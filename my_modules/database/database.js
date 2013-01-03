
var gcmyDataBase = new myDataBase();
exports = module.exports = gcmyDataBase;

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
var gmSql		= require('mysql');


/*
	my modules
*/
var gmMisc = require('../../misc.js');

/*
PUBLIC function definition 
*/
function myDataBase( _name )
{
	this.connect = null;
}

myDataBase.prototype.init = function()
{
	var connect = gmSql.createConnection( {host:'localhost', user:'root', password:'convex1234!@'} );

	connect.connect(function(_err) {
		if(_err) {
			console.log( 'gmSql.createConnection - err : ', _err );
		}
	});

	connect.query('USE ipcam', function(_err) {
		if(_err) {
			console.log( 'gmSql.query(USE ipcam) - err : ', _err );
		}
	});

	gcmyDataBase.connect = connect;

	connect.on('error', function(_err) {
		if( !_err.fatal ) {
			return;
		}
		
		if(_err.code !== 'PROTOCOL_CONNECTION_LOST') {
			throw _err;
		}
		
		console.log('>>>>>>>>>> Re-connecting lost connection: ' + _err.stack);
		
		gcmyDataBase.init();
	});

	return gcmyDataBase.connect;
}

myDataBase.prototype.makedefault_ipcam_database = function()
{
	console.log('->> myDataBase.prototype.makedefault_ipcam_database');
	
	gcmyDataBase.connect.query('CREATE DATABASE ipcam', function(_err) {
		//console.log(_err);
		if( _err ) {
			switch(_err.code) {
			case 'ER_DB_CREATE_EXISTS':
				gcmyDataBase.connect.query('DROP DATABASE ipcam', function(_err) {
					if(_err) {}
					else {
						gcmyDataBase.connect.query('CREATE DATABASE ipcam', function(_err) {
							if(_err) {}
							else {
								gcmyDataBase.connect.query('USE ipcam');
								gcmyDataBase._makedefault_ipcam_config();
							}
						});
					}
				});
			}
		}
		else {
			gcmyDataBase.connect.query('USE ipcam');
		}
	});
}

myDataBase.prototype.getquery_ipcam_config = function( _query, _callback )
{
	console.log('->> myDataBase.prototype.getquery_ipcam_config');
	
	var ajresult = [];
	var query = gcmyDataBase.connect.query(_query);
	
	query.on('error', function(_err) {
		// Handle error, an 'end' event will be emitted after this as well
		//console.log('getquery_ipcam_config error:', _err);
	})
	.on('fields', function(_fields) {
		// the field packets for the rows to follow
		//console.log('getquery_ipcam_config fields:', _fields);
	})
	.on('result', function(_row) {
		// Pausing the connnection is useful if your processing involves I/O
		//console.log('getquery_ipcam_config result:', _row);

		//var json = eval('(' + _row.type + ')');
		//console.log('json:', json);
		ajresult.push(_row);
	})
	.on('end', function() {
		// all rows have been received
		//console.log('getquery_ipcam_config end:');
		_callback(ajresult);
	})
}

myDataBase.prototype.setquery_ipcam_config = function( _query, _param, _callback )
{
	console.log('->> myDataBase.prototype.setquery_ipcam_config _query:', _query);
	console.log('    myDataBase.prototype.setquery_ipcam_config _param:', _param);
	
	var ajresult = [];
	var query = gcmyDataBase.connect.query(_query, _param);
	
	query.on('error', function(_err) {
		// Handle error, an 'end' event will be emitted after this as well
		console.log('setquery_ipcam_config error:', _err);
	})
	.on('fields', function(_fields) {
		// the field packets for the rows to follow
		console.log('setquery_ipcam_config fields:', _fields);
	})
	.on('result', function(_row) {
		// Pausing the connnection is useful if your processing involves I/O
		console.log('setquery_ipcam_config result:', _row);

		//var json = eval('(' + _row.type + ')');
		//console.log('json:', json);
		ajresult.push(_row);
	})
	.on('end', function() {
		// all rows have been received
		console.log('setquery_ipcam_config end:');
		
		_callback(ajresult);
	})
}

/*

*/
myDataBase.prototype._makedefault_ipcam_config = function()
{
	var obj = {};
	obj.tablename = 'configuration';
	obj.sql = 'seqno			tinyint not null auto_increment primary key' + ','
			+ 'lvalue			char(64) not null' + ','
			+ 'rvalue			char(128) not null' + ','
			+ 'type				char(128) not null' + ','
			+ 'privilige		char(16) not null' + ','
			+ 'syntax			char(128) not null';

	var sql = 'CREATE TABLE ' + obj.tablename + '(' + obj.sql + ')';
	//console.log('sql :', sql);	

	gcmyDataBase.connect.query( sql, function(_err) {
		if(_err) {}
		else {
			
			var sql = 'INSERT INTO configuration (lvalue, rvalue, type, privilige, syntax) VALUES (?,?,?,?,?)';
			var val = _make_sqltables();
			
			//console.log('val.length :', val.length);
			for( var i=0; i<val.length; i++ ) {
				gcmyDataBase.connect.query( sql, val[i], function(_err, _results, _fields) {
					if(_err) { console.log(_err); }
					else { }
				});
			}
		}
	});
}

function _make_sqltables()
{
	var val = 
	[
	['audio.capture.nbrofchannel',		'1',			'{"type":"count","min":0,"max":1,"def":"1"}',				'admin', 's___g|count'],
	['audio.capture.ch0.enable',		'yes',			'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['audio.capture.ch0.standard',		'mic-mono',		'{"type":"select","list":"mic-mono","def":"mic-mono"}',		'admin', 's___g|select|mic-mono'],
	['audio.capture.ch0.frequency',		'16000',		'{"type":"select","list":"8000,16000","def":"16000"}',		'admin', 's__sg|select|8000,16000'],
	['audio.capture.ch0.bit',			'16',			'{"type":"select","list":"8,16","def":"16"}',				'admin', 's__sg|select|8,16'],
	['audio.capture.ch0.channels',		'mono',			'{"type":"select","list":"mono","def":"mono"}',				'admin', 's___g|select|mono'],
	['audio.capture.ch0.codec',			'ulaw',			'{"type":"select","list":"alaw,ulaw","def":"ulaw"}',		'admin', 's__sg|select|alaw,ulaw'],
	['audio.capture.ch0.volume',		'4',			'{"type":"int","min":0,"max":4,"def":4}',					'admin', 's__sg|int|0|4'],
	['audio.capture.ch0.boost',			'0',			'{"type":"int","min":0,"max":1,"def":0}',					'admin', 's__sg|int|0|1'],
	['audio.playback.nbrofchannel',		'1',			'{"type":"count","min":0,"max":1,"def":"1"}',				'admin', 's___g|count'],
	['audio.playback.ch0.enable',		'yes',			'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['audio.playback.ch0.standard',		'line-mono',	'{"type":"select","list":"line-mono","def":"line-mono"}',	'admin', 's__sg|select|line-mono'],
	['audio.playback.ch0.volume',		'50',			'{"type":"int","min":0,"max":64,"def":50}',					'admin', 's__sg|int|0|64'],
	['audio.playback.ch0.source',		'tcp',			'{"type":"select","list":"tcp","def":"tcp"}',				'admin', 's__sg|select|tcp'],
	['audio.playback.ch0.source.tcp.port',		'6012',			'{"type":"port","min":1,"max":65535,"def":6012}',			'admin', 's__sg|port|1|65535'],

	['brandinfo.brand',					'<unknown>',	'{"type":"sz","min":0,"max":64,"def":"<unknown>"}',			'admin', 's___g|sz|64'],
	['brandinfo.product.fn',			'<unknown>',	'{"type":"sz","min":0,"max":128,"def":"<unknown>"}',		'admin', 's___g|sz|128'],
	['brandinfo.product.sn',			'<unknown>',	'{"type":"sz","min":0,"max":64,"def":"<unknown>"}',			'admin', 's___g|sz|64'],
	['brandinfo.product.nbr',			'<unknown>',	'{"type":"sz","min":0,"max":16,"def":"<unknown>"}',			'admin', 's___g|sz|16'],
	['brandinfo.product.type',			'<unknown>',	'{"type":"sz","min":0,"max":32,"def":"<unknown>"}',			'admin', 's___g|sz|32'],
	['brandinfo.url',					'http://',		'{"type":"url","def":"http://"}',							'admin', 's___g|url|128'],	

	['videocodec.nbrofchannel',				'1',		'{"type":"count","min":0,"max":1,"def":"1"}',				'admin', 's___g|count'],
	['videocodec.ch0.nbrofstream',			'2',		'{"type":"count","min":0,"max":2,"def":"2"}',				'admin', 's___g|count'],
	['videocodec.ch0.st0.enable',			'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['videocodec.ch0.st0.name',				' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['videocodec.ch0.st0.std',				'h264',		'{"type":"select","list":"h264","def":"h264"}',				'admin', 's__sg|select|h264'],
	['videocodec.ch0.st0.h264.profile',		'hp',		'{"type":"select","list":"hp","def":"hp"}',					'admin', 's__sg|select|hp'],
	['videocodec.ch0.st0.h264.resolution',	'hd1080',	'{"type":"select","list":"hd720,hd1080","def":"hd1080"}',	'admin', 's__sg|select|hd720,hd1080'],
	['videocodec.ch0.st0.h264.bitrate',		'12000',	'{"type":"kbitps","min":32,"max":20000,"def":"12000"}',		'admin', 's__sg|kbitps|32|20000'],
	['videocodec.ch0.st0.h264.bitratectrl',	'vbr',		'{"type":"select","list":"cbr,vbr","def":"vbr"}',			'admin', 's__sg|select|cbr,vbr'],
	['videocodec.ch0.st0.h264.qvalue',		'1',		'{"type":"int","min":0,"max":4,"def":1}',					'admin', 's__sg|int|0|4'],
	['videocodec.ch0.st0.h264.maxfps',		'30',		'{"type":"int","min":0,"max":30,"def":30}',					'admin', 's__sg|int|0|30'],
	['videocodec.ch0.st0.h264.pcount',		'29',		'{"type":"int","min":0,"max":127,"def":29}',				'admin', 's__sg|int|0|127'],

	['videocodec.ch0.st1.enable',			'no',		'{"type":"yesno","def":"no"}',								'admin', 's__sg|yesno'],
	['videocodec.ch0.st1.name',				' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['videocodec.ch0.st1.std',				'mjpeg',	'{"type":"select","list":"mjpeg,h264","def":"mjpeg"}',		'admin', 's__sg|select|mjpeg,h264'],
	['videocodec.ch0.st1.h264.profile',		'hp',		'{"type":"select","list":"hp","def":"hp"}',					'admin', 's__sg|select|hp'],
	['videocodec.ch0.st1.h264.resolution',	'480270',	'{"type":"select","list":"qcif,cif,2cif,4cif,d1,qvga,vga,svga,xga,320180,480270,800450","def":"480270"}',	'admin', 's__sg|select|qcif,cif,2cif,4cif,d1,qvga,vga,svga,xga,320180,480270,800450'],
	['videocodec.ch0.st1.h264.bitrate',		'12000',	'{"type":"kbitps","min":32,"max":20000,"def":"12000"}',		'admin', 's__sg|kbitps|32|20000'],
	['videocodec.ch0.st1.h264.bitratectrl',	'vbr',		'{"type":"select","list":"cbr,vbr","def":"vbr"}',			'admin', 's__sg|select|cbr,vbr'],
	['videocodec.ch0.st1.h264.qvalue',		'1',		'{"type":"int","min":0,"max":4,"def":1}',					'admin', 's__sg|int|0|4'],
	['videocodec.ch0.st1.h264.maxfps',		'30',		'{"type":"int","min":0,"max":30,"def":30}',					'admin', 's__sg|int|0|30'],
	['videocodec.ch0.st1.h264.pcount',		'29',		'{"type":"int","min":0,"max":127,"def":29}',				'admin', 's__sg|int|0|127'],
	['videocodec.ch0.st1.mjpeg.resolution',	'480270',	'{"type":"select","list":"qcif,cif,2cif,4cif,d1,qvga,vga,svga,xga,320180,480270,800450","def":"480270"}',	'admin', 's__sg|select|qcif,cif,2cif,4cif,d1,qvga,vga,svga,xga,320180,480270,800450'],	
	['videocodec.ch0.st1.mjpeg.quality',	'80',		'{"type":"int","min":0,"max":100,"def":80}',				'admin', 's__sg|int|0|100'],
	['videocodec.ch0.st1.mjpeg.maxfps',		'30',		'{"type":"int","min":0,"max":30,"def":30}',					'admin', 's__sg|int|0|30'],

	['datetime.timezone',					'UTC',		'{"type":"sz","min":0,"max":32,"def":"UTC"}',				'admin', 's__sg|sz|32'],
	['datetime.enabledst',					'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['datetime.syncsource',					'rtc',		'{"type":"select","list":"rtc,ntp","def":"rtc"}',			'admin', 's__sg|select|rtc,ntp'],
	['datetime.syncinterval',				'none',		'{"type":"select","list":"none,everyday","def":"none"}',	'admin', 's__sg|select|none,everyday'],

	['ddns.enable',							'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['ddns.serverip',						' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['ddns.serverport',						'53',		'{"type":"port","min":1,"max":65535,"def":53}',				'admin', 's__sg|port|1|65535'],
	['ddns.id',								' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['ddns.passwd',							' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['ddns.domainname',						' ',		'{"type":"sz","min":0,"max":64,"def":" "}',					'admin', 's__sg|sz|64'],
	['ddns.updatetime',						' ',		'{"type":"sec","min":0,"max":60000,"def":600}',				'admin', 's__sg|sec|0|60000'],
	['ddns.servertype',						'DynDNS',	'{"type":"sz","min":0,"max":32,"def":"DynDNS"}',			'admin', 's__sg|sz|32'],
	['ddns.email',							'username@example.com',	'{"type":"sz","min":0,"max":256,"def":"username@example.com"}',			'admin', 's__sg|sz|256'],
	['ddns.macaddress',						'AABBCCDDEEFF',	'{"type":"sz","min":0,"max":32,"def":"AABBCCDDEEFF"}',	'admin', 's__sg|sz|32'],

	['dido.enable',							'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['dido.nbrofdi',						'1',		'{"type":"int","min":0,"max":4,"def":1}',					'admin', 's__sg|int|0|4'],
	['dido.di.hwtype',						'relay',	'{"type":"select","list":"relay,voltage","def":"relay"}',   'admin', 's__sg|select|relay,voltage'],
	['dido.di0.name',						'DI0',		'{"type":"sz","min":0,"max":64,"def":"DI0"}',				'admin', 's__sg|sz|64'],
	['dido.di0.nonc',						'NO',		'{"type":"sz","min":0,"max":8,"def":"NO"}',					'admin', 's__sg|sz|8'],
	['dido.di0.detecttime',					'0',		'{"type":"sec","min":0,"max":60,"def":0}',					'admin', 's__sg|sec|0|60'],
	['dido.nbrofdo',						'1',		'{"type":"int","min":0,"max":4,"def":1}',					'admin', 's__sg|int|0|4'],	
	['dido.do0.name',						'DO0',		'{"type":"sz","min":0,"max":64,"def":"DO0"}',				'admin', 's__sg|sz|64'],
	['dido.do0.worktime',					'0',		'{"type":"sec","min":0,"max":6000,"def":0}',				'admin', 's__sg|sec|0|6000'],

	['dns.nbrofcount',						'2',		'{"type":"int","min":0,"max":2,"def":2}',					'admin', 's__sg|int|0|2'],
	['dns.dns0.ipaddress',					'0.0.0.0',	'{"type":"ipv4","def":"0.0.0.0"}',							'admin', 's__sg|ipv4'],
	['dns.dns1.ipaddress',					'0.0.0.0',	'{"type":"ipv4","def":"0.0.0.0"}',							'admin', 's__sg|ipv4'],

	['email.server.friendlyname',			' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['email.server.sendfrom',				' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['email.server.ipaddress',				' ',		'{"type":"sz","min":0,"max":128,"def":" "}',				'admin', 's__sg|sz|128'],
	['email.server.port',					'25',		'{"type":"port","min":1,"max":65535,"def":25}',				'admin', 's__sg|port|1|65535'],
	['email.server.id',						' ',		'{"type":"sz","min":0,"max":128,"def":" "}',				'admin', 's__sg|sz|128'],
	['email.server.passwd',					' ',		'{"type":"sz","min":0,"max":32,"def":" "}',					'admin', 's__sg|sz|32'],
	['email.server.authentication',			'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],

	['ftpd.enable',							'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['ftpd.port',							'21',		'{"type":"port","min":1,"max":65535,"def":21}',				'admin', 's__sg|port|1|65535'],
	['ftpd.homedir',						'/mnt',		'{"type":"sz","min":0,"max":128,"def":"/mnt"}',				'admin', 's__sg|sz|128'],
	['ftpd.timeout',						'15',		'{"type":"min","min":0,"max":30,"def":"15"}',				'admin', 's__sg|min|0|30'],
	['ftpd.uploadbw',						'0',		'{"type":"kbyteps","min":0,"max":1024,"def":"0"}',			'admin', 's__sg|kbyteps|0|1024'],
	['ftpd.downloadbw',						'1024',		'{"type":"kbyteps","min":0,"max":1024,"def":"1024"}',		'admin', 's__sg|kbyteps|0|1024'],

	['account.enable',						'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['account.admin',						' ',		'{"type":"usernamelist","def":" "}',						'admin', 's__sg|usernamelist'],
	['account.operator',					' ',		'{"type":"usernamelist","def":" "}',						'admin', 's__sg|usernamelist'],
	['account.viewer',						' ',		'{"type":"usernamelist","def":" "}',						'admin', 's__sg|usernamelist'],
	
/*
*/


	['system.deviceinfo.manufacturer',	'manufacturer', '{"type":"sz","min":0,"max":64,"def":""}',					'admin', 's___g|sz|64'],
	['system.deviceinfo.model',			'model',		'{"type":"sz","min":0,"max":64,"def":""}',					'admin', 's___g|sz|64'],
	['system.deviceinfo.fwversion',		'fwversion',	'{"type":"sz","min":0,"max":64,"def":""}',					'admin', 's___g|sz|64'],
	['system.deviceinfo.serialno',		'serialno',		'{"type":"sz","min":0,"max":64,"def":""}',					'admin', 's___g|sz|64'],
	['system.deviceinfo.hwid',			'hwid',			'{"type":"sz","min":0,"max":64,"def":""}',					'admin', 's___g|sz|64'],

	['security.account.user',			'root',		'{"type":"sz","min":0,"max":64,"def":""}',						'admin', 's___g|sz|64'],
	['security.account.privilige',		'pass',		'{"type":"sz","min":0,"max":64,"def":""}',						'admin', 's___g|sz|64'],

	['network.eth0.mac',				'00:11:22:33:44:55',	'{"type":"sz","min":0,"max":64,"def":""}',			'admin', 's___g|sz|64'],
	['network.eth0.ipv4',				'192.168.0.2',			'{"type":"sz","min":0,"max":64,"def":""}',			'admin', 's___g|sz|64'],
	['network.eth0.subnet',				'255.255.255.0',		'{"type":"sz","min":0,"max":64,"def":""}',			'admin', 's___g|sz|64']
	];
	
	return val;
}
