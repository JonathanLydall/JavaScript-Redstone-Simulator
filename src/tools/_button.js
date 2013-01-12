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
