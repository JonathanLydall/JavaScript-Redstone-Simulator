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
var funcName = "guiFullToolbar";

var proto = function(gui) {
	var t = this;
	var toolbarContainerDomSelector = "#toolbars";
	var modelViewContainerDomSelector = "#workarea";
	var toolbarDomSelector = ".toolbar";
	var maxToolbars = 4;
	
	this.gui = gui;
	this.toolbarCount = 4;
	this.slotCount = 10;
	this.currentToolbar = 0;
	this.currentSlot = 0;
	this.showing = false;
	this.iconSize = 40;
	this.L10n = this.gui.localization;
	
	//TODO: Break out tools and have them be able register themselves
	this.extraTools = [
		{
			name: "pan",
			description: "tools.description.pan",
			icon: 'images/icons/tools/transform-move.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.pan.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.pan.body")
		},
		{
			name: "toggle",
			description: "tools.description.toggle",
			icon: 'images/icons/tools/click.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.toggle.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.toggle.body")
		},
		{
			name: "rotateBlock",
			description: "tools.description.rotateblock",
			icon: 'images/icons/tools/transform-rotate-2.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.rotateBlock.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.rotateBlock.body")
		},
		{
			name: "deleteBlock",
			description: "tools.description.deleteblock",
			icon: 'images/icons/tools/edit-delete-6.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.deleteBlock.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.deleteBlock.body")
		},
		{
			name: "blockInfo",
			description: "tools.description.blockinfo",
			icon: 'images/icons/tools/system-help-3.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.blockInfo.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.blockInfo.body")
		},
	];

	this.construct = function() {
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		this.registerInputBindings();
		this.registerOptions();
		this.initializeSelectionModal();
		this.initializeToolbarLayout();
		this.renderToolbars();
		
		$('.toolbarSlot').bind('click', function(e) {
			t.toolbarSlot_onClick(e);
		});

		this.onUserSettingsLoad(); //Populates the toolbars with user set icons, also called if the user logs in later

		//Bind the drggable event to icons, but disable until we have the toolbar editing modal showing:
		this.bindDraggable('.icon');
		$('.icon').draggable('disable');
	};
	
	/**
	 * Draws the unpopulated toolbars onto the screen
	 */
	this.initializeToolbarLayout = function() {
		$('body').append('<div id="toolbars"></div>');
		
		var toolbarCount = this.gui.getOption("toolbars", "count");
		var html;
		toolbarCount = 1;
		
		for (var i=0; i<maxToolbars; i++) {
			html = '<span class="toolbar" id="guiFullToolbar_'+i+'">';
			for (var j=0; j<this.slotCount; j++) {
				html += '<span class="toolbarSlot unselected" id="guiFullToolbarIcon_'+i+'_'+j+'" data-toolbar="'+i+'" data-slot="'+j+'"></span>';
			}
			html += '</span>';
			$(toolbarContainerDomSelector).append(html);
		}
		
		$('.toolbarSlot').html('<span class="emptySlot"></span>');

		$('.emptySlot').css({
			width: this.iconSize + "px",
			height: this.iconSize + "px"
		});

		//Make the toolbar slots valid dropable points for our drag and drop for icons
		$('.toolbarSlot').droppable({
			accept: '.icon',
			activeClass: 'toolbarSlot-droppable-active',
			hoverClass: 'toolbarSlot-droppable-hover',
			drop: function() {
				t.iconDropped(
					$(this).data('toolbar'),
					$(this).data('slot')
				);
			}
		});
		
		var self = this;
		var tooltip = this.gui.tooltip; 
		
		tooltip.creteForElementWithDynamicParameters($('.toolbarSlot'), function(context)
		{
			return self.getParamatersForTooltip(context);
		});
	};
	
	this.getParamatersForTooltip = function(context) {
		var toolbar = $(context).data('toolbar');
		var slot = $(context).data('slot');
		
		var $domElement = $('#guiFullToolbarIcon_'+toolbar+'_'+slot);
		var shortcutKeyScope = 'main';
		var shortcutKeyEventName = 'toolbarSlotShortcutKey_'+toolbar+'_'+slot; 
		var headerText = "", bodyText = "";

		var slotData = this.getSlotData(toolbar, slot);
		if (slotData != null) {
			switch (slotData[0]) {
				case "block":
					var blockData = this.gui.placeableBlocks[slotData[1]];
					var blockId = (blockData.blockMetadata == 0) ? blockData.blockID : blockData.blockID + ':' + blockData.blockMetadata;
					var blockName = this.gui.localization.getString(blockData.blockName);
			
					headerText = blockName + ' ('+blockId+')';
					break;
				case "tool":
					headerText = this.extraTools[slotData[1]].tooltipHeader;
					bodyText = this.extraTools[slotData[1]].tooltipBody;
					break;
				default: throw new Error("Unexpected case");
			}
			
			return {
				$domElement: $domElement,
				position: "right",
				headerText: headerText,
				bodyText: bodyText,
				shortcutKeyScope: shortcutKeyScope,
				shortcutKeyEventName: shortcutKeyEventName
			};
		}
		
		return null;
	};
	
	/**
	 * Used to render the toolbars, also called back if the toolbar count is changed in options
	 */
	this.renderToolbars = function() {
		var toolbarCount = this.gui.getOption("toolbars", "count");

		for (var i=0; i<maxToolbars; i++) {
			if (i < toolbarCount) {
				$('#guiFullToolbar_'+i).show();
			}
			else {
				$('#guiFullToolbar_'+i).hide();
			}
		}
		
		$(toolbarContainerDomSelector).width($(toolbarDomSelector).width()*toolbarCount);
		$(modelViewContainerDomSelector).css("left", $(toolbarContainerDomSelector).width() + $(toolbarContainerDomSelector).position().left);

		this.setSelectedSlot(0,0);
	};

	/**
	 * When a toolbar slot is clicked
	 */
	this.toolbarSlot_onClick = function(e) {
		var targetData = $(e.target).data();
		if (
			typeof targetData.toolbar != 'undefined' &&
			this.getSlotData(targetData.toolbar, targetData.slot) != null
		) {
			this.setSelectedSlot(targetData.toolbar, targetData.slot);
		}
	};
	
	/**
	 * A modal from which we can drag icons onto our toolbars
	 */
	this.initializeSelectionModal = function() {
		var selectionModalHtml =
			'<span class="liveSearchWrapper"><input type="text" id="liveSearch"/></span>' +
			'<div class="iconSelectionBox">' +
				'<table>';
				
		//extra tools:
		for (var i=0; i<this.extraTools.length; i++) {
			var toolDescription = this.gui.localization.getString(this.extraTools[i].description);
			selectionModalHtml += 
				'<tr>' + 
					'<td><img class="icon" data-tool-type="tool" data-array-link="'+i+'" style="width: '+this.iconSize+'px; height: '+this.iconSize+'px;" src="' + this.extraTools[i].icon + '"/></td>' + 
					'<td class="blockId"></td>' + 
					'<td class="blockName">' + toolDescription + '</td>' + 
				'</tr>';
		}
		
		//Materials which can be placed:
		var placeableBlocks = this.gui.placeableBlocks;
		for (var i in placeableBlocks) {
			var blockId = (placeableBlocks[i].blockMetadata == 0) ? placeableBlocks[i].blockID : placeableBlocks[i].blockID + ':' + placeableBlocks[i].blockMetadata;
			var blockName = this.gui.localization.getString(placeableBlocks[i].blockName);
			
			selectionModalHtml += 
				'<tr>' + 
					'<td><img class="icon" data-tool-type="block" data-array-link="'+i+'" src="' + placeableBlocks[i].iconImageData + '"/></td>' + 
					'<td class="blockId"><pre> '+blockId+' </pre></td>' + 
					'<td class="blockName">' + blockName + '</td>' + 
				'</tr>';
		}

		selectionModalHtml +=
				'</table>'+
			'</div>';

		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setContent(selectionModalHtml);
		this.modal.setCloseButtonText(this.L10n.getString("guiFull.button.close"));
		this.modal.bind('show', function() {
			t.show();
		});
		
		this.modal.bind('hide', function() {
			t.hide();
		});
		
		$('#liveSearch').keyup(
			function() {

			var searchTerm = $('#liveSearch').val();
			
				$('tr').each(function() {
					if($(this).text().search(new RegExp(searchTerm, "i")) < 0) {
						$(this).hide();
					}
					else {
						$(this).show();
					}
					
				});
			}
		);
		
		$('.inner .icon').bind('mousedown', function() {
			t.scrollTop = $('.inner').scrollTop(); //fix for firefox jumping the inner div scrolling to the top any time you try drag
		});
	};
	
	this.registerInputBindings = function() {
		var t = this;
		
		this.gui.input.bindInputEvent({
			category: 'toolbars.general',
			savedKeyName: 'nextToolbarSlot',
			description: 'toolbars.changetool.next',
			callbackFunction: function(e, data) {t.toolbarSlotChange(1);}
		});

		this.gui.input.bindInputEvent({
			category: 'toolbars.general',
			savedKeyName: 'previousToolbarSlot',
			description: 'toolbars.changetool.previous', 
			callbackFunction: function(e, data) {t.toolbarSlotChange(-1);}
		});
		
		for (var i=0; i<maxToolbars; i++) {
			for (var j=0; j<this.slotCount; j++) {
				this.gui.input.bindInputEvent({
					category: 'toolbar'+i,
					savedKeyName: 'toolbarSlotShortcutKey_'+i+'_'+j,
					description: 'toolbars.shortcut.slot'+j,
					data: {toolbar: i, slot: j},
					callbackFunction: function(e, data) {t.slotShortcutKey(data);}
				});
			}
		}
	};
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options;

		options.registerOption({
			type: 'number',
			name: 'count',
			category: 'toolbars',
			defaultValue: 2,
			minValue: 1,
			maxValue: 4,
			callbackScope: 'toolbars',
			callbackForOnChange: function() {t.renderToolbars();}
		});
	};
	
	/**
	 * Sets a slot as selected
	 * 
	 * @param	{Integer}	toolbar	The toolbar
	 * @param	{Integer}	slot	The slot
	 */
	this.setSelectedSlot = function(toolbar, slot) {
		var toolbarCount = this.gui.getOption("toolbars", "count");
		if (toolbar >= toolbarCount) {
			return; //Can happen if they use a shortcut key to select it
		}
		
		this.currentToolbar = toolbar;
		this.currentSlot = slot;
		$('.selected').addClass('unselected');
		$('.selected').removeClass('selected');
		$('#guiFullToolbarIcon_'+toolbar+'_'+slot).addClass('selected');
		$('#guiFullToolbarIcon_'+toolbar+'_'+slot).removeClass('unselected');
		
		var slotInfo = this.getSlotData(toolbar, slot);
		if (slotInfo != null) {
			var toolType = slotInfo[0];
			var toolId = slotInfo[1];
			switch (toolType) {
				case "block":
					this.gui.toolHandler.activeTool = "material";
					break; 
				case "tool":
					this.gui.toolHandler.activeTool = this.extraTools[toolId].name;
					break;
			}
		}
	};
	
	this.toolbarSlotChange = function(delta) {
		var currentSlot = this.currentSlot;
		var currentToolbar = this.currentToolbar;
		var toolbarCount = this.gui.getOption("toolbars", "count");
		
		do {
			if (delta > 0) {
				currentSlot++;
				if (currentSlot >= this.slotCount) {
					currentSlot = 0;
					currentToolbar++;
					if (currentToolbar >= toolbarCount) currentToolbar = 0;
				}
			}
			else if (delta < 0) {
				currentSlot--;
				if (currentSlot < 0) {
					currentSlot = this.slotCount-1;
					currentToolbar--;
					if (currentToolbar < 0) currentToolbar = toolbarCount-1;
				}
			}
			else {
				throw new Error("Unexpected delta");
			}
			
			if (
				currentSlot == this.currentSlot &&
				currentToolbar == this.currentToolbar
			) {
				//we're back where we started, there is no more than one slot with a tool in it, so, break
				break;
			}

			//We break if we encounter a slot which is populated
			if (this.getSlotData(currentToolbar, currentSlot) != null) break;
		} while (true);
		
		this.setSelectedSlot(currentToolbar, currentSlot);
	};
	
	this.slotShortcutKey = function(data) {
		if (this.getSlotData(data.toolbar, data.slot) != null) this.setSelectedSlot(data.toolbar, data.slot);
	};
	
	/**
	 * Returns whatever is currently in the slot
	 */
	this.getSlotData = function(toolbar, slot) {
		if(
			typeof this.gui.userSettings.toolbars == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined' ||
			this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == ''
		) {
			//Empty slot
			return null;
		}
		return this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot];
	};
	

	/**
	 * Used to retrive the blockId and metadata for the currently selected material
	 */
	this.getMaterialData = function() {
		var link = this.getSlotData(this.currentToolbar, this.currentSlot)[1];
		return {
			blockId: this.gui.placeableBlocks[link].blockID,
			blockMetadata: this.gui.placeableBlocks[link].blockMetadata
		};
	};

	/**
	 * Callback for when user settings are loaded, populates the toolbars with the saved settings.
	 */
	this.onUserSettingsLoad = function() {
		//Draw icons:
		for(var i=0; i<4; i++) {
			for(var j=0; j<10; j++) {
				this.renderIcon(i,j);
			}
		}

		if (this.getSlotData(0,0) != null) {
			this.setSelectedSlot(0,0);
		}
		else {
			this.toolbarSlotChange(1); //Otherwise, pretend we used the mousewheel, which only selects a valid tool
		}
	};
	
	this.show = function() {
		this.showing = true;
		$('.icon').draggable('enable');
		$('#toolbars').addClass('onIconChange');
	};
	
	this.hide = function() {
		this.showing = false;
		
		$('#liveSearch').val('');
		$('#liveSearch').trigger('keyup');
		
		$('.icon').draggable('disable');
		this.gui.userManager.saveUserSettings();

		$('#toolbars').removeClass('onIconChange');
	};
	
	/**
	 * Calls draggable binding on an element
	 * 
	 * @param	{String}	selector 	The CSS selector rule of which DOM elements to apply the draggable binding
	 */
	this.bindDraggable = function(selector) {
		var t = this;
		$(selector).draggable({
			helper: 'clone',
			appendTo: 'body',
			scroll: false,
			zIndex: 200,
			//cursorAt: {top: 1, right: 1},
			start: function(event, ui) {
				t.pickedUpItem = $(this).data('arrayLink');
				t.pickedUpItemType = $(this).data('toolType');
				
				$('.inner').scrollTop(t.scrollTop); //fix as firefox jumps the inner div scrolling to the top

				if (typeof $(this).data('toolbar') != 'undefined') {
					delete t.gui.userSettings.toolbars.slots[$(this).data('toolbar')]['slot'+$(this).data('slot')];
					t.renderIcon($(this).data('toolbar'), $(this).data('slot'));
				}

			}
		});
		
	};
	
	/**
	 * Event called when a tool icon is dropped onto a toolbar slot. 
	 */
	this.iconDropped = function(toolbar, slot) {
		var toolId = this.pickedUpItem;
		var toolType = this.pickedUpItemType;
		
		if (typeof this.gui.userSettings.toolbars == 'undefined') this.gui.userSettings.toolbars = {};
		if (typeof this.gui.userSettings.toolbars.slots == 'undefined') this.gui.userSettings.toolbars.slots = [{},{},{},{}];
		if (typeof this.gui.userSettings.toolbars.slots[toolbar].length != 'undefined') this.gui.userSettings.toolbars.slots[toolbar] = {}; //Sometimes we can get arrays in here instead of objects, as only arrays have lengths, this is any easy way to check
		if (typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined') this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] = ['',''];
		
		this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] = [toolType, toolId];
		this.renderIcon(toolbar, slot);
	};
	
	/**
	 * Updates the icon for a toolbar slot
	 */
	this.renderIcon = function(toolbar, slot) {
		var t = this;
		var domId = '#guiFullToolbarIcon_' + toolbar + '_' + slot;
		
		if(
			typeof this.gui.userSettings.toolbars == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined' ||
			this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == ''
		) {
			//Empty slot
			$(domId).html('<span class="emptySlot"></span>');
			$(domId+' .emptySlot').css({
				width: this.iconSize + "px",
				height: this.iconSize + "px"
			});
			return;
		}
		
		var toolType = this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot][0];
		var toolId = this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot][1];
		switch (toolType) {
			case 'block': //Type of tool is a block/material placement
				var blockData = this.gui.placeableBlocks[toolId];
				if (typeof blockData == 'undefined') throw new Error('toolbar.renderIcon(): Invalid blocktype "'+toolId+'"');
				$(domId).html('<img class="icon" data-slot="'+slot+'" data-toolbar="'+toolbar+'" data-tool-type="block" data-array-link="'+ toolId +'" src="' + blockData.iconImageData+ '"/>');
				break;
			case 'tool':
				var tool = this.extraTools[toolId];
				$(domId).html('<img class="icon" data-slot="'+slot+'" data-toolbar="'+toolbar+'" data-tool-type="tool" data-array-link="'+ toolId +'" style="width: '+this.iconSize+'px; height: '+this.iconSize+'px;" src="' + tool.icon+ '"/>');
				break; 
		}
		this.bindDraggable(domId + ' img');
	};
	
	this.construct();
};
namespace[funcName] = proto;
})();
