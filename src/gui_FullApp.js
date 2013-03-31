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

(function(){
	var namespace = com.mordritch.mcSim;
	var loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia mattis faucibus. Vivamus nisi lorem, varius vel aliquet non, venenatis eu magna. Nulla eget sapien diam, a posuere purus. Aenean suscipit ultrices odio, vitae aliquet est tempor quis. Donec tincidunt magna eget turpis ultrices cursus. Phasellus vel erat sed dolor luctus convallis eget a ante. Suspendisse diam magna, euismod sed tincidunt sed, dapibus ut neque. Nulla vulputate dictum leo eget lacinia. Aenean in urna augue, eu mollis diam. Donec aliquet feugiat elit, sit amet convallis mi luctus sit amet."; //http://www.lipsum.com/
	var Gui_FullApp = function(mcSim) {
		this.defaultSettings = window.defaultOptions;
		this.userSettings = JSON.parse(JSON.stringify(this.defaultSettings));
		this.userSettings_onLoadCallbacks = [];
		this.schematicMetadata = {};
		this.tickerDomIds = {};
		
		this.init = function() {
			this.L10n = this.localization = new namespace.localization(window['localizationStrings']); //needs to be done as the very first, pretty much everything needs to make use of localization
			this.input = new namespace.guiFullInput(this); //needs to be called before any components which want to use bindings
			this.options = new namespace.options(this); //needs to be called before any components which want to register options
	
			this.loaderModal = new namespace.guiFullModal(this);
			this.loaderModal.setDomClass("prompt");
			this.loaderModal.bind('hide', function() {
				t.loaderMessaging.cancel = true;
			});
	
			$('#header').append(
				'<span class="documentToolBarLeft"></span>' +
				'<span class="documentToolBarRight"></span>'
			);

			this.tooltip = new namespace.tooltip(this);

			this.initGuiOptions();
			this.initTopRightButtons();
			this.initTopLeftButtons();
			
			this.userManager = new namespace.guiFull_userManager(this);
			 
			this.toolHandler = new namespace.toolHandler(this);
			this.mcSim = new namespace.MinecraftSimulator(this);
	
			this.ticker = new namespace.guiFull_ticker(this); //not the actual ticker, just the gui's way of talking to it, depends on ticker inside mcSim having already been created
			
			this.initPlaceableBlockList(); //needs to be run before the toolbar
			this.initBlockHelpers();
	
			this.modelviews = new namespace.guiFull_multiViewHandler(this);
			this.toolbars = new namespace.guiFullToolbar(this);
			this.sidebar = new namespace.sidebar(this);
			this.viewPorts = new namespace.viewPorts(this);
			
			this.documentOpen = new namespace.documentOpen(this);
			this.documentNew = new namespace.documentNew(this);
			this.documentSave = new namespace.documentSave(this);
			this.documentSaveLocally = new namespace.documentSaveLocally(this);
			this.documentInfo = new namespace.documentInfo(this);
			this.documentDownloadSavedVersion = new namespace.documentDownloadSavedVersion(this);

			this.documentResize = new namespace.documentResize(this);
			this.documentRotate = new namespace.documentRotate(this);
			
			this.submitFeedback = new namespace.submitFeedback(this);
			
			this.urlHistory = new namespace.urlHistory(this);
			this.googleAnalytics = new namespace.googleAnalytics(this); 
			
			var t = this;
			$('.addDocumentToolbarButton0fileOpen').bind('mouseenter.moveto', function() {
				t.documentOpen.initOverButton(); //Makes a file upload element ontop of the button, run now after the DOM positioning has settled down
				$('.addDocumentToolbarButton0fileOpen').unbind('mouseenter.moveto');
			});
			
			
			this.loaderMessaging = {cancel: false};
	
			var schematicIdToOpen = window['schematicIdToOpen'];
			this.schematicMetadata = window['schematicMetadata'];
	
			if (this.schematicMetadata.error) {
				var xDefaultSize = this.userSettings.options.simulator.xDefaultSize;
				var yDefaultSize = this.userSettings.options.simulator.yDefaultSize;
				var zDefaultSize = this.userSettings.options.simulator.zDefaultSize;
	
				this.mcSim.makeNew(xDefaultSize, yDefaultSize, zDefaultSize, this.userSettings.options.simulator.startTickingWorldOnLoad);
			}
			
			this.sideBarSchematicDescriptionElement = this.sidebar.addSection('','');
			this.setSchematicMetadata(this.schematicMetadata, isNew = true);
		}
		
		this.initBlockHelpers = function() {
			this.blockHelper_Sign = new  namespace.blockHelper_Sign(this);
		}
		
		this.setSchematicMetadata = function(parameters, isNew) {
			isNew = (typeof isNew == "undefined") ? false : isNew;
			
			var schematicMetadata;
			
			if (isNew) {
				this.schematicMetadata = {
					created: this.L10n.getString("document.metadata.default.created"),
					lastModified: this.L10n.getString("document.metadata.default.lastModified"),
					fileName: this.L10n.getString("document.metadata.default.fileName"),
					fileSize: this.L10n.getString("document.metadata.default.fileSize"),
					description: this.L10n.getString("document.metadata.default.description"),
					title: this.L10n.getString("document.metadata.default.title"),
					schematicId: -1,
					userDisplayName: this.L10n.getString("document.metadata.default.userDisplayName"),
					userId: ""
				}
			}
			
			schematicMetadata = this.schematicMetadata;
			
			for (var parameter in parameters)
			{
				if (parameters[parameter] != "")
				{
					schematicMetadata[parameter] = parameters[parameter];
				}
			}
			
			var downloadNowString = this.L10n.getString("application.downloadnow");
			
			$('#headerDocumentTitle').text(" - " + escapeHtml(schematicMetadata.title));
			if (schematicMetadata.title != "") {
				$('#headerDocumentTitle').append(' (<a href="./download/?downloadId='+schematicMetadata.schematicId+'">' + downloadNowString + '</a>)');
			}

			var sideBarBodyText =
				this.L10n.getString("sidebar.schematic.info.title") +
				'<br/>' +
				'<b>' +
				escapeHtml(schematicMetadata.title) +
				'</b>' +
				'<br/>' +
				'<br/>' +
				this.L10n.getString("sidebar.schematic.info.uploadedby") +
				'<br/>' +
				'<b>' +
				escapeHtml(schematicMetadata.userDisplayName) +
				'</b>' +
				'<br/>' +
				'<br/>' +
				this.L10n.getString("sidebar.schematic.info.description") +
				' ' +
				escapeHtml(schematicMetadata.description).replace("\\n", "<br/>");

			this.sidebar.addSection(
				this.L10n.getString("sidebar.schematic.info.header"),
				sideBarBodyText,
				hideByDefault = false,
				this.sideBarSchematicDescriptionElement
			);
			
			this.urlHistory.setSchematicId(schematicMetadata.schematicId, useReplaceState = false, noChange = true);
		}
		
		this.initGuiOptions = function() {
			this.options.registerOption({
				type: 'number',
				name: 'xDefaultSize',
				category: 'simulator',
				defaultValue: 32,
				minValue: 1,
				maxValue: 2048
			});
	
			this.options.registerOption({
				type: 'number',
				name: 'yDefaultSize',
				category: 'simulator',
				defaultValue: 8,
				minValue: 1,
				maxValue: 256
			});
	
			this.options.registerOption({
				type: 'number',
				name: 'zDefaultSize',
				category: 'simulator',
				defaultValue: 32,
				minValue: 1,
				maxValue: 2048
			});
	
			this.options.registerOption({
				type: 'boolean',
				name: 'startTickingWorldOnLoad',
				category: 'simulator',
				defaultValue: true
			});
			
		}
		
		this.initTopRightButtons = function() {
			var container = '.documentToolBarRight';
			var t = this;
			
			this.addDocumentToolbarButton(
				'options',
				'options',
				'images/icons/configure-4.png',
				container,
				function() {
					t.options.showOptionsScreen();
				}
			);
			
			this.addDocumentToolbarButton(
				'input',
				'input',
				'images/icons/configure-shortcuts.png',
				container,
				function() {
					t.input.modal.show();
				}
			);
	
			this.addDocumentToolbarButton(
				'toolbars',
				'toolbars',
				'images/icons/configure-toolbars.png',
				container,
				function() {
					t.toolbars.modal.show();
				}
			);
	
			/*
			this.addDocumentToolbarButton(
				'help',
				'help',
				'images/icons/help-3.png',
				container,
				function() {
					//t.toolbars.modal.show();
				}
			);
			*/

			this.addDocumentToolbarButton(
				'sidebar',
				'sidebar',
				'images/icons/view-right-close.png',
				container,
				function() {
					t.sidebar.toggle();
				}
			);
		}
		
		this.initTopLeftButtons = function() {
			var container = '.documentToolBarLeft';
			var t = this;
			
			this.addDocumentToolbarButton(
				'fileNew',
				'fileNew',
				'images/icons/document-new-5.png',
				container,
				function() {
					t.documentNew.prompt();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileOpen',
				'fileOpen',
				'images/icons/document-open-5.png',
				container,
				function() {
					t.documentOpen.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileSave',
				'fileSave',
				'images/icons/document-save-5.png',
				container,
				function() {
					t.documentSave.save();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileSaveAs',
				'fileSaveAs',
				'images/icons/document-save-as-5.png',
				container,
				function() {
					t.documentSave.saveAs();
				}
			);
			
			this.addDocumentToolbarSeperator(container);
	
			this.addDocumentToolbarButton(
				'documentSaveLocally',
				'documentSaveLocally',
				'images/icons/download.png',
				container,
				function() {
					t.documentSaveLocally.save();
				}
			);
			
			this.addDocumentToolbarButton(
				'schematicDownload',
				'schematicDownload',
				'images/icons/download-3.png',
				container,
				function() {
					t.documentDownloadSavedVersion.download();
				}
			);
			
			this.addDocumentToolbarSeperator(container);
	
			this.addDocumentToolbarButton(
				'documentResize',
				'documentResize',
				'images/icons/transform-scale-2.png',
				container,
				function() {
					t.documentResize.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'documentRotate',
				'documentRotate',
				'images/icons/object-rotate-right.png',
				container,
				function() {
					t.documentRotate.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'documentInformation',
				'documentInformation',
				'images/icons/document-properties.png',
				container,
				function() {
					t.documentInfo.show();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			this.addDocumentToolbarButton(
				'editSelect',
				'editSelect',
				'images/icons/edit/edit-select.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editCopy',
				'editCopy',
				'images/icons/edit/edit-copy-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editPaste',
				'editPaste',
				'images/icons/edit/edit-paste-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editDelete',
				'editDelete',
				'images/icons/edit/edit-delete-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			this.addDocumentToolbarButton(
				'viewPortsSplitHorizontally',
				'viewPortsSplitHorizontally',
				'images/icons/view-split-left-right-2.png',
				container,
				function() {
					t.viewPorts.ToggleSplitHorizontally();
				}
			);
			
			this.addDocumentToolbarButton(
				'viewPortsSplitVertically',
				'viewPortsSplitVertically',
				'images/icons/view-split-top-bottom-2.png',
				container,
				function() {
					t.viewPorts.ToggleSplitVertically();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			var tickerStop = this.addDocumentToolbarButton(
				'tickerStop',
				'tickerStop',
				'images/icons/media-playback-pause-7.png',
				container,
				function() {
					t.ticker.stop();
				}
			);
	
			var tickerRun = this.addDocumentToolbarButton(
				'tickerRun',
				'tickerRun',
				'images/icons/media-playback-start-7.png',
				container,
				function() {
					t.ticker.start();
				}
			);
	
			var tickerStep = this.addDocumentToolbarButton(
				'tickerStep',
				'tickerStep',
				'images/icons/media-playback-step-7.png',
				container,
				function() {
					t.ticker.step();
				}
			);
			
			var tickerTickFor = this.addDocumentToolbarButton(
				'tickerTickFor',
				'tickerTickFor',
				'images/icons/media-skip-forward-7.png',
				container,
				function() {
					t.ticker.tickFor();
				}
			);
			
			var tickUntilStopTextBoxId = "tickUntilStopTextBox";
			$(container).append(
				'<input type="text" id="'+ tickUntilStopTextBoxId +'" value="">'
			);
			
			$("#" + tickUntilStopTextBoxId).bind("keyup", function(e){
				if (e.which == 13) {
					t.ticker.tickFor();
				}
			});

			this.addDocumentToolbarSeperator(container);

			$(container).append(
				'<span class="topToolbarText">' + this.L10n.getString("ticker.tickcounter") + '</span>'
			);
			
			this.addDocumentToolbarButton(
				'resetTickCounter',
				'resetTickCounter',
				'images/icons/view-refresh-4.png',
				container,
				function() {
					t.ticker.resetTickCounter();
				}
			);
			
			$(container).append(
				' <span class="topToolbarText" id="tickCounter">0</span>'
			);
			
			this.addDocumentToolbarSeperator(container);

			this.tickerDomIds.tickCounterId = "tickCounter";
			this.tickerDomIds.stopButtonClass = tickerStop;
			this.tickerDomIds.runButtonClass = tickerRun;
			this.tickerDomIds.stepButtonClass = tickerStep;
			this.tickerDomIds.tickForButtonClass = tickerTickFor;
			this.tickerDomIds.tickForTextboxId = tickUntilStopTextBoxId;
		}
		
		this.addDocumentToolbarButton = function(name, description, imageUrl, container, onClickCallback) {
			var className = 'addDocumentToolbarButton_'+name;
			var t = this;
			
			$(container).append(
				'<span class="'+className+' topToolbarUnselected"><img src="'+imageUrl+'" /></span> '
			);
			
			this.input.bindInputEvent({
				savedKeyName: name,
				category: 'toolbar.top',
				description: 'shortcuts.toolbar.top.'+name,
				callbackFunction: onClickCallback
			});

			this.tooltip.createForElement(
				$domElement = $('.addDocumentToolbarButton_'+name),
				position = "below",
				headerText = 'toolbar.top.tooltips.'+description+'.title',
				bodyText = 'toolbar.top.tooltips.'+description+'.description',
				shortcutKeyScope = 'main',
				shortcutKeyEventName = name);

			$(container+' .'+className).bind('click', onClickCallback);
			return className;
		}
		
		/**
		 * Adds a toolbar seperator 
		 */
		this.addDocumentToolbarSeperator = function(container) {
			$(container).append(
				'<span class="toolbarSeperator"></span>'
			);
		}
		
		/**
		 * Classes can register to be notified if usersettings are loaded
		 */
		this.userSettings_registerForOnLoadCallback = function(callback) {
			this.userSettings_onLoadCallbacks.push(callback);
		}
		
		/**
		 * Tells all clases which are registered for usersetting change notifcation through callbacks
		 */
		this.userSettingsLoaded = function(options) {
			for (var i=0; i<this.userSettings_onLoadCallbacks.length; i++) {
				this.userSettings_onLoadCallbacks[i]();
			}
		}
		
		this.loadSchematicId = function(schematicId) {
			if (typeof schematicId == "undefined" || schematicId == null) throw new Error("loadSchematicId() Schematic ID cannot be undefined.");
			
			this.loaderModal.setContent("Downloading from server..."); //TODO: Use a localized string
			this.loaderModal.show();

			if (typeof this.schematicMetadata.schematicId != "undefined" && this.schematicMetadata.schematicId == schematicId) {
				this.ajaxGetSchematicData (schematicId);
			}
			else {
				var t = this;
				$.ajax({
					url: 'php/getSchematicMetadata.php?id=' + schematicId,
					dataType: 'json',
					success: function(data) {
						t.setSchematicMetadata(data, isNew = true);
						t.ajaxGetSchematicData(data.schematicId);
					}
				});
			}
		}
		
		this.ajaxGetSchematicData = function(schematicIdToOpen) {
			var t = this;
			
			var url = 'php/openBinaryById.php?id=' + schematicIdToOpen;
	
			$.ajax({
				url: url,
				progress: function(xhrObject) {
					console.log("ajaxGetSchematicData: ", xhrObject);
				},
				success: function(data) {
					
					base64_decode_async({
						data: data,
						success: function(b64DecodedData) {
							t.loaderModal.setContent("Reading NBT data...");
							setTimeout(function() {
								t.loadSchematic(b64DecodedData);
							},0);
						},
						progress: function(task, amount) {
							var percentDone = "" + Math.floor((amount/data.length)*100) + "%";
							t.loaderModal.setContent("Task: Base 64 decoding<br/>Progress: "+percentDone);
						}
					});
				}
			});
		}
		
		
		/**
		 * Takes input as a binary .schematic file contents   
		 */
		this.loadSchematic = function(data) {
			var isError = false;
			
			try {
			} 
			catch (e) {
				console.log(e);
				isError = true;
			}
			
			if (!isError) {
				/*
				When testing encoding / decoding, uncomment below, and comment above
				
				var nbtData1 = new namespace.NbtParser().encode(nbtData, false, true);
				var nbtData2 = new namespace.NbtParser().decode(nbtData1);
				t.mcSim.loadWorldData(nbtData2, t.userSettings.simulator.startTickingWorldOnLoad);
				*/
				
				//$('#schem').val(JSON.stringify(data)); //Uncomment to export a loaded schematic to a text blob
			}
				
			this.loaderModal.setContent("Reading NBT data..."); //TODO: Localize
			this.loaderModal.show();
			
			var t = this;
			this.loaderMessaging.cancel = false;
			new namespace.NbtParser().decode({
				data: data,
				updateInterval: 1000,
				progress: function(category, progress, messaging) {
					if (t.loaderMessaging.cancel) {
						messaging.cancel = true;
					}
					//console.log("progress: %s", progress);
					t.loaderModal.setContent("Task: "+category+"<br/>Progress: "+progress);
					t.documentOpen.createForm();
					//t.mcSim.loadProgress(category, progress);
				},
				cancel: function() {
					//console.log("cancelled.");
					//t.loaderModal.setContent("Task: "+category+"<br/>Progress: "+progress);
				},
				success: function(nbtData) {
					var startTickingWorldOnLoad = t.userSettings.options.simulator.startTickingWorldOnLoad;
					t.sidebar.show(noAnimate = true);
					t.ticker.resetTickCounter();
					t.mcSim.loadWorld(nbtData, startTickingWorldOnLoad);
					t.loaderModal.hide();
					//t.tempToParticularView();
				}
			});
		}
		
		this.tempToParticularView = function() {
			var 
				NORTH = 0,
				EAST = 1,
				SOUTH = 2,
				WEST = 3;
			
			this.viewPorts.ToggleSplitHorizontally();
			var sideView = this.modelviews.getModelViewByCssClass('modelViewTopRight');

			sideView.changeFacingTo(WEST);
			sideView.layerTo(1);
		}
		
		
		this.saveSchematic = function(options) {
			var nbtData = this.mcSim.saveWorld();
			var nbtParser = new namespace.NbtParser();
			nbtParser.encode({
				data: nbtData,
				encloseInUnnamedCompoundTag: false,
				gzipDeflate: true,
				success: function() {
					console.log("saveSchematic(): success callback.");
				},
				progress: function() {
					console.log("saveSchematic(): progress callback.");
				}
			});
		}
		
		/**
		 * Queries all blocks to get a list of blocktypes the user can place
		 */
		this.initPlaceableBlockList = function() {
			var blocksList = this.mcSim.Block.blocksList;
			var placeableBlocks = {};
			var zoomLevel = 5;
			
			$('body').append('<canvas id="tempForIconGeneration" width="'+zoomLevel*8+'" height="'+zoomLevel*8+'" style="display:none"></canvas>');
			var canvasDomObject = document.getElementById("tempForIconGeneration");
			//var context = new namespace.CanvasInterface();
			context = canvasDomObject.getContext("2d");
			
			//context.getContext(canvasDomObject);
			
			for (block in blocksList) {
				var placeableBlockResults = blocksList[block].enumeratePlaceableBlocks();
				for (placeableBlockType in placeableBlockResults) {
					var blockType = placeableBlockResults[placeableBlockType];
					
					//Fenerate an icon:
					context.setTransform(1, 0, 0, 1, 0, 0); //resets the translate coords
					context.scale(zoomLevel, zoomLevel);
					context.clearRect(0,0,8,8);
					blocksList[block].drawIcon(this.mcSim.Block, context, blockType.blockMetadata);
					blockType.iconImageData = canvasDomObject.toDataURL();
	
					placeableBlocks[blockType.blockType+'_'+blockType.blockID+'_'+blockType.blockMetadata] = (blockType);
				}
			}
			this.placeableBlocks = placeableBlocks;
			//console.log(placeableBlocks);
			$('canvas#tempForIconGeneration').remove();
		}
		
		/**
		 * Pauses all keybinding events
		 * 
		 * For example, a modal calls this as it is shown, so that it overrides key events for itself
		 */
		this.pauseBindings = function() {
			this.input.suspend();
		}
		
		/**
		 * Resumes all keybinding events
		 * 
		 * For example, a modal calls this as it hides itself to make key and mouse events work again 
		 */
		this.resumeBindings = function() {
			this.input.resume();
		}
		
		/**
		 * Get an option's  current value
		 */
		this.getOption = function(category, name) {
			return this.options.getOption(category, name);
		}
		
		this.refreshModelViews = function() {
			this.modelviews.drawAllBlocks();
		}
		
		this.init();
	}
	
	namespace['Gui_FullApp'] = Gui_FullApp;
}());
