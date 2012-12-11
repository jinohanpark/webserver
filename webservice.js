
/*
	based on node.js v0.8.14
*/



var gnWebService_UDPport = 3702;
var gnWebService_MulticastIP = '239.255.255.250';

/*
	internal modules
*/
var gmDgram = require('dgram');
var gmUtil = require('util');
var gmFs   = require('fs');

/*
	external modules
*/
var gmConnect = require('connect');

/*
	my modules
*/
var gmMisc = require('./misc.js');

/*
*/
var gcWebServiceServer = gmDgram.createSocket('udp4');

gcWebServiceServer.on( 'message', onWebServiceMessage );
gcWebServiceServer.on( 'listening', onWebServiceListening );
gcWebServiceServer.on( 'close', onWebServiceClose );
gcWebServiceServer.on( 'error', onWebServiceError );
gcWebServiceServer.bind(gnWebService_UDPport);
gcWebServiceServer.setBroadcast(1);
gcWebServiceServer.setTTL(1);
gcWebServiceServer.addMembership(gnWebService_MulticastIP);

/*
*/
function onWebServiceMessage(_msg, _rinfo)
{
	console.log('<onWebServiceMessage>');
	console.log('_msg:', _msg);
	console.log('_rinfo:', _rinfo);
	
	
}

function onWebServiceClose()
{
	console.log('<onWebServiceClose>');
}

function onWebServiceListening()
{
	console.log('<onWebServiceListening> - ', gcWebServiceServer.address());
}

function onWebServiceError()
{
	console.log('<onWebServiceError>');
}
