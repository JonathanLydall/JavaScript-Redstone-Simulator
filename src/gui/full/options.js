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

com.mordritch.mcSim.options = function(gui) {
	this.gui = gui;
	this.registeredOptions = {};
	
	this.construct = function() {
		var t = this;
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setCloseButtonText('Cancel');
		this.modal.addButton('Apply', 'applyButton', function() {t.applyButton()}); //TODO: localize "Apply" word here 
		
		
		this.gui.input.bindInputEvent({
			savedKeyName: 'showOptions',
			category: 'options',
			description: 'shortcuts.options.show',
			callbackFunction: function(e) {t.showOptionsScreen();}
		});
	}
	
	/**
	 * A convenient way to get an option's current value  
	 */
	this.getOption = function(category, name) {
		return currentValue = this.gui.userSettings.options[category][name];
	}

	/**
	 * When the apply button is pushed
	 */
	this.applyButton = function() {
		var callbacksNeeded = {};
		var isInputError = false;
		var updatedOptions = JSON.parse(JSON.stringify(this.gui.userSettings.options));
		for (var category in this.registeredOptions) {
			for (var name in this.registeredOptions[category]) {
				var currentValue = this.gui.userSettings.options[category][name];
				var newValue = this.getValue(category, name);
				var option = this.registeredOptions[category][name];
				if (this.checkForError(category, name)) {
					isInputError = true;
				}
				
				if (
					newValue != currentValue &&
					typeof option.callbackForOnChange != 'undefined'
				) {
					//value has changed, let's put it on the list to do callbacks which gets called if no error occurs
					callbacksNeeded[category+'_'+name+'_'+option.callbackScope] = option;
				}
				updatedOptions[category][name] = this.getValue(category, name);
			}
		}
		
		if (isInputError) {
			this.modal.setFeedbackText('<span class="errorText">'+this.gui.localization.getString('options.error.errorexists')+'</span>');
		}
		else {
			this.modal.setFeedbackText("");
			this.gui.userSettings.options = updatedOptions;
			for (var i in callbacksNeeded) {
				callbacksNeeded[i].callbackForOnChange();
				//console.log("Calling back for: %s", i);
			}
			this.gui.userManager.saveUserSettings();
			this.modal.hide();
		}
	}
	
	/**
	 * Reads the current value set by the user on the form based on the option name and category
	 * 
	 * Automatically handles for different data types
	 */
	this.getValue = function(category, name) {
		var id = '#options_'+category+'_'+name;
		var $targetElement = $(id);
		var option = this.registeredOptions[category][name];
		switch (option.type) {
			case "number":
				return parseFloat($targetElement.val());
			case "boolean":
				if ($targetElement.is(':checked'))
					return true;
				else
					return false;
		}		
	}
	
	/**
	 * Checks automically reads the DOM value and returns whether or not the current input is valid
	 * 
	 * Will also add an optionError class to text input's if they have invalid input, CSS can be used to make those boxes red or something
	 */
	this.checkForError = function(category, name) {
		var id = '#options_'+category+'_'+name;
		var $targetElement = $(id);
		var option = this.registeredOptions[category][name];
		switch (option.type) {
			case "number":
				var currentValue = parseFloat($targetElement.val());
				if (
					isNaN($targetElement.val()) ||
					currentValue > option.maxValue ||
					currentValue < option.minValue
				) {
					$targetElement.addClass("optionError");
					$targetElement.parent().parent().attr('data-errorText', this.gui.localization.getString("options.error.number", option.minValue, option.maxValue));
					return true;
				}
				else {
					$targetElement.removeClass("optionError");
					$targetElement.parent().parent().attr('data-errorText', "");
				}
				break;
		}
		return false;
	}
	
	/**
	 * Called anytime a table row is moused over, if there is an error it shows it
	 */
	this.showErrorDetails = function(e) {
		var target = $(e.delegateTarget).attr('data-errorText');
		
		if (
			typeof target  != 'undefined' &&
			target != ""
		) {
			//TODO: Implement a div which can pop up with the error details
			//console.log(target);
		}
	}
	
	/**
	 * 
	 * @param	name				A name which is unique within the category
	 * @param	type				So we know what kind of option change widget to draw, for example for a number or tickbox
	 * @param	callbackForOnChange	If the value of the option changes, either due to onload or just through the options screen,
	 * 								this callback can be called
	 * @param	callbackScope		If multiple options being changed would result in the same callback function, this scope is
	 * 								a way of grouping those together, unique within category only
	 * @param	category			A way to group kinds of options together, for example everythign which applies to modelviews or the ticker
	 * @param	defaultValue		If the value is unset, this will be its default
	 * @param	maxValue			If the value is a number or text, this is the maximum length or value
	 * @param	minValue			If the value is a number or text, this is the minimum length or value
	 */
	this.registerOption = function(parameters) {
		if (typeof this.gui.userSettings.options == 'undefined')
			this.gui.userSettings.options = {};
		if (typeof this.gui.userSettings.options[parameters.category] == 'undefined')
			this.gui.userSettings.options[parameters.category] = {};

		if (typeof this.registeredOptions[parameters.category] == 'undefined')
			this.registeredOptions[parameters.category] = {};
		if (typeof this.registeredOptions[parameters.category][parameters.name] != 'undefined')
			throw new Error("com.mordritch.mcSim.options.registerOption(): Tried to register conflicting option " + parameters.category + "." + parameters.category);
		
		this.registeredOptions[parameters.category][parameters.name] = parameters;
		if (typeof this.gui.userSettings.options[parameters.category][parameters.name] == 'undefined') {
			this.gui.userSettings.options[parameters.category][parameters.name] = parameters.defaultValue;
		}
	}
	
	/**
	 * Populates and shows the options modal
	 */
	this.showOptionsScreen = function() {
		var content = 
			'<table class="optionsTable">' +
				'<colgroup>' +
					'<col class="col1">' +
					'<col class="col2">' +
					'<col class="col3">' +
				'</colgroup>' +
		'';
		
		for (var category in this.registeredOptions) {
			content +=
			'<tr>' +
				'<td colspan="3"><b>' +
					this.gui.localization.getString("options.category."+category) +
				'</b></td>' +
			'</tr>';

			for (var name in this.registeredOptions[category]) {
				var currentValue = this.gui.userSettings.options[category][name];
				var option = this.registeredOptions[category][name];
				var id = 'options_'+category+'_'+name;
				var label = this.gui.localization.getString("options."+category+"."+name);
				var defaultButton =
					'<span' +
						' class="setDefault button"' +
						' data-for-id="'+id+'"' +
						' data-name="'+name+'"' +
						' data-category="'+category+'"' +
					'>'
						+this.gui.localization.getString("options.settodefault") +
					'</span>';
				

				switch (option.type) {
					case "boolean":
						if (currentValue) {
							var checked = ' checked="checked"';
						}
						else {
							var checked= '';
						}
						content +=
						'<tr>' +
							'<td colspan="2">' +
								'<label><input type="checkbox" id="'+id+'"'+checked+'/>'+label+'</label>' +
							'</td>' +
							'<td>' +
								defaultButton +
							'</td>' +
						'</tr>';
						break;
					case "text":
						break;
					case "number":
						content +=
						'<tr>' +
							'<td>' +
								label +
							'</td>' +
							'<td>' +
								'<input class="numberInput" type="text" id="'+id+'" value="'+currentValue+'" />' +
								'<span class="minusButton button" data-name="'+name+'" data-category="'+category+'" data-for-id="'+id+'">-</span>' +
								'<span class="plusButton button" data-name="'+name+'" data-category="'+category+'" data-for-id="'+id+'">+</span>' +
							'</td>' +
							'<td>' +
								defaultButton +
							'</td>' +
						'</tr>';
						break;
				}
			}
		}

		content +=
			'</table>';

		this.modal.setContent(content);
		this.modal.show();
		
		var t = this;
		$('.optionsTable .plusButton').bind('click', function(e) {t.plusMinusButtonsClick(e, "plus");});
		$('.optionsTable .minusButton').bind('click', function(e) {t.plusMinusButtonsClick(e, "minus");});
		$('.optionsTable .setDefault').bind('click', function(e) {t.defaultButton(e);});

		$('.optionsTable .button').disableSelection();
		$('.optionsTable tr').bind('mouseover', function(e) {t.showErrorDetails(e)});
		$('.optionsTable .numberInput').bind('change', function(e) {t.onChangeEvent(e)});
	}
	
	/**
	 * Called any time an input box is changed, can check the input live
	 * 
	 * Note that browsers don't call this event as you type, but only as you lose focus
	 */
	this.onChangeEvent = function(e) {
		var arr = e.delegateTarget.id.split('_');
		this.checkForError(arr[1], arr[2]);
	}
	
	/**
	 * Number inputs have +/- buttons, this is called each time they are pushed
	 */
	this.plusMinusButtonsClick = function(e, buttonPushed) {
		var data = $(e.target).data();
		var $targetElement = $('#'+data.forId);
		var currentValue = parseFloat($targetElement.val());
		var option = this.registeredOptions[data.category][data.name];
		
		if (typeof option.changeIncrement == 'undefined') option.changeIncrement = 1;

		if (buttonPushed == "plus") {
			var newValue = Math.round((currentValue + option.changeIncrement)*10)/10
		}
		else {
			var newValue = Math.round((currentValue - option.changeIncrement)*10)/10
		}
		
		if (
			newValue <= option.maxValue &&
			newValue >= option.minValue
		) {
			$targetElement.val(newValue);
		}
		this.checkForError(data.category, data.name);
	}
	
	/**
	 * Each row has a "Default" button, this is called when that's pushed and sets the option to its default value
	 */
	this.defaultButton = function(e) {
		var data = $(e.target).data();
		var $targetElement = $('#'+data.forId);
		var option = this.registeredOptions[data.category][data.name];
		
		switch(option.type) {
			case "number":
				$targetElement.val(option.defaultValue);
				this.checkForError(data.category, data.name);
				break;
			case "boolean":
				$targetElement.attr('checked', true);
				break;
		}
	}
	
	/**
	 * The callback function which is called if say the user logs in.
	 */
	this.onUserSettingsLoad = function() {
		var callbacks = {};
		for (var category in this.registeredOptions) {
			for (var name in this.registeredOptions[category]) {
				if (typeof this.registeredOptions[category][name].callbackForOnChange != 'undefined') {
					if (typeof callbacks[category] == 'undefined') callbacks[category] = {}; 
					callbacks[category][callbackScope] = this.registeredOptions[category][name].callbackForOnChange; 
				}
			}
		}
		
		for (var category in callbacks) {
			for (var callbackScope in callbacks[category]) {
				callbacks[category][callbackScope]();
			}
		}
	}
	
	this.construct();
}
