com.mordritch.mcSim.documentOpen = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	
	this.construct = function() {
		var t = this;

		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		
		
		this.modal.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.loadUsingBounceBack();
			}
		);
		
		this.initOverButton();
		
		return;
	}
	
	this.supportsFileAPI = function() {
		if (
			window.File &&
			window.FileReader &&
			window.FileList &&
			window.Blob
		) {
			return true;
		}
		else {
			return false;
		}
	}
	
	this.show = function() {};
	
	this.initOverButton = function() {
		var t = this;
		/*
		this.modal.setContent(
			'<div class="documentOpen">' +
				'<form action="php/readFile_bounceBack.php?task=put" enctype="multipart/form-data" id="form_documentOpen" method="POST" encoding="multipart/form-data">' +
					'<b>' + this.L10n.getString("document.open.title") + '</b><br/><br/>' +
					'<p>'+this.L10n.getString('file.open') +'<br/>' +
					'<input type="file"name="schematicFile" id="input_fileOpen" style="opacity: 0; height: 300px; width: 30px; cursor: pointer;"></p>' +
					'<span id="fileOpen_progress"></span>' +
				'</form>' +
			'</div>'
		);
		*/
		
		var hiddenDiv = 
			'<div class="documentOpen" style="' +
				//'border: 1px solid red;' +
				'z-index: 50;' +
				'position: absolute;' +
				//'top: 50px;' +
				//'left: 500px;' +
				//'width: 32px;' +
				//'height: 32px;' +
				//'width: 500px;' +
				//'height: 500px;' +
				'overflow: hidden;' +
			'"></div>';
			
		$('body').append(hiddenDiv);
		this.createForm();
		
		$('.addDocumentToolbarButton_fileOpen').bind("mouseenter", function() {
			t.move();
		});
		this.move();
	}
	
	this.bind = function() {
		//because we have a hidden input element hovering over, we need to update the styles manually of the "button under"File Open" icon beneath it
		var fileOpenClass =  ".addDocumentToolbarButton_fileOpen";
		var triggerElement = "#input_fileOpen";
		
		$(triggerElement).on("mouseenter", function() {
			$(fileOpenClass).addClass("topToolbarUnselected_hover");
		});
		
		$(triggerElement).on("mousedown", function() {
			$(fileOpenClass).removeClass("topToolbarUnselected_hover");
			$(fileOpenClass).removeClass("topToolbarUnselected");
			$(fileOpenClass).addClass("topToolbarUnselected_active");
		});
		
		$(triggerElement).on("mouseleave", function() {
			$(fileOpenClass).removeClass("topToolbarUnselected_active");
			$(fileOpenClass).removeClass("topToolbarUnselected_hover");
			$(fileOpenClass).addClass("topToolbarUnselected");
		});
	}
	
	this.move = function() {
		$('.documentOpen').width($('.addDocumentToolbarButton_fileOpen img').outerWidth());
		$('.documentOpen').height($('.addDocumentToolbarButton_fileOpen img').outerHeight());
		$('.documentOpen').offset({
			top: $('.addDocumentToolbarButton_fileOpen img').offset().top,
			left: $('.addDocumentToolbarButton_fileOpen img').offset().left
		});
	}
	
	this.createForm = function() {
		var html =
			'<form action="php/readFile_bounceBack.php?task=put" enctype="multipart/form-data" id="form_documentOpen" method="POST" encoding="multipart/form-data">' +
				'<input type="file" name="schematicFile" id="input_fileOpen" style="' +
					'position: absolute;' +
					'right: 0;' +
					'top: 0;' +
					'height: 64px;' +
					'opacity: 0;' +
					
				'"></p>' +
			'</form>';
			
		$('.documentOpen').html('<span></span>');
		$('.documentOpen').html(html);
		this.bind();
		
		$('#input_fileOpen').bind('change', {t: this}, function(e) {
			var t = e.data.t;
			$("#input_fileOpen").trigger("mouseleave");
			
			var fileName = $('#input_fileOpen').val().replace(/\\/g, '/');
			fileName = fileName.substr(fileName.lastIndexOf("/")+1);
			
			t.fileName = fileName;
			
			if (t.supportsFileAPI()) {
				t.loadUsingFileApi(e);
			}
			else {
				t.loadUsingBounceBack(e);
			}
		});
	}
	
	this.loadUsingFileApi = function(e) {
		console.log("Loading using File API.");
		var t = this;
		var file = e.target.files[0];
		var fileReader = new FileReader();
		
		fileReader.onload = function(e) {
			t.openFile(e.target.result);
		}
		fileReader.readAsBinaryString(file);
		t.createForm();
	}
	
	this.loadUsingBounceBack = function(e) {
		console.log("Loading using server bounceback.");
		var t = this;
		$('#form_documentOpen').ajaxSubmit({
			dataType: 'json',
			/*
			uploadProgress: function(event, position, total, percentComplete) {
				//On a 200kb file, even running slowly, this only gets triggered twice. Considering typical file sizes for schematics, not implementing for now
				console.log("uploadProgress:", percentComplete + '%');
			},*/
			success: function(data) {
				console.log("Put complete, getting...")
				$.ajax({
					url: "php/readFile_bounceBack.php?task=get&id=" + data.id,
					success: function(data) {
						//console.log("Base64 decoding...", new Date());
						var b64 = base64_decode(data);
						//console.log("Opening...", new Date());
						t.openFile(b64);
						t.createForm();
					}
				});
			}
		});
	}
	
	this.openFile = function(data) {
		//console.log("Open file for length:", data.length);
		
		//console.log(hexDump(data));
		//this.modal.hide();
		
		var title = this.fileName.substr(0, this.fileName.lastIndexOf("."));
		
		
		this.gui.loadSchematic(data);
		this.gui.setSchematicMetadata({
			title: title,
			fileName: this.fileName,
			description: ""
		}, isNew = true);
	}
	
	this.construct();
}
