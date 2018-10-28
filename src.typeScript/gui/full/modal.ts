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

namespace com.mordritch.mcSim {
	export class guiFullModal {
		domId: string;
		jqDomId: string;
		localizer: localization;
		eventBindings: { [index: string]: Function[] } = {};
		isShowing: boolean = false;
		modalDomIdCounter: number = 0;
		domClass: string = "panel";
		defaultButton: string = "";
		loadingIcon: string = '<img src="images/loading1.gif" alt="">';
	
		constructor(
			private gui: gui,
			private makeClosedButtonDefault: boolean
		) {
			if ($("#modalBackground").length == 0) {
				$('body').append('<div id="modalBackground"></div>');
				$("#modalBackground").hide().disableSelection();
			}
		
			this.domId = 'domId_'+com.mordritch.mcSim.domIdCounter++;
			this.jqDomId = '#' + this.domId;
			this.localizer = gui.localization;

			var html =
				'<div class="guiFullModal ' + this.domClass + '" id="'+this.domId+'" style="display: none;">' +
					'<div class="guiModal_innerContent"></div>' +
					'<span class="guiModal_Feedback"></span>' +
					'<span class="guiModal_Buttons"></span>' +
				'</div>' +
				'';
			$('body').append(html);
		
			this.addButton(this.localizer.getString('button.text.cancel'), 'guiModal_closeButton', () => this.hide(), makeClosedButtonDefault);
		}

		/**
		 * Change the CSS class that is applied to the modal, for example, one style would make it a large modal, another could make it a much smaller modal.
		 * 'prompt' makes a small prompt box
		 * 'panel' makes it the general "options" type of modal, this is the default
		 *  
		 */
		setDomClass(domClass: string): void {
			$(this.jqDomId).removeClass(this.domClass);
			this.domClass = domClass;
			$(this.jqDomId).addClass(this.domClass);
		}
		
		setContent(html: string): void {
			$(this.jqDomId+' .guiModal_innerContent').html(html);
		};
		
		setFeedbackText(html: string): void {
			$(this.jqDomId+' .guiModal_Feedback').html(html);
		};
		
		setCloseButtonText(html: string): void {
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
		addButton(
			param1: string | { label: string, classAttribute?: string, onActivateFunction: Function, isDefault?: boolean },
			classAttributeParameter?: string,
			onActivateFunctionParameter?: Function,
			isDefaultParameter?: boolean
		): void {
			if (!param1)
				throw new Error("param1 is mandatory");

			//New method uses a jquery like method to receive paramaters via objects, however, this is backwards compatiable too
			var label: string;
			var onActivateFunction: Function;
			var classAttribute: string | undefined;
			var isDefault: boolean | undefined;

			if (typeof param1 == "object") {
				label = param1.label;
				onActivateFunction = param1.onActivateFunction;
				classAttribute = param1.classAttribute || '';
				isDefault = param1.isDefault || false;
			}
			else {
				if (!onActivateFunctionParameter)
					throw new Error("onActivateFunction is mandatory");
				label = param1;
				onActivateFunction = onActivateFunctionParameter;
				classAttribute = classAttributeParameter;
				isDefault = isDefaultParameter;
			}


			var domId = 'modal_button_' + this.domId +'_'+ this.modalDomIdCounter++;
			var html = '<span id="' + domId + '" role="button" tabindex="0" class="button '+classAttribute+'">'+label+'</span>';
			if (isDefault) this.defaultButton = domId;
			$(this.jqDomId+' .guiModal_Buttons').prepend(html);
			$('#'+domId).bind('click keyup', (e) => {
				if ($(e.delegateTarget).hasClass('disabled')) return;
				
				if (
					(e.type == "keyup" && (e.which == 13 || e.which == 32)) ||
					(e.type == "click" && e.which == 1)
				) onActivateFunction();
			});
		}
		
		toggleShown(): void {
			if (this.isShowing) {
				this.hide();
			}
			else {
				this.show();
			}
		}
		
		show(): void {
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
		}
		
		hide(): void {
			$('#modalBackground').hide();
			if (!this.isShowing) return; //already hidden, return
			this.isShowing = false;
			$(this.jqDomId).css('display','none');
			$(document).unbind('keyup.' + this.domId);
			this.gui.resumeBindings();
			this.triggerEvent('hide');
			this.gui.ticker.resume();
		}
		
		/**
		 * Allows callback bindings
		 * 
		 * For example, a callback could be called when the modal is shown or hidden.
		 */
		bind(eventName: string, callbackFunction: Function): void {
			if (typeof this.eventBindings[eventName] == "undefined") {
				this.eventBindings[eventName] = [];
			}

			this.eventBindings[eventName].push(callbackFunction);
		}
		
		/**
		 * Used within the modal to trigger events so any bound callbacks are called.
		 */
		triggerEvent(eventName: string): void {
			if (typeof this.eventBindings[eventName] != "undefined") {
				for (var i in this.eventBindings[eventName]) {
					this.eventBindings[eventName][i]();
				}
			}
		}
		
		disableControls(): void {
			$(this.jqDomId + ' .button').addClass("disabled");
			$(this.jqDomId + ' input').attr("disabled", "disabled");
			
		}
		
		startWaitingForServer(message: string): void {
			this.disableControls();
			this.setFeedbackText('<img src="images/loading1.gif" alt=""> ' + message);
		}
		
		enableControls(): void {
			$(this.jqDomId + ' .button').removeClass("disabled");
			$(this.jqDomId + ' input').removeAttr("disabled");
		}
		
		stopWaitingForServer(): void {
			this.enableControls();
			this.setFeedbackText('');
		}
	}
}