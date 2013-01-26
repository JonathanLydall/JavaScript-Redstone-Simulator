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

/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * Date: 2011-12-30
 * 
 */

(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "ModelView_Canvas_Default";
	var funcName = "ModelView_CanvasSide";
	
	namespace[funcName] = function(options) {
		this.options = options;
		this._construct();
	};
	
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	/**
	 * "Constants" 
	 */
	var 
		NORTH = 0,
		EAST = 1,
		SOUTH = 2,
		WEST = 3;
		
	proto.construct = function() {
		this.currentSlice = 0;
		this.currentFacing = NORTH;
		this.drawMethod = "drawSideView";
		$('#'+this.containerDomId+' .direction').html(new Array('N','E','S','W')[this.currentFacing]);
	}
	
	/**
	 * Generates the HTML for the controls of the model view, called in the parent class' _construct method 
	 */
	proto.getControlsHtml = function() {
		 var returnString = 
		 	'<span class="status">' +
				'&#8593;: <span class="direction">-</span>' +
				'X: <span class="coords x">-</span>' +
				'Y: <span class="coords y">-</span>' +
				'Z: <span class="coords z">-</span>' +
			'</span>' +
			'<img class="arrowUp" src="images/icons/modelviewControls/arrow-up.png" />' +
			'<img class="arrowDown" src="images/icons/modelviewControls/arrow-down.png" />' +
			'<img class="rotateClockwise" src="images/icons/modelviewControls/rotate-right.png" />' +
			'<img class="rotateAntiClockwise" src="images/icons/modelviewControls/rotate-left.png" />' +
			'<img class="zoomIn" src="images/icons/modelviewControls/zoom-in.png" />' +
			'<img class="zoomOut" src="images/icons/modelviewControls/zoom-out.png" />' +
			'<img class="exportImage" src="images/icons/modelviewControls/export-image.png" />';
		return returnString;
	}
	

	proto.bindControlEvents = function() {
		$('#'+this.containerDomId+' .arrowUp').bind('click', {t: this}, function(e) {e.data.t.layerUp()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .arrowUp'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.layerUp.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.layerUp.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_layer_up');

		$('#'+this.containerDomId+' .arrowDown').bind('click', {t: this}, function(e) {e.data.t.layerDown()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .arrowDown'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.layerDown.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.layerDown.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_layer_down');
		
		$('#'+this.containerDomId+' .rotateClockwise').bind('click', {t: this}, function(e) {e.data.t.rotateClockwise()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .rotateClockwise'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.rotateClockwise.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.rotateClockwise.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_rotate_clockwise');

		$('#'+this.containerDomId+' .rotateAntiClockwise').bind('click', {t: this}, function(e) {e.data.t.rotateAntiClockwise()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .rotateAntiClockwise'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.rotateAntiClockwise.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.rotateAntiClockwise.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_rotate_anti_clockwise');

		$('#'+this.containerDomId+' .zoomIn').bind('click', {t: this}, function(e) {e.data.t.zoomLevelIncrease()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .zoomIn'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.zoomIn.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.zoomIn.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_zoom_increase');
		
		$('#'+this.containerDomId+' .zoomOut').bind('click', {t: this}, function(e) {e.data.t.zoomLevelDecrease()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .zoomOut'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.zoomOut.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.zoomOut.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_zoom_decrease');
		
		$('#'+this.containerDomId+' .exportImage').bind('click', {t: this}, function(e) {e.data.t.exportImage()});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .exportImage'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.exportImage.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.exportImage.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_exportImage');
	}
	
	/**
	 * Translates out current grid coordinate into a world coordinate, based on current direction being faced 
	 * usefull for knowing where in the world our block is based on where our mouse is
	 * 
	 * Depth is how many layers down we are checking from our currentSlice, set to 0 for currentSlice
	 */
	proto.getWorldCoordsFromGridCoords = function(xGrid, yGrid, depth) {
		if (this.gui.mcSim.World == null) return {x: 0, y: 0, z: 0}; //if the world is still loading while we are hovering over, an error happens
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		
		var xWorldSize = worldData.getSizeX();  
		var yWorldSize = worldData.getSizeY();  
		var zWorldSize = worldData.getSizeZ();  

		switch (this.currentFacing) {
			case NORTH:
				return {
					x: xGrid,
					y: yWorldSize - yGrid - 1,
					z: currentSlice - depth
				};
				break;
			case EAST:
				return {
					x: currentSlice + depth,
					y: yWorldSize - yGrid - 1,
					z: xGrid
				};
				break;
			case SOUTH:
				return {
					x: xWorldSize - xGrid - 1,
					y: yWorldSize - yGrid - 1,
					z: currentSlice + depth
				};
				break;
			case WEST:
				return {
					x: currentSlice - depth,
					y: yWorldSize - yGrid - 1,
					z: zWorldSize - xGrid - 1
				};
				break;
		}
	}
	
	/**
	 * Translates world coordinates into grid coordinates based on current direction
	 */
	proto.getGridCoordsFromWorldCoords = function(xWorld, yWorld, zWorld) {
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		
		var xWorldSize = worldData.getSizeX();
		var yWorldSize = worldData.getSizeY();
		var zWorldSize = worldData.getSizeZ();
				
		switch (this.currentFacing) {
			case NORTH:
				return {
					x: xWorld,
					y: yWorldSize - yWorld - 1
				};
				break;
			case EAST:
				return {
					x: zWorld,
					y: yWorldSize - yWorld - 1
				};
				break;
			case SOUTH:
				return {
					x: xWorldSize - xWorld - 1,
					y: yWorldSize - yWorld - 1
				};
				break;
			case WEST:
				return {
					x: zWorldSize - zWorld - 1,
					y: yWorldSize - yWorld - 1
				};
				break;
		}
	}
	
	/**
	 * See if world coords are in the current slice + offset based on the current direction
	 *  
	 * Returns true or false
	 */
	proto.worldCoordsAreInRenderRange = function(xCoord, yCoord, zCoord) {
		var lowerLayersToDraw = this.lowerLayersToDraw;
		var currentSlice = this.currentSlice;
		var returnValue;
		
		if (zCoord < 0 || yCoord < 0 || zCoord < 0) {
			returnValue = false;
		}
		
		switch (this.currentFacing) {
			case NORTH:
				returnValue = (currentSlice - lowerLayersToDraw <= zCoord && zCoord <= currentSlice || zCoord == currentSlice + 1);
				break;
			case SOUTH:
				returnValue = (currentSlice + lowerLayersToDraw >= zCoord && zCoord >= currentSlice || zCoord == currentSlice - 1);
				break;
			case WEST:
				returnValue = (currentSlice - lowerLayersToDraw <= xCoord && xCoord <= currentSlice || xCoord == currentSlice + 1);
				break;
			case EAST:
				returnValue = (currentSlice + lowerLayersToDraw >= xCoord && xCoord >= currentSlice || xCoord == currentSlice - 1);
				break;
			default: throw new Error("Unexpected case");
		}
		
		var debugReturn = false;
		if (returnValue && debugReturn) {
			console.log(
				"worldCoordsAreInRenderRange(): returnValue=%s, currentFacing=%s, currentSlice=%s, lowerLayersToDraw=%s, coords=x:%s, y:%s, z:%s",
				returnValue,
				this.currentFacing,
				currentSlice,
				lowerLayersToDraw,
				xCoord,
				yCoord,
				zCoord
			);
		}

		return returnValue;
	}
	
	/**
	 * Based on our direction we are facing and our current layer, ensure that our number of lower layers to
	 * draw doesn't extend outside of our world size; 
	 */
	proto.getLayersToDrawCount = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		var drawDepth = this.lowerLayersToDraw;
		var currentFacing = this.currentFacing;
		
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		
		switch (currentFacing) {
			case NORTH:
				return (currentSlice - drawDepth >= 0) ? drawDepth : currentSlice;  
				break;
			case EAST:
				return (currentSlice + drawDepth <= xWorldSize) ? drawDepth : xWorldSize - currentSlice;  
				break;
			case SOUTH:
				return (currentSlice + drawDepth <= zWorldSize) ? drawDepth : zWorldSize - currentSlice;  
				break;
			case WEST:
				return (currentSlice - drawDepth >= 0) ? drawDepth : currentSlice;  
				break;
			
		}
	}
		
	proto.rotateClockwise = function() {
		this.changeFacingTo(new Array(1, 2, 3, 0)[this.currentFacing]);
	}
	
	proto.rotateAntiClockwise = function() {
		this.changeFacingTo(new Array(3, 0, 1, 2)[this.currentFacing]);
	}
	
	proto.changeFacingTo = function(facing) {
		this.currentFacing = facing;
		var maxSlice = this.getMaxSlice();
		if (this.currentSlice >= maxSlice) {
			this.currentSlice = maxSlice;
		}
		$('#'+this.containerDomId+' .direction').html(new Array('N','E','S','W')[this.currentFacing]);
		this.drawAllBlocks();
	}
	
	/**
	 * Tries moving up one layer up
	 */
	proto.layerUp = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		var currentSlice = this.currentSlice;
		var currentFacing = this.currentFacing;
		
		switch (currentFacing) {
			case NORTH:
				if (currentSlice + 1 < zWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case EAST:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case SOUTH:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case WEST:
				if (currentSlice + 1 < xWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
		}
	}
	
	/**
	 * Tries moving down one layer down
	 */
	proto.layerDown = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		var currentSlice = this.currentSlice;
		var currentFacing = this.currentFacing;
		
		switch (currentFacing) {
			case NORTH:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case EAST:
				if (currentSlice + 1 < xWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case SOUTH:
				if (currentSlice + 1 < zWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case WEST:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
		}
	}
	
	/**
	 * Based on the current direction it's facing, returns the max slice that is possible 
	 */
	proto.getMaxSlice = function() {
		var xWorldSize = this.gui.mcSim.World.worldData.getSizeX();
		var zWorldSize = this.gui.mcSim.World.worldData.getSizeZ();
		var currentFacing = this.currentFacing;

		if (currentFacing == NORTH || currentFacing == SOUTH) {
			return zWorldSize;
		}
		else {
			return xWorldSize;
		}
	}
	
	/**
	 * Tries moving to the specified layer
	 */
	proto.layerTo = function(layerNumber) {
		var currentSlice = this.currentSlice;
		var maxSlice = this.getMaxSlice();

		if (
			layerNumber < maxSlice &&
			layerNumber >= 0 &&
			layerNumber != currentSlice
		) {
			this.currentSlice = layerNumber;
			this.drawAllBlocks();
			return true;
		}
		return false;
	}

	/**
	 * Check and see if the dimensions of a "world" have changed and if we maybe need to change our canvas size.
	 */
	proto.checkSizeForDimensionReset = function() {
		var currentRows = this.rows;
		var worldRows = this.mcSim.worldData.getSizeY();
		
		var currentColumns = this.columns;
		switch (this.currentFacing) {
			case NORTH:
				var worldColumns = this.mcSim.worldData.getSizeX();
				break;
			case EAST:
				var worldColumns = this.mcSim.worldData.getSizeZ();
				break;
			case SOUTH:
				var worldColumns = this.mcSim.worldData.getSizeX();
				break;
			case WEST:
				var worldColumns = this.mcSim.worldData.getSizeZ();
				break;
		}
		
		
		if (
			currentColumns != worldColumns ||
			currentRows != worldRows
		) {
			this.setDimensions({
				columns: worldColumns,
				rows: worldRows
			});
		}
	}
	
	
}());
