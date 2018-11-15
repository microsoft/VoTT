/* To avoid CSS expressions while still supporting IE 7 and IE 6, use this script */
/* The script tag referencing this file must be placed before the ending body tag. */

/* Use conditional comments in order to target IE 7 and older:
	<!--[if lt IE 8]><!-->
	<script src="ie7/ie7.js"></script>
	<!--<![endif]-->
*/

(function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'icomoon-video-tagging\'">' + entity + '</span>' + html;
	}
	var icons = {
		'icon-file-picture': '&#xe900;',
		'icon-file-play': '&#xe919;',
		'icon-price-tag': '&#xe901;',
		'icon-price-tags': '&#xe902;',
		'icon-pushpin': '&#xe903;',
		'icon-floppy-disk': '&#xe91a;',
		'icon-cross': '&#xe904;',
		'icon-play3': '&#xe905;',
		'icon-pause2': '&#xe906;',
		'icon-stop2': '&#xe907;',
		'icon-backward2': '&#xe908;',
		'icon-forward3': '&#xe909;',
		'icon-first': '&#xe90a;',
		'icon-last': '&#xe90b;',
		'icon-previous2': '&#xe90c;',
		'icon-next2': '&#xe90d;',
		'icon-eject': '&#xe90e;',
		'icon-volume-medium': '&#xe90f;',
		'icon-volume-mute2': '&#xe910;',
		'icon-arrow-right': '&#xe911;',
		'icon-arrow-left': '&#xe912;',
		'icon-arrow-right2': '&#xe913;',
		'icon-arrow-left2': '&#xe914;',
		'icon-circle-right': '&#xe915;',
		'icon-circle-left': '&#xe916;',
		'icon-checkbox-unchecked': '&#xe918;',
		'icon-share': '&#xe917;',
		'0': 0
		},
		els = document.getElementsByTagName('*'),
		i, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
}());
