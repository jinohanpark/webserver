
var gcmyWsIO = new myWebSocket();
exports = module.exports = gcmyWsIO;

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

/*
	my modules
*/


/*
PUBLIC function definition 
*/
function myWebSocket( _name )
{
	this.self = this;		// gcmyWsIO
	
}

myWebSocket.prototype.createSocket = function()
{

}
