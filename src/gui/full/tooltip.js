/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

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
	};
	
	this.createForElement = function($domElement, position, headerTextResourceName, bodyTextResourceName, shortcutKeyScope, shortcutKeyEventName) {
		var self = this;
		$domElement.on('mouseenter', function() {
			self.show(
				$domElement = $domElement,
				position = position,
				headerText = L10n.getString(headerTextResourceName),
				bodyText = L10n.getString(bodyTextResourceName),
				shortcutKeyScope = shortcutKeyScope,
				shortcutKeyEventName = shortcutKeyEventName
			);
		});
		
		this.bindHideEvents($domElement);
	};
	
	this.creteForElementWithDynamicParameters = function($domElement, getParamatersCallback) {
		var self = this;
		
		$domElement.on('mouseenter', function() {
			var parameters = getParamatersCallback(this);
			
			if (parameters == null)
			{
				return;
			}
			
			self.show(
				$domElement = parameters.$domElement,
				position = parameters.position,
				headerText = parameters.headerText,
				bodyText = parameters.bodyText,
				shortcutKeyScope = parameters.shortcutKeyScope,
				shortcutKeyEventName = parameters.shortcutKeyEventName
			);
		});
		
		this.bindHideEvents($domElement);
	};
	
	this.bindHideEvents = function($domElement) {
		$domElement.on('mouseleave', this.hide);
		$domElement.on('click', this.hide);
	};
	
	
	this.show = function($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName) {
		clearTimeout(timeoutId);
		var t = this;
		timeoutId = setTimeout(function(){
			t.showNow($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName);
		}, delay);
	};
	
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
				bodyText = bodyText.replace("\\n", "<br/>");
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
	};
	
	this.getOuterHeight = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerHeight();
		$tooltip.hide();
		return returnValue;
	};
	
	this.getOuterWidth = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerWidth();
		$tooltip.hide();
		return returnValue;
	};
	
	this.hide = function() {
		clearTimeout(timeoutId);
		$tooltip.hide();
	};	
	
	this.construct();
};
})();
