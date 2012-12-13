
var objType = new myWebService();
exports = module.exports = objType;

/*
	internal modules
*/
var gmDgram		= require('dgram');
var gmUtil		= require('util');
var gmFs		= require('fs');
var gmBuffer	= require('buffer');

/*
	external modules
*/
var gmXml = require('node-xml');
var gmXml2Json = require('xml2json');

/*
	my modules
*/
var gmMisc = require('../../misc.js');

/*
*/
var gcServer;

/*
*/
function myWebService( _name )
{
	this.nWebService_UDPport = 3702;
	this.nWebService_MulticastIP = '239.255.255.250';
}

myWebService.prototype.createSocket = function()
{
	gcServer = gmDgram.createSocket('udp4');

	gcServer.on( 'message', this._onWebServiceMessage );
	gcServer.on( 'listening', this._onWebServiceListening );
	gcServer.on( 'close', this._onWebServiceClose );
	gcServer.on( 'error', this._onWebServiceError );
	gcServer.bind( this.nWebService_UDPport );
	gcServer.setBroadcast(1);
	gcServer.setTTL(1);
	gcServer.addMembership( this.nWebService_MulticastIP );

	return gcServer;
}

/*
*/
myWebService.prototype._onWebServiceMessage = function(_msg, _rinfo)
{
	console.log('<_onWebServiceMessage>');
	//console.log('_msg:', _msg);
	console.log('_rinfo:', _rinfo);
	
	gmFs.writeFileSync('req.xml', _msg, 'utf8');

	var xmlfile = gmFs.readFileSync('reqtest.xml', 'utf8');
	var xmldata = new Buffer(xmlfile, 'utf8');
	var json = gmXml2Json.toJson(xmldata, {reversible:true});
	var xmlobj = JSON.parse(json); 
	//console.log('json', json);

/*
json 
{
	"Envelope":{
				"xmlns:dn":"http://www.onvif.org/ver10/network/wsdl",
				"xmlns":"http://www.w3.org/2003/05/soap-envelope",
				"Header":{
							"wsa:MessageID":{
											"xmlns:wsa":"http://schemas.xmlsoap.org/ws/2004/08/addressing",
											"$t":"uuid:10c3f798-8d00-466c-b8c2-0fd93a33b15f"
							},
							"wsa:To":{
										"xmlns:wsa":"http://schemas.xmlsoap.org/ws/2004/08/addressing",
										"$t":"urn:schemas-xmlsoap-org:ws:2005:04:discovery"
							},
							"wsa:Action":{
										"xmlns:wsa":"http://schemas.xmlsoap.org/ws/2004/08/addressing",
										"$t":"http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe"
							}
				},
				"Body":{
						"Probe":{
								"xmlns:xsi":"http://www.w3.org/2001/XMLSchema-instance",
								"xmlns:xsd":"http://www.w3.org/2001/XMLSchema",
								"xmlns":"http://schemas.xmlsoap.org/ws/2005/04/discovery",
								"Types":{
										"$t":"dn:NetworkVideoTransmitter"
								},
								"Scopes":{
								}
					   }
				}
	}
}
*/
	if( !xmlobj.Envelope ) return;
	if( 'http://www.onvif.org/ver10/network/wsdl' != xmlobj.Envelope['xmlns:dn'] ) return;
	
	if( 'urn:schemas-xmlsoap-org:ws:2005:04:discovery' != xmlobj.Envelope.Header['wsa:To'].$t ) return;
	if( 'http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe' != xmlobj.Envelope.Header['wsa:Action'].$t ) return;
	var msgid = xmlobj.Envelope.Header['wsa:MessageID'].$t;
	
	if( 'http://schemas.xmlsoap.org/ws/2005/04/discovery' != xmlobj.Envelope.Body.Probe['xmlns'] ) return;
	var probetypes = xmlobj.Envelope.Body.Probe.Types.$t;
	if( 'dn:NetworkVideoTransmitter' != probetypes ) return;

	console.log('msgid :', msgid);	//uuid:10c3f798-8d00-466c-b8c2-0fd93a33b15f
	console.log('probetypes', probetypes);
	console.log('OKOKOKOK');
	
	var szresmsg = '';
	szresmsg += '<?xml version="1.0" encoding="UTF-8"?>';
	
	
	
	console.log('RESMSG-OKOKOK', szresmsg);
	
/*
<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope	xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" 
					xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" 
					xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
					xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
					xmlns:c14n="http://www.w3.org/2001/10/xml-exc-c14n#" 
					xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" 
					xmlns:xenc="http://www.w3.org/2001/04/xmlenc#" 
					xmlns:ds="http://www.w3.org/2000/09/xmldsig#" 
					xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" 
					xmlns:dn="http://www.onvif.org/ver10/network/wsdl" 
					xmlns:wsa5="http://schemas.xmlsoap.org/ws/2004/08/addressing" 
					xmlns:xmime="http://tempuri.org/xmime.xsd" 
					xmlns:xop="http://www.w3.org/2004/08/xop/include" 
					xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing" 
					xmlns:tt="http://www.onvif.org/ver10/schema" 
					xmlns:wsrfbf="http://docs.oasis-open.org/wsrf/bf-2" 
					xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2" 
					xmlns:wstop="http://docs.oasis-open.org/wsn/t-1" 
					xmlns:d="http://schemas.xmlsoap.org/ws/2005/04/discovery" 
					xmlns:ns2="http://www.onvif.org/ver10/network/wsdl/RemoteDiscoveryBinding" 
					xmlns:ns3="http://www.onvif.org/ver10/network/wsdl/DiscoveryLookupBinding" 
					xmlns:ns1="http://www.onvif.org/ver10/network/wsdl" 
					xmlns:ns4="http://www.onvif.org/ver20/analytics/wsdl/RuleEngineBinding" 
					xmlns:ns5="http://www.onvif.org/ver20/analytics/wsdl/AnalyticsEngineBinding" 
					xmlns:ns6="http://docs.oasis-open.org/wsn/b-2" 
					xmlns:ns7="http://docs.oasis-open.org/wsn/t-1" 
					xmlns:ns9="http://www.onvif.org/ver10/events/wsdl/EventBinding" 
					xmlns:tet="http://www.onvif.org/ver10/events/wsdl" 
					xmlns:tan="http://www.onvif.org/ver20/analytics/wsdl" 
					xmlns:tad="http://www.onvif.org/ver10/analyticsdevice/wsdl" 
					xmlns:tds="http://www.onvif.org/ver10/device/wsdl" 
					xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl" 
					xmlns:tls="http://www.onvif.org/ver10/display/wsdl" 
					xmlns:tmd="http://www.onvif.org/ver10/deviceIO/wsdl" 
					xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" 
					xmlns:trc="http://www.onvif.org/ver10/recording/wsdl" 
					xmlns:trp="http://www.onvif.org/ver10/replay/wsdl" 
					xmlns:trt="http://www.onvif.org/ver10/media/wsdl" 
					xmlns:trv="http://www.onvif.org/ver10/receiver/wsdl" 
					xmlns:tse="http://www.onvif.org/ver10/search/wsdl" 
					xmlns:ter="http://www.onvif.org/ver10/error" 
					xmlns:tns1="http://www.onvif.org/ver10/topics" 
					xmlns:dis="http://docs.oasis-open.org/ws-dd/ns/discovery/2009/01">

	<SOAP-ENV:Header>
		<wsa:MessageID>uuid:1419d68a-1dd2-11b2-a105-000C0C0234E6</wsa:MessageID>
		<wsa:RelatesTo>uuid:887e66b5-d74e-45ee-9952-a4feec07c1d4</wsa:RelatesTo>
		<wsa:To SOAP-ENV:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</wsa:To>
		<wsa:Action SOAP-ENV:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2005/04/discovery/ProbeMatches</wsa:Action>
	</SOAP-ENV:Header>
	
	<SOAP-ENV:Body>
		<d:ProbeMatches>
			<d:ProbeMatch>
				<wsa:EndpointReference>
					<wsa:Address>urn:uuid:1419d68a-1dd2-11b2-a105-000C0C0234E6</wsa:Address>
					<wsa:ReferenceProperties></wsa:ReferenceProperties>
					<wsa:ReferenceParameters></wsa:ReferenceParameters>
					<wsa:PortType>ttl</wsa:PortType>
				</wsa:EndpointReference>
				<d:Types>dn:NetworkVideoTransmitter</d:Types>
				<d:Scopes>onvif://www.onvif.org/type/NetworkVideoTransmitter onvif://www.onvif.org/name/DM8127_IPNC onvif://www.onvif.org/hardware/00E00ADD0001 onvif://www.onvif.org/location </d:Scopes>
				<d:XAddrs>http://192.168.1.168/onvif/device_service</d:XAddrs>
				<d:MetadataVersion>1</d:MetadataVersion>
			</d:ProbeMatch>
		</d:ProbeMatches>
	</SOAP-ENV:Body>
</SOAP-ENV:Envelope>
*/


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
	console.log('<_onWebServiceListening> - ', gcServer.address());
}
