
var gcThis = new myLogin();
exports = module.exports = gcThis;

/*
	native modules
*/


/*
	external modules
*/
var gmUtils = require('connect/lib/utils.js');


/*
	my modules
*/
var gmEncdec = require('../../my_modules/encdec/encdec.js');
var gmDataBase = require('../../my_modules/database/database.js');

/*
	global variable
*/
var ganonces = {};	// keep sessions info.
var gsession_timeout = 60*60*1000;  // after one hour

/*
*/
function myLogin( _name )
{
	var self = this;
}

function _db_getconfiguration(_queryitem, _callback)
{
	var query = 'SELECT * FROM configuration WHERE lvalue LIKE "' + _queryitem + '"';
	gmDataBase.getquery_config( query, function(_result) {

		var json = {};

		for( var i=0; i<_result.length; i++ ) {
			json[_result[i].lvalue] = [];
			json[_result[i].lvalue].push(_result[i].rvalue);
			json[_result[i].lvalue].push(JSON.parse(_result[i].type));
		}

		_callback(_result, json);
	});
}

function _getpasswordhash( _realm, _username, _password ) {
	var sz = _username+':'+_realm+':'+_password;
	return gmUtils.md5(sz, 'hex');
}

function _getopaquehash( _realm, _req ) {
	var sz = _realm+_req.headers['user-agent']+_req.connection.remoteAddress;
	return gmUtils.md5(sz, 'hex');  
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

myLogin.prototype.logout = function( _req )
{
	var tauth = _parsing_authorization(_req);
	if( false == tauth ) {
		// user is not logged in
		return false;
	}

	var opaque = _getopaquehash( tauth.realm, _req );
	clearTimeout(ganonces[opaque].timer);
	delete ganonces[opaque];

	return true;
};

myLogin.prototype.httpDigest = function( _req, _res, _next )
{
  	var realm = 'IPCAM_SERVER';

  	return function(_req, _res, _next) {
    	var authorization = _req.headers.authorization;  //console.log('authorization:', authorization);
    	var opaque = _getopaquehash( realm, _req ); console.log('opaque:', opaque);
    
    	// check if the headers are present.
    	if( !authorization ) {
      		return _res_digest_unauthorized(_req, _res, realm, opaque, 'Unauthorized. please login.');
    	}

    	// is digest authentication?
    	if( authorization.substr(0, 6) != 'Digest' ) {
      		return _next(gmUtils.error(400, 'Unauthorized. we are http-digest authentication(refer to RFC2069) supported.'));
    	}

    	var tauth = _parsing_authorization(authorization);  //console.log('*** parsing req.headers.authorization:', tauth);
    	if( false == tauth ) {
      		return _next(gmUtils.error(400, 'Unauthorized. invalid authentication http request header.'));
    	}

    	// async
    	var pause = gmUtils.pause(_req);
    	_checkall(tauth, realm, function(err, user, _message) {
      		if(err || !user) return _res_digest_unauthorized(_req, _res, realm, opaque, _message);
      		_next();
      		pause.resume();
    	});

    	/////////////////////////////////////////////////////////////////////////////////
    	//
    	function _checkall( _tauth, _realm, _fncallback ) {

      		var isauthen_enable;
      		var fauthen_error = true;

      		var users = {};

      		_db_getconfiguration( 'account.%', function(_result, _json) {
        		//console.log('from DB _result._json:', _json);
        		isauthen_enable = _json['account.enable'][0];

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

				console.log('users:', users);

				_gogogo();
			});

      		function _gogogo() {
        		console.log('>>>>>>>>> _tauth:', _tauth);
       			do {
          			// check realm!
          			if( _tauth.realm != realm ) {
            			console.log('eeeeeeeeee');
            			_req.authentication = null;
            			_fncallback(true, _tauth.username, 'Unauthorized.');
            			break;
          			}

          			// check username!
          			if( !users[_tauth.username][0] ) {
            			console.log('ffffffffffffff');
            			_req.authentication = null;
            			_fncallback(true, _tauth.username, 'Unauthorized.');
            			break;
          			}

					// Make sure the requested url is actually the url we are authenticating.
					// Some browsers add the host and port, others don't, so check both.
					// Don't just check for the substring but actually make sure the whole end matches.
          			var p = _tauth.uri.lastIndexOf(req.url);
          			if( (p == -1) || ((p + req.url.length) != _tauth.uri.length) ) {
            			console.log('ggggggggggg');
            			_req.authentication = null;
            			_fncallback(true, _tauth.username, 'Unauthorized.');
            			break;
          			}

          			// Make sure this session exists and hasn't timed out.
          			if( !ganonces[opaque] ) {
            			console.log('not exists session info.');
            			_req.authentication = null;
            			_fncallback(true, _tauth.username, 'Unauthorized.');
            			break;
          			}

					// Hasn't session time-stamp.
					// if( ganonces[opaque].n != _tauth.nonce ) {
					// 	console.log('session time-stamp mismatch.');
					// 	_req.authentication = null;
					// 	_fncallback(true, _tauth.username, 'Unauthorized.');
					// 	break;
					// }

					var response = gmUtils.md5(users[_tauth.username][0]+':'+_tauth.nonce+':'+_tauth.nc+':'+_tauth.cnonce+':'+_tauth.qop+':'+gmUtils.md5(_req.method+':'+_tauth.uri));
					if( _tauth.response != response ) {
						console.log('invalid username and password.');
						_req.authentication = null;
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
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
/*
myLogin.prototype.authen = function( _req )
{
	var szdec = gmEncdec.Decrypt('z5n3UO/v7+/hb3p4', 'szkey_aaa');
	console.log(szdec);

	var szusername = '';
	var szpassword = '';
	var fret = false;

	//console.log('authen.method:', _req.method);
	if( 'POST' == _req.method ) {
		szusername = _req.body.username;
		szpassword = _req.body.password;
	}
	else
	if( 'GET' == _req.method ) {
		szusername = _req.query.username;
		szpassword = _req.query.password;
	}
	else {
		console.log('\u001b[1m', '\u001b[30m', '\u001b[41m');
		console.log('authen.method:', _req.method);
		console.log('\u001b[0m');
	}

	// basic authentication
	if( 'root' == szusername && 'pass' == szpassword ) {
		fret = true;
	}
	
	//
	var sess = _req.session;
	if( true == fret ) {
		sess.ncount = sess.ncount || 0;
		sess.ncount++;
		sess.szusername = szusername;
		sess.fauthen = true;
	}
	else {
		_req.session = null;
	}

	return fret;
}
*/

/*
myLogin.prototype.islogin = function(_req, _res)
{
	var sess = _req.session;
	//console.log('req.session:', sess);
	if( undefined == sess.fauthen ) {
		sess.ncount = 1;
		sess.szusername = 'anonymous_zXcsa1wjk';
		sess.fauthen = false;
	}

	return sess.fauthen;
}
*/
