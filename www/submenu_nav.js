
function Init_jQuery()
{
	jQuery(
	function() { 
		$('.left_nav a').click(
			function(ev) {
				var atag = $(this).text();
				var szhref = $(this).attr('href');
				var str = szhref+'&submenuid='+atag;
				$(this).attr('href', str);
			}
		);
	});
}(jQuery);

function showSubmenu( sztype )
{
	var szhtml = '';
	
	szhtml = '';
	szhtml += '<dl class="submenu_nav">';
	
	szhtml +=	'<dt>Getting Start</dt>';
	szhtml +=		'<dd><a href=/submenu/account.html?id=zzz1>Account</a></dd>';
	szhtml +=		'<dd><a href=/submenu/profile.html?id=zzz2>Profile</a></dd>';
	szhtml +=	'<dt>Streaming</dt>';
	szhtml +=		'<dd><a href=/submenu/camera.html?id=zzz3>Camera</a></dd>';
	szhtml +=		'<dd><a href=/submenu/avcodec.html?id=zzz4>A/V Codec</a></dd>';
	szhtml +=		'<dd><a href=/submenu/videoout.html?id=zzz5>Video Out</a></dd>';

	szhtml += '</dl>';
	
	document.write(szhtml);
}

function showSubmenu_Selected()
{
	var szhref = window.location.href.split('?');
	var sztag = szhref[1].split('&');
	var sz;
	for( i=0; i < sztag.length; i++ ) {
		sz = sztag[i].split("=");
		if( "submenuid" == sz[0] ) {
			break;
		}
	}

	var szsubmenuid = sz[1];
	var obj = $('.submenu_nav').find('a');
	for( i=0; i<obj.length; i++ ) {
		if( szsubmenuid == obj[i].innerText ) {
			$(obj[i]).addClass('selected');
		}
	}
}	
