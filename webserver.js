
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

	//
	if( true == _fnRedirect_INDEX_HTML(_req, _res) ) return;

	//
	var szcontenttype = 'text/html';
	if( false == _fnGetRequestContentType(_req, szcontenttype) ) return;

	//
	//console.log('method:', _req.method);
	console.log('gmConnect.query:', _req.query);
	console.log('gmConnect.bodyParser:', _req.body);
	console.log('gmConnect.cookies:', _req.cookies);
	console.log('gmConnect.session:', _req.session);

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

function _fnGetRequestContentType( _req, _szcontenttype )
{
	var oUrl = gmUrl.parse(_req.url);
	var opagefile = oUrl.pathname.split('.');

	switch( opagefile[opagefile.length-1] ) {
	case '/clear':	_szcontenttype = 'text/html'; break;
	case 'html':	_szcontenttype = 'text/html'; break;
	case 'css':		_szcontenttype = 'text/css'; break;
	case 'js':		_szcontenttype = 'application/javascript'; break;
	case 'png':		_szcontenttype = 'image/png'; break;
	case 'gif':		_szcontenttype = 'image/gif'; break;
	case 'ico':		_szcontenttype = 'image/x-icon'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return false;
	}
	
	return true;
}	

/*
var modConnect = require('connect');

var app = modConnect().use( modConnect.favicon() )
					  .use( modConnect.logger('dev') )
					  .use( modConnect.static('public') )
					  .use( modConnect.directory('public') )
					  .use( modConnect.cookieParser() )
					  .use( modConnect.session( {secret: 'my secret here'} ) )
					  .use( function( req, res ) {
						res.end('Hello from Connect! \n');
					  });

var mHttp = require('http');
mHttp.createServer( app ).listen(3000);
*/


/*
var mod_url = require('url');

var objParsed = mod_url.parse('http://user:pass@192.168.0.211:8080/admin/httpapi.cgi?action=query#hash', true);
console.log('objParsed :', '\r\n', objParsed, '\r\n');
console.log('objParsed.protocol :', '\r\n', objParsed.protocol, '\r\n');
console.log('objParsed.pathname :', '\r\n', objParsed.pathname, '\r\n');

console.log('objParsed.query :', '\r\n', objParsed.query, '\r\n');

objParsed.host = '192.168.222.111:8088';
objParsed.auth = 'aaa:bbb';

var objFormat = mod_url.format(objParsed);
console.log('objFormat :', '\r\n', objFormat, '\r\n');

var modQS = require('querystring');

var szjson = {foo:'bar', fuz:'xzz', baz:['qux','quux'], corge:''};

var sz = modQS.stringify(szjson);
console.log('sz1 :', '\r\n', sz, '\r\n');

// sz = 'foo=bar&fuz=xzz&baz=qux&baz=quux&corge='
var ppp = sz.split('&').map( 
	function(element22) {
		var element = element22.split('=');
		return { 
			lvalue : element[0],
			rvalue : element[1]
		};
	}
);

console.log('ppp :', '\r\n', ppp[0].lvalue, '\r\n');
*/


/*
var connect = require('connect');
connect.createServer( connect.router() )
*/

/*
connect.createServer( function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Hello Connect Module ...!</h1>');
}).listen(52273, function() {
    console.log('Server running at http://~:52273');
});
*/

/*
var server = require('http').createServer();

server.on('request', function() {
    console.log('request on');
});

server.on('connection', function() {
    console.log('connection on');
});

server.on('clientError', function() {
    console.log('clientError on');
});

server.on('close', function() {
    console.log('close on');
});

server.listen(52273, function() {
    console.log('Server running at http://192.168.0.2:52273');
});
*/
