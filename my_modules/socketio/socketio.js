﻿
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

/*
	my modules
*/

var gszIDSubscribe_Firmup   = 'subscribe_firmup';
var gszIDSubscribe_Chatting = 'subscribe_chatting';


var gcWsIO;

/*
PUBLIC function definition 
*/
function myWebSocket( _name )
{
	this.self = this;		// gcmyWsIO
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
}

/*
LOCAL function definition
*/
function _onWsIOConnection( _socket )
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
