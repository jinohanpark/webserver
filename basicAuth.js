
/*!
 * Connect - basicAuth
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , unauthorized = utils.unauthorized;

/**

 * Digest Auth:

**/

/*
  native modules
*/
var gmEncdec = require('../../../../my_modules/encdec/encdec.js');
var gmDataBase = require('../../../../my_modules/database/database.js');

/*
  global variable
*/
var ganonces = {};  // keep sessions info.
var gsession_timeout = 60*60*1000;  // after one hour

function _getpasswordhash( _realm, _username, _password ) {
  var sz = _username+':'+_realm+':'+_password;
  return utils.md5(sz, 'hex');
}

function _getopaquehash( _realm, _req ) {
  var sz = _realm+_req.headers['user-agent']+_req.connection.remoteAddress;
  return utils.md5(sz, 'hex');  
}

function _res_digest_unauthorized( _req, _res, _realm, _opaque, _message) {
  var nonce = new Date().getTime();

  // session timeout
  var timer = setTimeout(function() {
    delete ganonces[_opaque];
  }, gsession_timeout );

  ganonces[_opaque] = {
    n:     nonce,
    timer: timer
  };

  var szres = 'Digest '+'realm="'+_realm+'"'+',qop="auth"'+',nonce="'+nonce+'"'+',opaque="'+_opaque+'"';

  _res.statusCode = 401;
  _res.setHeader('WWW-Authenticate', szres);
  _res.end(_message);//_res.end('Unauthorized');
}

function _parsing_authorization(_szauthorization) {
  var tauthorization = {
    'username': null,
    'realm':    null,
    'nonce':    null,
    'uri':      null,
    'response': null,
    'opaque':   null,
    'qop':      null,
    'nc':       null,
    'cnonce':   null
  };

  for( var lvalue in tauthorization ) {
    var val = new RegExp(lvalue+'="([^"]*)"').exec(_szauthorization);
    if( null == val ) {
      val = new RegExp(lvalue+'=([^,]*)').exec(_szauthorization);
    }

    if( (val == null) || (!val[1]) ) {
      return false;
    }

    tauthorization[lvalue] = val[1];
  }

    return tauthorization;
}


/**
 * Basic Auth:
 *
 * Enfore basic authentication by providing a `callback(user, pass)`,
 * which must return `true` in order to gain access. Alternatively an async
 * method is provided as well, invoking `callback(user, pass, callback)`. Populates
 * `req.user`. The final alternative is simply passing username / password
 * strings.
 *
 *  Simple username and password
 *
 *     connect(connect.basicAuth('username', 'password'));
 *
 *  Callback verification
 *
 *     connect()
 *       .use(connect.basicAuth(function(user, pass){
 *         return 'tj' == user & 'wahoo' == pass;
 *       }))
 *
 *  Async callback verification, accepting `fn(err, user)`.
 *
 *     connect()
 *       .use(connect.basicAuth(function(user, pass, fn){
 *         User.authenticate({ user: user, pass: pass }, fn);
 *       }))
 *
 * @param {Function|String} callback or username
 * @param {String} realm
 * @api public
 */
module.exports = function basicAuth(_method)
{
  //realm = realm || 'Authorization Required';
  realm = 'IPCAM_SERVER';

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var fnbasic = function(req, res, next) {
    var authorization = req.headers.authorization;

    if (req.user) return next();
    if (!authorization) return unauthorized(res, realm);

    var parts = authorization.split(' ');

    if (parts.length !== 2) return next(utils.error(400));

    var scheme = parts[0]
      , credentials = new Buffer(parts[1], 'base64').toString()
      , index = credentials.indexOf(':');

    if ('Basic' != scheme || index < 0) return next(utils.error(400));
    
    var user = credentials.slice(0, index)
      , pass = credentials.slice(index + 1);

    // async
    var pause = utils.pause(req);
    _checkall(user, pass, function(err, user, _message) {
      if (err || !user)  return unauthorized(res, realm);
      req.user = req.remoteUser = user;
      next();
      pause.resume();
    });

    /////////////////////////////////////////////////////////////////////////////////
    //
    function _checkall( _user, _pass, _fncallback ) {

      var users = {};

      gmDataBase.getconfig( 'account.%', function(_result, _json, _ret) {
        //console.log('from DB _result._json:', _json);

        function _add( _szprivilege, _aname, _apasswd ) {
          var cnt = ( '' == _aname[0] ) ? 0 : _aname.length;
          for( var i=0; i<cnt; i++ ) {
            var szdec = gmEncdec.Decrypt(_apasswd[i], 'szkey_aaa');
            users[_aname[i]] = [];
            users[_aname[i]][0] = szdec;
            users[_aname[i]][1] = _szprivilege;
          }
        }

        var aname = _json['account.admin'][0].split(',');
        var apasswd = _json['account.admin.passwd'][0].split(',');
        _add( 'admin', aname, apasswd );

        var aname = _json['account.operator'][0].split(',');
        var apasswd = _json['account.operator.passwd'][0].split(',');
        _add( 'operator', aname, apasswd );

        var aname = _json['account.viewer'][0].split(',');
        var apasswd = _json['account.viewer.passwd'][0].split(',');
        _add( 'viewer', aname, apasswd );

        //console.log('users:', users);

        // check username and password!
        if( !users[_user][0] ) {
          _fncallback(true, _user);  
        }
        else {
          if( users[_user][0] == _pass ) {
            _fncallback(false, _user);    
          }
          else {
            _fncallback(true, _user);     
          }
        }
      });
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var fndigest = function(req, res, next) {
    var authorization = req.headers.authorization;  //console.log('authorization:', authorization);
    var opaque = _getopaquehash( realm, req ); console.log('opaque:', opaque);
    
    // check if the headers are present.
    if( !authorization ) {
      return _res_digest_unauthorized(req, res, realm, opaque, 'Unauthorized. please login.');
    }

    // is digest authentication?
    if( authorization.substr(0, 6) != 'Digest' ) {
      return next(utils.error(400, 'Unauthorized. we are http-digest authentication(refer to RFC2069) supported.' ));
    }

    var tauth = _parsing_authorization(authorization);  //console.log('*** parsing req.headers.authorization:', tauth);
    if( false == tauth ) {
      return next(utils.error(400, 'Unauthorized. invalid authentication http request header.' ));
    }

    // async
    var pause = utils.pause(req);
    _checkall(tauth, realm, function(err, user, _message) {
      if(err || !user) return _res_digest_unauthorized(req, res, realm, opaque, _message);
      next();
      pause.resume();
    });

    /////////////////////////////////////////////////////////////////////////////////
    //
    function _checkall( _tauth, _realm, _fncallback ) {

      var fauthen_error = true;

      var users = {};

      gmDataBase.getconfig( 'account.%', function(_result, _json, _ret) {
        //console.log('from DB _result._json:', _json);

        function _add( _szprivilege, _aname, _apasswd ) {
          var cnt = ( '' == _aname[0] ) ? 0 : _aname.length;
          for( var i=0; i<cnt; i++ ) {
            var szdec = gmEncdec.Decrypt(_apasswd[i], 'szkey_aaa');
            users[_aname[i]] = [];
            users[_aname[i]][0] = _getpasswordhash(realm, _aname[i], szdec);
            users[_aname[i]][1] = _szprivilege;
          }
        }

        var aname = _json['account.admin'][0].split(',');
        var apasswd = _json['account.admin.passwd'][0].split(',');
        _add( 'admin', aname, apasswd );

        var aname = _json['account.operator'][0].split(',');
        var apasswd = _json['account.operator.passwd'][0].split(',');
        _add( 'operator', aname, apasswd );

        var aname = _json['account.viewer'][0].split(',');
        var apasswd = _json['account.viewer.passwd'][0].split(',');
        _add( 'viewer', aname, apasswd );

        // console.log('-------------------------------');
        // console.log('users:', users);
        // console.log('-------------------------------');

        _gogogo();
      });

      function _gogogo() {
        
        // console.log('-------------------------------');
        // console.log('>>>>>>>>> _tauth:', _tauth);
        // console.log('-------------------------------');

        do {
          // check realm!
          if( _tauth.realm != realm ) {
            console.log('eeeeeeeeee');
            req.authentication = null;
            _fncallback(true, _tauth.username, 'Unauthorized.');
            break;
          }

          // check username! 
          if( !users[_tauth.username] ) {
            console.log('ffffffffffffff');
            req.authentication = null;
            _fncallback(true, _tauth.username, 'Unauthorized.');
            break;
          }

          // Make sure the requested url is actually the url we are authenticating.
          // Some browsers add the host and port, others don't, so check both.
          // Don't just check for the substring but actually make sure the whole end matches.
          var p = _tauth.uri.lastIndexOf(req.url);
          if( (p == -1) || ((p + req.url.length) != _tauth.uri.length) ) {
            console.log('ggggggggggg');
            req.authentication = null;
            _fncallback(true, _tauth.username, 'Unauthorized.');
            break;
          }

          // Make sure this session exists and hasn't timed out.
          if( !ganonces[opaque] ) {
            console.log('not exists session info.');
            req.authentication = null;
            _fncallback(true, _tauth.username, 'Unauthorized.');
            break;
          }

          // Hasn't session time-stamp.
          // if( ganonces[opaque].n != _tauth.nonce ) {
          //   console.log('session time-stamp mismatch.');
          //   req.authentication = null;
          //   _fncallback(true, _tauth.username, 'Unauthorized.');
          //   break;
          // }

          var response = utils.md5(users[_tauth.username][0]+':'+_tauth.nonce+':'+_tauth.nc+':'+_tauth.cnonce+':'+_tauth.qop+':'+utils.md5(req.method+':'+_tauth.uri, 'hex'), 'hex');
          if( _tauth.response != response ) {
            console.log('invalid username and password.');
            req.authentication = null;
            _fncallback(true, _tauth.username, 'Unauthorized.');
          }
          else {
            fauthen_error = false;

            // Extend timeout the session.
            clearTimeout( ganonces[opaque].timer );

            // session timeout
            ganonces[opaque].timer = setTimeout( function() {
              delete ganonces[opaque];
            }, gsession_timeout );

            _fncallback(fauthen_error, _tauth.username);
          }
        } while(0); // do...while
      };//function _gogogo()
    }//function _checkall( _tauth, _realm, _fncallback )
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////
  if( 'basic' == _method ) {
    return fnbasic;  
  }
  else
  if( 'digest' == _method ) {    
    return fndigest;
  }
};  

/*
module.exports = function basicAuth(callback, realm) {
  var username, password;

  // user / pass strings
  if ('string' == typeof callback) {
    username = callback;
    password = realm;
    if ('string' != typeof password) throw new Error('password argument required');
    realm = arguments[2];
    callback = function(user, pass){
      return user == username && pass == password;
    }
  }

  realm = realm || 'Authorization Required';

  return function(req, res, next) {
    var authorization = req.headers.authorization;

    if (req.user) return next();
    if (!authorization) return unauthorized(res, realm);

    var parts = authorization.split(' ');

    if (parts.length !== 2) return next(utils.error(400));

    var scheme = parts[0]
      , credentials = new Buffer(parts[1], 'base64').toString()
      , index = credentials.indexOf(':');

    if ('Basic' != scheme || index < 0) return next(utils.error(400));
    
    var user = credentials.slice(0, index)
      , pass = credentials.slice(index + 1);

    // async
    if (callback.length >= 3) {
      var pause = utils.pause(req);
      callback(user, pass, function(err, user){
        if (err || !user)  return unauthorized(res, realm);
        req.user = req.remoteUser = user;
        next();
        pause.resume();
      });
    // sync
    } else {
      if (callback(user, pass)) {
        req.user = req.remoteUser = user;
        next();
      } else {
        unauthorized(res, realm);
      }
    }
  }
};
*/
