
/*
	based on node.js v0.8.14
*/

var gnhttpport = 3000;
var gszbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www';

/*
	internal modules
*/
var gmUtil = require('util');
var gmHttp = require('http');
var gmFs   = require('fs');
var gmUrl  = require('url');

/*
	external modules
*/
var gmConnect = require('connect');

/*
	my modules
*/
var gmLogin = require('./my_modules/login');

/*
*/
var gcConnect = gmConnect();
gcConnect.use( gmConnect.query() );
gcConnect.use( gmConnect.logger('dev') );
gcConnect.use( gmConnect.bodyParser() );
gcConnect.use( gmConnect.cookieParser() );
gcConnect.use( gmConnect.cookieSession( {secret:'some secret'}) );

gcConnect.use( onWebServerRequest );
//gcConnect.use( gmConnect.errorHandler({message:true}) );

/*
*/
var gcWebS = gmHttp.createServer(gcConnect);

//gcWebS.on( 'request', onWebServerRequest );
gcWebS.on( 'connection', onWebServerConnection );
gcWebS.on( 'close', onWebServerClose );
gcWebS.on( 'checkContinue', onWebServerClose );
gcWebS.listen( gnhttpport, callbackWebServerListen );

function onWebServerRequest( _req, _res )
{
	this._req = _req;
	this._res = _res;
	
	console.log('Request On');
	//console.log('method:', _req.method);
	console.log('gmConnect.query:', _req.query);
	console.log('gmConnect.bodyParser:', _req.body);
	console.log('gmConnect.cookies:', _req.cookies);
	console.log('gmConnect.session:', _req.session);

	//
	if( true == _fnRedirect_INDEX_HTML(_req, _res) ) return;
	
	//
	if( false == _fnIsLogin(_req, _res) ) {
		_fnRedirect_LOGIN_HTML(_req, _res);
		return;
	}
	
	//
	if( null == (obj = _fnGetRequestContentType(_req)) ) return;
	var szcontenttype = obj.szcontenttype;
	
	//
	var oUrl = gmUrl.parse(_req.url);
	var szpagefile = gszbasedir + oUrl.pathname;
	gmFs.readFile( szpagefile, 'utf8', callbackReadPageFile );

	function callbackReadPageFile( error, data )
	{
		if( error ) {
			console.log( error );
			_res.writeHead( 404, {
							'Content-Type': 'text/html'
						   }
						 );
			_res.end();
		}
		else {
			var date = new Date();
			date.setDate(date.getDate() + 7);
			_res.writeHead( 200, {
							'Content-Type': szcontenttype,
							'Set-Cookie': [ //'breakfast = toast;Expires = ' + date.toUTCString(),
											'dinner = chicken',
											'testkey = testvalue'
										  ]
						   }
						 );
			_res.end( data );
		}
	}
}

function onWebServerConnection()
{
	console.log('Connection On');
}

function onWebServerClose()
{
	console.log('WebServer Close On');
}

function callbackWebServerListen()
{
	console.log('callbackWebServerListen 192.168.0.2:3000');
	//console.log( gmHttp.STATUS_CODES );
}


/*

*/
function _fnIsLogin(_req, _res)
{
	var sess = _req.session;
	console.log('gmConnect.session:', sess);

	if( undefined == sess.fauthen ) {
		sess.ncount = 1;
		sess.szusername = 'anonymous_zXcsa1wjk';
		sess.fauthen = false;
		return false;
	}
	
	

	/*
	sess.count = sess.count || 0;
	var n = sess.count++;
	var name = sess.username || 'anonymous_zXcsa1wjk';
	var authen = sess.authen || 'false';
	
	if( 'POST' != _req.method ) return false;
	
	if( '/clear' == _req.url ) {
		_req.session = null;
		
		_res.statusCode = 302;
		_res.setHeader( 'Location:', '/index.html' );
		_res.end();
		return;		
	}

	if( 'POST' == _req.method ) {
		_req.session.name = _req.body.name;
	}

	_req.session.count = _req.session.count || 0;
	var n = _req.session.count++;
	var name = _req.session.name || 'Enter your name';
	_res.end( '<p>hits: ' + n + '</p>'
			 +'<form method="post">'
			 +'<p>'
			 +'<input type="text" name="name" value="' + name + '"/>'
			 +'<input type="submit" value="Save" />'
			 +'</p>'
			 +'</form>'
			 +'<p><a href="/clear">clear session</a></p>'
			 );
	return;			 
	*/
}

function _fnRedirect_LOGIN_HTML( _req, _res )
{
	var oUrl = gmUrl.parse(_req.url);

	oUrl.pathname = '/login.html';
	var szUrl = gmUrl.format(oUrl);
	_res.writeHead( 302, { 'Location' : szUrl } );
	_res.end();

	return true;
}

function _fnRedirect_INDEX_HTML( _req, _res )
{
	var oUrl = gmUrl.parse(_req.url);
	if( '/' == oUrl.pathname ) {
		oUrl.pathname = '/index.html';
		var szUrl = gmUrl.format(oUrl);
		_res.writeHead( 302, { 'Location' : szUrl } );
		_res.end();
		return true;
	}
	else {
		return false;
	}
}

function _fnGetRequestContentType( _req )
{
	//
	var szretcontenttype = 'text/html';
	
	//
	var oUrl = gmUrl.parse(_req.url);
	var opagefile = oUrl.pathname.split('.');

	switch( opagefile[opagefile.length-1] ) {
	case 'html':	szretcontenttype = 'text/html'; break;
	case 'css':		szretcontenttype = 'text/css'; break;
	case 'js':		szretcontenttype = 'application/javascript'; break;
	case 'png':		szretcontenttype = 'image/png'; break;
	case 'gif':		szretcontenttype = 'image/gif'; break;
	case 'ico':		szretcontenttype = 'image/x-icon'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return null;
	}
	
	return { 'szcontenttype' : szretcontenttype };
}	
