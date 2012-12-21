
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
	connect.connect();
	connect.query('USE ipcam');

	this.connect = connect;
	
	return this.connect;
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
	
	var ajresult = [{}];
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
			var val = 
[
['system.deviceinfo.manufacturer',	'manufacturer', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.model',			'model',		'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.fwversion',		'fwversion',	'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.serialno',		'serialno',		'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.hwid',			'hwid',			'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],

['security.account.user',			'root',		'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['security.account.privilige',		'pass',		'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],

['network.eth0.mac',				'00:11:22:33:44:55',	'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['network.eth0.ipv4',				'192.168.0.2',			'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['network.eth0.subnet',				'255.255.255.0',		'{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64']

];
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
