
var gcmyWebService = new myWebService();
exports = module.exports = gcmyWebService;

/*
	internal modules
*/
var gmDgram		= require('dgram');
var gmOS		= require('os');
var gmUtil		= require('util');
var gmFs		= require('fs');
var gmBuffer	= require('buffer');

/*
	external modules
*/
var gmXml = require('node-xml');
var gmXml2Json = require('xml2json');
//var gmXml2Js = require('xml2js');

/*
	my modules
*/
var gmMisc = require('../../misc.js');
/*
gmMisc.event.on('aaa', function(_param) {
	console.log('gmMisc.event.on _param:', _param);
});
*/
var gmDataBase = require('../../my_modules/database/database.js');
var gcDBClient = gmDataBase.init();


/*
PUBLIC function definition 
*/
function myWebService( _name )
{
	this.self = this;		// gcmyWebService
	this.cSocketServer = '';
	
	this.nWebService_UDPport = 3702;
	this.nWebService_MulticastIP = '239.255.255.250';

}

myWebService.prototype.createSocket = function()
{
	this.cSocketServer = gmDgram.createSocket('udp4');

	this.cSocketServer.on( 'message', this._onWebServiceMessage );
	this.cSocketServer.on( 'listening', this._onWebServiceListening );
	this.cSocketServer.on( 'close', this._onWebServiceClose );
	this.cSocketServer.on( 'error', this._onWebServiceError );
	this.cSocketServer.bind( this.nWebService_UDPport );
	this.cSocketServer.setBroadcast(1);
	this.cSocketServer.setTTL(1);
	this.cSocketServer.addMembership( this.nWebService_MulticastIP );

	return this.cSocketServer;
}

myWebService.prototype.fireWebServiceMessage = function( _szwhat )
{
	var szbroadmsg = null;

	switch( _szwhat) {
	case 'broad_hello':
		szbroadmsg = this._makebroad_hello(); //console.log('this._makebroad_hello : \r\n', szbroadmsg, '\r\n');
		break;
	}

	if( null != szbroadmsg ) {
		var data = new Buffer(szbroadmsg, 'utf8');
		gcmyWebService.cSocketServer.send( data, 0, data.length, gcmyWebService.nWebService_UDPport, gcmyWebService.nWebService_MulticastIP,
			function(_err, _bytes) {
				console.log('gcmyWebService.cSocketServer.send broadpacket - %s:%d(len:%d)', gcmyWebService.nWebService_MulticastIP, gcmyWebService.nWebService_UDPport, _bytes);
				//console.log('- .send data :', data);
				//console.log('- .send data.length :', data.length);
			}
		);
		delete data;
	}
}

myWebService.prototype.onWebServiceHTTPMessage = function( _req, _res, _msg )
{
	var retcode = 0;

	var xmlobj = {};
	var parser = new gmXml.SaxParser( 
	function(cb) {
		cb.onStartDocument(function() { });
		cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
			//console.log("=> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
			if( ('Envelope' == elem) && ('http://www.w3.org/2003/05/soap-envelope' == uri) ) { xmlobj.soap = 'yes'; }
			if( ('Body' == elem) &&	('http://www.w3.org/2003/05/soap-envelope' == uri) ) { xmlobj.body = 'yes'; }
		});
		cb.onEndElementNS(function(elem, prefix, uri) {
			//console.log("<= End: " + elem + " uri="+uri + " prefix="+prefix + "\n");
			//elem.toLowerCase()
			if( ('http://www.onvif.org/ver10/device/wsdl' == uri) ) { 
				if( ('yes' == xmlobj.body) && ('yes' == xmlobj.soap) ) {
					xmlobj.req = elem;
				}
			}
		});
		cb.onCharacters(function(chars) { console.log('<CHARS>'+chars+"</CHARS>"); });
		cb.onCdata(function(cdata) { console.log('<CDATA>'+cdata+"</CDATA>"); });
		cb.onComment(function(msg) { console.log('<COMMENT>'+msg+"</COMMENT>"); });
		cb.onWarning(function(msg) { console.log('<WARNING>'+msg+"</WARNING>"); });
		cb.onError(function(msg) { console.log('<ERROR>'+JSON.stringify(msg)+"</ERROR>"); });
		cb.onEndDocument(function() { });
	});

	parser.parseString(_msg);

	//
	var szresmsg = null;
	
	if( xmlobj.req ) {
		console.log('onvif-req:', xmlobj.req);

		switch( xmlobj.req ) {
		case 'GetDeviceInformation':
			this._makeres_getdeviceinformation(xmlobj, _callbackHttpResponse);
			break;

		default:
			console.log('??? onvif-req:', xmlobj.req);
			break;			
		}
	}
	else {
		;
	}
	
	function _callbackHttpResponse( _szresmsg ) {
		var data = new Buffer(_szresmsg, 'utf8');
		_res.writeHead( 200, { 'Server': 'node.js-jinohan.park',
							   'Content-Length': data.length,
							   'Content-Type': 'application/soap+xml; charset=utf-8' } );
		_res.end(data);
		delete data;
	}
		
	return retcode;
}

//////////////////////////////////////////////////////////////////////////////////////////////
/*
LOCAL function definition 
*/
myWebService.prototype._onWebServiceMessage = function(_msg, _rinfo)
{
	console.log('<_onWebServiceMessage>');
	//console.log('_msg:', _msg);
	console.log('_rinfo:', _rinfo);

if(1) {
	gmFs.writeFileSync('req.xml', _msg, 'utf8');
}

	var json;
if(0) {
	var xmlfile = gmFs.readFileSync('reqtest.xml', 'utf8');
	var xmldata = new Buffer(xmlfile, 'utf8');
	json = gmXml2Json.toJson(xmldata, {reversible:true});
	delete xmldata;
} else {
	json = gmXml2Json.toJson(_msg/*xmldata*/, {reversible:true});
}
	//console.log('json', json);

	var xmlobj = JSON.parse(json); //console.log('xmlobj xml2json', gmUtil.inspect(xmlobj, false, null));

	var szresmsg = null;
	if( true == gcmyWebService._is_probe(xmlobj) ) {
		szresmsg = gcmyWebService._makeres_probematch(xmlobj); //console.log('gcmyWebService._makeres_probematch : \r\n', szresmsg, '\r\n');
	}

	if( null != szresmsg ) {
		var data = new Buffer(szresmsg, 'utf8');
		gcmyWebService.cSocketServer.send( data, 0, data.length, _rinfo.port, _rinfo.address,
			function(_err, _bytes) {
				console.log('gcmyWebService.cSocketServer.send respacket - %s:%d(len:%d)', _rinfo.address, _rinfo.port, _bytes);
				//console.log('- .send data :', data);
				//console.log('- .send data.length :', data.length);
			}
		);
		delete data;
	}
}

myWebService.prototype._onWebServiceClose = function()
{
	console.log('<onWebServiceClose>');
}

myWebService.prototype._onWebServiceError = function()
{
	console.log('<onWebServiceError>');
}

myWebService.prototype._onWebServiceListening = function()
{
	console.log('<_onWebServiceListening> - ', gcmyWebService.cSocketServer.address());
	
	gcmyWebService.fireWebServiceMessage('broad_hello');
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	check WS-Discovery protocol
*/
myWebService.prototype._is_probe = function(_xmlobj)
{
	var fret = false;
	
	if( !_xmlobj.Envelope ) return fret;
	if( _xmlobj.Envelope['xmlns:dn'] != 'http://www.onvif.org/ver10/network/wsdl' ) return fret;

	if( _xmlobj.Envelope.Header['wsa:To'].$t     != 'urn:schemas-xmlsoap-org:ws:2005:04:discovery' ) return fret;
	if( _xmlobj.Envelope.Header['wsa:Action'].$t != 'http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe' ) return fret;

	if( _xmlobj.Envelope.Body.Probe['xmlns']	 != 'http://schemas.xmlsoap.org/ws/2005/04/discovery' ) return fret;

	var probetypes = _xmlobj.Envelope.Body.Probe.Types.$t;
	if( probetypes != 'dn:NetworkVideoTransmitter' ) return fret;

	fret = true;
	return fret;
}

myWebService.prototype._makemsg_soap_envelope = function( _sz )
{
	_sz += 
	'<?xml version="1.0" encoding="UTF-8"?>\n'
			 +'<SOAP-ENV:Envelope '
			 +'xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" '
			 +'xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" '
			 +'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
			 +'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
			 +'xmlns:c14n="http://www.w3.org/2001/10/xml-exc-c14n#" '
			 +'xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" '
			 +'xmlns:xenc="http://www.w3.org/2001/04/xmlenc#" '
			 +'xmlns:ds="http://www.w3.org/2000/09/xmldsig#" '
			 +'xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" '
			 +'xmlns:dn="http://www.onvif.org/ver10/network/wsdl" '
			 +'xmlns:wsa5="http://schemas.xmlsoap.org/ws/2004/08/addressing" '
			 +'xmlns:xmime="http://tempuri.org/xmime.xsd" '
			 +'xmlns:xop="http://www.w3.org/2004/08/xop/include" '
			 +'xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing" '
			 +'xmlns:tt="http://www.onvif.org/ver10/schema" '
			 +'xmlns:wsrfbf="http://docs.oasis-open.org/wsrf/bf-2" '
			 //+'xmlns:wsaw="http://www.w3.org/2006/05/addressing/wsdl" '
			 +'xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2" '
			 +'xmlns:wstop="http://docs.oasis-open.org/wsn/t-1" '
			 +'xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" '
			 +'xmlns:ns2="http://www.onvif.org/ver10/network/wsdl/RemoteDiscoveryBinding" '
			 +'xmlns:ns3="http://www.onvif.org/ver10/network/wsdl/DiscoveryLookupBinding" '
			 +'xmlns:ns1="http://www.onvif.org/ver10/network/wsdl" '
			 +'xmlns:ns4="http://www.onvif.org/ver20/analytics/wsdl/RuleEngineBinding" '
			 +'xmlns:ns5="http://www.onvif.org/ver20/analytics/wsdl/AnalyticsEngineBinding" '
			 +'xmlns:ns6="http://docs.oasis-open.org/wsn/b-2" '
			 +'xmlns:ns7="http://docs.oasis-open.org/wsn/t-1" '
			 +'xmlns:ns9="http://www.onvif.org/ver10/events/wsdl/EventBinding" '
			 +'xmlns:tet="http://www.onvif.org/ver10/events/wsdl" '
			 +'xmlns:tan="http://www.onvif.org/ver20/analytics/wsdl" '
			 +'xmlns:tad="http://www.onvif.org/ver10/analyticsdevice/wsdl" '
			 +'xmlns:tds="http://www.onvif.org/ver10/device/wsdl" '
			 +'xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl" '
			 +'xmlns:tls="http://www.onvif.org/ver10/display/wsdl" '
			 +'xmlns:tmd="http://www.onvif.org/ver10/deviceIO/wsdl" '
			 +'xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" '
			 +'xmlns:trc="http://www.onvif.org/ver10/recording/wsdl" '
			 +'xmlns:trp="http://www.onvif.org/ver10/replay/wsdl" '
			 +'xmlns:trt="http://www.onvif.org/ver10/media/wsdl" '
			 +'xmlns:trv="http://www.onvif.org/ver10/receiver/wsdl" '
			 +'xmlns:tse="http://www.onvif.org/ver10/search/wsdl" '
			 +'xmlns:ter="http://www.onvif.org/ver10/error" '
			 +'xmlns:tns1="http://www.onvif.org/ver10/topics" '
			 +'xmlns:dis="http://docs.oasis-open.org/ws-dd/ns/discovery/2009/01">'
	;

	return _sz;
}

myWebService.prototype._makemsg_soap_header = function( _objres, _sz, _szwhat )
{
	_sz +=
	 '<SOAP-ENV:Header>'
	+'<wsa:MessageID>' + _objres.messageid + '</wsa:MessageID>'
	;

	switch( _szwhat ) {
	case 'res_probematch':
		_sz += ''
		+'<wsa:RelatesTo>' + _objres.req_messageid + '</wsa:RelatesTo>'
		+'<wsa:To SOAP-ENV:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:To>'
		+'<wsa:Action SOAP-ENV:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2005/04/discovery/ProbeMatches</wsa:Action>'
		;
		break;

	case 'broad_hello':		
		_sz += ''
		+'<wsa:To SOAP-ENV:mustUnderstand="true">urn:schemas-xmlsoap-org:ws:2005:04:discovery</wsa:To>'
		+'<wsa:Action SOAP-ENV:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2005/04/discovery/Hello</wsa:Action>'
		;
		break;
	}

	_sz += ''
	+'</SOAP-ENV:Header>'
	;
	
	return _sz;
}	

myWebService.prototype._makemsg_soap_body = function( _objres, _sz, _szwhat )
{
	_sz += 
	'<SOAP-ENV:Body>'
	;
	
	switch( _szwhat ) {
	case 'res_getdeviceinformation':
		_sz += ''
		+'<tds:GetDeviceInformationResponse>'
		+'<tds:Manufacturer>'+_objres.manufacturer+'</tds:Manufacturer>'	// Samsung Techwin
		+'<tds:Model>'+_objres.model+'</tds:Model>'					// SNP-6200
		+'<tds:FirmwareVersion>'+_objres.fwversion+'</tds:FirmwareVersion>'	// 1.02_121119
		+'<tds:SerialNumber>'+_objres.serialno+'</tds:SerialNumber>'	// 7000
		+'<tds:HardwareId>'+_objres.hwid+'</tds:HardwareId>'	// SNP-6200
		+'</tds:GetDeviceInformationResponse>'
		;
		break;
		
	case 'res_probematch':
		_sz += ''
		+'<d:ProbeMatches>'
		+'<d:ProbeMatch>'
		+'<wsa:EndpointReference>'
		+'<wsa:Address>urn:' + _objres.messageid + '</wsa:Address>'
		+'<wsa:ReferenceProperties></wsa:ReferenceProperties>'
		+'<wsa:ReferenceParameters></wsa:ReferenceParameters>'
		+'<wsa:PortType>' + _objres.porttype + '</wsa:PortType>'
		+'</wsa:EndpointReference>'
		+'<d:Types>' + _objres.types + '</d:Types>'
		+'<d:Scopes>onvif://www.onvif.org/type/' + _objres.scopes.type + ' '
		+		   'onvif://www.onvif.org/name/' + _objres.scopes.name + ' '
		+		   'onvif://www.onvif.org/hardware/' + _objres.scopes.hardware + ' '
		+		   'onvif://www.onvif.org/location/country/' + _objres.scopes.location.country + ' '
		+		   'onvif://www.onvif.org/location/city/' + _objres.scopes.location.city + ' '
		+'</d:Scopes>'
		+'<d:XAddrs>' + _objres.xaddrs + '</d:XAddrs>'
		+'<d:MetadataVersion>' + _objres.metadataversion + '</d:MetadataVersion>'
		+'</d:ProbeMatch>'
		+'</d:ProbeMatches>'
		;
		break;

	case 'broad_hello':
		_sz += ''
		+'<d:Hello>'
		+'<wsa:EndpointReference>'
		+'<wsa:Address>urn:' + _objres.messageid + '</wsa:Address>'
		+'</wsa:EndpointReference>'
		+'<d:Types>' + _objres.types + '</d:Types>'
		+'<d:Scopes>onvif://www.onvif.org/type/' + _objres.scopes.type + ' '
		+		   'onvif://www.onvif.org/name/' + _objres.scopes.name + ' '
		+		   'onvif://www.onvif.org/hardware/' + _objres.scopes.hardware + ' '
		+		   'onvif://www.onvif.org/location/country/' + _objres.scopes.location.country + ' '
		+		   'onvif://www.onvif.org/location/city/' + _objres.scopes.location.city + ' '
		+'</d:Scopes>'
		+'<d:XAddrs>' + _objres.xaddrs + '</d:XAddrs>'
		+'<d:MetadataVersion>' + _objres.metadataversion + '</d:MetadataVersion>'
		+'</d:Hello>'
		;
		break;
	}
	
	_sz += ''
		+'</SOAP-ENV:Body>'
		+'</SOAP-ENV:Envelope>'
		;
					
	return _sz;
}

myWebService.prototype._makeres_probematch = function(_xmlobj)
{
	var objres = {};
	
	objres.req_messageid = _xmlobj.Envelope.Header['wsa:MessageID'].$t;

	var szmacaddr = '5E0C0C0C0C0C';
	objres.messageid = 'uuid:99245ae4-e8b3-459f-b29f-' + szmacaddr;

	objres.porttype = 'ttl';
	objres.types = 'dn:NetworkVideoTransmitter';
	objres.scopes = {};
	objres.scopes.type = 'NetworkVideoTransmitter';
	objres.scopes.name = 'IP-TESTTEST';
	objres.scopes.hardware = 'IP-HARDWARE';
	
	objres.scopes.location = {};
	objres.scopes.location.country = 'korea';
	objres.scopes.location.city = 'seoul';
	
	objres.xaddrs = 'http://192.168.0.2:3000/onvif/device_service';
	objres.metadataversion = '1';

	////////////////////////////////////////////////////////////////////////////
	var szresmsg = '';
	szresmsg = this._makemsg_soap_envelope( szresmsg );
	szresmsg = this._makemsg_soap_header( objres, szresmsg, 'res_probematch' );
	szresmsg = this._makemsg_soap_body( objres, szresmsg, 'res_probematch' );
	
	return szresmsg;
}

myWebService.prototype._makebroad_hello = function()
{
	var objres = {};
	
	//console.log( 'gmOS.getNetworkInterfaces: ', gmOS.getNetworkInterfaces());
	//console.log( 'process.hrtime: ', process.hrtime());
	
	var time = process.hrtime();
	var buf = new Buffer(8);
	buf.writeDoubleLE( parseInt(eval('time[0] * time[1]'),16), 0 );

	var szmacaddr = '5E0C0C0C0C0C';
	//objres.messageid = 'uuid:9A245ae4-e8b3-459f-b29f-' + szmacaddr;
	objres.messageid = 'uuid:9A245a' + buf[0].toString(16) + '-'
					 + buf[1].toString(16) + buf[2].toString(16) + '-'
					 + buf[3].toString(16) + buf[4].toString(16) + '-'
					 + buf[5].toString(16) + buf[6].toString(16) + '-'
					 + szmacaddr;

	objres.porttype = 'ttl';
	objres.types = 'dn:NetworkVideoTransmitter';
	objres.scopes = {};
	objres.scopes.type = 'NetworkVideoTransmitter';
	objres.scopes.name = 'IP-TESTTEST';
	objres.scopes.hardware = 'IP-HARDWARE';
	
	objres.scopes.location = {};
	objres.scopes.location.country = 'korea';
	objres.scopes.location.city = 'seoul';
	
	objres.xaddrs = 'http://192.168.0.2:3000/onvif/device_service';
	objres.metadataversion = '1';
	
	////////////////////////////////////////////////////////////////////////////
	var szresmsg = '';
	szresmsg = this._makemsg_soap_envelope( szresmsg );
	szresmsg = this._makemsg_soap_header( objres, szresmsg, 'broad_hello' );
	szresmsg = this._makemsg_soap_body( objres, szresmsg, 'broad_hello' );
	
	return szresmsg;
}

myWebService.prototype._makeres_getdeviceinformation = function(_xmlobj, _callback)
{
	var objres = {};

	//gmDataBase.getquery_ipcam_config();

	objres.manufacturer = 'my_manufacturer';
	objres.model = 'my_modelname';
	objres.fwversion = 'my_fwversion';
	objres.serialno = 'my_serialno';
	objres.hwid = 'my_hwid';

	////////////////////////////////////////////////////////////////////////////
	var szresmsg = '';
	szresmsg = this._makemsg_soap_envelope( szresmsg );
	szresmsg = this._makemsg_soap_body( objres, szresmsg, 'res_getdeviceinformation' );

	_callback(szresmsg);
}
