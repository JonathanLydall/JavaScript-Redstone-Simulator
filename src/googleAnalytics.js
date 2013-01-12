com.mordritch.mcSim.googleAnalytics = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	var self = this;
	
	var construct = function() {
		setInterval(function() {
			self.doUpdate();
		},1000*25*60); //25 minutes * 60 seconds * 1000 milliseconds
	}
	
	this.doUpdate = function() {
		if (typeof window._gaq != 'undefined') {
			//console.log("pushed %s", window.location.href);
			window._gaq.push(['_trackPageview', window.location.pathname + window.location.search]);
		}
	}
	
	construct();
}
