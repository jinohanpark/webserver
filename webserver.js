
/*
	based on node.js v0.8.14
*/



var gnhttpport = 3000;
var gszbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www';
var gszuploadbasedir = '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www/upload';

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
var gmMisc = require('./misc.js');
var gmLogin = require('./my_modules/login/login.js');
var gmWebService = require('./my_modules/webservice/webservice.js');
var gmDataBase = require('./my_modules/database/database.js');
var gmmyWsIO = require('./my_modules/socketio/socketio.js');

/*
*/
var gcDBClient = gmDataBase.init();
//console.log('gcDBClient:', gcDBClient);
gmDataBase.makedefault_ipcam_database();

/*
*/
var gcWebServiceServer = gmWebService.createSocket();
//console.log('gcWebServiceServer:', gcWebServiceServer);

/*
*/
var gcConnect = gmConnect();
gcConnect.use( gmConnect.query() );
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

/*
*/
gmmyWsIO.Listen( gcWebServer );


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
	//console.log('gmConnect.cookies:', _req.cookies);
	//console.log('gmConnect.session:', _req.session);
	console.log('gmUrl.url:', _req.url);

	//
	var szreqfiletype;

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
	}

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
		case '/cgi-bin/login.node':
			var fok = gmLogin.authen(_req);
			if( false == fok ) {
				_fnRedirectPage(_req, _res, '/login.html');
			}
			else {
				_fnRedirectPage(_req, _res, '/index.html');
			}
			break;

		case '/cgi-bin/upload.node':
			console.log('-> /cgi-bin/upload.node');

			var form   = _req.form;
			var files  = [];
			var fields = [];

			form.on( 'progress',
				function(_bytesReceived, _bytesExpected) {
					//console.log('on.progress ', bytesReceived, bytesExpected);
					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'progress', bytesReceived:_bytesReceived, bytesExpected:_bytesExpected } );
				} );

			form.on( 'field', 
				function(_field, _value) {
					console.log('on.field', _field, _value);
					fields.push([_field, _value]);
				} );

			form.on( 'fileBegin', 
				function(_tagname, _file) {
					console.log('on.fileBegin', _tagname, _file);

					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'fileBegin', name:_file.name } );
				} );

			form.on( 'file',
				function(_tagname, _file) {
					console.log('on.file', _tagname, _file);
					files.push([_tagname, _file]);

					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'file', name:_file.name } );
				} );

			form.on( 'error',
				function(_err) {
					console.log('on.error', _err);

					gmFs.unlinkSync( tmp_path );
					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'error' } );
				} );

			form.on( 'aborted',
				function(_err) {
					console.log('on.aborted');

					gmFs.unlinkSync( tmp_path );
					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'aborted' } );
				} );

			form.on( 'end',
				function() {
					console.log('-> upload done');

					var tmp_path = files[0][1].path;
					var target_path = gszuploadbasedir + '/' + files[0][1].name;
					//console.log('-> tmp_path', tmp_path);
					//console.log('-> target_path', target_path);
					
					try {
						// move the file from the temporary location to the intended location
						gmFs.renameSync( tmp_path, target_path );
					} catch(e) {
						gmMisc.dbgerr( 'error upload - ' + tmp_path + ',' + target_path );
						// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
						gmFs.unlinkSync( tmp_path );
					}

					gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'end' } );
				} );
				
			form.on( 'field', 
				function(_field, _value) {
					console.log('on.field', _field, _value);
					fields.push([_field, _value]);
				} );
				

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
	if( ('text/html' == szreqfiletype) ) {
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

	//
	if( ('ssi/javascript' == szreqfiletype) ) {
		var sz = 'var gnaaaa = 1;';
		callbackReadPageFile( 0, sz );
	}
	else {	// HTML,JS,CSS,...
		var szpagefile = gszbasedir + oUrl.pathname;
		gmFs.readFile( szpagefile, 'utf8', callbackReadPageFile );
	}
	
	function callbackReadPageFile( error, data )
	{
		if( error ) {
			console.log( error );
			_res.writeHead( 404, { 'Content-Type': 'text/html' } );
			_res.end();
		}
		else {
			var date = new Date();
			date.setDate(date.getDate() + 7);
			_res.writeHead( 200, {
							'Server': 'node.js-jinohan.park',
							'Content-Type': szreqfiletype,
							'Set-Cookie': [ //'breakfast = toast;Expires = ' + date.toUTCString(),
											'dinner = chicken',
											'testkey = testvalue'
										  ]
						    }
						  );
			_res.end( data );
		}
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
	console.log('callbackWebServerListen 192.168.1.2:3000');
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
	
	//
	var oUrl = gmUrl.parse(_req.url);
	var opagefile = oUrl.pathname.split('.');

	switch( opagefile[opagefile.length-1] ) {
	case 'html':	szretfiletype = 'text/html'; break;
	case 'css':		szretfiletype = 'text/css'; break;
	case 'js':		szretfiletype = 'application/javascript'; break;
	case 'png':		szretfiletype = 'image/png'; break;
	case 'gif':		szretfiletype = 'image/gif'; break;
	case 'ico':		szretfiletype = 'image/x-icon'; break;
	case 'cgi':		szretfiletype = 'application/cgi'; break;
	case 'node':	szretfiletype = 'application/node'; break;
	case 'ssi':		szretfiletype = 'ssi/javascript'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return null;
	}
	
	return { 'szreqfiletype' : szretfiletype };
}	
