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
	var animationSpeed = 'fast';
	var horizontalButtonSelector = '.addDocumentToolbarButton_viewPortsSplitHorizontally';
	var verticalButtonSelector = '.addDocumentToolbarButton_viewPortsSplitVertically';
	var buttonSelectedClass = 'topToolbarSelected';
	var buttonUnselectedClass = 'topToolbarUnselected';
	
	viewPorts = function(gui) {
		var multiViewHandler = gui.modelviews;
		var isSplitHorizontally = false;
		var isSplitVertically = false;
		var isResizing = false;
		var self = this;
		
		var construct = function() {
			multiViewHandler.addModelView('modelViewTopLeft', 'top');
			$('.modelViewTopLeft').css({width: '100%', height: '100%'});
		};
		
		this.ToggleSplitHorizontally = function() {
			if (isResizing) return;
			isResizing = true;
			
			if (isSplitHorizontally) {
				isSplitHorizontally = false;
				mergeHorizontally();
			}
			else {
				isSplitHorizontally = true;
				splitHorizontally();
			}
		};
		
		this.ToggleSplitVertically = function() {
			if (isResizing) return;
			isResizing = true;
			
			if (isSplitVertically) {
				isSplitVertically = false;
				mergeVertically();
			}
			else {
				isSplitVertically = true;
				splitVertically();
			}
		};
		
		var mergeHorizontally = function() {
			if (isSplitVertically) {
				$('.modelViewTopLeft,.modelViewBottomLeft').animate(
					{width: '100%'},
					animationSpeed
				);

				$('.modelViewTopRight,.modelViewBottomRight').animate(
					{width: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewTopRight');
						multiViewHandler.removeModelView('modelViewBottomRight');
						$(horizontalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
			else {
				$('.modelViewTopLeft').animate(
					{width: '100%'},
					animationSpeed
				);

				$('.modelViewTopRight').animate(
					{width: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewTopRight');
						$(horizontalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
		};
		
		var splitHorizontally = function() {
			$(horizontalButtonSelector)
				.removeClass(buttonUnselectedClass)
				.addClass(buttonSelectedClass);

			if (isSplitVertically) {
				multiViewHandler.addModelView('modelViewTopRight', 'side');
				multiViewHandler.addModelView('modelViewBottomRight', 'side');
				$('.modelViewTopRight,.modelViewBottomRight').css({width: '0', height: '50%'});
				
				$('.modelViewTopLeft,.modelViewTopRight,.modelViewBottomLeft,.modelViewBottomRight').animate(
					{width: '50%', height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
			else {
				multiViewHandler.addModelView('modelViewTopRight', 'side');
				$('.modelViewTopRight').css({width: '0', height: '100%'});
				
				$('.modelViewTopRight,.modelViewTopLeft').animate(
					{width: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
		};
		
		var mergeVertically = function() {
			if (isSplitHorizontally) {
				$('.modelViewTopLeft,.modelViewTopRight').animate(
					{height: '100%'},
					animationSpeed
				);

				$('.modelViewBottomLeft,.modelViewBottomRight').animate(
					{height: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewBottomLeft');
						multiViewHandler.removeModelView('modelViewBottomRight');
						$(verticalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
			else {
				$('.modelViewTopLeft').animate(
					{height: '100%'},
					animationSpeed
				);

				$('.modelViewBottomLeft').animate(
					{height: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewBottomLeft');
						$(verticalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
		};
		
		var splitVertically = function() {
			$(verticalButtonSelector)
				.removeClass(buttonUnselectedClass)
				.addClass(buttonSelectedClass);
			
			if (isSplitHorizontally) {
				multiViewHandler.addModelView('modelViewBottomLeft', 'top');
				multiViewHandler.addModelView('modelViewBottomRight', 'side');
				$('.modelViewBottomLeft,.modelViewBottomRight').css({width: '50%', height: '0'});
				
				$('.modelViewTopLeft,.modelViewTopRight,.modelViewBottomLeft,.modelViewBottomRight').animate(
					{height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
			else {
				multiViewHandler.addModelView('modelViewBottomLeft', 'top');
				$('.modelViewBottomLeft').css({width: '100%', height: '0'});
				
				$('.modelViewTopLeft,.modelViewBottomLeft').animate(
					{height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
		};
		
		construct();
	};
	
	namespace.viewPorts = viewPorts;
}());
