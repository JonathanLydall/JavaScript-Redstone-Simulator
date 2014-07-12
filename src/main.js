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

$(document).ready(function () {
	//IE does not have a "console" object unless the debugger is running, let's create one if this is the case.
	if (typeof window['console'] == 'undefined') window['console'] = new function() {this.log = function() {};};
	
	if (!window.HTMLCanvasElement) {
		return; //canvas unsupported
	}
	
	nameSpace = com.mordritch.mcSim;
	nameSpace.domIdCounter = 0; //A counter for creating unique named DOM IDs
	nameSpace.gui = new com.mordritch.mcSim.Gui_FullApp();
});

function g() {
	nameSpace = com.mordritch.mcSim;
	nameSpace.domIdCounter = 0; //A counter for creating unique named DOM IDs
	nameSpace.gui = new com.mordritch.mcSim.Gui_FullApp();
}


//TODO: Have these moved into another file perhaps?

// Use the browser's built-in functionality to quickly and safely escape the
// string
if (typeof window.escapeHtml == "undefined") {
	window.escapeHtml = function(str) {
	    var div = document.createElement('div');
	    div.appendChild(document.createTextNode(str));
	    return div.innerHTML;
	};
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
if (typeof window.unescapeHtml == "undefined") {
	window.unescapeHtml = function(escapedStr) {
	    var div = document.createElement('div');
	    div.innerHTML = escapedStr;
	    var child = div.childNodes[0];
	    return child ? child.nodeValue : '';
	};
}