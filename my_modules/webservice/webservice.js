
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
var gmBuffer = require('buffer');

/*
	external modules
*/
var gmXml = require('node-xml');

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
	
	gmFs.writeFileSync('req.xml', _msg, 'utf8');

	var parser = new gmXml.SaxParser(
		function(_cb) {
			_cb.onStartDocument( function() { console.log('onStartDocument'); } );
			_cb.onEndDocument( function() { console.log('onEndDocument'); } );
			
			_cb.onStartElementNS( function(elem, attrs, prefix, uri, namespaces) {
				console.log("=> Started: " + elem + " uri=" + uri + " prefix=" + prefix + " namespaces=" + namespaces + " (Attributes: " + JSON.stringify(attrs) + " )");
			});
			
			_cb.onEndElementNS( function(elem, prefix, uri) {
				console.log("<= End: " + elem + " uri=" + uri + " prefix=" + prefix + "\n");
				parser.pause();// pause the parser
				
				setTimeout( function (){parser.resume();}, 100 ); //resume the parser
			});
			
			_cb.onCharacters( function(chars) {
				console.log('<CHARS>'+chars+"</CHARS>");
			});
			
			_cb.onCdata( function(cdata) {
				console.log('<CDATA>'+cdata+"</CDATA>");
			});
			
			_cb.onComment( function(msg) {
				console.log('<COMMENT>'+msg+"</COMMENT>");
			});
			
			_cb.onWarning( function(msg) {
				console.log('<WARNING>'+msg+"</WARNING>");
			});
			
			_cb.onError( function(msg) {
				console.log('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
			});
		}
	);
	
	parser.parseString(_msg);
	
	/*
	var resmsg = gmFs.readFileSync('aaa.xml', 'utf8');
	
	var data = new Buffer(resmsg, 'utf8');
	gcWebServiceServer.send( data, 0, data.length, _rinfo.port, _rinfo.address,
		function(_err, _bytes) {
			console.log('- .send _bytes :', _bytes);
			console.log('- .send data :', data);
			console.log('- .send data.length :', data.length);
		}
	);
	*/
}

function onWebServiceClose()
{
	console.log('<onWebServiceClose>');
}

function onWebServiceError()
{
	console.log('<onWebServiceError>');
}

function onWebServiceListening()
{
	console.log('<onWebServiceListening> - ', gcWebServiceServer.address());

	/*
	var parser = new gmXml.SaxParser(
		function(_cb) {
			_cb.onStartDocument( function() { console.log('onStartDocument'); } );
			_cb.onEndDocument( function() { console.log('onEndDocument'); } );
			
			_cb.onStartElementNS( function(elem, attrs, prefix, uri, namespaces) {
				console.log("=> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
			});
			
			_cb.onEndElementNS( function(elem, prefix, uri) {
				console.log("<= End: " + elem + " uri="+uri + "\n");
				parser.pause();// pause the parser
				
				setTimeout( function (){parser.resume();}, 100 ); //resume the parser
			});
			
			_cb.onCharacters( function(chars) {
				console.log('<CHARS>'+chars+"</CHARS>");
			});
			
			_cb.onCdata( function(cdata) {
				console.log('<CDATA>'+cdata+"</CDATA>");
			});
			
			_cb.onComment( function(msg) {
				console.log('<COMMENT>'+msg+"</COMMENT>");
			});
			
			_cb.onWarning( function(msg) {
				console.log('<WARNING>'+msg+"</WARNING>");
			});
			
			_cb.onError( function(msg) {
				console.log('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
			});
		}
	);

	//parser.parseString('<?xml version="1.0" encoding="UTF-8"?>');
	//parser.parseFile('req.xml');
	*/	
}
