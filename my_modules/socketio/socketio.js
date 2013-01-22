
var gcmyWsIO = new myWebSocket();
exports = module.exports = gcmyWsIO;

/*
	internal modules
*/
var gmOS		= require('os');
var gmUtil		= require('util');
var gmFs		= require('fs');
var gmBuffer	= require('buffer');

/*
	external modules
*/
var gmWsIO = require('socket.io');
var gcWsIO;

/*
	my modules
*/
var gmDataBase = require('../../my_modules/database/database.js');
var gcDBClient = gmDataBase.init();

/*
	global variable
*/
var gszIDSubscribe_Firmup   = 'subscribe_firmup';
var gszIDSubscribe_Chatting = 'subscribe_chatting';
var gszIDSubscribe_Configuration = 'subscribe_configuration';


/*
PUBLIC function definition 
*/
function myWebSocket( _name )
{
	this.self = this;		// gcmyWsIO
}

myWebSocket.prototype.GetSubscribeID = function( _what )
{
	if( 'firmup' == _what ) return gszIDSubscribe_Firmup;
}

myWebSocket.prototype.CloseListen = function()
{

}

myWebSocket.prototype.Listen = function( _cWebServer )
{
	gcWsIO = gmWsIO.listen(_cWebServer);
	
	gcWsIO.set('log level', 2);
	
	gcWsIO.sockets.on( 'connection', _onWsIOConnection );
	gcWsIO.sockets.on( 'message', _onWsIOMessage );
	gcWsIO.sockets.on( 'anything', _onWsIOAnything );
	gcWsIO.sockets.on( 'disconnect', _onWsIODisconnect );
	
	return gcWsIO;
}

/*
LOCAL function definition
*/
function _onWsIOConnection( _socket )
{
	//console.log('onWsIOConnection - _socket : ');//console.log('onWsIOConnection - _socket : ', _socket);

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

	_socket.on( gszIDSubscribe_Configuration,
		function(_data) {
			console.log('subscribe_configuration - ClientID(', _socket.id, ')', ' received data:', _data);

			var id = _socket.id;

			var ack = {};
			ack.action = 'ready';
			ack.query  = _data.query;
			ack.result = ' ';
			gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );

			switch(_data.action) {
			case 'get':
				_db_getconfiguration( _data.query, function(_result, _json) {
					//console.log('from DB _result ', _result);
					var ack = {};
					ack.action = _data.action;
					ack.query  = _data.query;
					ack.result = _json;
					gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );

					var ack = {};
					ack.action = 'getdone';
					ack.query  = _data.query;
					ack.result = ' ';
					gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );
				});
				break;

			case 'set':
				var cnt = 0;
				_db_setconfiguration( _data.query, function(_result, _json) {
					var ack = {};
					ack.action = _data.action;
					ack.query  = _data.query;
					ack.result = 'ok';
					gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );

					if( (++cnt) == _data.query.length ) {
						var ack = {};
						ack.action = 'setdone';
						ack.query  = _data.query;
						ack.result = ' ';
						gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );

						var ack = {};
						ack.href   = _data.href;
						ack.action = 'onchange';
						ack.query  = _data.query;
						ack.result = ' ';

						//gcWsIO.sockets.in(gszIDSubscribe_Configuration).emit('publish_configuration', ack);
						_socket.broadcast.emit('publish_configuration', ack);
					}
				});
				break;

			case 'join':
				console.log('subscribe_configuration - join OK');
				
				_socket.join(gszIDSubscribe_Configuration);
				_socket.set('nickname', _data.query); //nickname이 반드시 필요한건 아니다.

				var ack = {};
				ack.action = _data.action;
				ack.query  = _data.query;
				ack.result = 'ok';
				gcWsIO.sockets.sockets[id].emit( 'publish_configuration', ack );
				break;
			}
		}
	);

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
}

function _onWsIODisconnect()
{
	console.log('_onWsIODisconnect : ');
}

function _onWsIOMessage( _message, _callbackWsIOMessageACK )
{
	console.log('_onWsIOMessage - _message : ', _message);
	
	function _callbackWsIOMessageACK()
	{
		console.log('callbackWsIOMessageACK : ');
	}
}

function _onWsIOAnything( _data )
{
	console.log('_onWsIOAnything - _data : ', _data);
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

function _db_setconfiguration(_queryitem, _callback)
{
	var query = 'UPDATE configuration SET rvalue=? WHERE lvalue=?';
	for( var i=0; i<_queryitem.length; i++ ) {

		var queryarray = [_queryitem[i].rvalue, _queryitem[i].lvalue];
		gmDataBase.setquery_ipcam_config( query, queryarray, function(_result) {
			var json = {};
			_callback(_result, json);
		});
	}
}
