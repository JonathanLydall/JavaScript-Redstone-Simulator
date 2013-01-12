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
	}
	
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
	}
	
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
	}
	
	construct();
}
