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
	var funcName = "ModelView_CanvasTop";
	var parentFunc = "ModelView_Canvas_Default";
	
	namespace[funcName] = function(options) {
		this.options = options;
		this._construct();
	};
	
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	 
	proto.construct = function() {
		this.currentLayer = 0;
		this.currentFacing = 0; //At this time only used by sideview, but our draw methods use this to determine based on the direction of the viewport, how we should draw blocks
		this.drawMethod = "drawTopView";
	};
	
	/**
	 * Generates the HTML for the controls of the model view, called in the parent class' _construct method 
	 */
	proto.getControlsHtml = function() {
		 var returnString = 
		 	'<span class="status">' +
				'N: <span class="direction">&#8593;</span>' +
				'X: <span class="coords x">0</span>' +
				'Y: <span class="coords y">0</span>' +
				'Z: <span class="coords z">0</span>' +
			'</span>' +
			'<img class="arrowUp" src="images/icons/modelviewControls/arrow-up.png" />' +
			'<img class="arrowDown" src="images/icons/modelviewControls/arrow-down.png" />' +
			'<img class="zoomIn" src="images/icons/modelviewControls/zoom-in.png" />' +
			'<img class="zoomOut" src="images/icons/modelviewControls/zoom-out.png" />' +
			'<img class="exportImage" src="images/icons/modelviewControls/export-image.png" />';
		return returnString;
	};
	
	/**
	 * Binds events to the controls of the modelView 
	 */
	proto.bindControlEvents = function() {
		$('#'+this.containerDomId+' .arrowUp').bind('click', {t: this}, function(e) {e.data.t.layerUp();});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .arrowUp'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.layerUp.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.layerUp.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_layer_up');
		
		$('#'+this.containerDomId+' .arrowDown').bind('click', {t: this}, function(e) {e.data.t.layerDown();});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .arrowDown'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.layerDown.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.layerDown.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_layer_down');
		
		$('#'+this.containerDomId+' .zoomIn').bind('click', {t: this}, function(e) {e.data.t.zoomLevelIncrease();});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .zoomIn'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.zoomIn.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.zoomIn.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_zoom_increase');
		
		$('#'+this.containerDomId+' .zoomOut').bind('click', {t: this}, function(e) {e.data.t.zoomLevelDecrease();});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .zoomOut'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.zoomOut.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.zoomOut.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_zoom_decrease');
		
		$('#'+this.containerDomId+' .exportImage').bind('click', {t: this}, function(e) {e.data.t.exportImage();});
		this.tooltip.createForElement(
			/* $domEelement           */ $('#'+this.containerDomId+' .exportImage'),
			/* position               */ 'below',
			/* headerTextResourceName */ 'toolbar.modelview.tooltips.exportImage.title',
			/* bodyTextResourceName   */ 'toolbar.modelview.tooltips.exportImage.description',
			/* shortcutKeyScope       */ 'main',
			/* shortcutKeyEventName   */ 'modelView_exportImage');
	};
		
	
	/**
	 * Tries moving up one layer up
	 */
	proto.layerUp = function() {
		if (this.currentLayer + 1 < this.mcSim.worldData.getSizeY()) {
			this.currentLayer++;
			this.drawAllBlocks();
		}
	};
	
	/**
	 * Tries moving down one layer down
	 */
	proto.layerDown = function() {
		if (this.currentLayer > 0) {
			this.currentLayer--;
			this.drawAllBlocks();
		}
	};
	
	/**
	 * Tries moving to the specified layer
	 */
	proto.layerTo = function(layerNumber) {
		if (
			layerNumber < this.mcSim.worldData.getSizeY() &&
			layerNumber >= 0 &&
			layerNumber != this.currentLayer
		) {
			this.currentLayer = layerNumber;
			this.drawAllBlocks();
			return true;
		}
		return false;
	};

	/**
	 * Check and see if the dimensions of a "world" have changed and if we maybe need to change our canvas size.
	 */
	proto.checkSizeForDimensionReset = function() {
		var xSize = this.mcSim.worldData.getSizeX();
		var ySize = this.mcSim.worldData.getSizeZ();
		
		if (
			this.columns != xSize ||
			this.rows != ySize
		) {
			this.setDimensions({
				columns: xSize,
				rows: ySize
			});
		}
	};
	
	/**
	 * Translates world coordinates into grid coordinates based on current direction
	 */
	proto.getGridCoordsFromWorldCoords = function(xWorld, yWorld, zWorld) {
		return {
			x: xWorld,
			y: zWorld
		};
	};
	
	/**
	 * Based on our direction we are facing and our current layer, ensure that our number of lower layers to
	 * draw doesn't extend outside of our world size; 
	 */
	proto.getLayersToDrawCount = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var currentLayer = this.currentLayer;
		var drawDepth = this.lowerLayersToDraw;
		
		return (currentLayer - drawDepth >= 0) ? drawDepth : currentLayer;  
	};

	proto.getWorldCoordsFromGridCoords = function(xGrid, yGrid, depth) {
		if (this.gui.mcSim.World == null) return {x: 0, y: 0, z: 0}; //if the world is still loading while we are hovering over, an error happens
		var currentLayer = this.currentLayer;
		
		return {
			x: xGrid,
			y: currentLayer - depth,
			z: yGrid
		};
	};

	/**
	 * See if world coords are in the currentLayer + renderdepth
	 *  
	 * Returns true or false
	 */
	proto.worldCoordsAreInRenderRange = function(xCoord, yCoord, zCoord) {
		var lowerLayersToDraw = this.lowerLayersToDraw;
		var currentLayer = this.currentLayer;
		var returnValue;
		
		if (zCoord < 0 || yCoord < 0 || zCoord < 0) {
			returnValue = false;
		}
		
		returnValue = (currentLayer - lowerLayersToDraw <= yCoord && yCoord <= currentLayer || yCoord == currentLayer + 1);
		
		var debugReturn = false;
		if (debugReturn) {
			console.log(
				"worldCoordsAreInRenderRange(): returnValue=%s, currentLayer=%s, lowerLayersToDraw=%s, coords=x:%s, y:%s, z:%s",
				returnValue,
				currentLayer,
				lowerLayersToDraw,
				xCoord,
				yCoord,
				zCoord
			);
		}

		return returnValue;
	};
}());