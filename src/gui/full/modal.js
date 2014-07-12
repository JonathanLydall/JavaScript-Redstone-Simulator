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

com.mordritch.mcSim.guiFullModal = function(gui, makeClosedButtonDefault) {
	makeClosedButtonDefault = (typeof makeClosedButtonDefault != "undefined") ? makeClosedButtonDefault : false;

	if ($("#modalBackground").length == 0) {
		$('body').append('<div id="modalBackground"></div>');
		$("#modalBackground").hide().disableSelection();
	}

	this.gui = gui;
	this.domId = 'domId_'+com.mordritch.mcSim.domIdCounter++;
	this.jqDomId = '#' + this.domId;
	this.localizer = gui.localization;
	this.eventBindings = {};
	this.isShowing = false;
	this.modalDomIdCounter = 0;
	this.domClass = "panel";
	this.defaultButton = "";
	this.loadingIcon = '<img src="images/loading1.gif" alt="">';
	
	this.construct = function() {

		var t = this;
		var html =
			'<div class="guiFullModal ' + this.domClass + '" id="'+this.domId+'" style="display: none;">' +
				'<div class="guiModal_innerContent"></div>' +
				'<span class="guiModal_Feedback"></span>' +
				'<span class="guiModal_Buttons"></span>' +
			'</div>' +
			'';
		$('body').append(html);
		
		
		this.addButton(this.localizer.getString('button.text.cancel'), 'guiModal_closeButton', function() {t.hide(); }, makeClosedButtonDefault);
	};
	
	/**
	 * Change the CSS class that is applied to the modal, for example, one style would make it a large modal, another could make it a much smaller modal.
	 * 'prompt' makes a small prompt box
	 * 'panel' makes it the general "options" type of modal, this is the default
	 *  
	 */
	this.setDomClass = function(domClass) {
		$(this.jqDomId).removeClass(this.domClass);
		this.domClass = domClass;
		$(this.jqDomId).addClass(this.domClass);
	};
	
	this.setContent = function(html) {
		$(this.jqDomId+' .guiModal_innerContent').html(html);
	};
	
	this.setFeedbackText = function(html) {
		$(this.jqDomId+' .guiModal_Feedback').html(html);
	};
	
	this.setCloseButtonText = function(html) {
		$(this.jqDomId+' .guiModal_closeButton').html(html);
	};
	
	/**
	 * Adds an extra button to the bottom area of the modal, to the left of the cancel button
	 * 
	 * @param	{String}	label				The display label for the button
	 * @param	{String}	classAttribute		Optional additional class attribute for the button
	 * @param	{Function}	onActivateFunction	A function bound to when it's clicked on or has enter/space hit while focussed
	 * @param	{Function}	isDefault			Automatically recieves focus when shown
	 */
	this.addButton = function(options, classAttribute, onActivateFunction, isDefault) {
		//New method uses a jquery like method to recieve paramaters via objects, however, this is backwards compatiable too
		if (typeof options == "object") {
			var label = options.label;
			var classAttribute = options.classAttribute;
			var onActivateFunction = options.onActivateFunction;
			var isDefault = options.isDefault;
		}
		else {
			label = options;
		}
		
		var domId = 'modal_button_' + this.domId +'_'+ this.modalDomIdCounter++;
		var html = '<span id="' + domId + '" role="button" tabindex="0" class="button '+classAttribute+'">'+label+'</span>';
		if (isDefault) this.defaultButton = domId;
		$(this.jqDomId+' .guiModal_Buttons').prepend(html);
		$('#'+domId).bind('click keyup', function(e) {
			if ($(e.delegateTarget).hasClass('disabled')) return;
			
			if (
				(e.type == "keyup" && (e.which == 13 || e.which == 32)) ||
				(e.type == "click" && e.which == 1)
			) onActivateFunction();
		});
	};
	
	this.toggleShown = function() {
		if (this.isShowing) {
			this.hide();
		}
		else {
			this.show();
		}
	};
	
	this.show = function() {
		$('#modalBackground').show();
		if (this.isShowing) return; //already showing, return
		this.isShowing = true;
		$(this.jqDomId).css('display','block');
		$(document).bind('keyup.' + this.domId, {t: this}, function(e) {
			if (e.which == 27) { //27 "Escape" key on keyboard. 
				e.data.t.hide();
			}
		});
		
		if (this.defaultButton != "") $('#'+this.defaultButton).focus();
		
		this.gui.pauseBindings();
		this.triggerEvent('show');

		this.gui.ticker.pause();
	};
	
	this.hide = function() {
		$('#modalBackground').hide();
		if (!this.isShowing) return; //already hidden, return
		this.isShowing = false;
		$(this.jqDomId).css('display','none');
		$(document).unbind('keyup.' + this.domId);
		this.gui.resumeBindings();
		this.triggerEvent('hide');
		this.gui.ticker.resume();
	};
	
	/**
	 * Allows callback bindings
	 * 
	 * For example, a callback could be called when the modal is shown or hidden.
	 */
	this.bind = function(eventName, callbackFunction) {
		if (typeof this.eventBindings[eventName] == "undefined") {
			this.eventBindings[eventName] = [];
		}
		this.eventBindings[eventName].push(callbackFunction);
	};
	
	/**
	 * Used within the modal to trigger events so any bound callbacks are called.
	 */
	this.triggerEvent = function(eventName) {
		if (typeof this.eventBindings[eventName] != "undefined") {
			for (var i in this.eventBindings[eventName]) {
				this.eventBindings[eventName][i]();
			}
		}
	};
	
	this.disableControls = function() {
		$(this.jqDomId + ' .button').addClass("disabled");
		$(this.jqDomId + ' input').attr("disabled", "disabled");
		
	};
	
	this.startWaitingForServer = function(message) {
		this.disableControls();
		this.setFeedbackText('<img src="images/loading1.gif" alt=""> ' + message);
	};
	
	this.enableControls = function() {
		$(this.jqDomId + ' .button').removeClass("disabled");
		$(this.jqDomId + ' input').removeAttr("disabled", "disabled");
	};
	
	this.stopWaitingForServer = function() {
		this.enableControls();
		this.setFeedbackText('');
	}
	;
	this.construct();
};
