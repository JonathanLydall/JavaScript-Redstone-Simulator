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

com.mordritch.mcSim.guiFull_multiViewHandler = function(gui) {
	this.gui = gui;
	//this.currentActiveView = 0;
	this.modelViews = [];
	this.mouseOverModelView = null;
	
	this.construct = function() {
		$('body').append('<div id="workarea"></div');

		var t = this;
		this.gui.mcSim.bindModelView(this);

		this.registerOptions();

		this.bindInputs();
		this.setDimensions();
		
		if (this.gui.mcSim.worldIsLoaded) {
			this.setLoading(false);
		}
		else {
			this.setLoading(true);
		}
		
	}
	
	this.addModelView = function(cssClass, viewType) {
		var t = this;
		var view = {
			top: 'ModelView_CanvasTop',
			side: 'ModelView_CanvasSide'
		}[viewType];
		
		this.modelViews.push(
			new com.mordritch.mcSim[view]({
				cssClass: cssClass,
				simulator: this.gui.mcSim,
				gui: this.gui,
				onMouseEnterOrLeave: function(action, modelView) {t.onMouseEnterOrLeave(action, modelView);},
				offSetX: 0,
				offSetY: 0
			})
		);
	}
	
	this.removeModelView = function(cssClass) {
		var oldModelViewsArray = this.modelViews;
		this.modelViews = [];
		for (var i=0; i< oldModelViewsArray.length; i++) {
			if (oldModelViewsArray[i].cssClass != cssClass) {
				this.modelViews.push(oldModelViewsArray[i]);
			} 
		}
		$('.' + cssClass).remove();
	}
	
	this.getModelViewByCssClass = function(cssClass) {
		for (var i=0; i< this.modelViews.length; i++) {
			if (this.modelViews[i].cssClass == cssClass) {
				return this.modelViews[i];
			} 
		}
	}
	
	this.onMouseEnterOrLeave = function(action, modelView) {
		if (action == 'enter') {
			for (var i=0; i<this.modelViews.length; i++) {
				if (this.modelViews[i] == modelView) {
					this.mouseOverModelView = i;
					break;
				}
			}
		}
		else {
			this.mouseOverModelView = null;
		}
	}
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options

		options.registerOption({
			type: 'number',
			name: 'defaultZoomLevel',
			category: 'modelview',
			defaultValue: 2,
			minValue: 0.25,
			maxValue: 5,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'layerDownOpacity',
			category: 'modelview',
			defaultValue: 0.4,
			changeIncrement: 0.1, 
			minValue: 0,
			maxValue: 1,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'workTime',
			category: 'modelview',
			defaultValue: 40,
			changeIncrement: 10, 
			minValue: 12,
			maxValue: 5000,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'lowerLayersToDraw',
			category: 'modelview',
			defaultValue: 0,
			minValue: 0,
			maxValue: 10,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'borderWidth',
			category: 'modelview',
			defaultValue: 1,
			minValue: 0,
			maxValue: 10,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		this.onOptionsChange();
	}
	
	this.onOptionsChange = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].onOptionsChange();
		}
	}
	
	this.bindInputs = function() {
		var t = this;
		/*
		this.gui.input.bindInputEvent({
			savedKeyName: 'null',
			category: 'modelview',
			description: 'null',
			data: null,
			mouseMoveEvent: true,
			callbackFunction: null,
			callbackFunction_mouseMove: null,
		});
		*/
		
		
		//Scrolling
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_left',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.left',
			callbackFunction: function(e) {t.scroll('left');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_right',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.right',
			callbackFunction: function(e) {t.scroll('right');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_up',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.up',
			callbackFunction: function(e) {t.scroll('up');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_down',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.down',
			callbackFunction: function(e) {t.scroll('down');}
		});
		
		//Layer up/down
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_layer_up',
			category: 'modelview',
			description: 'shortcuts.modelview.layer.up',
			callbackFunction: function(e) {t.layerChange('up');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_layer_down',
			category: 'modelview',
			description: 'shortcuts.modelview.layer.down',
			callbackFunction: function(e) {t.layerChange('down');}
		});

		//Zooming:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_zoom_increase',
			category: 'modelview',
			description: 'shortcuts.modelview.zoom.increase',
			callbackFunction: function(e) {t.zoom('increase');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_zoom_decrease',
			category: 'modelview',
			description: 'shortcuts.modelview.zoom.decrease',
			callbackFunction: function(e) {t.zoom('decrease');}
		});
		
		//Panning:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_pan',
			category: 'modelview',
			description: 'shortcuts.modelview.pan',
			callbackFunction: function(e) {t.pan_start(e);},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.pan_onMouseMove(e);}
		});
		
		//Export Image:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_exportImage',
			category: 'modelview',
			description: 'shortcuts.modelview.exportImage',
			callbackFunction: function(e) {t.exportImage(e);},
		});
		
		//Rotating (For SideViews):
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_rotate_clockwise',
			category: 'modelview',
			description: 'shortcuts.modelview.rotateClockwise',
			callbackFunction: function(e) {t.rotateClockwise(e);},
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_rotate_anti_clockwise',
			category: 'modelview',
			description: 'shortcuts.modelview.rotateAntiClockwise',
			callbackFunction: function(e) {t.rotateAntiClockwise(e);},
		});

		
		//Jump to layer:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_goto_layer',
			category: 'modelview',
			description: 'shortcuts.modelview.gotolayer',
			callbackFunction: function(e) {t.gotoLayer();},
			keyUpModifierKeysOnTrigger: true
		});
	}
	
	/**
	 * Called as the mouse as the shortcut keycombo is first pushed
	 */
	this.pan_start = function(e) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].pan_start(e);
		}
		
	}
	
	/**
	 * Called as the mouse moves while the keycombo is still active
	 */
	this.pan_onMouseMove = function(e) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].pan_onMouseMove(e);
		}
	}
	
	/**
	 * Forwards the keybound event to scroll the modelview
	 */
	this.scroll = function(direction) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].scroll(direction);
		}
	}
	
	/**
	 * Mark a block as needing a redraw:
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i=0; i<this.modelViews.length; i++) {
			for (var z=posZ-1; z<=posZ+1; z++) {
			for (var y=posY-1; y<=posY+1; y++) {
			for (var x=posX-1; x<=posX+1; x++) {
				this.modelViews[i].markBlockNeedsUpdate(x, y, z);
			}}}
		}
	}
	
	/**
	 * Draw everything now that needs an update
	 */
	this.flushMarkedBlocks = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].flushMarkedBlocks();
		}
	} 

	/**
	 * Called by simulator when a block needs to be redrawn
	 */
	this.drawBlock = function(posX, posY, posZ) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].drawBlock(posX, posY, posZ);
		}
	}
	
	/**
	 * Called by simulator any time the size of the schematic changes
	 */
	this.setDimensions = function(parameters) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].setDimensions(parameters);
		}
	}
	
	/**
	 * Called any time all blocks need to be redrawn
	 * 
	 * Can be called by the simulator
	 */
	this.drawAllBlocks = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].drawAllBlocks();
		}
	}
	
	/**
	 * Tells all canvases whether or not world data is in the process of
	 */
	this.setLoading = function(state) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].setLoading(state);
		}
	}

	/**
	 * Jumps the current selected modelview to the specified layer:
	 */
	this.gotoLayer = function(isFromTimeout) {
		this.gui.pauseBindings();
		var layer = prompt(this.gui.localization.getString("modelview.prompt.gotolayer"));
		this.gui.resumeBindings();
		if (
			layer != null &&
			!isNaN(parseFloat(layer)) &&
			isFinite(layer) &&
			layer % 1 == 0 &&
			this.modelViews[this.mouseOverModelView].layerTo(layer)
		) {
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
		else {
			console.log("Could not change layer to "+layer);
		}
	}
	
	/**
	 * Forwards keybound event to try change active modelview's layer
	 */
	this.layerChange = function(direction) {
		if (this.mouseOverModelView != null) {
			if (direction == 'up') {
				this.modelViews[this.mouseOverModelView].layerUp();
			}
			else {
				this.modelViews[this.mouseOverModelView].layerDown();
			}
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
	}
	
	/**
	 * Forwards keybound event to try change active modelview's zoomlevel
	 */
	this.zoom = function(type) {
		if (this.mouseOverModelView != null) {
			if (type == 'decrease') {
				this.modelViews[this.mouseOverModelView].zoomLevelDecrease();
			}
			else if (type == 'increase') {
				this.modelViews[this.mouseOverModelView].zoomLevelIncrease();
			}
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
	}
	
	/**
	 * Forwards keybound event to export image
	 */
	this.exportImage = function() {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].exportImage();
		}
	}
	
	/**
	 * Forwards keybound event for rotating image
	 */
	this.rotateClockwise = function() {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].rotateClockwise();
		}
	}
	
	/**
	 * Forwards keybound event for rotating image
	 */
	this.rotateAntiClockwise = function() {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].rotateAntiClockwise();
		}
	}
	
	/**
	 * If the mouse is currently over the grid, this returns the coords, otherwise it returns false.
	 */
	this.getCurrentMouseCoords = function(e) {
		if (this.mouseOverModelView == null) return false;
		
		var mouseOnCanvas = this.modelViews[this.mouseOverModelView].getMousePositionOnCanvas(e.pageX, e.pageY);
		var schematicCoordsCurrentLayer = this.modelViews[this.mouseOverModelView].getSchematicCoords(mouseOnCanvas.x, mouseOnCanvas.y, forAboveLayer = false);
		var schematicCoordsAboveLayer = this.modelViews[this.mouseOverModelView].getSchematicCoords(mouseOnCanvas.x, mouseOnCanvas.y, forAboveLayer = true);

		//Check if numeric: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.x)) && isFinite(schematicCoordsCurrentLayer.x))) {
			return false;
		}
		
		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.y)) && isFinite(schematicCoordsCurrentLayer.y))) {
			return false;
		}

		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.z)) && isFinite(schematicCoordsCurrentLayer.z))) {
			return false;
		}

		return {
			x: schematicCoordsCurrentLayer.x,
			y: schematicCoordsCurrentLayer.y,
			z: schematicCoordsCurrentLayer.z,
			x1: schematicCoordsAboveLayer.x,
			y1: schematicCoordsAboveLayer.y,
			z1: schematicCoordsAboveLayer.z
		};
	}
	
	this.construct();
}
