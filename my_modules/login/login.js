
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
