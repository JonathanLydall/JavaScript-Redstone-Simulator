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

com.mordritch.mcSim.guiFullInput = function(gui) {
	this.gui = gui;

	this.inputEventBindings = {};
	this.keyBindingsMap = {};
	this.modKeysDown = []; //Used for live tracking of which modkeys are presently pressed

	this.suspended = false;
	this.scope = "main";

	this.capturingInputCombination = false; //Used for selecting shortcut keys, catches all and reports the result
	this.capturingInputCombination_modKeys = [];
	
	this.construct = function() {
		var t = this;

		$(window).bind('keydown', {t:this}, function(e) {e.data.t.onKeyDown(e);});
		//$(window).bind('mousedown', {t:this}, function(e) {e.data.t.onKeyDown(e);}); //Thanks to browser bugs, browsers will fire mousedown if user clicks on a scrollbar, but never mouseup! we are just going to have to bind click event's the modelviews instead

		$(window).bind('keyup', {t:this}, function(e) {e.data.t.onKeyUp(e);});
		$(window).bind('mouseup', {t:this}, function(e) {e.data.t.onKeyUp(e);});
		
		$(window).bind('focus', {t:this}, function(e) {e.data.t.onFocus(e);});
		$(window).bind('blur', {t:this}, function(e) {e.data.t.onBlur(e);});

		$(window).bind('mousemove', {t:this}, function(e) {e.data.t.onMouseMove(e)});
		$(window).bind('mousewheel', {t: this}, function(e, delta) {e.data.t.onMouseWheel(e, delta);}); //Requires the mousewheel JQuery extension: http://plugins.jquery.com/project/mousewheel
		
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setCloseButtonText('Cancel');
		this.modal.bind('show', function() {t.onModalShow()});
		this.modal.addButton('Apply', 'applyButton', function() {t.applyButton()});
		
		$('body').append('<div id="inputSelectOverlay"></div>');
		$('#inputSelectOverlay').hide();
		$('#inputSelectOverlay').bind('mousedown', {t:this}, function(e) {e.data.t.onKeyDown(e);}) //Since it's not bound above
				
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		
	}
	
	/**
	 * Returns a string showing the friendly keybinding key combo, used in places like tooltips  
	 */
	this.getBindingKeyNames = function(scope, eventName) {
		returnArray = [];
		if (this.inputEventBindings[scope][eventName].binding1 != null) {
			returnArray.push(this.getKeyNames(this.inputEventBindings[scope][eventName].binding1, "+"));
		}
		if (this.inputEventBindings[scope][eventName].binding2 != null) {
			returnArray.push(this.getKeyNames(this.inputEventBindings[scope][eventName].binding2, "+"));
		}
		
		return returnArray.join(", ");
	}
	
	/**
	 * Called as the modal is shown
	 */
	this.onModalShow = function() {
		//Below two lines are used to track the "desired" updates to keybindings, since changes aren't applied immediately and can be cancelled.
		this.keyBindingsMap_new = JSON.parse(JSON.stringify(this.keyBindingsMap));
		this.inputEventBindings_toUpdate = {};
		
		this.modal.setFeedbackText('');

		var categories = [];
		var keyBindings = {};
		for (var scope in this.inputEventBindings) {
			for (var eventName in this.inputEventBindings[scope]) {
				var obj = this.inputEventBindings[scope][eventName];
				if (typeof keyBindings[obj.category] == 'undefined') {
					keyBindings[obj.category] = [];
					
					categories.push({
						category: obj.category,
						translatedName: this.gui.localization.getString('shortcuts.category.'+obj.category)
					});
				}
				
				keyBindings[obj.category].push(
					{
						scope: scope,
						eventName: eventName,
						description: this.gui.localization.getString(obj.description)
					}
				);
			}
		}
		
		categories.sort(function(a,b){
			if (a.translatedName < b.translatedName)
				return -1;
			if (a.translatedName > b.translatedName)
				return 1;
			return 0;
		});
		
		for (var i in keyBindings) {
			keyBindings[i].sort(function(a,b){
				if (a.description < b.description)
					return -1;
				if (a.description > b.description)
					return 1;
				return 0;
			});
		}
		
		
		var selectionModalHtml = 
			'<table class="keyBindings">' +
				'<colgroup>' +
				'<col class="col1" />' +
				'<col class="col2" />' +
				'<col class="col3" />' +
			'</colgroup>' +
		'';
		
		for (var i in categories) {
			selectionModalHtml += '<tr><td colspan="3"><b>'+categories[i].translatedName+'</b></td></tr>';
			var keyBindingCategory = keyBindings[categories[i].category]; 
			
			for(var j in keyBindingCategory) {
				var keyBinding = keyBindingCategory[j];
				var binding1 = this.getKeyNames(this.inputEventBindings[keyBinding.scope][keyBinding.eventName].binding1, "+");
				var binding2 = this.getKeyNames(this.inputEventBindings[keyBinding.scope][keyBinding.eventName].binding2, "+");
				
				var domId = this.modal.domId+'_'+keyBinding.scope+'_'+keyBinding.eventName+'_binding';
				
				selectionModalHtml += 
				'<tr>' +
					'<td>'+ keyBinding.description +'</td>'+
					'<td><span data-binding="binding1" data-scope="' + keyBinding.scope + '" data-keyevent="' + keyBinding.eventName + '" id="' + domId + '1" class="button shortcut1 choosekeybinding">' + binding1 + '</span></td>' +
					'<td><span data-binding="binding2" data-scope="' + keyBinding.scope + '" data-keyevent="' + keyBinding.eventName + '" id="' + domId + '2" class="button shortcut2 choosekeybinding">' + binding2 + '</span></td>' +
				'</tr>';
			}
		}
		
		//temp, just to make it bigg enough to scroll while testing visual look
		for (var i=0; i<0; i++) {
				selectionModalHtml += 
				'<tr>' +
					'<td>'+ keyBinding.description +'</td>'+
					'<td><span class="button shortcut1">'+binding1+'</span></td>' +
					'<td><span class="button shortcut2">'+binding2+'</span></td>' +
				'</tr>';
		}
		selectionModalHtml += '</table>';
		this.modal.setContent(selectionModalHtml);
		$('.choosekeybinding').bind('click',{t:this},function(e) {
			e.data.t.chooseInputCombo(e.target.id);
		});
	}
	
	this.toggleConfigVisible = function() {
		this.modal.toggleShown();
	}
	
	/**
	 * Called whenever the browser window/tab becomes active
	 */
	this.onFocus = function() {
		
	}
	
	/**
	 * Called whenever the browser window/tab becomes the inactive/background window/tab
	 */
	this.onBlur = function() {
		this.modKeysDown = [];
		
		for (var i in this.modKeysDown) {
			//TODO: Trigger keyupevent for each modkey which was down (perhaps). 
		}
	}
	
	this.ignoreKey = function(keyCode) {
		return (
			keyCode == 93 || //Windows Context Menu Key 
			keyCode == 92 || //Windows Key
		false);
	}
	
	this.isModKey = function(keyCode) {
		return (
			keyCode == 1 || //mouse1 
			keyCode == 2 || //mouse2
			keyCode == 3 || //mouse3
			keyCode == 16 || //shift
			keyCode == 17 || //ctrl
			keyCode == 18 || //alt
			keyCode == 32 || //space
		false);
	}
	
	this.onKeyUp = function(e) {
		if(this.isModKey(e.which)) {
			for (var i in this.modKeysDown) {
				if (this.modKeysDown[i] == e.which) {
					this.modKeysDown.splice(i,1);
					break;
				}
			}

			if (this.capturingInputCombination && this.modKeysDown.length == 0) {
				this.capturingInputCombination_modKeys.sort();
				this.captureDone(this.capturingInputCombination_modKeys.join('-'));
			}
		}
		
		if (e.type == "mouseup")
		{
			var keysDown = [];
			keysDown.push(e.which);
			for (var i in this.modKeysDown) {
				keysDown.push(this.modKeysDown[i]);
			}
			keysDown.sort();
			this.inputEvent(keysDown.join('-'), e);
		}
	}
	
	this.onMouseMove = function(e) {
		var keysDown = [];
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}
		keysDown.sort();
		this.inputEvent(keysDown.join('-'), e);
	}
	
	this.onKeyDown = function(e) {
		if (this.ignoreKey(e.which)) return;
		if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA') return; //Prevent capturing input sent to input fields. //TODO: Add other node types here perhaps? or maybe it's fine, we can leave it covered by suspending input
		
		var keysDown = [];
		if(this.isModKey(e.which)) {
			var keyFound = false;
			for (var i in this.modKeysDown) {
				if (this.modKeysDown[i] == e.which) {
					keyFound = true;
				}
			}
			if (!keyFound) {
				this.modKeysDown.push(e.which);
			}
		}
		else {
			keysDown.push(e.which);
		}
		
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}
		keysDown.sort();

		this.inputEvent(keysDown.join('-'), e);
	}
	
	this.inputEvent = function(keys, e) {
		var isForMouseUp = e.type == "mouseup";

		//Always prevent default for certain keys:
		if (
			e.which == 32 //Spacebar, shortcut key in some browsers for page down
		) {
			e.preventDefault();
		}
		
		if (
			!this.capturingInputCombination &&
			!this.suspended &&
			(
				typeof this.keyBindingsMap[this.scope][keys] != 'undefined' ||
				typeof this.keyBindingsMap["main"][keys] != 'undefined'
			) &&
			(
				!isForMouseUp ||
				(isForMouseUp && this.keysAreBoundToMouseUpEvent(keys, e))
			)
		) {
			e.preventDefault();
			this.doCallbackForKeyCombo(keys, e);
		}
		else if (this.capturingInputCombination && e.type != 'mousemove') {
			e.preventDefault();
			
			if (
				this.isModKey(e.which) &&
				this.capturingInputCombination_modKeys.indexOf(e.which) < 0
			) {
				this.capturingInputCombination_modKeys.push(e.which);
				return;
			}
			
			if (!this.isModKey(e.which)) {
				this.captureDone(keys);
			}
		}
	}
	
	this.keysAreBoundToMouseUpEvent = function(keys, e)
	{
		var scopeBinding = this.keyBindingsMap[this.scope][keys];
		var mainBinding = this.keyBindingsMap["main"][keys];
		
		if (typeof inputEventName == 'undefined' && typeof scopeBinding == 'undefined')
		{
			return false;
		} 

		var inputEventName = typeof scopeBinding != 'undefined' ? scopeBinding : mainBinding;
		var inputEventBinding = this.inputEventBindings[this.scope][inputEventName];
		return inputEventBinding.alsoFireOnMouseUp;
	}
	
	/**
	 * When there is a matching keybinding, this calls back the bound function
	 */
	this.doCallbackForKeyCombo = function(keys, e, isForMouseUp) {
		if (
			typeof this.keyBindingsMap[this.scope][keys] != 'undefined'
		) {
			var scope = this.scope;
		}
		
		if (
			typeof this.keyBindingsMap[this.scope][keys] == 'undefined' &&
			typeof this.keyBindingsMap["main"][keys] != 'undefined'
		) {
			var scope = "main";
		}

		var inputEventName = this.keyBindingsMap[scope][keys];
		var inputEventBinding = this.inputEventBindings[scope][inputEventName];
		var callBackData = inputEventBinding.data;
		
		if (
			e.type == 'mousemove' &&
			inputEventBinding.bindToMouseMove
		) {
			inputEventBinding.callbackFunction_mouseMove(e, callBackData);
		}
		else {
			inputEventBinding.callbackFunction(e, callBackData);
			if (inputEventBinding.keyUpModifierKeysOnTrigger)
				this.modKeysDown = [];
		}
	}
	
	this.chooseInputCombo = function(domId) {
		$('#inputSelectOverlay').show();
		$(window).bind('contextmenu.inputSelection', function(e) {e.preventDefault()});

		this.choosingEventFor = {
			domId: domId,
			scope: $('#'+domId).data('scope'),
			keyEvent: $('#'+domId).data('keyevent'),
			binding: $('#'+domId).data('binding')
		};
		
		this.modal.setFeedbackText(this.gui.localization.getString("guiFull.input.choose"));
		this.capturingInputCombination_modKeys = [];
		this.capturingInputCombination = true;
	}
	
	this.captureDone = function(keys) {
		if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope] == 'undefined')
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope] = {};
		if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent] == 'undefined')
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent] = {
				binding1: this.inputEventBindings[this.choosingEventFor.scope][this.choosingEventFor.keyEvent].binding1,
				binding2: this.inputEventBindings[this.choosingEventFor.scope][this.choosingEventFor.keyEvent].binding2
			}

		this.capturingInputCombination = false;
		$('#inputSelectOverlay').hide();
		
		window.setTimeout(
			function() {
				//If we unbind it immediately, then it still fires.
				$(window).unbind('contextmenu.inputSelection');
			},
			200
		);
		
		//did we just set it for the same key?
		if (
			this.keyBindingsMap_new[this.choosingEventFor.scope][keys] == this.choosingEventFor.keyEvent &&
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding] == keys
		) {
			this.modal.setFeedbackText("");
			return;
		}
		
		//See if there was already another key bound:
		if (
			typeof this.keyBindingsMap_new[this.choosingEventFor.scope][keys] != 'undefined'
		) {
			var conflictingKeyEvent = this.keyBindingsMap_new[this.choosingEventFor.scope][keys];
			if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope] == 'undefined')
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope] = {};
			if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent] == 'undefined')
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent] = {
					binding1: this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].binding1,
					binding2: this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].binding2
				};
			
			var overRiddenEventDescription = this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].description;
			var overRiddenKeyName = this.gui.localization.getString(overRiddenEventDescription);
			
			//which of the two bindings got hit?
			if (this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding1 == keys) {
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding1 = null;
				$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.keyBindingsMap_new[this.choosingEventFor.scope][keys]+'_binding1').html(this.getKeyNames(null));
				var bindingNumber = 1;
			}
			else {
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding2 = null;
				$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.keyBindingsMap_new[this.choosingEventFor.scope][keys]+'_binding2').html(this.getKeyNames(null));
				var bindingNumber = 2;
			}

			this.modal.setFeedbackText('<span class="errorText">'+this.gui.localization.getString("guiFull.input.nowunbound", overRiddenKeyName, bindingNumber)+'</span>');
			
		}
		else {
			this.modal.setFeedbackText("");
		}
		
		//delete the old keybinding referrence:
		var currentKey = this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding];
		delete this.keyBindingsMap_new[this.choosingEventFor.scope][currentKey];
		
		//Set the new referrence
		$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.choosingEventFor.keyEvent+'_'+this.choosingEventFor.binding).html(this.getKeyNames(keys, "+"));
		this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding] = keys;
		this.keyBindingsMap_new[this.choosingEventFor.scope][keys] = this.choosingEventFor.keyEvent;
	}

	/**
	 * Called when the modal's apply button is clicked
	 */
	this.applyButton = function() {
		this.keyBindingsMap = this.keyBindingsMap_new;
		for (var scope in this.inputEventBindings_toUpdate) {
			for (var keyEvent in this.inputEventBindings_toUpdate[scope]) {
				this.inputEventBindings[scope][keyEvent].binding1 = this.inputEventBindings_toUpdate[scope][keyEvent].binding1; 
				this.inputEventBindings[scope][keyEvent].binding2 = this.inputEventBindings_toUpdate[scope][keyEvent].binding2; 
			}
		}
		
		this.gui.userSettings.bindings = this.getSaveableBindings();
		this.gui.userManager.saveUserSettings();
		this.modal.hide();
	}
	
	this.onKeyPress = function(e, type) {

	}
	
	this.getKeyNames = function(keys, seperator) {
		if (keys == null) return this.gui.localization.getString('keynames.unbound');
		
		var keyNames = [];
		for (var i in keys.split('-')) {
			keyNames.push(this.getKeyName(keys.split('-')[i]));
		}
		
		return keyNames.join(seperator);
	}
	
	this.getKeyName = function(keyCode) {
		var keyCodeNames = {
			8: "keynames.8",
			9: "keynames.9",
			12: 'keynames.12',
			13: "keynames.13",
			16: "keynames.16",
			17: "keynames.17",
			18: "keynames.18",
			20: 'keynames.20',
			19: 'keynames.19',
			32: "keynames.32",
			33: 'keynames.33',
			34: 'keynames.34',
			35: 'keynames.35',
			36: 'keynames.36',
			37: 'keynames.37',
			38: 'keynames.38',
			39: 'keynames.39',
			40: 'keynames.40',
			45: 'keynames.45',
			46: 'keynames.46',
			96: 'keynames.96',
			97: 'keynames.97',
			98: 'keynames.98',
			99: 'keynames.99',
			100: 'keynames.100',
			101: 'keynames.101',
			102: 'keynames.102',
			103: 'keynames.103',
			104: 'keynames.104',
			105: 'keynames.105',
			106: 'keynames.106',
			107: 'keynames.107',
			109: 'keynames.109',
			110: 'keynames.110',
			111: 'keynames.111',
			112: 'keynames.112',
			113: 'keynames.113',
			114: 'keynames.114',
			115: 'keynames.115',
			116: 'keynames.116',
			117: 'keynames.117',
			118: 'keynames.118',
			119: 'keynames.119',
			120: 'keynames.120',
			121: 'keynames.121',
			122: 'keynames.122',
			123: 'keynames.123',
			144: 'keynames.144',
			145: 'keynames.145',
			186: 'keynames.186',
			187: 'keynames.187',
			188: 'keynames.188',
			189: 'keynames.189',
			190: 'keynames.190',
			191: 'keynames.191',
			192: 'keynames.192',
			220: 'keynames.220',
			219: "keynames.219",
			222: 'keynames.222',
			221: "keynames.221",
			1: "keynames.1",
			2: "keynames.2",
			3: "keynames.3",
			mousewheelup: "keynames.mousewheelup",
			mousewheeldown: "keynames.mousewheeldown",
			mousemove: "keynames.mousemove"
		};


		if (typeof keyCodeNames[keyCode] != 'undefined') {
			return this.gui.localization.getString(keyCodeNames[keyCode]);
		}
		else if (keyCode == 0) {
			return keyCode;
		}
		else {
			return String.fromCharCode(keyCode);
		}
	}

	this.onMouseWheel = function(e, delta) {
		var keysDown = [];
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}

		if (delta > 0) {
			keysDown.push("mousewheelup");
		}
		else {
			keysDown.push("mousewheeldown");
		}

		keysDown.sort();

		this.inputEvent(keysDown.join('-'), e);
	}
	
	/**
	 * Tools use this register their events which can be bound to input
	 * 
	 * @param	{String}	scope						Scope can cause precedence to input events, allowing default key behaviour to be overridden
	 * @param	{String}	category					Give the keybinding a category, making the keyselection page easier to break up
	 * @param	{String}	savedKeyName				This is the mapping used to find the saved keymapping from user options
	 * @param	{String}	description					String name of the translation for a description of what the keybinding is for
	 * @param	{Object}	data						Extra data which can be included arbitrarily and passed to the callback
	 * @param	{Boolean}	bindToMouseMove				Also bind this event to fire if the mouse is moved along with the keycombo
	 * @param	{Function}	callbackFunction_mouseMove	Callback function to execute when the mouse is moved along with the keycombo
	 * @param	{Function}	callbackFunction			The function called when an input event match is found 
	 * @param	{Function}	keyUpModifierKeysOnTrigger	If true, will automatically set all modifier keys as unpressed. This is
	 * 								 					useful for bindings which show prompts as the "keyUp" event could land up
	 * 													not being fired.
	 * @param	{Boolean}	alsoFireOnMouseUp				When set, the event will also trigger on key up, instead of just on keydown.
	 */
	this.bindInputEvent = function(parameters) {
		//console.log("guiFullInput.bindInputEvent(): ", parameters.savedKeyName);
		//console.log(parameters);
		//console.log(" ");
		
		var defaultParamaters = {
			scope: 'main',
			data: {},
			mouseMoveEvent: false,
			keyUpModifierKeysOnTrigger: false,
			alsoFireOnMouseUp: false
		}
		
		for (var i in defaultParamaters) {
			if (typeof parameters[i] == 'undefined') parameters[i] = defaultParamaters[i];
		}
		
		var scope 						= parameters.scope;
		var category 					= parameters.category;
		var savedKeyName 				= parameters.savedKeyName;
		var description 				= parameters.description;
		var data 						= parameters.data;
		var callbackFunction 			= parameters.callbackFunction;
		var bindToMouseMove 			= parameters.bindToMouseMove;
		var callbackFunction_mouseMove 	= parameters.callbackFunction_mouseMove;
		var keyUpModifierKeysOnTrigger 	= parameters.keyUpModifierKeysOnTrigger;
		var alsoFireOnMouseUp			= parameters.alsoFireOnMouseUp;
		
		
		
		if (typeof this.inputEventBindings[scope] == 'undefined') this.inputEventBindings[scope] = {};
		if (typeof this.keyBindingsMap[scope] == 'undefined') this.keyBindingsMap[scope] = {};
		
		if (typeof this.inputEventBindings[scope][savedKeyName] != 'undefined') {
			throw new Error('input.bindInputEvent: Attempted binding of duplicate savedKeyName and scope combination.');
		}
		this.inputEventBindings[scope][savedKeyName] = {
			'callbackFunction': callbackFunction,
			'description': description,
			'category': category,
			'data': data,
			'binding1': null,
			'binding2': null,
			'userLoaded': false,
			'bindToMouseMove': bindToMouseMove,
			'callbackFunction_mouseMove': callbackFunction_mouseMove,
			'keyUpModifierKeysOnTrigger': keyUpModifierKeysOnTrigger,
			'alsoFireOnMouseUp': alsoFireOnMouseUp
		};
		
		var bindings_userLoaded = this.gui.userSettings.bindings;
		if (typeof bindings_userLoaded == 'undefined') bindings_userLoaded = {};	
		var bindings_default = this.gui.defaultSettings.bindings;
		if (typeof bindings_default == 'undefined') bindings_default = {};
		var binding1 = null;
		var binding2 = null;
		var userLoaded = false;

		if (typeof bindings_userLoaded[savedKeyName] != 'undefined') {
			//If it's conflicting with an existing keybinding which was user set, then ignore.
			if (
				bindings_userLoaded[savedKeyName].binding1 != null && (
					typeof this.keyBindingsMap[scope][binding1] == 'undefined' ||
					!this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].userLoaded
				)
			) binding1 = bindings_userLoaded[savedKeyName].binding1;
			
			if (
				bindings_userLoaded[savedKeyName].binding2 != null && (
					typeof this.keyBindingsMap[scope][binding2] == 'undefined' ||
					!this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].userLoaded
				)
			) binding2 = bindings_userLoaded[savedKeyName].binding2;

			
			userLoaded = true;
		}
		else if (typeof bindings_default[savedKeyName] != 'undefined') {
			//As this is a default (fallback) binding, only apply if not already conflicting.
			if (typeof this.keyBindingsMap[scope][binding1] == 'undefined') binding1 = bindings_default[savedKeyName].binding1;
			if (typeof this.keyBindingsMap[scope][binding2] == 'undefined') binding2 = bindings_default[savedKeyName].binding2; 
		}
		this.inputEventBindings[scope][savedKeyName].userLoaded = userLoaded;

		if (binding1 != null) {
			if (typeof this.keyBindingsMap[scope][binding1] != 'undefined') {
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding1 == binding1) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding1 = null;
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding2 == binding1) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding2 = null;
			}

			this.keyBindingsMap[scope][binding1] = savedKeyName;
			this.inputEventBindings[scope][savedKeyName].binding1 = binding1;
		}
		
		if (binding2 != null) {
			if (typeof this.keyBindingsMap[scope][binding2] != 'undefined') {
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding1 == binding2) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding1 = null;
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding2 == binding2) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding2 = null;
			}

			this.keyBindingsMap[scope][binding2] = savedKeyName;
			this.inputEventBindings[scope][savedKeyName].binding2 = binding2;
		}
	}
	
	/**
	 * Used to apply user's saved keybindings, destroys any current custom keybindings
	 */
	this.onUserSettingsLoad = function() {
		var bindings_userLoaded = this.gui.userSettings.bindings;
		if (typeof bindings_userLoaded == 'undefined') bindings_userLoaded = {};
		var bindings_default = this.gui.defaultSettings.bindings;
		if (typeof bindings_default == 'undefined') bindings_default = {};

		this.keyBindingsMap = {};
		
		for (var scope in this.inputEventBindings) {
			if (typeof this.keyBindingsMap[scope] == 'undefined') this.keyBindingsMap[scope] = {};
			for (var savedKeyName in this.inputEventBindings[scope]) {
				this.inputEventBindings[scope][savedKeyName].userLoaded = false;
				this.inputEventBindings[scope][savedKeyName].binding1 = null;
				this.inputEventBindings[scope][savedKeyName].binding2 = null;
				
				if (
					typeof bindings_userLoaded[savedKeyName] != 'undefined' &&
					bindings_userLoaded[savedKeyName].binding1 != null &&
					typeof this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding1] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding1 = bindings_userLoaded[savedKeyName].binding1;
					this.inputEventBindings[scope][savedKeyName].userLoaded = true;
					this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding1] = savedKeyName;
				}

				if (
					typeof bindings_userLoaded[savedKeyName] != 'undefined' &&
					bindings_userLoaded[savedKeyName].binding2 != null &&
					typeof this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding2] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding2 = bindings_userLoaded[savedKeyName].binding2;
					this.inputEventBindings[scope][savedKeyName].userLoaded = true;
					this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding2] = savedKeyName;
				}
			}
		}
		
		//Second time round is filling in any bindings with default, provided the defaults don't conflict
		for (var scope in this.inputEventBindings) {
			for (var savedKeyName in this.inputEventBindings[scope]) {
				if (
					typeof bindings_userLoaded[savedKeyName] == 'undefined' &&
					typeof bindings_default[savedKeyName] != 'undefined' &&
					bindings_default[savedKeyName].binding1 != null &&
					typeof this.keyBindingsMap[scope][bindings_default[savedKeyName].binding1] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding1 = bindings_default[savedKeyName].binding1;
					this.keyBindingsMap[scope][bindings_default[savedKeyName].binding1] = savedKeyName;
				}

				if (
					typeof bindings_userLoaded[savedKeyName] == 'undefined' &&
					typeof bindings_default[savedKeyName] != 'undefined' &&
					bindings_default[savedKeyName].binding2 != null &&
					typeof this.keyBindingsMap[scope][bindings_default[savedKeyName].binding2] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding2 = bindings_default[savedKeyName].binding1;
					this.keyBindingsMap[scope][bindings_default[savedKeyName].binding2] = savedKeyName;
				}
			}
		}
	}
	
	/**
	 * Returns an object which can be placed in the database of the server with a snapshot of the users keybindings.
	 * 
	 * @return	{Object}
	 */
	this.getSaveableBindings = function() {
		var returnObject = {};
		for (var scope in this.inputEventBindings) {
			for (var savedKeyName in this.inputEventBindings[scope]) {
				returnObject[savedKeyName] = {
					binding1: this.inputEventBindings[scope][savedKeyName].binding1,
					binding2: this.inputEventBindings[scope][savedKeyName].binding2
				}
			}
		}
		return returnObject;
	}
	
	
	/**
	 * Used to "choose" input combinations by the user, so they can assign shortcut keys
	 * 
	 * @param callbackFunction	{function}	function which is called when the user has selected a keystroke
	 */
	this.captureInputCombo = function(callbackFunction) {
		this.capturingInputCombination = true;
		this.inputCaptureCallbackFunction = callbackFunction;
	}

	/**
	 * Pauses shortcut key processing
	 * 
	 * For example, modal dialogues pause key strokes.
	 */
	this.suspend = function() {
		this.suspended = true;
	}
	
	/**
	 * Resumes shortcut key processing
	 */
	this.resume = function() {
		this.suspended = false;
	}
	
	this.construct();
}
