
/*
	single instance module
*/
var gcmyDataBase = new myDataBase();
exports = module.exports = gcmyDataBase;

/*
	internal modules
*/

/*
	external modules
*/
var gmFiber 	= require('fibers');
var gmFuture 	= require('fibers/future'), wait = gmFuture.wait;
var gmSql		= require('mysql');

/*
	my modules
*/


/*
PUBLIC function definition 
*/
function myDataBase( _name )
{
	this.databasename = 'ipcam';
	this.tablename_config = 'configuration';

	/////////////////////////////////////////////////
	this.revision = '1';
}

myDataBase.prototype.init = function( _option )
{
	//console.log('->> myDataBase.prototype.init');
	var db = gmSql.createConnection( _option );
	db.connect( function(_err) {
		if(_err) {
			console.log( 'gmSql.createConnection - err : ', _err );
		}
	});

	db.on('error', function(_err) {
		if( !_err.fatal ) {
			return;
		}

		if(_err.code !== 'PROTOCOL_CONNECTION_LOST') {
			throw _err;
		}
		
		console.log('>>>>>>>>>> Re-connecting lost connection: ' + _err.stack);
		gcmyDataBase.init( _option );
	});

	gcmyDataBase.db = db;
	gcmyDataBase._option = _option;
}

myDataBase.prototype.using = function()
{
	var future = new gmFuture;

	gcmyDataBase.db.query( 'USE '+gcmyDataBase.databasename, function(_err) {
		if(_err) {
			console.log( 'gmSql.query(USE %s) - err : ', gcmyDataBase.databasename, _err );
			future.return({'ret':'fail', 'code':_err});
		}
		else {
			future.return({'ret':'ok', 'code':''});
		}
	});

	return future;
}

/*
	_szdefault : [string] factory-all
*/
myDataBase.prototype.makedefault_database = function( _szdefault )
{
	//console.log('->> myDataBase.prototype.makedefault_database');
	var future = new gmFuture;

	var _szdefault = _szdefault || 'update';

	gcmyDataBase.db.query('CREATE DATABASE '+gcmyDataBase.databasename, function(_err) {
		if( _err ) {
			switch(_err.code) {
			case 'ER_DB_CREATE_EXISTS': 
				{
					if( _szdefault == 'factory-all' ) {
						// 이미 존재하는 경우, 모두 지우고 새로 만든다.
						gcmyDataBase.db.query('DROP DATABASE '+gcmyDataBase.databasename, function(_err) {
							if(_err) {
								console.log('makedefault_database - error2 db_drop:', _err.code);
								future.return({'ret':'fail', 'code':_err.code});
							}
							else {
								gcmyDataBase.db.query('CREATE DATABASE '+gcmyDataBase.databasename, function(_err) {
									if(_err) {
										console.log('makedefault_database - error3 db_create:', _err.code);
										future.return({'ret':'fail', 'code':_err.code});
									}
									else {
										gcmyDataBase.db.query('USE '+gcmyDataBase.databasename);
										_sync_makedefault_config( future );
									}
								});
							}
						});
					}
					else {
						future.return({'ret':'fail', 'code':'is not factory-all???'});
					}
				}
				break;

			default:
				{
					console.log('makedefault_database - error1 db_create:', _err.code);
					future.return({'ret':'fail', 'code':_err.code});
				}
				break;
			}
		}
		else {
			// Creates a new space because it is empty
			gcmyDataBase.db.query('USE '+gcmyDataBase.databasename);
			_sync_makedefault_config( future );
		}
	});

	return future;
}

/*
	_callback(result, json, ret)

	ex)
	result= [ { seqno: 1,
		  		 lvalue: 'framework.rev.db',
		  		 rvalue: '1',
		  		 type: '{"type":"sz","min":1,"max":8,"def":"1"}',
		  		 privilige: 'admin',
		  		 syntax: 's___g|sz|8' }, { }, ... ]
	json= { 'framework.rev.db' : [ '1', '{"type":"sz","min":1,"max":8,"def":"1"}' ], ... }
	ret= { _ret : 'ok' or errcode }
*/
myDataBase.prototype.getconfig = function( _szlvalue, _callback )
{
	var future = null;

	var query = 'SELECT * FROM '+gcmyDataBase.tablename_config+' WHERE lvalue LIKE "' + _szlvalue + '"';
	// sync mode
	if( !_callback ) future = new gmFuture;

	var future = new gmFuture;
	_getquery_config( query, function(_result, _ret) {
		var json = {};
		if( _ret.ret == 'ok' ) {
			for( var i=0; i<_result.length; i++ ) {
				json[ _result[i].lvalue ] = [];
				json[ _result[i].lvalue ].push(_result[i].rvalue);
				json[ _result[i].lvalue ].push(JSON.parse(_result[i].type));
			}
		}

		// sync mode
		if( !_callback ) future.return( {'result':_result, 'json':json, 'ret':_ret} );
		// async mode
		else _callback(_result, json, _ret);
	});

	// sync mode
	if( !_callback ) return future;
}

function _getquery_config( _query, _callback )
{
	console.log('->> _getquery_config');
	
	var jret = { ret : 'ok' };

	var ajresult = [];
	var query = gcmyDataBase.db.query(_query);

	query.on('error', function(_err) {
		// Handle error, an 'end' event will be emitted after this as well
		//console.log('_getquery_config error:', _err);
		jret.ret = _err;
	})
	.on('fields', function(_fields) {
		// the field packets for the rows to follow
		//console.log('_getquery_config fields:', _fields);
	})
	.on('result', function(_row) {
		// Pausing the connnection is useful if your processing involves I/O
		/*
		_getquery_config result: { seqno: 1,
		  lvalue: 'framework.rev.db',
		  rvalue: '1',
		  type: '{"type":"sz","min":1,"max":8,"def":"1"}',
		  privilige: 'admin',
		  syntax: 's___g|sz|8' }		
		*/
		//console.log('_getquery_config result:', _row);

		//var json = eval('(' + _row.type + ')');
		//console.log('json:', json);
		ajresult.push(_row);
	})
	.on('end', function() {
		// all rows have been received
		//console.log('_getquery_config end:');
		_callback(ajresult, jret);
	})
}

myDataBase.prototype.setquery_config = function( _query, _param, _callback )
{
	console.log('->> myDataBase.prototype.setquery_config _query:', _query);
	console.log('    myDataBase.prototype.setquery_config _param:', _param);
	
	var ajresult = [];
	var query = gcmyDataBase.db.query(_query, _param);
	
	query.on('error', function(_err) {
		// Handle error, an 'end' event will be emitted after this as well
		console.log('setquery_config error:', _err);
	})
	.on('fields', function(_fields) {
		// the field packets for the rows to follow
		console.log('setquery_config fields:', _fields);
	})
	.on('result', function(_row) {
		// Pausing the connnection is useful if your processing involves I/O
		console.log('setquery_config result:', _row);

		//var json = eval('(' + _row.type + ')');
		//console.log('json:', json);
		ajresult.push(_row);
	})
	.on('end', function() {
		// all rows have been received
		console.log('setquery_config end:');
		
		_callback(ajresult);
	})
}

function _sync_makeupdate_config( _future )
{
	var val = _gettable_configuration();	//console.log('val.length :', val.length);
	var table    = val[0];
	var tableval = val[1];

	table.tablename = 'new_configuration';
	var sql = 'CREATE TABLE ' + table.tablename + '(' + table.sql + ')';//console.log('sql :', sql);

	gcmyDataBase.db.query( sql, function(_err) {
		if(_err) {
			_future.return({'ret':'fail', 'code':_err});
		}
		else {
			// JOIN

/*
NEW와 비교해 OLD에서 삭제되야 하는것
mysql> select a.** from a left outer join b on a.a=b.a where b.a is null;
+------+------+
| a    | b    |
+------+------+
| 5    | e    |
+------+------+
1 row in set (0.00 sec)

NEW와 비교해 OLD에서 추가되야 하는것
mysql> select b.a, b.b from a right outer join b on a.a=b.a where a.a is null;
+------+------+
| a    | b    |
+------+------+
| 4    | d    |
+------+------+
1 row in set (0.00 sec)

NEW와 비교해 OLD와 동일한것
mysql> select a.a, a.b from a inner join b on a.a=b.a;
+------+------+
| a    | b    |
+------+------+
| 1    | a    |
| 2    | b    |
| 3    | c    |
+------+------+
3 rows in set (0.00 sec)
*/

/*
drop table a;
drop table b;

create table a (a char(2), b char(2), c char(2), d char(2));
create table b (a char(2), b char(2), c char(2), d char(2), e char(2));

insert into a values(1, 'b', 'c', 'd');
insert into a values(2, 'b', 'c', 'd');
insert into a values(3, 'b', 'c', 'd');
insert into a values(5, 'b', 'c', 'd');

insert into b values(1, 'b', 'c', 'd', 'e');
insert into b values(2, 'bb', 'cc', 'dd', 'ee');
insert into b values(3, 'b3', 'c3', 'dd', 'ee');
insert into b values(4, 'b4', 'cc', 'd4', 'ee');

update a, (select a.a, a.b from a inner join b on a.a=b.a) set a.c=b.c, a.d=b.d, a.e=b.e
set t1.field_id_60 = t2.field_id_46,
    t1.field_id_61 = t2.field_id_47
where t1.entry_id = 45
*/
			/*
			var sql = 'INSERT INTO configuration (lvalue, rvalue, type, privilige, syntax) VALUES (?,?,?,?,?)';
			var cnt = tableval.length;
			for( var i=0; i<tableval.length; i++ ) {
				gcmyDataBase.db.query( sql, tableval[i], function(_err, _results, _fields) {
					if(_err) { 
						console.log(_err);
						_future.return({'ret':'fail', 'code':_err});
					}
					else {
						cnt = cnt - 1;
						if(0 == cnt) {
							_future.return({'ret':'ok', 'code':''});
						}
					}
				});
			}
			*/
		}
	});
}

function _sync_makedefault_config( _future )
{
	var val = _gettable_configuration();	//console.log('val.length :', val.length);
	var table    = val[0];
	var tableval = val[1];

	var sql = 'CREATE TABLE ' + table.tablename + '(' + table.sql + ')';//console.log('sql :', sql);
	gcmyDataBase.db.query( sql, function(_err) {
		if(_err) {
			_future.return({'ret':'fail', 'code':_err});
		}
		else {

			var sql = 'INSERT INTO '+gcmyDataBase.tablename_config+' (lvalue, rvalue, type, privilige, syntax) VALUES (?,?,?,?,?)';
			var cnt = tableval.length;
			for( var i=0; i<tableval.length; i++ ) {
				gcmyDataBase.db.query( sql, tableval[i], function(_err, _results, _fields) {
					if(_err) { 
						console.log(_err);
						_future.return({'ret':'fail', 'code':_err});
					}
					else {
						cnt = cnt - 1;
						if(0 == cnt) {
							_future.return({'ret':'ok', 'code':''});
						}
					}
				});
			}
		}
	});
}

function _gettable_configuration()
{
	var obj = {};
	obj.tablename = gcmyDataBase.tablename_config;
	obj.sql = 'seqno			tinyint not null auto_increment primary key' + ','
			+ 'lvalue			varchar(64) not null' + ','
			+ 'rvalue			varchar(2048) character set utf8 not null' + ','
			+ 'type				varchar(128) not null' + ','
			+ 'privilige		varchar(16) not null' + ','
			+ 'syntax			varchar(128) not null';

	var val = 
	[
	//
	// table을 변경하면 반드시 revision을 수정하여 하위 호환에 대응한다.
	//
	['framework.rev.db',				gcmyDataBase.revision,	'{"type":"sz","min":1,"max":8,"def":"1"}',			'admin', 's___g|sz|8'],

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
	['account.admin',						'admin',	'{"type":"usernamelist","def":"admin"}',					'admin', 's__sg|usernamelist|1|30'],
	['account.admin.passwd',				'z5n3UO/v7+/hb3p4',	'{"type":"passwd","def":"z5n3UO/v7+/hb3p4"}',		'admin', 's__sg|passwdlist|1|30'],
	['account.operator',					'',			'{"type":"usernamelist","def":""}',							'admin', 's__sg|usernamelist|0|30'],
	['account.operator.passwd',				'',			'{"type":"passwd","def":""}',								'admin', 's__sg|passwdlist|0|30'],
	['account.viewer',						'',			'{"type":"usernamelist","def":""}',							'admin', 's__sg|usernamelist|0|30'],
	['account.viewer.passwd',				'',			'{"type":"passwd","def":""}',								'admin', 's__sg|passwdlist|0|30'],
	
	['http.enable',							'yes',		'{"type":"yesno","def":"yes"}',								'admin', 's__sg|yesno'],
	['http.port',							'80',		'{"type":"port","min":1,"max":65535,"def":25}',				'admin', 's__sg|port|1|65535'],

/*
	webservice
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
	
	return [obj,val];
}
