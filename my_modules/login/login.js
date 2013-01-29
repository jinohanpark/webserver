
var gcThis = new myLogin();
exports = module.exports = gcThis;

/*
	native modules
*/
var gmCrypto = require('crypto');
var gmUtil = require('util');
var gmPause = require('pause');

/*
	my modules
*/
var gmEncdec = require('../../my_modules/encdec/encdec.js');
var gmDataBase = require('../../my_modules/database/database.js');
var gcDBClient = gmDataBase.init();

/*
	global variable
*/
var ganonces = {};	// keep sessions info.

/*
*/
function myLogin( _name )
{
	var self = this;

	this.session_timeout = 60*60*1000;	// after one hour
};

/*
	var gmPause = require('pause');
	var cnt = 0;
	var pause = gmPause();
	var timerid = setInterval( function() {
   		console.log('aaaaa');
		if( cnt++ == 5 ) {
			pause.resume();
			clearInterval(timerid);
			timerid = null;
		}
   	}, 1000);
	console.log('bbbbbbbbbbbbb');
*/

function _db_getconfiguration(_queryitem, _callback)
{
	var query = 'SELECT * FROM configuration WHERE lvalue LIKE "' + _queryitem + '"';
	gmDataBase.getquery_ipcam_config( query, function(_result) {

		var json = {};

		for( var i=0; i<_result.length; i++ ) {
			json[_result[i].lvalue] = [];
			json[_result[i].lvalue].push(_result[i].rvalue);
			json[_result[i].lvalue].push(JSON.parse(_result[i].type));
		}

		_callback(_result, json);
	});
}

function _md5(_s) {
	return gmCrypto.createHash('md5').update(_s).digest('hex');
}

function _getpasswordhash( _realm, _username, _password ) {
	return _md5(_username+':'+_realm+':'+_password);
}

function _getopaquehash( _realm, _req ) {
	return _md5( _realm+_req.headers['user-agent']+_req.connection.remoteAddress );
}

function _parsing_authorization(_req) {
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
		var val = new RegExp(lvalue+'="([^"]*)"').exec(_req.headers.authorization);
		if( null == val ) {
			val = new RegExp(lvalue+'=([^,]*)').exec(_req.headers.authorization);
		}

		if( (val == null) || (!val[1]) ) {
			return false;
		}

		tauthorization[lvalue] = val[1];
	}

  	return tauthorization;
}

function _res_auth( _req, _res, _realm, _opaque, _message) {
	var nonce = new Date().getTime();

	// session timeout
	var timer = setTimeout(function() {
		delete ganonces[_opaque];
	}, gcThis.session_timeout );

	ganonces[_opaque] = {
		n:     nonce,
		timer: timer
	};

	_res.writeHead( 401, {
		'Content-Type': 'text/html',
		'WWW-Authenticate': 'Digest realm="'+_realm+'",qop="auth",nonce="'+nonce+'",opaque="'+_opaque+'"'
	});

	_res.end(_message);
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

	var realm = 'IPCAM_MACNO';
	var users = {};

myLogin.prototype.login = function( _req, _res )
{
	var fauthen_enable;
	// 	'admin': 'df612ed72c77e5b55021809a58799711', // This is the output of: auth.passhash('Admin section', 'admin', 'password')
	// 	'erik':  _getpasswordhash(realm, 'erik', 'hello')
	// };

	//console.log(util.inspect(_req.connection, true, null));

	_db_getconfiguration( 'account.%', function(_result, _json) {
		//console.log('from DB _result._json:', _json);

		fauthen_enable = _json['account.enable'][0];

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
	});

	var opaque = _getopaquehash( realm, _req );

	// check if the headers are present.
	if( !_req.headers.authorization ) {
		console.log('bbbbbhhhbbbbbbb');
		_res_auth(_req, _res, realm, opaque, 'Please login.');
		return false;
	}

	// We only support digest authentication.
	if( _req.headers.authorization.substr(0, 6) != 'Digest' ) {
		console.log('cccccccccccc');
		_res_auth(_req, _res, realm, opaque, 'Only digest authentication supported.');
		return false;
	}

	var tauth = _parsing_authorization(_req);
	//console.log('*** req.headers.auth:', tauth);

	// We need all item authen.
	if( false == tauth ) {
		console.log('dddddddddddd');
		_res_auth(_req, _res, realm, opaque, 'Invalid authentication header.');
		return false;
	}

	if( tauth.realm != realm ) {
		console.log('eeeeeeeeee');
		_res_auth(_req, _res, realm, opaque, 'Invalid realm.');
		return false;
	}
	
	// Check for a valid username.
	console.log('xxxxxxxxxx :', tauth.username );
	console.log('xxxxxxxxxx :', users[tauth.username] );
	console.log('xxxxxxxxxx :', users[tauth.username][0] );
	if( !users[tauth.username][0] ) {
		console.log('ffffffffffffff');
		_res_auth(_req, _res, realm, opaque, 'Invalid username and/or password combination.');
		return false;
	}
	
	// Make sure the requested url is actually the url we are authenticating.
	var p = tauth.uri.lastIndexOf(_req.url);

	// Some browsers add the host and port, others don't, so check both.
	// Don't just check for the substring but actually make sure the whole end matches.
	if( (p == -1) || ((p + _req.url.length) != tauth.uri.length) ) {
		console.log('ggggggggggg');
		_res_auth(_req, _res, realm, opaque, 'Invalid uri.');
		return false;
	}

	//console.log('*** ganonces[opaque]:opaque:', opaque);
	//console.log('*** ganonces[opaque]:', ganonces);

	// Make sure this session exists and hasn't timed out.
	if( !ganonces[opaque] || (ganonces[opaque].n != tauth.nonce) ) {
		console.log('hhhhhhhhhhhh');
		_res_auth(_req, _res, realm, opaque, 'Invalid nonce.');
		return false;
	}

	var response = _md5( users[tauth.username][0]+':'+tauth.nonce+':'+tauth.nc+':'+tauth.cnonce+':'+tauth.qop+':'+_md5(_req.method+':'+tauth.uri));
	if( tauth.response != response ) {
		console.log('iiiiiiiiiii');
		_res_auth(_req, _res, realm, opaque, 'Invalid username and/or password combination.');
		return false;
	}

	// Extend timeout the session.
	clearTimeout( ganonces[opaque].timer );

	// session timeout
	ganonces[opaque].timer = setTimeout( function() {
		delete ganonces[opaque];
	}, gcThis.session_timeout );

	//return tauth.username;
	return true;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
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

/*
*/
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
