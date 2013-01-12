(function(){
var namespace = com.mordritch.mcSim;
var funcName = "tooltip";

namespace[funcName] = function(gui) {
	var delay = 500;
	var timeoutId = -1;
	var domId = "tooltip";
	var $tooltip;
	var L10n = gui.localization;
	
	this.construct = function() {
		$('body').append('<div id="'+domId+'"></div>');
		$tooltip = $('#'+domId);
		$tooltip.hide();
	}
	
	this.show = function($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName) {
		clearTimeout(timeoutId);
		var t = this;
		timeoutId = setTimeout(function(){
			t.showNow($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName);
		}, delay);
	}
	
	this.showNow = function($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName) {
		var posX, posY, html = '';
		if (headerText.length > 0) {
			html += '<b>' + headerText + '</b>';
		}
		if (
			shortcutKeyScope.length > 0 &&
			shortcutKeyEventName.length > 0 &&
			gui.input.getBindingKeyNames(shortcutKeyScope, shortcutKeyEventName).length > 0
		) {
			html += '<br/>' + L10n.getString('tooltip.shortcutKeyText', gui.input.getBindingKeyNames(shortcutKeyScope, shortcutKeyEventName));
		}
		if (bodyText.length > 0) {
			while (bodyText.indexOf('\\n') >= 0) {
				bodyText = bodyText.replace("\\n", "<br/>")
			}
			
			html += '<br/><br/>' + bodyText;
		}
		$tooltip.html(html);
		
		switch (position) {
			case "below":
				posX = $domElement.offset().left; 
				posY = $domElement.offset().top + $domElement.outerHeight() + 2;
				var outerWidth = this.getOuterWidth();
				if (posX + outerWidth > $(window).width()) {
					posX = $domElement.offset().left + $domElement.outerWidth() - outerWidth;
				}
				break;
			case "right":
				posX = $domElement.offset().left + $domElement.outerWidth() + 2;
				posY = $domElement.offset().top;
				var outerHeight = this.getOuterHeight();
				if (posY + outerHeight > $(window).height()) {
					posY = $domElement.offset().top + $domElement.outerHeight() - outerHeight - 2;
				}
				break;
			default: throw new Error("Unexpected case");
		}
		
		$tooltip.css({
			left: posX + "px",
			top: posY + "px"
		});
		$tooltip.fadeIn("fast");
	}
	
	this.getOuterHeight = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerHeight();
		$tooltip.hide();
		return returnValue;
	}
	
	this.getOuterWidth = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerWidth();
		$tooltip.hide();
		return returnValue;
	}
	
	this.hide = function() {
		clearTimeout(timeoutId);
		$tooltip.hide();
	}
	
	
	this.construct();
}})();
