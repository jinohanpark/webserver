
var objType = new myWebService();
exports = module.exports = objType;

/*
	internal modules
*/
var gmDgram		= require('dgram');
var gmUtil		= require('util');
var gmFs		= require('fs');
var gmBuffer	= require('buffer');

function myWebService( _name )
{
	var self = this;
	
	this.nWebService_UDPport = 3702;
	this.nWebService_MulticastIP = '239.255.255.250';
}

myWebService.prototype.createSocket = function()
{
	var gcWebServiceServer = gmDgram.createSocket('udp4');	

	console.log('createSocket');
}
