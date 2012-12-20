
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
	this.self = this;		// gcmyDataBase
	this.cDB = null;
}

myDataBase.prototype.init = function()
{
	this.cDB = gmSql.createConnection( {host:'localhost', user:'root', password:'convex1234!@'} );
	this.cDB.connect();

	this._initdefault_ipcam_database();

	return this.cDB;
}

myDataBase.prototype._initdefault_ipcam_database = function()
{
	var self = this.self;

	console.log('->> myDataBase.prototype._initdefault_ipcam_database');
	
	gcmyDataBase.cDB.query('CREATE DATABASE ipcam', function(_err) {
		//console.log(_err);
		if( _err ) {
			switch(_err.code) {
			case 'ER_DB_CREATE_EXISTS':
				gcmyDataBase.cDB.query('DROP DATABASE ipcam', function(_err) {
					if(_err) {}
					else {
						gcmyDataBase.cDB.query('CREATE DATABASE ipcam', function(_err) {
							if(_err) {}
							else {
								gcmyDataBase.cDB.query('USE ipcam');
								self._makedefault_ipcam_config();
							}
						});
					}
				});
			}
		}
		else {
			gcmyDataBase.cDB.query('USE ipcam');
		}
	});
}

myDataBase.prototype._makedefault_ipcam_config = function()
{
	var self = this.self;

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

	gcmyDataBase.cDB.query( sql, function(_err) {
		if(_err) {}
		else {
			var sql = 'INSERT INTO configuration (lvalue, rvalue, type, privilige, syntax) VALUES (?,?,?,?,?)';
			var val = 
[
['system.deviceinfo.manufacturer',	'', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.model',			'', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.fwversion',		'', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.serialno',		'', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64'],
['system.deviceinfo.hwid',			'', '{type:\'sz\',min:0,max:64,def:\'\'}', 'admin', 's___g|sz|64']
];
			//console.log('val.length :', val.length);
			for( var i=0; i<val.length; i++ ) {
				gcmyDataBase.cDB.query( sql, val[i], function(_err, _results, _fields) {
					if(_err) { console.log(_err); }
					else { }
				});
			}
		}
	});
}
