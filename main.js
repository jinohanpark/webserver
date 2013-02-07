
/*
Dev.history
	Park, jinohan
	v1.0.0		2013-03-01	jinohan
				startup code based on nodejs v0.8.18
*/


/*
	native modules
*/
var gmOs = require('os');


/*
	native modules
*/
var gmUtil = require('util');
var gmHttp = require('http');
var gmFs   = require('fs');
var gmUrl  = require('url');
var gmQS   = require('querystring');

/*
	external modules
*/
var gmFiber  = require('fibers');
var gmFuture = require('fibers/future'), wait = gmFuture.wait;


/*
	my modules
*/
var gmMisc = require('./misc.js');
var gmDataBase = require('./my_modules/database/database.js');
var gmHttpServer = require('./my_modules/webserver/webserver.js');

/*
	global variables
*/
var gmainapp = {};
var gval = {};


/*
	function prototype
*/

gmainapp.main = function()
{
	//show_process_attr();
	//show_os_attr();

	try {
		////////////////////////////////////////////////////////////////////////////////////////
		// database
		var option = { host:'localhost', user:'root', password:'convex1234!@' };
		gmDataBase.init(option);

		var ret = gmDataBase.using().wait();
		if( 'fail' == ret.ret ) {
			var ret = gmDataBase.makedefault_database('factory-all').wait();
			if( 'fail' == ret.ret ) throw ret;
		}
		else {
			//console.log('db.revision:', gmDataBase.revision );
			var ret = gmDataBase.getconfig('framework.rev.db').wait();
			if( 'ok' !== ret.ret.ret ) throw ret;
			/*
			ret: { result:
			   [ { seqno: 1,
			       lvalue: 'framework.rev.db',
			       rvalue: '1',
			       type: '{"type":"sz","min":1,"max":8,"def":"1"}',
			       privilige: 'admin',
			       syntax: 's___g|sz|8' } ],
			  json: { 'framework.rev.db': [ '1', [Object] ] },
			  ret: { ret: 'ok' } }			
			*/
			console.log('getquery - db.revision:', ret.result[0].rvalue);
		}

		///////////////////////////////////////////////////////////////////////////////////////
		// http-server
		var option = _getwebserveroption();
		if( 'fail' == option.ret ) throw ret;

		var cHttpServer = new gmHttpServer();
		cHttpServer.Init(option);

		//
		// var cHttpsServer = new gmHttpServer();
		// var option = {
		// 	ssl : 'no',
		// 	port : '3001',
		// 	basedir : '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www',
		// 	uploaddir : '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www/upload'
		// };
		// cHttpsServer.Init(option);


		///////////////////////////////////////////////////////////////////////////////////////
		// ???

	}
	catch(err) {
		console.log('main routine error ret:', err);
	}
	finally {
		console.log('main routine finally...');
	}

	return 'main_retvalue';
}.future();




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
*/
console.log('!!!! startup nodejs.main !!!!');

var lresult = gmainapp.main().resolve( function(err, val) {
	console.log('!!!! endup nodejs.main ret:', val, ' gval:', gval);	//'main_retvalue'
});

console.log('!!!! nodejs.main running...');

process.on('SIGINT', function() {

	console.log('Got SIGINT.');
	process.exit(0);
})

process.on('exit', function () {
	process.nextTick( function () {
		console.log('This will not run');
	});
	console.log('********************************************************************************************************');
	console.log('process.memoryusage:', process.memoryUsage());
	console.log('process.uptime:', process.uptime());
	console.log('********************************************************************************************************');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
	local function
*/
function show_os_attr()
{
	console.log('OS module:', gmOs);
	
	console.log('os.hostname:', gmOs.hostname());
	console.log('os.type:', gmOs.type());
	console.log('os.platform:', gmOs.platform());
	console.log('os.arch:', gmOs.arch());
	console.log('os.release:', gmOs.release());
	console.log('os.uptime:', gmOs.uptime());
	console.log('os.loadavg:', gmOs.loadavg());
	console.log('os.totalmem:', gmOs.totalmem());
	console.log('os.freemem:', gmOs.freemem());
	console.log('os.cpus:', gmOs.cpus());
	console.log('os.getNetworkInterfaces:', gmOs.getNetworkInterfaces());
	console.log('os.tmpDir:', gmOs.tmpDir());
}

function show_process_attr()
{
	process.argv.forEach( function(_item, _index) {
		console.log(_index + ':' + typeof(_item) + ':', _item);
		if( _item == '-port') {
			var portno = Number(process.argv[_index+1]);
			console.log('portno:', portno);
		}
	});
	console.log('process:', process);
	return 0;
}

function _getwebserveroption()
{
	//var query = 'SELECT * FROM configuration WHERE lvalue LIKE "' + 'framework.rev.db' + '"';
	//var ret = gmDataBase.getconfig( 'framework.rev.db' ).wait();
	//if( 'ok' !== ret.ret.ret ) return ret;

	var szipaddr = '';
	var netinterface = gmOs.getNetworkInterfaces();
	var akeys = Object.keys(netinterface);
	for(var i=0; i<akeys.length; i++) {
		var nets = netinterface[akeys[i]][0];//console.log(nets);
		if( (nets['family'] == 'IPv4') && (nets['internal'] == false) ) {
			szipaddr = nets['address'];
			break;
		}
	}
	if( szipaddr ) { console.log('#### IPADDRESS:', szipaddr, 'applied.' ); }
	else { console.log('## IPADDRESS:', ' depend on system default net-adapter'); }

	return {
		ssl : 'no',
		ipaddr : szipaddr,	// or ''
		port : '3000',
		basedir : '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www',
		uploaddir : '/home/jopark/workdir/_SVN1/linux/server/node.js/testcode/webserver/www/upload'
	};
}
