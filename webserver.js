
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
var gmQS   = require('querystring');

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
gcConnect.use( gmConnect.cookieSession( {secret:'some secret'/*, cookie: { maxAge: 60000 1min. }*/ }) );

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

	console.log('method:', _req.method);
	console.log('headers:', JSON.stringify(_req.headers));
	//console.log('headers(user-agent):', _req.headers('user-agent'));
	//console.log('headers.accept:', _req.headers.accept);
	
	console.log('gmConnect.query:', _req.query);
	console.log('gmConnect.bodyParser:', _req.body);
	console.log('gmConnect.cookies:', _req.cookies);
	//console.log('gmConnect.session:', _req.session);
	//console.log('gmUrl.url:', _req.url);

	//
	var oUrl = gmUrl.parse(_req.url);
	if( '/' == oUrl.pathname ) {
		_fnRedirectPage(_req, _res, '/index.html');
		return;
	}

	if( null == (obj = _fnGetRequestContentType(_req)) ) {
		_res.writeHead( 404,
					    { 'Content-Type': 'text/html' } );
		_res.end();
		return;
	}
	var szcontenttype = obj.szcontenttype;
	
	//
	if( ('text/html' == szcontenttype) ) {
		var flogin = gmLogin.islogin(_req, _res);

		if( false == flogin ) {
			if( ('/login.html' != oUrl.pathname) ) {
				_fnRedirectPage(_req, _res, '/login.html');
				return;
			}
		}
		else {
			if( ('/login.html' == oUrl.pathname) ) {
				// already login, logout? or switch user?
			}
		}
	}

	if( 'application/cgi' == szcontenttype ) {
		if( '/cgi-bin/login.cgi' == oUrl.pathname ) {

			var fok = gmLogin.authen(_req);

			if( false == fok ) {
				_fnRedirectPage(_req, _res, '/login.html');
			}
			else {
				_fnRedirectPage(_req, _res, '/index.html');
			}
		}
		return;
	}

	//
	var szpagefile = gszbasedir + oUrl.pathname;
	gmFs.readFile( szpagefile, 'utf8', callbackReadPageFile );

	function callbackReadPageFile( error, data )
	{
		if( error ) {
			console.log( error );
			_res.writeHead( 404,
							{ 'Content-Type': 'text/html' } );
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

function _fnRedirect_LOGIN_HTML( _req, _res )
{
	var oUrl = gmUrl.parse(_req.url);

	oUrl.pathname = '/login.html';
	var szUrl = gmUrl.format(oUrl);
	_res.writeHead( 302, { 'Location' : szUrl } );
	_res.end();

	return true;
}

function _fnRedirectPage( _req, _res, _szredirectpage )
{
	var oUrl = gmUrl.parse(_req.url).pathname = _szredirectpage;

	_res.writeHead( 302, { 'Location' : gmUrl.format(oUrl) } );
	_res.end();
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
	case 'ico':		szretcontenttype = 'image/x-icon'; break;
	case 'cgi':		szretcontenttype = 'application/cgi'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return null;
	}
	
	return { 'szcontenttype' : szretcontenttype };
}	
