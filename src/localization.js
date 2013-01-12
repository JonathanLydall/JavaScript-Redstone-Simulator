/**
 * Requires a javascript implementation of sprintf, for example:
 * http://www.diveintojavascript.com/projects/javascript-sprintf
 */

com.mordritch.mcSim.localization = function(rawStrings) {
	this.rawStrings = rawStrings;
	this.registeredLocalizationChangeCallbacks = new Array();
	
	this.construct = function() {
		this.strings = {};
		for (var section in this.rawStrings)
		{
			for (var string in this.rawStrings[section])
			{
				this.strings[string] = this.rawStrings[section][string];
			}
		}
	}
	
	/**
	 * Returns the translated string
	 */
	this.getString = function(stringName) {
		if (typeof this.strings[stringName] != "undefined") {
			var string = this.strings[stringName];
			var args = [];
			var args1 = []; //something about vsprintf adds an extra element to args, so this is for the data-arguments section
			for (var i=1; i<arguments.length; i++) {
				args.push(arguments[i]);
				args1.push(arguments[i]);
			}
			var returnString = vsprintf(string, args);
		}
		else {
			var returnString = "[UNTRANSLATED]"+stringName+"[/UNTRANSLATED]";
			console.log("Untranslated string: %s", stringName);
		}
		
		//return '<span class="localizedString" data-string-name="'+stringName+'" data-arguments=\''+JSON.stringify(args1)+'\'>'+returnString+'</span>';
		//return '<span>'+returnString+'</span>';
		return returnString;
	}
	
	/**
	 * UI elements can use this to register callbacks to themselves to update their strings
	 * if the user changes the localization.
	 */
	this.registerLocalizationChangeCallback = function(callbackFunction) {
		this.registeredLocalizationChangeCallbacks.push(callbackFunction);
	}
	
	this.construct();
}
