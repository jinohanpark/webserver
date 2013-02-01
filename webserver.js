
/*
	based on node.js v0.8.18
*/

var gnhttpport = 3000;
var gszbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www';
var gszuploadbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www/upload';

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
var gmMisc = require('./misc.js');
//var gmLogin = require('./my_modules/login/login.js');
var gmWebService = require('./my_modules/webservice/webservice.js');
var gmmyWsIO = require('./my_modules/socketio/socketio.js');

/*
*/
var gmDataBase = require('./my_modules/database/database.js');
gmDataBase.init();
gmDataBase.makedefault_ipcam_database();


/*
*/ 
var gcWebServiceServer = gmWebService.createSocket();	//console.log('gcWebServiceServer:', gcWebServiceServer);

/*
*/
var gcConnect = gmConnect();
gcConnect.use( gmConnect.query() );
//gcConnect.use( gmConnect.basicAuth('basic') );
gcConnect.use( gmConnect.basicAuth('digest') );
gcConnect.use( gmConnect.favicon(gszbasedir+'/images/favicon.ico') );
gcConnect.use( gmConnect.logger('dev') );
gcConnect.use( gmConnect.bodyParser({uploadDir:gszuploadbasedir, defer:true}) );
gcConnect.use( gmConnect.cookieParser() );
gcConnect.use( gmConnect.cookieSession( {secret:'some secret'/*, cookie: { maxAge: 60000 1min. }*/ }) );
gcConnect.use( _onWebServerRequest );
gcConnect.use( gmConnect.errorHandler({message:true}) );

/*
*/
var gcWebServer = gmHttp.createServer(gcConnect);
//gcWebServer.on( 'request', _onWebServerRequest );
gcWebServer.on( 'connection', _onWebServerConnection );
gcWebServer.on( 'close', _onWebServerClose );
gcWebServer.on( 'checkContinue', _oncheckContinue );
gcWebServer.listen( gnhttpport, _callbackWebServerListen );
/**/
var gcWsIO = gmmyWsIO.Listen( gcWebServer );

/*
var gcWebServer1 = gmHttp.createServer(gcConnect);
//gcWebServer1.on( 'request', _onWebServerRequest );
gcWebServer1.on( 'connection', _onWebServerConnection );
gcWebServer1.on( 'close', _onWebServerClose );
gcWebServer1.on( 'checkContinue', _oncheckContinue );
gcWebServer1.listen( 4000, _callbackWebServerListen );
*/

/*
*/
function _onWebServerRequest( _req, _res )
{
	this._req = _req;
	this._res = _res;
	
	console.log('Request On');
	
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
					var retcode = gmWebService.onWebServiceHTTPMessage( _req, _res, _data );
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

			gmmyWsIO.FirmwareUpload( _req, gszuploadbasedir );

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
		var szpagefile = gszbasedir + oUrl.pathname;
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

function _onWebServerConnection()
{
	console.log('Connection On');
}

function _onWebServerClose()
{
	console.log('WebServer Close On');
}

function _oncheckContinue()
{
	console.log('WebServer _oncheckContinue On');
}

function _callbackWebServerListen()
{
	console.log('callbackWebServerListen 192.168.0.2:3000');
	//console.log( this );
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

function getSharedSecretForUserFunction(_user, _callback) {
	console.log('aaaaaaaaaaaaaaaaaaaa getSharedSecretForUserFunction');

	var result;
	if(_user == 'foo') 
		result= 'bar';
	_callback(null, result);
}

function validatePasswordFunction(_username, _password, _successCallback, _failureCallback) {
	console.log('aaaaaaaaaaaaaaaaaaaa validatePasswordFunction');

	if( _username === 'foo' && _password === "bar" ) {
		_successCallback();
	}
	else {
		_failureCallback();
	}
}
