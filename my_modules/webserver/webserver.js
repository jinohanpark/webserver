
/*
	native modules
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
var gmMisc = require('../../misc.js');
var gmDataBase = require('../database/database.js');
var gmWebService = require('../webservice/webservice.js');
var gmWsIO = require('../socketio/socketio.js');

/*
	global variable
*/

/*
	multiple instance
*/
var myWebServer = function( _name )
{
	this.nhttpport = 3000;
	this.szbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www';
	this.szuploadbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www/upload';

	this.connect = null;
	this.server = null;
	this.wsio = null;
	this.webservice = null;
}
// export module
module.exports = myWebServer;

myWebServer.prototype.Init = function( _option )
{
	var self = this;

	/*
	*/
	var connect = gmConnect();
	self.connect = connect;

	connect.use( gmConnect.query() );
	connect.use( gmConnect.basicAuth('digest') );//connect.use( gmConnect.basicAuth('basic') );
	connect.use( gmConnect.favicon(self.szbasedir+'/images/favicon.ico') );
	connect.use( gmConnect.logger('dev') );
	connect.use( gmConnect.bodyParser({uploadDir:self.szuploadbasedir, defer:true}) );
	connect.use( gmConnect.cookieParser() );
	connect.use( gmConnect.cookieSession( {secret:'some secret'/*, cookie: { maxAge: 60000 1min. }*/ }) );
	connect.use( function( _req, _res ) {
		return self._onWebServerRequest(_req, _res);
	});
	connect.use( gmConnect.errorHandler({message:true}) );

	/*
	*/
	var server = gmHttp.createServer(connect);
	self.server = server;

	//server.on( 'request', _onWebServerRequest );
	server.on( 'connection', function() {
		console.log('Connection On');
	});

	server.on( 'close', function() { 
		console.log('WebServer Close On');		
	});

	server.on( 'checkContinue', function() { 
		console.log('WebServer _oncheckContinue On');		
	});

	server.listen( self.nhttpport, function() {
		return self._callbackWebServerListen();
	});

	/*
	*/
	var wsio = new gmWsIO();
	self.wsio = wsio;

	wsio.Listen( server );

	/*
	*/ 
	var webservice = new gmWebService();
	self.webservice = webservice;

	webservice.createSocket();
}

myWebServer.prototype.Deinit = function( _szhandler )
{
	;
}

/*
*/
myWebServer.prototype._onWebServerRequest = function( _req, _res )
{
	var self = this;

	//console.log('_req.headers:', _req.headers);
	//console.log('_req.headers.host:', _req.headers.host);
	//console.log('_req.headers.content-type:', _req.headers['content-type']);
	//console.log('_req.headers.content-length:', _req.headers['content-length']);

	//console.log('gmConnect.query:', _req.query);		//console.log('gmConnect.query.key:', _req.query.key);
	//console.log('gmConnect.body:', _req.body);
	//console.log('gmConnect.multipart:', _req.files);
	//console.log('---------------------------------------');
	//console.log('gmConnect.cookies:', _req.cookies);
	//console.log('gmConnect.session:', _req.session);
	console.log('gmUrl.url:', _req.url);
	//_req.session._mydata = '11111';

	//
	var szreqfiletype;
	var szfiletype;	// utf8, binary

	var oUrl = gmUrl.parse(_req.url);//console.log('oUrl.pathname:', oUrl.pathname);
	if( '/' == oUrl.pathname ) {
		_fnRedirectPage(_req, _res, '/index.html');
		return;
	}
	else
	if( '/onvif/device_service' == oUrl.pathname ) {
		szreqfiletype = 'application/soap+xml';
	}
	else {
		var obj;
		if( null == (obj = _fnGetRequestFileType(_req)) ) {
			_res.writeHead( 404, { 'Content-Type': 'text/html' } );
			_res.end();
			return;
		}
		szreqfiletype = obj.szreqfiletype;
		szfiletype = obj.sztype;
	}

	///////////////////////////////////////////////////////////////////////////////////
	// check authentication
	// only html???
	/*
	if( ('text/html' == szreqfiletype) ) {	
		var fok = gmLogin.login( _req, _res );
		if( false == fok ) {
	    	// the response is already finished so we can just return here.
	    	return;
	    }
	}
	*/

	///////////////////////////////////////////////////////////////////////////////////
	//
	if( ('application/soap+xml' == szreqfiletype) ) {
		if( 'post' != _req.method.toLowerCase() ) {
			gmMisc.dbgerr( 'MISMATCH method(only "post") - ' + oUrl.pathname );
			return;
		}
		
		switch( oUrl.pathname ) {
		case '/onvif/device_service':
			//console.log('-> /onvif/device_service');

			_req.on('data',
				function(_data) {
					//console.log('-> /onvif/device_service post data:', _data);
					var retcode = self.webservice.onWebServiceHTTPMessage( _req, _res, _data );
				}
			);
			break;
		}

		console.log('#############################################');
		
		return;
	}
	
	///////////////////////////////////////////////////////////////////////////////////
	//
	if( 'application/node' == szreqfiletype ) {
		if( 'post' != _req.method.toLowerCase() ) {
			gmMisc.dbgerr( 'MISMATCH method(only "post") - ' + oUrl.pathname );
			return;
		}

		switch( oUrl.pathname ) {
		/*	
		case '/cgi-bin/login.node':
			var fok = gmLogin.authen(_req);
			if( false == fok ) {
				_fnRedirectPage(_req, _res, '/login.html');
			}
			else {
				_fnRedirectPage(_req, _res, '/index.html');
			}
			break;
		*/
		case '/cgi-bin/upload.node':
			console.log('-> /cgi-bin/upload.node');

			self.wsio.FirmwareUpload( _req, this.szuploadbasedir );

			if( 'referer' == _req.query.retpage ) {
				_fnRedirectPage(_req, _res, gmUrl.parse(_req.form.headers.referer).path);
			}
			else {
				_fnRedirectPage(_req, _res, _req.query.retpage);
			}
			break;

		default:
			gmMisc.dbgerr( 'FILE NOT FOUND - ' + oUrl.pathname );
			break;		
		}
		
		return;
	}
	
	///////////////////////////////////////////////////////////////////////////////////	
	//
	/*
	if( ('text/html' == szreqfiletype) ) {
		var flogin = gmLogin.islogin(_req, _res);
		var flogin = true;

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
	*/

	//
	if( ('ssi/javascript' == szreqfiletype) ) {
		//GET /submenu/configuration.ssi?action=query&lvalue=system.deviceinfo.%&var=gserverform_deviceinfo
		//console.log('ssi query:', _req.query);
		
		_db_getconfiguration( _req.query.lvalue, function(_result, _json) {
			//console.log('from DB _result ', _json);
			var sz = 'var ' + _req.query.var + ' = ';
			sz += 'JSON.parse(';
			sz += "'" + JSON.stringify(_json) + "'";
			sz += ');';

			szreqfiletype = 'application/javascript';
			callbackReadPageFile( 0, sz );
		});
	}
	else {
		// HTML,JS,CSS,...
		var szpagefile = this.szbasedir + oUrl.pathname;
		gmFs.readFile( szpagefile, callbackReadPageFile );//gmFs.readFile( szpagefile, 'utf8', callbackReadPageFile );
	}

	function callbackReadPageFile( error, data )
	{
		if( error ) {
			console.log( error );
			_res.writeHead( 404, { 'Content-Type': 'text/html' } );
			_res.end();
		}
		else {
			_writeHead( _res, szreqfiletype );
			_res.end( data );
		}
	}

	function _writeHead(_res, _szmimetype) {
		var date = new Date();
		date.setDate(date.getDate() + 7);

		_res.writeHead( 200, {
						'Server': 'nodejs-jinohan.park',
						'Content-Type': _szmimetype,
						'Set-Cookie': [ 'breakfast = toast;Expires = ' + date.toUTCString(),
										'dinner = chicken',
										'testkey = testvalue'
									  ]
						, 'Cache-Control': 'no-cache'
					    }
					  );
	}

	return;
}

myWebServer.prototype._callbackWebServerListen = function()
{
	var self = this;

	console.log('callbackWebServerListen 192.168.0.2:3000');
	console.log('self.szbasedir:', self.szbasedir);
	//console.log( gmHttp.STATUS_CODES );
}

function _fnRedirectPage( _req, _res, _szredirectpage )
{
	var oUrl = gmUrl.parse(_req.url).pathname = _szredirectpage;

	_res.writeHead( 302, { 'Location' : gmUrl.format(oUrl) } );
	_res.end();
}

function _fnGetRequestFileType( _req )
{
	//
	var szretfiletype = 'text/html';
	var szrettype = 'utf8';	// binary
	
	//
	var oUrl = gmUrl.parse(_req.url);
	var opagefile = oUrl.pathname.split('.');

	switch( opagefile[opagefile.length-1] ) {
	case 'html':	szretfiletype = 'text/html'; break;
	case 'css':		szretfiletype = 'text/css'; break;
	case 'js':		szretfiletype = 'application/javascript'; break;
	case 'node':	szretfiletype = 'application/node'; break;
	case 'ssi':		szretfiletype = 'ssi/javascript'; break;
	case 'jpeg':	szretfiletype = 'image/jpeg'; szrettype = 'binary'; break;
	case 'jpg':		szretfiletype = 'image/jpg'; szrettype = 'binary'; break;
	case 'png':		szretfiletype = 'image/png'; szrettype = 'binary'; break;
	case 'gif':		szretfiletype = 'image/gif'; szrettype = 'binary'; break;
	case 'ico':		szretfiletype = 'image/x-icon'; szrettype = 'binary'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return null;
	}
	
	return { 'szreqfiletype' : szretfiletype, 'sztype' : szrettype };
}	

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
