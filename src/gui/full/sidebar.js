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
	var funcName = "sidebar";
	
	var proto = function(gui) {
		var isShowing = false;
		var buttonDomSelector = '.addDocumentToolbarButton_sidebar';
		var sidebarDomSelector = '#sidebar';
		var contentDomSelector = '#sidebarContent';
		var workareaDomSelector = '#workarea'; 
		var width = 300;
		
		this.construct = function() {
			$('body').append(
				'<div id="sidebar">' +
					'<div id="sidebarInner">' +
						'<div id="sidebarContent">' +
						'' +
						'' +
						'' +
						'' +
						'</div>' +
					'</div>' +
				'</div>');
		};
		
		this.show = function(noAnimate) {
			if (isShowing) {return;}
			
			if (typeof noAnimate == "undefined") {
				noAnimate = false;
			}
			
			isShowing = true;
			$(buttonDomSelector)
				.removeClass('topToolbarUnselected')
				.addClass('topToolbarSelected');
				
			$(sidebarDomSelector).css({width: width, right: -width});
			$(sidebarDomSelector).show();
			
			if (noAnimate) {
				$(sidebarDomSelector).css({right: 0});
				$(workareaDomSelector).css({right: width});
			}
			else {
				$(sidebarDomSelector).animate({right: 0}, 'fast');
				$(workareaDomSelector).animate({right: width}, 'fast');
			}
		};
		
		this.hide = function() {
			if (!isShowing) {return;}
			isShowing = false;
			$(buttonDomSelector)
				.removeClass('topToolbarSelected')
				.addClass('topToolbarUnselected');

			$(sidebarDomSelector).animate({right: -width}, 'fast', function() {
				$(sidebarDomSelector).hide();
			});
			$(workareaDomSelector).animate({right: 0}, 'fast');
		};
		
		this.resize = function(resizeToPixels) {
			$(sidebarDomSelector).css('width', resizeToPixels + 'px');
			$(workareaDomSelector).css('right', resizeToPixels + 'px');
		};
		
		this.toggle = function() {
			if (isShowing) {
				this.hide();
			}
			else {
				this.show();
			}
		};
		
		this.addSection = function(header, body, collapsedByDefault, existingDomId) {
			collapsedByDefault = (typeof collapsedByDefault != "undefined") ? collapsedByDefault : false;

			var domId = (typeof existingDomId != "undefined") ? existingDomId : 'domId_'+com.mordritch.mcSim.domIdCounter++;
			
			if (typeof existingDomId == "undefined") {
				$(contentDomSelector).append('<div id="'+domId+'"></div>');
			}
			
			$('#' + domId).html(
				'<div class="heading">' +
					'<span class="arrow"></span> ' +
					'<b>' +
						header +
					'</b>' +
				'</div>' +
				'<div class="body">' +
					'<br/>' +
					body.replace(/\n/g, '<br/>') +
					'<br/>' +
					'<br/>' +
				'</div>'
			);
			
			if (collapsedByDefault) {
				$('#' + domId + ' .body').hide();
			}
			$('#' + domId + ' .arrow').html((collapsedByDefault) ? "\u25ba" : "\u25bc");
			
			
			$('#' + domId + ' .heading').on('click', function() {
				var selector = '#' + domId + ' .';
					var hidden = ($(selector + 'arrow').html() == "\u25ba"); 
					$(selector + 'arrow').html((hidden) ? "\u25bc" : "\u25ba");
				$(selector + 'body').slideToggle('fast', function() {
				});
			});
			
			return domId;
		};
		
		this.construct();
	};
	namespace[funcName] = proto;
})();
