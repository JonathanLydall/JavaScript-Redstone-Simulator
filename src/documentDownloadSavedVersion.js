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

com.mordritch.mcSim.documentDownloadSavedVersion = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var feedbackModal = new com.mordritch.mcSim.guiFullModal(gui, makeClosedButtonDefault = true);
	
	/**
	 * When the "download" button or shortcut is triggered
	 */
	this.download = function() {
		var schematicId = gui.schematicMetadata.schematicId;
		if (schematicId == "" || schematicId == null) {
			feedbackModal.show();
		}
		else {
			sendDownloadRequest(schematicId);
		}
	};
	
	var construct = function() {
		$('body').append(
			'<div style="display:none">' +
				'<form id="documentDownloadSavedVersion">' +
				'</form>' +
			'</div>'
			);

		feedbackModal.setContent(
			'<b>'+L10n.getString('document.download.server.error.header')+'</b>' +
			'<p>'+L10n.getString('document.download.server.error.body')+'</p>'
			);
			
		feedbackModal.setCloseButtonText(L10n.getString('button.text.ok'));
		
		feedbackModal.setDomClass('prompt');
	};
	
	var sendDownloadRequest = function(schematicId) {
		$('#documentDownloadSavedVersion').ajaxForm({
			type: 'POST',
			iframe: true,
			url: 'php/schematicDownload.php?id=' + schematicId,
			error: function() {
				console.log("documentDownloadSavedVersion.sendDownloadRequest(): error");
			},
			success: function(data) {
				console.log("documentDownloadSavedVersion.sendDownloadRequest(): complete");
			}
		}).submit();
	};
	
	construct();
};
