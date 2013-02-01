
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
	external modules
*/
var gmFiber  = require('fibers');
var gmFuture = require('fibers/future'), wait = gmFuture.wait;

/*
	my modules
*/
var gmDataBase = require('./my_modules/database/database.js');

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

	console.log('aaaaaa');
	gmDataBase.init();
	console.log('bbbbbb');

	var ret = gmDataBase.makedefault_ipcam_database().wait();
	console.log('cccccc ret:', ret);

/*
	gval.test1 = 1;
	console.log('before sync1 ');
	var szret = _syncQuery1();
	wait(szret);
	console.log('after sync1, ret:', szret);

	console.log('before sync2 ');
	var szret = _syncQuery2().wait();
	console.log('after sync2, ret:', szret);
*/

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

function _syncQuery3()
{
	var fiber = gmFiber.current;

	gval.test2 = 2;

    setTimeout( function() {
    	console.log('timer3');
    	gval.test3 = 3;

    	var szret = 'ok_sync3';
    	fiber.run(szret);

    }, 1000);

    var szret = gmFiber.yield();
	console.log('timer1-eeeee, szret:', szret);
}

function _syncQuery1()
{
	var future = new gmFuture;

	gval.test2 = 2;

    setTimeout( function() {
    	console.log('timer1');
    	gval.test3 = 3;
    	var szret = 'ok_sync1';
        future.return(szret);
        console.log('timer1-ddddd');
    }, 1000);

	console.log('timer1-eeeee');
	return future;
}

function _syncQuery2()
{
	var future = new gmFuture;

	gval.test4 = 4;
    setTimeout( function() {
    	console.log('timer2');
    	gval.test5 = 5;
    	var szret = 'ok_sync2';
        future.return(szret);
    }, 500);

	return future;
}
