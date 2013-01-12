com.mordritch.mcSim.documentSave = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	var progressModal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton(
			L10n.getString("button.text.ok"),
			"",
			function() {
				validateForm();
			}
		);
		
		gui.options.registerOption({
			type: 'boolean',
			name: 'doNotShowSavedUrl',
			category: 'simulator',
			defaultValue: false
		});
		
	}
	
	
	var showModal = function() {
		modal.show();
		$('#documentSave_title').focus();
	}
	
	var populateForm = function() {
		var title = gui.schematicMetadata.title;
		var fileName = gui.schematicMetadata.fileName;
		var description = gui.schematicMetadata.description;
		var schematicId = gui.schematicMetadata.schematicId
		
		modal.setContent(
			'<div class="documentSave standardForm">' +
				'<form>' +
					'<p><b>'+L10n.getString("document.save.prompt.title")+'</b></p>' +
	
					'<p>'+L10n.getString('document.title') +'<br/>' +
					'<input type="text" class="text" id="documentSave_title" value=""> <span class="errorText" id="documentSave_title_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filename') +'<br/>' +
					'<input type="text" class="text" id="documentSave_filename" value=""> <span class="errorText" id="documentSave_filename_error"></span></p>' +
	
					'<p>'+L10n.getString('document.description') +'<br/>' +
					'<textarea id="documentSave_description"></textarea> <span class="errorText" id="documentSave_description_error"></span></p>' +
					'<input type="hidden" id="documentSave_data" value="">' +
					'<input type="hidden" id="documentSave_schematicId" value="">' +
				'</form>' +
			'</div>'
		);
		
		$('#documentSave_title').val(title);
		$('#documentSave_filename').val(fileName);
		$('#documentSave_description').val(description);
		$('#documentSave_schematicId').val(schematicId);
		$('#documentSave_data').val('');

		$('.documentSave input').bind('keyup', function(e) {
			if (e.which == 13) validateForm();
		});
	}
	
	/**
	 * When the "save" button or shortcut is triggered
	 */
	this.save = function() {
		var userManager = gui.userManager;
		var schematicMetadata = gui.schematicMetadata;
		
		if (!userManager.authenticated) {
			userManager.show_signInFirst(
				'document.save.signinrequired',
				function() {
					self.save();
				}
			);
			return;
		}
		
		if (userManager.userData.userId != schematicMetadata.userId) {
			//This schematic was made by a different user, use "Save As" instead
			self.saveAs();
			return;
		}
		
		populateForm();
		populateDataField();
	}
	
	/**
	 * When the "save as" button or shortcut is triggered
	 */
	this.saveAs = function() {
		var userManager = gui.userManager;

		if (!userManager.authenticated) {
			userManager.show_signInFirst(
				'document.save.signinrequired',
				function() {
					self.saveAs();
				}
			);
			return;
		}
		populateForm();
		$('#documentSave_schematicId').val(-1);
		showModal();
	}
	
	var validateForm = function() {
		var inputError = false;
		var dataToCheck = [
			{
				id: '#documentSave_title',
				max: 65535,
				min: 1
			},
			{
				id: '#documentSave_filename',
				max: 64,
				min: 1
			},
			{
				id: '#documentSave_description',
				max: 65535,
				min: 0
			}
		];
		
		for (var i=0; i<dataToCheck.length; i++) {
			if (
				$(dataToCheck[i].id).val().length > dataToCheck[i].max ||
				$(dataToCheck[i].id).val().length < dataToCheck[i].min
			) {
				inputError = true;
				$(dataToCheck[i].id + '_error').text(L10n.getString("error.value.string.length", dataToCheck[i].min, dataToCheck[i].max));
				$(dataToCheck[i].id + '_error').prepend('<br/>');
			}
			else {
				$(dataToCheck[i].id + '_error').text('');
			}
		}
		
		if (!inputError) {
			gui.schematicMetadata.title = $('#documentSave_title').val();
			gui.schematicMetadata.fileName = $('#documentSave_filename').val()
			gui.schematicMetadata.description = $('#documentSave_description').val()
			
			modal.hide();
			populateDataField();
		}
	}
	
	var populateDataField = function() {
		progressModal.setContent(
			'<b>'+L10n.getString('document.save.progress.title')+'</b>' +
			'<p id="documentSave_saving"></p>'
		);
		progressModal.setDomClass('prompt');
		progressModal.show();
		$('#documentSave_saving').text(L10n.getString('document.save.progress.savingworld'));
		
		var nbtData = gui.mcSim.saveWorld();
		var nbtParser = new com.mordritch.mcSim.NbtParser();
		
		
		nbtParser.encode({
			data: nbtData,
			encloseInUnnamedCompoundTag: false,
			gzipDeflate: false,
			success: function(data) {
				//if (data.length > 300000) {
				if (data.length > 0) {
					deflate(data);
				}
				else {
					submitForm(data);
				}
			},
			progress: function() {
				console.log("submitForm: progress callback.");
			},
			cancel: function() {
				console.log("submitForm: cancel callback.");
			}
		});
	}
	
	var deflate = function(data) {
		$('#documentSave_saving').text(L10n.getString('document.save.progress.compressing', '0%'));
		
		com.mordritch.mcSim.gzip.deflateAsync({
			data: data,
			success: function(returnData) {
				//$('#documentSave_saving').text("Finished.");
				//returnData = com.mordritch.mcSim.gzip.inflate(returnData);
				//console.log(hexDump(returnData));
				submitForm(returnData);
			},
			progress: function(type, amount) {
				var percentDone = Math.floor((amount/data.length)*100);
				$('#documentSave_saving').text(L10n.getString('document.save.progress.compressing', percentDone+'%'));
			},
			cancel: function() {
				
			}
		});
	}
	
	var submitForm = function(data) {
		//console.log("Submitting...")
		//console.log(hexDump($('#documentSave_data').val()));
		//console.log(hexDump(data));
		
		/*
		new com.mordritch.mcSim.NbtParser().decode({
			//data: $('#documentSave_data').val(),
			data: data,
			updateInterval: 1000,
			success: function(nbtData) {
				console.log("test open successfull")
			},
			progress: function(category, progress, messaging) {
				console.log("test progress...")
			},
			cancel: function() {

			}
		});
		*/
		//return;

		$('#documentSave_saving').text(L10n.getString('document.save.progress.uploading'));

		$.ajax({
			type: 'POST',
			url: 'php/saveOnServer.php',
			dataType: 'json',
			data: {
				schematicData: base64_encode(data), //It seems that suhosin or something like it, is stripping binary data from posts, so it has to be b64 encoded
				title: $('#documentSave_title').val(),
				filename: $('#documentSave_filename').val(),
				description: $('#documentSave_description').val(),
				id: $('#documentSave_schematicId').val()
			},
			success: function(data) {
				uploadComplete(data);
				gui.urlHistory.setSchematicId(data.metaData.id, useReplaceState = false, noChange = true);
				
			}
		});
	}
	
	var uploadComplete = function(data) {
		progressModal.hide();

		var hintString = L10n.getString('document.save.urlhint');
		while (hintString.indexOf('\\n') >= 0) {
			hintString = hintString.replace("\\n", "\n")
		}

		if (!gui.options.getOption('simulator', 'doNotShowSavedUrl')) {
			prompt(hintString, window.location.href);
		}
	}
	
	construct();
}
