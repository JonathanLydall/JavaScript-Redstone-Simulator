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

com.mordritch.mcSim.guiFull_ticker = function(gui) {
	this.gui = gui;
	this.L10n = gui.L10n;
	var wasRunning;
	
	this.construct = function() {
		for (var domId in this.gui.tickerDomIds) {
			this[domId] = this.gui.tickerDomIds[domId];
		}

		this.registerOptions();
		this.registerEventBindings();
		this.registerInputBindings();
		this.tickCounter = 0;
		this.tickForRemaining = 0;
		this.tickingForInProgress = false;
	}
	
	this.updateButtonStatus = function() {
		var ticker = this.gui.mcSim.updateTicker;
		this.onEventStopOrStart(ticker.isRunning);
	}
	
	/**
	 * Records whether or not the ticker was running and stops it 
	 */
	this.pause = function() {
		var ticker = this.gui.mcSim.updateTicker;
		wasRunning = ticker.isRunning;
		this.stop();
	}
	
	/**
	 * Based on the state recorded by this.pause(), will start it running again if it was running before 
	 */
	this.resume = function() {
		if (wasRunning) {
			this.start();
		}
	}
	
	this.registerInputBindings = function() {
		var t = this;
		var input = this.gui.input;
		var ticker = this.gui.mcSim.updateTicker;


		input.bindInputEvent({
			savedKeyName: 'ticker_toggleRunning',
			category: 'ticker',
			description: 'shortcuts.ticker.togglerunning',
			callbackFunction: function(e) {ticker.toggleRunning();}
		});

		input.bindInputEvent({
			savedKeyName: 'ticker_tickOnce',
			category: 'ticker',
			description: 'shortcuts.ticker.tickonce',
			callbackFunction: function(e) {ticker.tickOnce();}
		});

		input.bindInputEvent({
			savedKeyName: 'ticker_tickFor',
			category: 'ticker',
			description: 'shortcuts.ticker.tickfor',
			callbackFunction: function(e) {t.tickFor();}
		});
	}
	
	this.registerEventBindings = function() {
		var t = this;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.bind("stopRunning", function() {
			t.onEventStopOrStart(false);
		});
		
		ticker.bind("startRunning", function() {
			t.onEventStopOrStart(true);
		});

		ticker.bind("onTickFinished", function() {
			t.onEventTickFinished();
		});
	}
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options;
		options.registerOption({
			type: 'number',
			name: 'targetTps',
			category: 'simulator',
			defaultValue: 20,
			changeIncrement: 1, 
			minValue: 0,
			maxValue: 100,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'tickOnceIncrement',
			category: 'simulator',
			defaultValue: 1,
			changeIncrement: 1, 
			minValue: 1,
			maxValue: 20,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'tickFor',
			category: 'simulator',
			defaultValue: 100,
			changeIncrement: 10, 
			minValue: 1,
			maxValue: 10000,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		this.onOptionsChange();
	}
	
	this.onOptionsChange = function() {
		var options = this.gui.userSettings.options.simulator;
		var ticker = this.gui.mcSim.updateTicker;
		
		ticker.targetTps = this.gui.getOption("simulator", "targetTps");
		ticker.tickOnceIncrement = this.gui.getOption("simulator", "tickOnceIncrement");
		$("#" + this.tickForTextboxId).val(this.gui.getOption("simulator", "tickFor"));
	}
	
	this.start = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.startRunning();
		this.setActiveButton(this.runButtonClass);
	}
	
	this.stop = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.stopRunning();
		this.setActiveButton(this.stopButtonClass);
	}
	
	this.step = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		this.setActiveButton(this.stepButtonClass);
		ticker.tickOnce();
		this.setActiveButton(this.stopButtonClass);
	}
	
	this.tickFor = function() {
		$tickFor = $("#" + this.tickForTextboxId);
		tickForValue = $tickFor.val();
		
		if (
			parseInt(tickForValue, 10) == tickForValue && //isInt
			tickForValue > 0
		) {
			$tickFor.removeClass("invalidBackgroundColor");
			this.setActiveButton(this.tickForButtonClass);
			this.tickingForInProgress = true;
			this.tickForRemaining = tickForValue;
			var ticker = this.gui.mcSim.updateTicker;
			ticker.startRunning();
		}
		else {
			$tickFor.addClass("invalidBackgroundColor");
		}
	}
	
	this.resetTickCounter = function() {
		this.tickCounter = 0;
		this.updateTickCounter();
	}
	
	this.onEventStopOrStart = function(isNowRunning) {
		//console.log("com.mordritch.mcSim.guiFull_ticker.onEventStopOrStart(): isNowRunning = %s", isNowRunning);
		if (isNowRunning) {
			if (this.tickingForInProgress) {
				this.setActiveButton(this.tickForButtonClass);
			}
			else {
				this.setActiveButton(this.runButtonClass);
			}
		}
		else {
			this.setActiveButton(this.stopButtonClass);
		}
	}
	
	this.setActiveButton = function(buttonClassName) {
		$("." + this.runButtonClass).removeClass("topToolbarSelected");
		$("." + this.runButtonClass).addClass("topToolbarUnselected");

		$("." + this.stopButtonClass).removeClass("topToolbarSelected");
		$("." + this.stopButtonClass).addClass("topToolbarUnselected");

		$("." + this.stepButtonClass).removeClass("topToolbarSelected");
		$("." + this.stepButtonClass).addClass("topToolbarUnselected");
		
		$("." + this.tickForButtonClass).removeClass("topToolbarSelected");
		$("." + this.tickForButtonClass).addClass("topToolbarUnselected");
		
		$("." + buttonClassName).removeClass("topToolbarUnselected");
		$("." + buttonClassName).addClass("topToolbarSelected");
	}
	
	this.onEventTickFinished = function() {
		this.tickCounter++;
		this.gui.modelviews.flushMarkedBlocks(); //TODO: Probably better to move it into the modelviews area
		if (this.tickingForInProgress) {
			this.tickForRemaining--;
			if (this.tickForRemaining == 0) {
				this.tickForInProgress = false;
				this.stop();
			this.setActiveButton(this.stopButtonClass);
			}
		}
		this.updateTickCounter();
	}
	
	this.updateTickCounter = function() {
		var easterEggText = (this.tickCounter > 9000) ? " (IT'S OVER 9000!)" : "";
		
		if (this.tickingForInProgress) {
			$("#" + this.tickCounterId).text(this.tickCounter + ' (' + this.tickForRemaining + ' ' + this.L10n.getString("ticker.tickForRemaining") + ')'+ easterEggText);
		}
		else {
			$("#" + this.tickCounterId).text(this.tickCounter + easterEggText);
		}
	}
	
	this.setTickerStepButtonClass = function(value) {
		this.step_domClass = value;
	}
	
	this.setTickerStopButtonClass = function(value) {
		this.stop_domClass = value;
	}
	
	this.setTickerRunButtonClass = function(value) {
		this.run_domClass = value;
	}
	
	this.setTickerTickForButtonClass = function(value) {
		this.tickFor_domClass = value;
	}
	
	this.setTickForTextboxId = function(value) {
		this.tickForTextbox_domId = value;
	}
	
	this.setTickCounterId = function(value) {
		this.tickCounter_domId = value;
	}
	
	this.construct();
}
