
/*
	internal modules
*/
var gmOS		= require('os');
var gmUtil		= require('util');
var gmFs		= require('fs');

/*
	external modules
*/
var gmWsIO = require('socket.io');

/*
	my modules
*/
var gmMisc = require('../../misc.js');
var gmDataBase = require('../../my_modules/database/database.js');

/*
	global variable
*/
var gszidevent_firmup  = 'event_firmup';
var gszidevent_chatting = 'event_chatting';
var gszidevent_configuration = 'event_configuration';
var gszidevent_serveraction = 'event_serveraction';

/*
	multiple instance
*/
var myWebSocket = function( _name )
{
	this.wsio = null;

	/////////////////////////////////////////////////////////////////////
	/*
	var ee = this.event = new process.EventEmitter();
	setInterval( function() {
		ee.emit('tick', 'xxxxxx');
	}, 1000);
	//
	this.event.on('tick', function( _aaa ) {
		console.log('websock test ontick:' + _aaa);
	});
	*/
};
// export module
module.exports = myWebSocket;

myWebSocket.prototype.Listen = function( _cWebServer )
{
	var self = this;

	var wsio = gmWsIO.listen(_cWebServer);
	self.wsio = wsio;

	//
	wsio.set('log level', 2);

	//
	wsio.sockets.on( 'connection', function( _socket ) {
		return self._onWsIOConnection(_socket);
	});

	wsio.sockets.on( 'message', function( _message, _callbackWsIOMessageACK ) {
		console.log('_onWsIOMessage - ############## _message ############ : ', _message);
		// function _callbackWsIOMessageACK() {
		// 	console.log('callbackWsIOMessageACK : ');
		// }
	});

	wsio.sockets.on( 'anything', function( _data ) {
		console.log('_onWsIOAnything - ############ _data ########### : ', _data);
	});

	wsio.sockets.on( 'disconnect', function() {
		console.log('_onWsIODisconnect ############ ##############: ');
	});
}

myWebSocket.prototype.CloseListen = function()
{

}

myWebSocket.prototype.FirmwareUpload = function( _req, _szuploadbasedir )
{
	var self = this;
	var wsio = self.wsio;

	var szuploadbasedir = _szuploadbasedir || gmOS.tmpDir();
	//console.log(szuploadbasedir);

	var form   = _req.form;
	var files  = [];
	var fields = [];

	form.on( 'progress',
		function(_bytesReceived, _bytesExpected) {
			//console.log('on.progress ', bytesReceived, bytesExpected);

			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'progress', bytesReceived:_bytesReceived, bytesExpected:_bytesExpected } );
		} );

	form.on( 'field', 
		function(_field, _value) {
			console.log('on.field', _field, _value);
			fields.push([_field, _value]);
		} );

	form.on( 'fileBegin', 
		function(_tagname, _file) {
			console.log('on.fileBegin', _tagname, _file);

			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'fileBegin', name:_file.name } );
		} );

	form.on( 'file',
		function(_tagname, _file) {
			console.log('on.file', _tagname, _file);
			files.push([_tagname, _file]);

			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'file', name:_file.name } );
		} );

	form.on( 'error',
		function(_err) {
			console.log('on.error', _err);

			gmFs.unlinkSync( tmp_path );
			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'error' } );
		} );

	form.on( 'aborted',
		function(_err) {
			console.log('on.aborted');

			gmFs.unlinkSync( tmp_path );
			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'aborted' } );
		} );

	form.on( 'end',
		function() {
			console.log('-> upload done');

			var tmp_path = files[0][1].path;
			var target_path = szuploadbasedir + '/' + files[0][1].name;
			//console.log('-> tmp_path', tmp_path);
			//console.log('-> target_path', target_path);
			
			try {
				// move the file from the temporary location to the intended location
				gmFs.renameSync( tmp_path, target_path );
			}
			catch(e) {
				gmMisc.dbgerr( 'error upload - ' + tmp_path + ',' + target_path );
				// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
				gmFs.unlinkSync( tmp_path );
			}

			wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'end' } );
		} );
		
	form.on( 'field', 
		function(_field, _value) {
			console.log('on.field', _field, _value);
			fields.push([_field, _value]);
		} );
}

/*
LOCAL function definition
*/
myWebSocket.prototype._onWsIOConnection = function( _socket )
{
	var self = this;
	var wsio = self.wsio;
	//console.log('onWsIOConnection - _socket : ');//console.log('onWsIOConnection - _socket : ', _socket);

	_socket.on( '_mymsg',
	    function(_data) {
			console.log('ClientID(', _socket.id, ')', ' sent data:', _data);

			var sz = '접속된 모든 클라이언트에게 바이러스를 심습니다.\n' +
					 '"확인" 버튼을 누르시면 고객님에 소중한 정보를 쪽쪽 빨아갑니다.\n\n' + 
					 '감사합니다.';

			if( 'private' == _data ) {
				var id = _socket.id;
				wsio.sockets.sockets[id].emit( '_mymsgack', sz );
			}
			else
			if( 'broadcast' == _data ) {
				_socket.broadcast.emit( '_mymsgack', sz );
			}
			else
			if( 'public' == _data ) {
				wsio.sockets.emit( '_mymsgack', sz );
			}
			else {
				_socket.emit( '_mymsgack', _data );
			}
	    }
	);	

	_socket.on( gszidevent_serveraction,
		function(_data) {
			console.log('event_serveraction - ClientID(', _socket.id, ')', ' received data:', _data);
			//console.log(gmUtil.inspect(_socket, true, null));
		}
	);

	_socket.on( gszidevent_configuration,
		function(_data) {
			console.log('event_configuration - ClientID(', _socket.id, ')', ' received data:', _data);

			var id = _socket.id;

			var ack = {};
			ack.action = 'ready';
			ack.query  = _data.query;
			ack.result = ' ';
			wsio.sockets.sockets[id].emit( 'event_configuration', ack );

			switch(_data.action) {
			case 'get':
				_db_getconfiguration( _data.query, function(_result, _json) {
					//console.log('from DB _result ', _result);
					var ack = {};
					ack.action = _data.action;
					ack.query  = _data.query;
					ack.result = _json;
					wsio.sockets.sockets[id].emit( 'event_configuration', ack );

					var ack = {};
					ack.action = 'getdone';
					ack.query  = _data.query;
					ack.result = ' ';
					wsio.sockets.sockets[id].emit( 'event_configuration', ack );
				});
				break;

			case 'set':
				var cnt = 0;
				_db_setconfiguration( _data.query, function(_result, _json) {
					var ack = {};
					ack.action = _data.action;
					ack.query  = _data.query;
					ack.result = 'ok';
					wsio.sockets.sockets[id].emit( 'event_configuration', ack );

					if( (++cnt) == _data.query.length ) {
						var ack = {};
						ack.action = 'setdone';
						ack.query  = _data.query;
						ack.result = ' ';
						wsio.sockets.sockets[id].emit( 'event_configuration', ack );

						//
						var ack = {};
						ack.href   = _data.href;
						ack.action = 'onchange';
						ack.query  = _data.query;
						ack.result = ' ';
						//wsio.sockets.in(gszidevent_configuration).emit('event_configuration', ack);
						_socket.broadcast.emit('event_configuration', ack);

						//
						// serveraction을 먼저 하고 'onchange'를 뿌려?
						//console.log('_data.serveraction.which:', _data.serveraction.which);
						//console.log('_data.serveraction.latch:', _data.serveraction.latch);
						//if('yes' == _data.serveraction.latch) {
						//	_serveraction( 'set', _data.serveraction.which );
						//}
					}
				});
				break;

			case 'join':
				console.log('event_configuration - join OK');
				
				_socket.join(gszidevent_configuration);
				_socket.set('nickname', _data.query); //nickname이 반드시 필요한건 아니다.

				var ack = {};
				ack.action = _data.action;
				ack.query  = _data.query;
				ack.result = 'ok';
				wsio.sockets.sockets[id].emit( 'event_configuration', ack );
				break;
			}
		}
	);

	_socket.on( gszidevent_chatting,
		function(_data) {
			console.log('event_chatting - ClientID(', _socket.id, ')', ' received data:', _data);
			
			switch(_data.action) {
			case 'chatmessage':
				var asznickname = [];
				_socket.get('nickname', function(_err, _name) { asznickname.push(_name); } );

				wsio.sockets.in(gszidevent_chatting).emit('event_chatting', { action:'chatmessage', msg:_data.msg, nickname:asznickname } );
				break;

			case 'join':
				console.log('event_chatting - join OK');

				_socket.join(gszidevent_chatting);
				_socket.set('nickname', _data.nickname);
				
				var asznickname = [];
				var objsocket = wsio.sockets.clients(gszidevent_chatting);
				for( var i=0; i<objsocket.length; i++ ) {
					var socket = objsocket[i];
					socket.get('nickname', function(_err, _name) { asznickname.push(_name); } );
				}

				wsio.sockets.in(gszidevent_chatting).emit('event_chatting', { action:'subscriber_list', state:'ok', nickname:asznickname } );
				break;
				
			case 'subscriber_list':
				//console.log('Getting All rooms :', wsio.sockets.manager.rooms);
				//console.log('Getting Clients in a room :', wsio.sockets.clients(gszidevent_chatting));
				//console.log('Getting Rooms a client has joined :', wsio.sockets.manager.roomClients[_socket.id]);
				
				var asznickname = [];
				var objsocket = wsio.sockets.clients(gszidevent_chatting);

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
	
	_socket.on( gszidevent_firmup,
		function(_data) {
			console.log('event_firmup - ClientID(', _socket.id, ')', ' received data:', _data);
			switch(_data) {
			case 'subscribe':
				console.log('event_firmup - subscribe join OK');

				_socket.join(gszidevent_firmup);
				_socket.set(gszidevent_firmup, gszidevent_firmup);

				wsio.sockets.in(gszidevent_firmup).emit('event_firmup', { action:'subscribe', state:'ok' } );
				break;
			}
		}
	);
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

function _db_setconfiguration(_queryitem, _callback)
{
	var query = 'UPDATE configuration SET rvalue=? WHERE lvalue=?';
	for( var i=0; i<_queryitem.length; i++ ) {

		var queryarray = [_queryitem[i].rvalue, _queryitem[i].lvalue];
		gmDataBase.setquery_config( query, queryarray, function(_result) {
			var json = {};
			_callback(_result, json);
		});
	}
}
