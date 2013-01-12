com.mordritch.mcSim.documentInfo = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton({
			label: L10n.getString("button.text.ok"),
			onActivateFunction: function() {
				validateForm();
			}
		});
		
	}
	
	this.show = function() {
		populateForm();
		modal.show();
		$('#documentInfo_title').focus();
	}
	
	var populateForm = function() {
		var title = gui.schematicMetadata.title;
		var fileName = gui.schematicMetadata.fileName;
		var fileSize = gui.schematicMetadata.fileSize;
		var description = gui.schematicMetadata.description;
		var xSize = gui.mcSim.World.worldData.getSizeX();
		var ySize = gui.mcSim.World.worldData.getSizeY();
		var zSize = gui.mcSim.World.worldData.getSizeZ();
		
		modal.setContent(
			'<div class="documentInfo standardForm">' +
				'<form>' +
					'<p><b>'+L10n.getString("document.info.prompt.title")+'</b></p>' +
	
					'<p>'+L10n.getString('document.title') +'<br/>' +
					'<input type="text" class="text" id="documentInfo_title" value=""> <span class="errorText" id="documentInfo_title_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filename') +'<br/>' +
					'<input type="text" class="text" id="documentInfo_filename" value=""> <span class="errorText" id="documentInfo_filename_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filesize') +'<br/>' +
					'<span class="readonly">' + fileSize + ' bytes</span></p>' +

					'<p>' +
						L10n.getString('document.width')  + ' <span class="readonly_short">' + zSize + '</span> ' +
						L10n.getString('document.height') + ' <span class="readonly_short">' + xSize + '</span> ' +
						L10n.getString('document.layers') +	' <span class="readonly_short">' + ySize + '</span> ' +
					'</p>' +

					'<p>'+L10n.getString('document.description') +'<br/>' +
					'<textarea id="documentInfo_description"></textarea> <span class="errorText" id="documentInfo_description_error"></span></p>' +
				'</form>' +
			'</div>'
		);
		
		$('#documentInfo_title').val(title);
		$('#documentInfo_filename').val(fileName);
		$('#documentInfo_description').val(description);

		$('.documentInfo input').bind('keyup', function(e) {
			if (e.which == 13) validateForm();
		});
	}
	
	var validateForm = function() {
		var inputError = false;
		var dataToCheck = [
			{
				id: '#documentInfo_title',
				max: 65535,
				min: 1
			},
			{
				id: '#documentInfo_filename',
				max: 64,
				min: 1
			},
			{
				id: '#documentInfo_description',
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
			gui.setSchematicMetadata({
				title: $('#documentInfo_title').val(),
				fileName: $('#documentInfo_filename').val(),
				description: $('#documentInfo_description').val()
			});
			
			
			modal.hide();
		}
	}
	
	construct();
}
