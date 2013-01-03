
function Init_jQuery()
{
	jQuery(
	function() { 
		$(document).ready( function() {
			showSubmenu_Selected();
		});
		
		$('.left_nav a').click( function(ev) {
			var atag = $(this).text();
			var szhref = $(this).attr('href');
			var str = szhref+'&submenutext='+atag;
			$(this).attr('href', str);
		});
	});
}(jQuery);

function showSubmenu( sztype )
{
	var szhtml = '';
	
	szhtml = '';
	szhtml += '<dl class="submenu_nav">';

	szhtml +=	'<dt>시작하기</dt>';
	szhtml +=		'<dd><a href=/submenu/account.html?submenuid=idaccount>계정</a></dd>';
	szhtml +=		'<dd><a href=/submenu/profile.html?submenuid=idprofile>프로파일</a></dd>';
	szhtml +=	'<dt>유지보수</dt>';
	szhtml +=		'<dd><a href=/submenu/firmwareupdate.html?submenuid=idfirmup>소프트웨어 업데이트</a></dd>';
	szhtml +=	'<dt>여러가지</dt>';
	szhtml +=		'<dd><a href=/submenu/chatting.html?submenuid=idchatting>채팅</a></dd>';
	szhtml +=		'<dd><a href=/submenu/getsetconfig.html?submenuid=idgetsetconfig>비동기갯셋</a></dd>';
	szhtml += '</dl>';

	document.write(szhtml);
}

function _myfindquerystring_rvalue( _szquerystring, _szlvalue )
{
	var szrvalue = '';

	var sz1 = _szquerystring.split('?');
	if( null == sz1[1] ) return szrvalue;
	
	var sz2 = sz1[1].split('&');
	var sz;
	for( var i=0; i < sz2.length; i++ ) {
		sz = sz2[i].split("=");
		if( _szlvalue == sz[0] ) {
			szrvalue = sz[1];
			break;
		}
	}
	return szrvalue;
}

function showSubmenu_Selected()
{
	var szsubmenuid1 = _myfindquerystring_rvalue( window.location.href, "submenuid" );
	//
	jQuery('.submenu_nav a[href*='+'"submenuid='+szsubmenuid1+'"]').addClass('selected');
	/*
	var szsubmenuid2 = '';
	var obj = jQuery('.submenu_nav').find('a');
	for( var i=0; i<obj.length; i++ ) {
		szsubmenuid2 = _myfindquerystring_rvalue( obj[i].href, "submenuid" );
		if( szsubmenuid1 == szsubmenuid2 ) {
			jQuery(obj[i]).addClass('selected');
			break;
		}
	}
	*/
}	

function getSubmenuText()
{
	var szsubmenuid1 = _myfindquerystring_rvalue( window.location.href, "submenuid" );
	var szhtml = jQuery('.submenu_nav a[href*='+'"submenuid='+szsubmenuid1+'"]').html();
	document.write(szhtml);
}
