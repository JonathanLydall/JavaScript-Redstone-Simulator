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

com.mordritch.mcSim.toolHandler = function(gui) {
	this.gui = gui;
	this.lastMaterialPlacedCoords = {x: "-", y: "-", z: "-"};
	this.infoModal = new com.mordritch.mcSim.guiFullModal(gui);
	this.lastMaterialPlacedAt = {x: null, y: null, z: null};
	this.debugEnabled = false;
	
	this.activeTool = "toggle";
	
	this.construct = function() {

		this.console = this.debugEnabled ? console : { "log": function () {} };
		
		var t = this;
		
		this.gui.input.bindInputEvent({
			savedKeyName: 'tool_primary',
			category: 'tools',
			description: 'shortcuts.tools.primary',
			callbackFunction: function(e) {t.onPrimaryInput(e, e.type == "mouseup");},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.onPrimaryInput_mouseMove(e, false);},
			alsoFireOnMouseUp: true
		});
		
		this.gui.input.bindInputEvent({
			savedKeyName: 'tool_secondary',
			category: 'tools',
			description: 'shortcuts.tools.secondary', 
			callbackFunction: function(e) {t.onSecondaryInput(e, e.type == "mouseup");},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.onSecondaryInput_mouseMove(e, false);},
			alsoFireOnMouseUp: true
		});
	};

	var currentX, currentY;
	
	this.onPrimaryInput = function(e, isMouseUpevent) {
		if (isMouseUpevent)
		{
			return;
		}
		switch (this.activeTool) {
			case "material":
				var materialData = this.gui.toolbars.getMaterialData();
				this.placeMaterial(e, false, materialData.blockId, materialData.blockMetadata);
				break;
			case "pan":
				this.pan(e, false);
				break;
			case "toggle":
				this.toggleBlock(e, false);
				break;
			case "rotateBlock":
				this.rotateBlock(e, false);
				break;
			case "deleteBlock":
				this.placeMaterial(e, false, 0, 0);
				break;
			case "blockInfo":
				this.blockInfo(e);
				break;
		}
		
		currentX = e.pageX;
		currentY = e.pageY;
	};
	
	this.onPrimaryInput_mouseMove = function(e) {
		switch (this.activeTool) {
			case "material":
				var materialData = this.gui.toolbars.getMaterialData();
				
				var self = this;
				linear(currentX, currentY, e.pageX, e.pageY, function(e2)
				{
					self.placeMaterial(e2, true, materialData.blockId, materialData.blockMetadata); //left click adds the block
				});
				
				break;
			case "pan":
				this.pan(e, true);
				break;
			case "deleteBlock":
				linear(currentX, currentY, e.pageX, e.pageY, function(e2)
				{
					self.placeMaterial(e2, true, 0, 0); //Right click deletes the block
				});
				this.placeMaterial(e, true, 0, 0);
				break;
		}
		
		currentX = e.pageX;
		currentY = e.pageY;

	};
	
	
	this.onSecondaryInput = function(e, isMouseUpevent) {
		if (isMouseUpevent)
		{
			switch (this.activeTool) {
				case "toggle":
					var t = this;
					window.setTimeout(function() { t.blockInfo(e); }, 0);
					break;
			}
		}
		else
		{
			switch (this.activeTool) {
				case "material":
					this.placeMaterial(e, false, 0, 0); //Right click deletes the block
					currentX = e.pageX;
					currentY = e.pageY;
					break;
				case "pan":
					this.pan(e, false);
					break;
				case "rotateBlock":
					this.rotateBlock(e, false);
					break;
				case "deleteBlock":
					this.placeMaterial(e, false, 0, 0);
					break;
			}
		}
	};
	
	this.onSecondaryInput_mouseMove = function(e) {
		switch (this.activeTool) {
			case "material":
				var self = this;
				linear(currentX, currentY, e.pageX, e.pageY, function(e2)
				{
					self.placeMaterial(e2, true, 0, 0); //Right click deletes the block
				});
				break;
			case "pan":
				this.pan(e, true);
				break;
			case "deleteBlock":
				this.placeMaterial(e, true, 0, 0);
				break;
		}
		currentX = e.pageX;
		currentY = e.pageY;
	};
	

	function linear(x0, y0, x1, y1, continuation)
	{
        var dots = [];
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        continuation({pageX: x0, pageY: y0});

        while(!((x0 == x1) && (y0 == y1)))
		{
            var e2 = err << 1;

            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }

            continuation({pageX: x0 + .5, pageY: y0 + .5});
        }

        return dots;
    }
	
	
	this.setBlockData = function(x, y, z, blockId, blockMetadata) {
		var block = this.gui.mcSim.Block.blocksList[blockId];
		var world = this.gui.mcSim.World;
		if (block.canPlaceBlockAt(world, x, y, z)) {
			world.setBlockAndMetadataWithNotify(x, y, z, blockId, blockMetadata);
			block.onBlockPlaced(world, x, y, z);
		}
		else {
			this.console.log(
				"setBlockData(): canPlaceBlockAt failed at x:%s, y:%s, z:%s, blockId: %s, blockMetadata: %s",
				x,
				y,
				z,
				blockId,
				blockMetadata
			);
		}
	};
	
	this.pan = function(e, onMousemove) {
		if (!onMousemove) {
			this.gui.modelviews.pan_start(e);
		}
		else {
			this.gui.modelviews.pan_onMouseMove(e);
		}		
	};
	
	this.placeMaterial = function(e, triggeredByMouseMove, blockId, blockMetadata) {
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (
			coords != false &&
			(
				!triggeredByMouseMove || 
				!(
					this.lastMaterialPlacedAt.x == coords.x &&
					this.lastMaterialPlacedAt.y == coords.y &&
					this.lastMaterialPlacedAt.z == coords.z
				)
			)
		) {
			this.lastMaterialPlacedAt = coords;
			
			var blockToPlace = this.gui.mcSim.getBlockById(blockId);
			var renderAsNormalBlock = blockToPlace.renderAsNormalBlock();
			
			//TODO: Make multilayer editing optional
			//For multilayer editing, if the current level is a solid block, we action the layer above
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x1, coords.y1, coords.z1);

			var blockMetadataCurrentLayer = this.gui.mcSim.World.getBlockMetadata(coords.x, coords.y, coords.z);
			
			//Try place block in current layer, then above layer
			if (blockId != 0 && (!renderAsNormalBlock || blockMetadataCurrentLayer != blockMetadata) && (renderAsNormalBlock || blockCurrentLayer.blockID != blockId && !blockCurrentLayer.renderAsNormalBlock())) {
				if (renderAsNormalBlock && !blockCurrentLayer.renderAsNormalBlock() && blockCurrentLayer.blockID != 0) {
					var currentLayerBlockID = blockCurrentLayer.blockID
					this.setBlockData(coords.x, coords.y, coords.z, blockId, blockMetadata);
					this.setBlockData(coords.x1, coords.y1, coords.z1, currentLayerBlockID, blockMetadataCurrentLayer);
				}
				else
					this.setBlockData(coords.x, coords.y, coords.z, blockId, blockMetadata);
			}
			else if (blockId != 0 && !renderAsNormalBlock && blockAboveLayer.blockID != blockId && blockCurrentLayer.renderAsNormalBlock()) {
				this.setBlockData(coords.x1, coords.y1, coords.z1, blockId, blockMetadata);
			}

			//Try place air in current layer
			else if (blockId == 0 && blockCurrentLayer.blockID != 0) {
				this.setBlockData(coords.x, coords.y, coords.z, blockId, blockMetadata);
			}
			
			
			//Try rotate block in above layer, then current layer
			else if (blockCurrentLayer.renderAsNormalBlock() && ((blockAboveLayer.blockID == blockId && blockId != 0) || (blockAboveLayer.sameBlockTypeAs(blockId)))) {
				blockAboveLayer.rotateBlock(world, coords.x1, coords.y1, coords.z1);
			}
			
			else if (blockId != 0 && (blockCurrentLayer.blockID == blockId || blockCurrentLayer.sameBlockTypeAs(blockId))) {
				blockCurrentLayer.rotateBlock(world, coords.x, coords.y, coords.z);
			}
			
			else {
				this.console.log(
					"placeMaterial(): Could not place block %s, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					blockId,
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				);
			}
		}
		
		this.gui.modelviews.markBlockNeedsUpdate(coords.x, coords.y, coords.z);
		this.gui.modelviews.flushMarkedBlocks();
	};

	this.toggleBlock = function(e, triggeredByMouseMove) {
		if (triggeredByMouseMove) return;
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (coords != false) {
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x1, coords.y1, coords.z1);
			if (!blockCurrentLayer.renderAsNormalBlock() && blockCurrentLayer.blockID != 0) {
				blockCurrentLayer.toggleBlock(world, coords.x, coords.y, coords.z);
			}
			else if (blockAboveLayer.blockID != 0) {
				blockAboveLayer.toggleBlock(world, coords.x1, coords.y1, coords.z1);
			}
			else {
				this.console.log(
					"toggleBlock(): Could not toggle block, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				);
			}
		}
		this.gui.modelviews.flushMarkedBlocks();
	};
	
	this.rotateBlock = function(e, triggeredByMouseMove) {
		if (triggeredByMouseMove) return;
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (coords != false) {
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y+1, coords.z);
			if (!blockCurrentLayer.renderAsNormalBlock() && blockCurrentLayer.blockID != 0) {
				blockCurrentLayer.rotateBlock(world, coords.x, coords.y, coords.z);
			}
			else if (blockAboveLayer.blockID != 0) {
				blockAboveLayer.rotateBlock(world, coords.x1, coords.y1, coords.z1);
			}
			else {
				this.console.log(
					"rotateBlock(): Could not rotate block, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				);
			}
		}
		this.gui.modelviews.flushMarkedBlocks();
	};
	
	this.blockInfo = function(e) {

		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var blockId = this.gui.mcSim.World.getBlockId(coords.x, coords.y, coords.z);
		var blockMetadata = this.gui.mcSim.World.getBlockMetadata(coords.x, coords.y, coords.z);
		var blockTileEntity = this.gui.mcSim.World.getBlockTileEntity(coords.x, coords.y, coords.z);
		var world = this.gui.mcSim.World;
		var block = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);

		if (coords != false) {
			var content =
				'<pre>' +
				'Block ID: ' + blockId + "\n" +
				'Metadata: ' + blockMetadata + "\n";
				
			if (blockTileEntity != null) {
				if (typeof blockTileEntity.loaded_NBT_Data != 'undefined') {
					content += 'Block Tile Entity Data: ' + JSON.stringify(blockTileEntity.loaded_NBT_Data, null, '  ') + "\n";
				}
				else {
					content += 'Block Tile Entity Data: ' + "\n";
					for (var i in blockTileEntity) {
						if (
							typeof blockTileEntity[i] != "object" &&
							typeof blockTileEntity[i] != "function"
						) {
							content += "  " + i + ' ('+typeof blockTileEntity[i]+'): '+ blockTileEntity[i] + "\n";
						}
					}
				}
			}
			
			if (blockId == 0) {
				content += 'Air has retracting block: ' + (world.getRetractingBlockEntity(coords.x, coords.y, coords.z) != null) + "\n";
			}
			content += block.getBlockInfo(world, coords.x, coords.y, coords.z);
			
			
			
			content +=
				'</pre>';
			this.infoModal.setContent(content);
			this.infoModal.show();
		}
		
	};
	
	this.construct();
};
