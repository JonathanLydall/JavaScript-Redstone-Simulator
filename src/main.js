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
	}
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
if (typeof window.unescapeHtml == "undefined") {
	window.unescapeHtml = function(escapedStr) {
	    var div = document.createElement('div');
	    div.innerHTML = escapedStr;
	    var child = div.childNodes[0];
	    return child ? child.nodeValue : '';
	}
}