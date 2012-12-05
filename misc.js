
var objType = new myMisc();
exports = module.exports = objType;

function myMisc( _name )
{
	var self = this;
}

myMisc.prototype.dbgerr = function( _sz )
{
	console.log('\u001b[1m', '\u001b[30m', '\u001b[41m', _sz, '\u001b[0m');
}


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
