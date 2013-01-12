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
	var topRightButtons = com.mordritch.mcSim.topRightButtons = function() {};
	
	topRightButtons.prototype.registeredButtons = [];
	
	/**
	 * Adds a button to the top right toolbar, buttons like save, load, etc
	 * 
 	 * @param {Object} options
	 */
	topRightButtons.prototype.insert = function(options) {
		var t = this;
		this.registeredButtons.push({
			onClickCallback: options.onClickCallback
		});
		var buttonId = "topRightButton_" + (this.registeredButtons.length);
		var buttonHtml = '<img alt="" id="' + buttonId +'" src="images/icons/' + options.image + '">';
		$('#documentToolBarLeft').append(buttonHtml);
		
		$('#'+buttonId).bind('click', {t: t, id: this.registeredButtons.length}, function(e) {
			e.data.t.registeredButtons[e.data.id]();
		});
		
		//TODO: Automatically register a bindable shortcut, description, tooltip
		
	};
}());
