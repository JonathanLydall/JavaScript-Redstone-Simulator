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

com.mordritch.mcSim.documentSaveLocally = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var progressModal = new com.mordritch.mcSim.guiFullModal(gui);
	var saveProgressDomId = "documentSaveLocally_saving";
	var saveProgressSelector = "#" + saveProgressDomId;
	var cancellationRequested = false;
	
	var construct = function() {
		$('body').append(
			'<div style="display:none">' +
				'<form id="documentSaveLocally">' +
				'</form>' +
			'</div>'
			);

		progressModal.setContent(
			'<b>'+L10n.getString('document.save.locally.progress.title')+'</b>' +
			'<p id="' + saveProgressDomId + '"></p>'
			);
		
		progressModal.setDomClass('prompt');
		
		progressModal.bind('hide', function() {
			hide();
		});
	};
	
	var hide = function() {
		cancellationRequested = true;
	};
	
	/**
	 * When the "save" button or shortcut is triggered
	 */
	this.save = function() {
		cancellationRequested = false;
		progressModal.show();
		$(saveProgressSelector).text(L10n.getString('document.save.progress.savingworld'));
		setTimeout(function() {
			nbtEncode();
		},5);
	};
	
	var nbtEncode = function() {
		var nbtData = gui.mcSim.saveWorld();
		var nbtParser = new com.mordritch.mcSim.NbtParser();
		
		nbtParser.encode({
			data: nbtData,
			encloseInUnnamedCompoundTag: false,
			gzipDeflate: false,
			progress: function(type, amount, messaging) {
				if (cancellationRequested) {
					messaging.requestCancel = true;
				}
				console.log("nbtEncode: progress callback.");
			},
			cancel: function() {
			},
			success: function(data) {
				deflate(data);
			}
		});
	};
	
	var deflate = function(data) {
		$(saveProgressSelector).text(L10n.getString('document.save.progress.compressing', '0%'));
		
		com.mordritch.mcSim.gzip.deflateAsync({
			data: data,
			progress: function(type, amount, messaging) {
				var percentDone = Math.floor((amount/data.length)*100);
				$(saveProgressSelector).text(L10n.getString('document.save.progress.compressing', percentDone+'%'));
				if (cancellationRequested) {
					messaging.requestCancel = true;
				}
			},
			cancel: function() {
			},
			success: function(returnData) {
				setTimeout(function() {
					$(saveProgressDomId).text(L10n.getString('document.save.locally.progress.uploading'));
					postData(returnData);
				},5);
			}
		});
	};
	
	var postData = function(data) {
		var fileName = (gui.schematicMetadata.fileName == null || gui.schematicMetadata.fileName == "") ? L10n.getString("document.metadata.default.fileName") : gui.schematicMetadata.fileName;
		console.log("Wanting to save %s bytes...", data.length);

		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: 'php/schematicSaveLocally.php?task=put',
			data: {
				schematicData: base64_encode(data),
				fileName: fileName
			},
			error: function() {
				console.log("documentSaveLocally.postData(): error");
			},
			success: function(data) {
				console.log("documentSaveLocally.postData(): complete");
				uploadComplete(data);
			}
		});
	};
	
	var uploadComplete = function(data) {
		progressModal.hide();
		if (data.error) {
			throw new Error("documentSaveLocally.uploadComplete() - Server responded with error: %s", data.errorDescription);
		}
		else {
			$('#documentSaveLocally').ajaxForm({
				type: 'POST',
				iframe: true,
				url: 'php/schematicSaveLocally.php?task=get',
				data: {
					id: data.id
				},
				error: function() {
					console.log("documentSaveLocally.uploadComplete(): error");
				},
				success: function(data) {
					console.log("documentSaveLocally.uploadComplete(): complete");
				}
			}).submit();
		}
	};
	
	construct();
};
