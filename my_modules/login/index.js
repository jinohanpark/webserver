
function myLogin( _name )
{
	var self = this;
	
	this.name = _name;
	this.ntest1 = 1;
	this.ntest2 = 2;
	this.sztest3 = 'test3';
};

myLogin.prototype.getvalue = function( _num )
{
	var value = null;

	if( 1 == _num ) value = this.ntest1;
	if( 2 == _num ) value = this.ntest2;
	if( 3 == _num ) value = this.sztest3;
	
	return value;
};

myLogin.prototype.setvalue = function( _num, _value )
{
	if( 1 == _num ) this.ntest1 = _value;
	if( 2 == _num ) this.ntest2 = _value;
	if( 3 == _num ) this.sztest3 = _value;
};

var objType = new myLogin();
exports = module.exports = objType;
