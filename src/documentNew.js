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

com.mordritch.mcSim.documentNew = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	
	this.construct = function() {
		var t = this;
		this.modalConfirmNew = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modalConfirmNew.setDomClass("prompt");
		this.modalConfirmNew.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.showNewPanel();
			},
			true
		);
		this.modalConfirmNew.setContent(
			'<b>' + this.L10n.getString("document.new.prompt.title") + '</b><br/><br/>' +
			this.L10n.getString("document.new.prompt.content")
		);

		this.modalPanelNew = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modalPanelNew.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.processNewPanel();
			}
		);
	}
	
	/**
	 * Once they have clicked the confirmation that they will lose any unsaved work 
	 */
	this.showNewPanel = function() {
		var t = this;
		this.modalConfirmNew.hide();
		this.modalPanelNew.setContent(
			'<div class="documentNew">' +
				'<b>' + this.L10n.getString("document.new.prompt.title") + '</b><br/><br/>' +
				
				'<p>'+this.L10n.getString('document.title') +'<br/>' +
				'<input type="text" class="text" id="documentNew_title" value="'+ this.L10n.getString('document.default.title') +'"> <span class="errorText" id="documentNew_title_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.width') +'<br/>' +
				'<input type="text" class="number" id="documentNew_width" value="'+this.gui.userSettings.options.simulator.xDefaultSize+'"> <span class="errorText" id="documentNew_width_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.height') +'<br/>' +
				'<input type="text" class="number" id="documentNew_height" value="'+this.gui.userSettings.options.simulator.zDefaultSize+'"> <span class="errorText" id="documentNew_height_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.layers') +'<br/>' +
				'<input type="text" class="number" id="documentNew_layers" value="'+this.gui.userSettings.options.simulator.yDefaultSize+'"> <span class="errorText" id="documentNew_layers_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.description') +'<br/>' +
				'<textarea id="documentNew_description"></textarea></p>' +
			'</div>'
		);
		
		$('.documentNew input').bind('keyup', function(e) {
			if (e.which == 13) t.processNewPanel();
		});

		this.modalPanelNew.show();
		$('#documentNew_title').focus();
		
	}
	
	this.prompt = function() {
		this.modalConfirmNew.show();
	}
	
	this.processNewPanel = function() {
		var inputError = false;
		var maxWidth = 10000;
		var maxHeight = 10000;
		var maxLayers = 256;
		var maxTitleLength = 65535;
		
		var xSize = $("#documentNew_width").val();
		var zSize = $("#documentNew_height").val();
		var ySize = $("#documentNew_layers").val();
		
		var title = $("#documentNew_title").val();
		var description = $("#documentNew_description").val();
		
		if (title.length > maxTitleLength || title.length < 1) {
			inputError = true;
			$("#documentNew_title_error").text(this.L10n.getString("error.value.string.length", 1, maxTitleLength));
		}
		else {
			$("#documentNew_title_error").text('');
		}
		
		if (xSize == "" || isNaN(xSize) || xSize > maxWidth || xSize < 1) {
			inputError = true;
			$("#documentNew_width_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxWidth));
		}
		else
			$("#documentNew_width_error").text('');

		if (zSize == "" || isNaN(zSize) || zSize > maxHeight || zSize < 1) {
			inputError = true;
			$("#documentNew_height_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxHeight));
		}
		else
			$("#documentNew_height_error").text('');

		if (ySize == "" || isNaN(ySize) || ySize > maxLayers || ySize < 1) {
			inputError = true;
			$("#documentNew_layers_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxLayers));
		}
		else
			$("#documentNew_layers_error").text('');
		
		if (!inputError) {
			this.modalPanelNew.hide();
			this.gui.mcSim.makeNew(xSize, ySize, zSize, this.gui.userSettings.options.simulator.startTickingWorldOnLoad);
			
			this.gui.setSchematicMetadata({
				fileName: title,
				title: title,
				description: description
			}, isNew = true);
		}
	}
	
	this.construct();
}
