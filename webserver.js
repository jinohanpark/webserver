
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
var gmWsIO = require('socket.io');

/*
	my modules
*/
var gmMisc = require('./misc.js');
var gmLogin = require('./my_modules/login/login.js');
var gmWebService = require('./my_modules/webservice/webservice.js');


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
gcConnect.use( onWebServerRequest );
gcConnect.use( gmConnect.errorHandler({message:true}) );

/*
*/
var gcWebServer = gmHttp.createServer(gcConnect);

//gcWebServer.on( 'request', onWebServerRequest );
gcWebServer.on( 'connection', onWebServerConnection );
gcWebServer.on( 'close', onWebServerClose );
gcWebServer.on( 'checkContinue', onWebServerClose );
gcWebServer.listen( gnhttpport, callbackWebServerListen );

/*
*/
var gcWsIO = gmWsIO.listen(gcWebServer);
gcWsIO.set('log level', 2);
gcWsIO.sockets.on( 'connection', onWsIOConnection );
gcWsIO.sockets.on( 'message', onWsIOMessage );
gcWsIO.sockets.on( 'anything', onWsIOAnything );
gcWsIO.sockets.on( 'disconnect', onWsIODisconnect );

var gszIDSubscribe_Firmup = 'subscribe_firmup';
var gszIDSubscribe_Chatting = 'subscribe_chatting';

/*
*/
function onWsIOConnection( _socket )
{
	console.log('onWsIOConnection - _socket : ');//console.log('onWsIOConnection - _socket : ', _socket);
	
	_socket.on( gszIDSubscribe_Chatting,
		function(_data) {
			console.log('subscribe_chatting - ClientID(', _socket.id, ')', ' received data:', _data);
			
			switch(_data.action) {
			case 'chatmessage':
				var asznickname = [];
				_socket.get('nickname', function(_err, _name) { asznickname.push(_name); } );

				gcWsIO.sockets.in(gszIDSubscribe_Chatting).emit('event_chatting', { action:'chatmessage', msg:_data.msg, nickname:asznickname } );
				break;

			case 'join':
				console.log('subscribe_chatting - join OK');

				_socket.join(gszIDSubscribe_Chatting);
				_socket.set('nickname', _data.nickname);
				
				var asznickname = [];
				var objsocket = gcWsIO.sockets.clients(gszIDSubscribe_Chatting);
				for( var i=0; i<objsocket.length; i++ ) {
					var socket = objsocket[i];
					socket.get('nickname', function(_err, _name) { asznickname.push(_name); } );
				}

				gcWsIO.sockets.in(gszIDSubscribe_Chatting).emit('event_chatting', { action:'subscriber_list', state:'ok', nickname:asznickname } );
				break;
				
			case 'subscriber_list':
				//console.log('Getting All rooms :', gcWsIO.sockets.manager.rooms);
				//console.log('Getting Clients in a room :', gcWsIO.sockets.clients(gszIDSubscribe_Chatting));
				//console.log('Getting Rooms a client has joined :', gcWsIO.sockets.manager.roomClients[_socket.id]);
				
				var asznickname = [];
				var objsocket = gcWsIO.sockets.clients(gszIDSubscribe_Chatting);

				if( 0 == objsocket.length ) {
					asznickname.push('참여한 사용자가 없습니다.');
				}
				else {
					for( var i=0; i<objsocket.length; i++ ) {
						var socket = objsocket[i];
						socket.get('nickname', function(_err, _name) { asznickname.push(_name); } );
					}
				}
				
				//
				_socket.emit('event_chatting', { action:'subscriber_list', state:'ok', nickname:asznickname } );
				break;
			}
		}
	);
	
	_socket.on( gszIDSubscribe_Firmup,
		function(_data) {
			console.log('subscribe_firmup - ClientID(', _socket.id, ')', ' received data:', _data);
			switch(_data) {
			case 'subscribe':
				console.log('subscribe_firmup - subscribe join OK');

				_socket.join(gszIDSubscribe_Firmup);
				_socket.set(gszIDSubscribe_Firmup, gszIDSubscribe_Firmup);

				gcWsIO.sockets.in(gszIDSubscribe_Firmup).emit('event_firmup', { action:'subscribe', state:'ok' } );
				break;
			}
		}
	);
	
	_socket.on( '_mymsg',
	    function(_data) {
			console.log('ClientID(', _socket.id, ')', ' sent data:', _data);

			var sz = '접속된 모든 클라이언트에게 바이러스를 심습니다.\n' +
					 '"확인" 버튼을 누르시면 고객님에 소중한 정보를 쪽쪽 빨아갑니다.\n\n' + 
					 '감사합니다.';

			if( 'private' == _data ) {
				var id = _socket.id;
				gcWsIO.sockets.sockets[id].emit( '_mymsgack', sz );
			}
			else
			if( 'broadcast' == _data ) {
				_socket.broadcast.emit( '_mymsgack', sz );
			}
			else
			if( 'public' == _data ) {
				gcWsIO.sockets.emit( '_mymsgack', sz );
			}
			else {
				_socket.emit( '_mymsgack', _data );
			}
	    }
	);	
}

function onWsIODisconnect()
{
	console.log('onWsIODisconnect : ');
}

function onWsIOMessage( _message, callbackWsIOMessageACK )
{
	console.log('onWsIOMessage - _message : ', _message);
}

function callbackWsIOMessageACK()
{
	console.log('callbackWsIOMessageACK : ');
}

function onWsIOAnything( _data )
{
	console.log('onWsIOAnything - _data : ', _data);
}

/*
*/
function onWebServerRequest( _req, _res )
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
	var szpagefile = gszbasedir + oUrl.pathname;
	gmFs.readFile( szpagefile, 'utf8', callbackReadPageFile );

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
	case 'ico':		szretfiletype = 'image/x-icon'; break;
	case 'cgi':		szretfiletype = 'application/cgi'; break;
	case 'node':	szretfiletype = 'application/node'; break;
	default:
		//var err = new Error('aaaaa');
		//err.number = 7;
		//throw err;
		console.log('@@@@ OnRequest - NOT FOUND FILETYPE(CONTENT-TYPE) : ', opagefile);
		return null;
	}
	
	return { 'szreqfiletype' : szretfiletype };
}	
