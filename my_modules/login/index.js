
function myLogin( _name )
{
	var self = this;
	
	this.name = _name;
	this.ntest1 = 1;
	this.ntest2 = 2;
	this.sztest3 = 'test3';
};

myLogin.prototype.authen = function( _req )
{
	var fret;

	//console.log('method:', _req.method);
	//console.log('gmConnect.bodyParser:', _req.body);
	//console.log('_req.body.username :', _req.body.username);
	//console.log('_req.body.password :', _req.body.password);
	
	fret = false;
	
	// basic authentication
	if( 'root' == _req.body.username && 'pass' == _req.body.password ) {
		fret = true;
	}

	//
	var sess = _req.session;
	if( true == fret ) {
		sess.ncount = sess.ncount || 0;
		sess.ncount++;
		sess.szusername = _req.body.username;
		sess.fauthen = true;
	}
	else {
		_req.session = null;
	}

	return fret;
}

/*

*/
myLogin.prototype.islogin = function(_req, _res)
{
	var sess = _req.session;
	console.log('gmConnect.session:', sess);

	if( undefined == sess.fauthen ) {
		sess.ncount = 1;
		sess.szusername = 'anonymous_zXcsa1wjk';
		sess.fauthen = false;
	}

	return sess.fauthen;

	/*
	sess.count = sess.count || 0;
	var n = sess.count++;
	var name = sess.username || 'anonymous_zXcsa1wjk';
	var authen = sess.authen || 'false';
	
	if( 'POST' != _req.method ) return false;
	
	if( '/clear' == _req.url ) {
		_req.session = null;
		
		_res.statusCode = 302;
		_res.setHeader( 'Location:', '/index.html' );
		_res.end();
		return;		
	}

	if( 'POST' == _req.method ) {
		_req.session.name = _req.body.name;
	}

	_req.session.count = _req.session.count || 0;
	var n = _req.session.count++;
	var name = _req.session.name || 'Enter your name';
	_res.end( '<p>hits: ' + n + '</p>'
			 +'<form method="post">'
			 +'<p>'
			 +'<input type="text" name="name" value="' + name + '"/>'
			 +'<input type="submit" value="Save" />'
			 +'</p>'
			 +'</form>'
			 +'<p><a href="/clear">clear session</a></p>'
			 );
	return;			 
	*/
}

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
