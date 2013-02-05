

var objType = new myMisc();
exports = module.exports = objType;

function myMisc( _name )
{
	// this.ttttt = 'xxxxxxxxxxxxxxxxx';
	// this.event = new process.EventEmitter();
	// setInterval( function() {
	// 	objType.event.emit('aaa', 'xxxxxx');
	// }, 1000);
}

myMisc.prototype.dbgerr = function( _sz )
{
	console.log('\u001b[1m', '\u001b[30m', '\u001b[41m', _sz, '\u001b[0m');
}


/*
// Constructor
var myMisc = function(value1, value2) {
  //this.value1 = value1;
}
// properties and methods
myMisc.prototype = {
  value1: "default_value",
  settest: function(_sz) {
    this.value2 = _sz;
  },
};

// node.js module export
module.exports = myMisc;

myMisc.prototype.gettest = function() {
    console.log('this:', this);
    //console.log(this.value2);
}
*/

/*
onWsIOConnection - _socket :  { id: 'agdDKt8IgdMVftJP__GI',
  namespace:
   { manager:
      { server: [Object],
        namespaces: [Object],
        sockets: [Circular],
        _events: [Object],
        settings: [Object],
        handshaken: [Object],
        connected: [Object],
        open: [Object],
        closed: {},
        rooms: [Object],
        roomClients: [Object],
        oldListeners: [Object],
        sequenceNumber: 1761603976,
        gc: [Object] },
     name: '',
     sockets: { agdDKt8IgdMVftJP__GI: [Circular] },
     auth: false,
     flags: { endpoint: '', exceptions: [] },
     _events: { connection: [Object] } },
  manager:
   { server:
      { domain: null,
        _events: [Object],
        _maxListeners: 10,
        _connections: 4,
        connections: [Getter/Setter],
        allowHalfOpen: true,
        _handle: [Object],
        httpAllowHalfOpen: false,
        _connectionKey: '4:0.0.0.0:3000' },
     namespaces: { '': [Object] },
     sockets:
      { manager: [Circular],
        name: '',
        sockets: [Object],
        auth: false,
        flags: [Object],
        _events: [Object] },
     _events:
      { 'set:transports': [Object],
        'set:store': [Function],
        'set:origins': [Function],
        'set:flash policy port': [Function],
        'set:flash policy server': [Function] },
     settings:
      { origins: '*:*',
        log: true,
        store: [Object],
        logger: [Object],
        static: [Object],
        heartbeats: true,
        resource: '/socket.io',
        transports: [Object],
        authorization: false,
        blacklist: [Object],
        'log level': 3,
        'log colors': true,
        'close timeout': 60,
        'heartbeat interval': 25,
        'heartbeat timeout': 60,
        'polling duration': 20,
        'flash policy server': true,
        'flash policy port': 10843,
        'destroy upgrade': true,
        'destroy buffer size': 100000000,
        'browser client': true,
        'browser client cache': true,
        'browser client minification': false,
        'browser client etag': false,
        'browser client expires': 315360000,
        'browser client gzip': false,
        'browser client handler': false,
        'client store expiration': 15,
        'match origin protocol': false },
     handshaken: { agdDKt8IgdMVftJP__GI: [Object] },
     connected: { agdDKt8IgdMVftJP__GI: true },
     open: { agdDKt8IgdMVftJP__GI: true },
     closed: {},
     rooms: { '': [Object] },
     roomClients: { agdDKt8IgdMVftJP__GI: [Object] },
     oldListeners: [ [Object] ],
     sequenceNumber: 1761603976,
     gc: { ontimeout: [Function] } },
  disconnected: false,
  ackPackets: 0,
  acks: {},
  flags: { endpoint: '', room: '' },
  readable: true,
  store:
   { store: { options: undefined, clients: [Object], manager: [Object] },
     id: 'agdDKt8IgdMVftJP__GI',
     data: {} },
  _events: { error: [Function] } }
*/







/*
var express = require('express')
  , format = require('util').format;

var app = module.exports = express()
var fs = require('fs');

// bodyParser in connect 2.x uses node-formidable to parse 
// the multipart form data.
// 업로드파일의 임시저장위치 지정
app.use(express.bodyParser({uploadDir:'D:/temp'}));

app.get('/', function(req, res){
  res.send('<form method="post" enctype="multipart/form-data">'
    + '<p>Title: <input type="text" name="title" /></p>'
    + '<p>Image: <input type="file" name="image" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});

app.post('/', function(req, res, next){  
	//console.log(req.files);
   	var tmp_path = req.files.image.path;
   	// set where the file should actually exists - in this case it is in the "images" directory
   	var target_path = './upload/' + req.files.image.name;
   	// move the file from the temporary location to the intended location
   	fs.rename(tmp_path, target_path, function(err) {
    	if (err) throw err;
       	// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
       	fs.unlink(tmp_path, function() {
        	if (err) throw err;
           	res.send('File uploaded to: ' + target_path + ' - ' + req.files.image.size + ' bytes');
       	});
   	});
    
});

if (!module.parent) {
	app.listen(3000);
  	console.log('Express started on port 3000');
}
*/

/*
var bufferSize = 8;

var read = gmFs.createReadStream('aaa.xml', {
  bufferSize: bufferSize
});
var write = gmFs.createWriteStream('output.xml');

read
  .on('data', function(data) {
    console.log('read: data');
    console.log(data.toString()); // buffer type으로 받기 때문에 변경한다.
  })
  .on('end',   function()          { console.log('read: end');    })
  .on('error', function(e)         { console.log('read: error');  })
  .on('close', function()          { console.log('read: colse');  })
  .on('fd',    function(fd)        { console.log('read: fd');     })
  ;

write
  .on('drain', function()          { console.log('write: drain'); })
  .on('error', function(e)         { console.log('write: error' ); })
  .on('close', function()          { console.log('write: close' ); })
  .on('pipe',  function(src)       { console.log('write: pipe'  ); })
  ;
read.pipe(write);
*/

/*
A simple HTTPS server using node.js:

const crypto = require('crypto'),
      fs = require("fs"),
      http = require("http");

var privateKey = fs.readFileSync('privatekey.pem').toString();
var certificate = fs.readFileSync('certificate.pem').toString();

var credentials = crypto.createCredentials({key: privateKey, cert: certificate});

var handler = function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
};

var server = http.createServer();
server.setSecure(credentials);
server.addListener("request", handler);
server.listen(8000);

You can generate the privatekey.pem and certificate.pem files using the following commands:

openssl genrsa -out privatekey.pem 1024 
openssl req -new -key privatekey.pem -out certrequest.csr 
openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
*/


/*
AXIS-ONVIF
Device Management -> CreateUsers : 장비에 root@pass로 암호가 걸려있는 경우 ONVIF REQ. XML 내용임.
REQ->
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns:tt="http://www.onvif.org/ver10/schema">
  <s:Header xmlns:s="http://www.w3.org/2003/05/soap-envelope">
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>root</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">o487Ro2wUWIEmX74G+GxkuoSvGg=</wsse:Password>
        <wsse:Nonce>VOdNhkxop4LWnwbLkNnuyg==</wsse:Nonce>
        <wsu:Created>2013-01-28T01:23:37Z</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </s:Header>
  <soap:Body>
    <tds:CreateUsers>
      <tds:User>
        <tt:Username>admin</tt:Username>
        <tt:Password>123</tt:Password>
        <tt:UserLevel>User</tt:UserLevel>
      </tds:User>
    </tds:CreateUsers>
  </soap:Body>
</soap:Envelope>

RES->
HTTP/1.1 400 Bad Request
Server: gSOAP/2.7
Content-Type: application/soap+xml; charset=utf-8
Content-Length: 3062
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:c14n="http://www.w3.org/2001/10/xml-exc-c14n#" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsa5="http://www.w3.org/2005/08/addressing" xmlns:xmime="http://tempuri.org/xmime.xsd" xmlns:xop="http://www.w3.org/2004/08/xop/include" xmlns:wsrfbf="http://docs.oasis-open.org/wsrf/bf-2" xmlns:wstop="http://docs.oasis-open.org/wsn/t-1" xmlns:tt="http://www.onvif.org/ver10/schema" xmlns:wsrfr="http://docs.oasis-open.org/wsrf/r-2" xmlns:aa="http://www.axis.com/vapix/ws/action1" xmlns:aev="http://www.axis.com/vapix/ws/event1" xmlns:apc="http://www.axis.com/vapix/ws/panopsiscalibration1" xmlns:arth="http://www.axis.com/vapix/ws/recordedtour1" xmlns:tan1="http://www.onvif.org/ver20/analytics/wsdl/RuleEngineBinding" xmlns:tan2="http://www.onvif.org/ver20/analytics/wsdl/AnalyticsEngineBinding" xmlns:tan="http://www.onvif.org/ver20/analytics/wsdl" xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns:tev1="http://www.onvif.org/ver10/events/wsdl/NotificationProducerBinding" xmlns:tev2="http://www.onvif.org/ver10/events/wsdl/EventBinding" xmlns:tev3="http://www.onvif.org/ver10/events/wsdl/SubscriptionManagerBinding" xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2" xmlns:tev4="http://www.onvif.org/ver10/events/wsdl/PullPointSubscriptionBinding" xmlns:tev="http://www.onvif.org/ver10/events/wsdl" xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl" xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" xmlns:trt="http://www.onvif.org/ver10/media/wsdl" xmlns:ter="http://www.onvif.org/ver10/error" xmlns:tns1="http://www.onvif.org/ver10/topics" xmlns:tnsaxis="http://www.axis.com/2009/event/topics">
  <SOAP-ENV:Header>
    <wsse:Security SOAP-ENV:mustUnderstand="true">
      <wsse:UsernameToken>
        <wsse:Username>root</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">UDQnmFY7PCAr5LrGFB+mHbtR8r0=</wsse:Password>
        <wsse:Nonce>MYzpgVEClNXJAChhT/KFtw==</wsse:Nonce>
        <wsu:Created>2013-01-28T01:29:20Z</wsu:Created>
      </wsse:UsernameToken>
    </wsse:Security>
  </SOAP-ENV:Header>
  <SOAP-ENV:Body>
    <SOAP-ENV:Fault SOAP-ENV:encodingStyle="http://www.w3.org/2003/05/soap-encoding">
      <SOAP-ENV:Code>
        <SOAP-ENV:Value>SOAP-ENV:Sender</SOAP-ENV:Value>
        <SOAP-ENV:Subcode>
          <SOAP-ENV:Value>ter:NotAuthorized</SOAP-ENV:Value>
        </SOAP-ENV:Subcode>
      </SOAP-ENV:Code>
      <SOAP-ENV:Reason>
        <SOAP-ENV:Text xml:lang="en">Sender not authorized</SOAP-ENV:Text>
      </SOAP-ENV:Reason>
      <SOAP-ENV:Detail>
        <SOAP-ENV:Text>The action requested requires authorization and the sender is not authorized</SOAP-ENV:Text>
      </SOAP-ENV:Detail>
    </SOAP-ENV:Fault>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>

// 아래는 암호를 설정하지 않은 경우 (ONVIF testtool.exe에서 management tab에서 관리)
REQ->
<?xml version='1.0' encoding='utf-8'?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"
               xmlns:tds="http://www.onvif.org/ver10/device/wsdl"
               xmlns:tt="http://www.onvif.org/ver10/schema">
  <soap:Body>
    <tds:CreateUsers>
      <tds:User>
        <tt:Username>admin</tt:Username>
        <tt:Password>123</tt:Password>
        <tt:UserLevel>User</tt:UserLevel>
      </tds:User>
    </tds:CreateUsers>
  </soap:Body>
</soap:Envelope>

RES->
HTTP/1.1 400 Bad Request
Server: gSOAP/2.7
Content-Type: application/soap+xml; charset=utf-8
Content-Length: 2564
Connection: close

<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://www.w3.org/2003/05/soap-envelope" xmlns:SOAP-ENC="http://www.w3.org/2003/05/soap-encoding" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:c14n="http://www.w3.org/2001/10/xml-exc-c14n#" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsa5="http://www.w3.org/2005/08/addressing" xmlns:xmime="http://tempuri.org/xmime.xsd" xmlns:xop="http://www.w3.org/2004/08/xop/include" xmlns:wsrfbf="http://docs.oasis-open.org/wsrf/bf-2" xmlns:wstop="http://docs.oasis-open.org/wsn/t-1" xmlns:tt="http://www.onvif.org/ver10/schema" xmlns:wsrfr="http://docs.oasis-open.org/wsrf/r-2" xmlns:aa="http://www.axis.com/vapix/ws/action1" xmlns:aev="http://www.axis.com/vapix/ws/event1" xmlns:apc="http://www.axis.com/vapix/ws/panopsiscalibration1" xmlns:arth="http://www.axis.com/vapix/ws/recordedtour1" xmlns:tan1="http://www.onvif.org/ver20/analytics/wsdl/RuleEngineBinding" xmlns:tan2="http://www.onvif.org/ver20/analytics/wsdl/AnalyticsEngineBinding" xmlns:tan="http://www.onvif.org/ver20/analytics/wsdl" xmlns:tds="http://www.onvif.org/ver10/device/wsdl" xmlns:tev1="http://www.onvif.org/ver10/events/wsdl/NotificationProducerBinding" xmlns:tev2="http://www.onvif.org/ver10/events/wsdl/EventBinding" xmlns:tev3="http://www.onvif.org/ver10/events/wsdl/SubscriptionManagerBinding" xmlns:wsnt="http://docs.oasis-open.org/wsn/b-2" xmlns:tev4="http://www.onvif.org/ver10/events/wsdl/PullPointSubscriptionBinding" xmlns:tev="http://www.onvif.org/ver10/events/wsdl" xmlns:timg="http://www.onvif.org/ver20/imaging/wsdl" xmlns:tptz="http://www.onvif.org/ver20/ptz/wsdl" xmlns:trt="http://www.onvif.org/ver10/media/wsdl" xmlns:ter="http://www.onvif.org/ver10/error" xmlns:tns1="http://www.onvif.org/ver10/topics" xmlns:tnsaxis="http://www.axis.com/2009/event/topics">
  <SOAP-ENV:Body>
    <SOAP-ENV:Fault>
      <SOAP-ENV:Code>
        <SOAP-ENV:Value>SOAP-ENV:Sender</SOAP-ENV:Value>
        <SOAP-ENV:Subcode>
          <SOAP-ENV:Value>ter:NotAuthorized</SOAP-ENV:Value>
        </SOAP-ENV:Subcode>
      </SOAP-ENV:Code>
      <SOAP-ENV:Reason>
        <SOAP-ENV:Text xml:lang="en">Sender not authorized</SOAP-ENV:Text>
      </SOAP-ENV:Reason>
      <SOAP-ENV:Detail>
        <SOAP-ENV:Text>The action requested requires authorization and the sender is not authorized</SOAP-ENV:Text>
      </SOAP-ENV:Detail>
    </SOAP-ENV:Fault>
  </SOAP-ENV:Body>
</SOAP-ENV:Envelope>
*/

/*
var Fiber = require('fibers');

function sleep(ms) {
    var fiber = Fiber.current;
    setTimeout(function() {
        fiber.run();
        console.log('bbbbbbbbbbbbbbb');
    }, ms);
    Fiber.yield();
    console.log('aaaaaaaaaaaaaaaaaaa');
}

Fiber(function() {
    console.log('wait... ' + new Date);
    sleep(10000);
    console.log('ok... ' + new Date);
}).run();

console.log('back in main');
*/

/*
var Fiber = require('fibers');

var inc = Fiber(function(start) {
    var total = start;
    while (true) {
        total += Fiber.yield(total);
    }
});

for (var ii = inc.run(1); ii <= 10; ii = inc.run(1)) {
    console.log(ii);
}
*/

/*
var Fiber = require('fibers');

console.log('aaaaaaaaaaaaaaaaaaa');
var fn = Fiber(function() {
    console.log('async work here...');
    Fiber.yield();
    console.log('still working...');
    Fiber.yield();
    console.log('just a little bit more...');
    Fiber.yield();
    throw new Error('oh crap!');
});
console.log('bbbbbbbbbbbbbbbbbb');
try {
    while (true) {
      console.log('ccccccccccccccccc');
        fn.run();
        console.log('dddddddddddddddddddd');
    }
} catch(e) {
    console.log('safely caught that error!');
    console.log(e.stack);
}

console.log('done!');
*/

/*
var Fiber = require('fibers');
var Future = require('fibers/future'), wait = Future.wait;
var fs = require('fs');

// This wraps existing functions assuming the last argument of the passed
// function is a callback. The new functions created immediately return a
// future and the future will resolve when the callback is called (which
// happens behind the scenes).
var readdir = Future.wrap(fs.readdir);
var stat = Future.wrap(fs.stat);

Fiber(function() {
    // Get a list of files in the directory
    var fileNames = readdir('.').wait();
    console.log('Found '+ fileNames.length+ ' files');

    // Stat each file
    var stats = [];
    for (var ii = 0; ii < fileNames.length; ++ii) {
        stats.push(stat(fileNames[ii]));
    }
    wait(stats);

    // Print file size
    for (var ii = 0; ii < fileNames.length; ++ii) {
        console.log(fileNames[ii]+ ': '+ stats[ii].get().size);
    }
}).run();
*/

/*
var Future = require('fibers/future'), wait = Future.wait;

// This function returns a future which resolves after a timeout. This
// demonstrates manually resolving futures.
function sleep(ms) {
    var future = new Future;
    setTimeout(function() {
        future.return();
    }, ms);
    return future;
}

// You can create functions which automatically run in their own fiber and
// return futures that resolve when the fiber returns (this probably sounds
// confusing.. just play with it to understand).
var calcTimerDelta = function(ms) {
    var start = new Date;
    sleep(ms).wait();
    return new Date - start;
}.future(); // <-- important!

// And futures also include node-friendly callbacks if you don't want to use
// wait()
calcTimerDelta(2000).resolve(function(err, val) {
    console.log('Set timer for 2000ms, waited '+ val+ 'ms');
});
*/
