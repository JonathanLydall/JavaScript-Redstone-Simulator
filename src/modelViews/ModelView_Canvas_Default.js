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

	/*
	http://www.minecraftwiki.net/wiki/Alpha_Level_Format/Chunk_File_Format#Block_Format
	
	Blocks are laid out in sets of vertical columns, with the rows going east-west through chunk, 
	and columns going north-south. Blocks in each chunk are accessed via the following method:
	unsigned char BlockID = Blocks[ y + z * ChunkSizeY(=128) + x * ChunkSizeY(=128) * ChunkSizeZ(=16) ];
	
	The coordinate system is as follows:
	X increases East, decreases West
	Y increases upwards, decreases downwards
	Z increases South, decreases North
	
	The Data, BlockLight, and SkyLight arrays have four bits for each byte of the Blocks array. 
	The least significant bits of the first byte of the Data, BlockLight, or SkyLight arrays correspond 
	to the first byte of the Blocks array.	
	*/
	
	/*
	Plan is to have it be able to dynamically load and unload chunks, including the canvas for them.
	Offset will be so we know which chunk we are displaying.
	ViewportId is for situation when we have multiple topviews, so we don't land up with conflicting
	dom IDs. 
	*/


(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "ModelView_Canvas_Default";
	
	namespace[funcName] = function() {};
	var proto = namespace[funcName].prototype;
	
	proto.defaultSettings = {
		offSetX: 0,
		offSetY: 0,
		borderColour: "128,128,128",
		noContextMenu: true
	}

	proto._construct = function() {
		var options = this.options;
		//Applies default options 
		for (var i in this.defaultSettings) {
			this[i] = this.defaultSettings[i];
		}
		
		//Applies all other options passed
		for (var i in options) {
			if (i == "simulator") {
				this.mcSim = options[i];
				continue;
			}
			this[i] = options[i];
		}
		
		this.tooltip = this.gui.tooltip;
		
		this.constructed = false; //used by readOptions(), gets changed to true when "construct()" gets called.

		this.readOptions(); //Saved user settings
		
		this.zoomLevel = this.defaultZoomLevel;

		this.drawAllBlocks_timer = "";
		this.drawAllBlocks_inProgress = false;
		this.drawAllBlocks_lastposition = 0;
		
		this.currentShownCoords = {x:0,y:0,z:0}; //Used to track what coordinates we currently have displayed on the DOM, so we can compare before updating and thus minimize required slow DOM updates
		this.blocksMarkedForUpdate = {};
		this.latestMouseCoords = {x:0, y:0};
		
		this.columns = 0;
		this.rows = 0;
	
		this.uniqueId = nameSpace.domIdCounter++;
		
		this.eventBindings_coordUpdate = new Array();
		this.eventBindings_onMousedown = new Array();
		
		//this.onMouseEnterOrLeave = options.onMouseEnterOrLeave; should be done in the above loop which went through options
		this.exportImageModal = new com.mordritch.mcSim.guiFullModal(this.gui);

		
		//Generate an ID for the DOM object:
		var id_offSetY;
		var id_offSetX;
		
		if (this.offSetX >= 0) {
			id_offSetX = "p" + this.offSetX;
		}
		else {
			id_offSetX = "n" + this.offSetX;
		}
		
		if (this.offSetY >= 0) {
			id_offSetY = "p" + this.offSetY;
		}
		else {
			id_offSetY = "n" + this.offSetY;
		}
		
		
		this.elementId = "modelView_"+this.uniqueId+"_chunk_"+id_offSetX+"_"+id_offSetY;
		this.elementId_overlay = "modelView_"+this.uniqueId+"_overlay";
		this.containerDomId = 'modelView_'+this.uniqueId; 
		var html = 
			'<div class="canvas" id="'+this.containerDomId+'">' +
				'<div class="scrollable">' +
					'<span class="controls"></span>' +
					
					'<div class="mouseDownCatcher innerDiv">' +
						'<span class="pendingWorldLoad"><br/><br/><br/>'+this.gui.localization.getString("modelview.pendingworldload")+'...</span>' +
						'<canvas class="modelView" id="'+this.elementId+'"></canvas>' +
						'<canvas class="overlay" id="'+this.elementId_overlay+'"></canvas>' +
					'</div>' +
				'</div>' +
			'</div>' +
		''
		$('#workarea').append(html);
		this.setCssClass(this.cssClass);
		

		this.$controls = $('#'+this.containerDomId+' .controls');
		this.$controls.hide();
		this.$controls.html(this.getControlsHtml());

		this.$domObject = $('#'+this.elementId);
		this.$domObject_overlay = $('#'+this.elementId_overlay);

		this.domObject = document.getElementById(this.elementId);
		this.domObject_overlay = document.getElementById(this.elementId_overlay);
		
		this.ctx = this.domObject.getContext("2d");
		
		this.context_overlay = this.domObject_overlay.getContext("2d");

		this.bindControlEvents();
		this.bindMouseEvents();
		
		if (this.noContextMenu == true) this.disableContextMenu();
		
		$(window).bind('resize', {t: this}, function(e){e.data.t.windowResize()});
		this.$controls.parent().bind('mouseenter', {t: this}, function(e) {
			e.data.t.$controls.show();
		});
		
		this.$controls.parent().bind('mouseleave', {t: this}, function(e) {
			e.data.t.$controls.hide();
		});


		this.construct();
		this.constructed = true;
		this.drawAllBlocks();
	}
	
	/**
	 * Used to change the container DIVs CSS class which is responsible for the placement of each modelview
	 */
	proto.setCssClass = function(cssClass) {
		$('#'+this.containerDomId).removeClass(this.cssClass);
		$('#'+this.containerDomId).addClass(cssClass);
		this.cssClass = cssClass;
	}


	proto.onOptionsChange = function() {
		this.readOptions();
	}
	
	/**
	 * Called if the options screen is applied or the user settings are loaded due to a reason like the user logging on 
	 */
	proto.readOptions = function() {
		var options = this.gui.userSettings.options.modelview;
		
		this.borderWidth = options.borderWidth;
		this.layerDownOpacity = options.layerDownOpacity;
		this.lowerLayersToDraw = options.lowerLayersToDraw;
		this.defaultZoomLevel = options.defaultZoomLevel;
		this.workTime = options.workTime;
		
		if (typeof this.mcSim != 'undefined' && this.constructed) this.drawAllBlocks();
	}
	
	proto.windowResize = function() {
		var top = this.$controls.parent().offset().top;
		var left = this.$controls.parent().offset().left;
		
		this.$controls.css('top', top+'px');
		this.$controls.css('left', left+'px');
	}
	
	proto.setLoading = function(state) {
		if (state) {
			$('#'+this.containerDomId+' .pendingWorldLoad').show();
			$('#'+this.containerDomId+' canvas').hide();
		}
		else {
			$('#'+this.containerDomId+' .pendingWorldLoad').hide();
			$('#'+this.containerDomId+' canvas').show();
			this.setDimensions();
		}
	}
	
	/**
	 * Prevents context menu from showing, making it possible to bind our right mousebutton
	 */
	proto.disableContextMenu = function() {
		this.$domObject_overlay.bind("contextmenu",function(e){return false;});
	}
	
	/**
	 * A public method for changing the worktime, perhaps it's a little superfluous 
	 * 
	 * In fact, i don't think it's used.
	proto.setWorkTime = function(workTime) {
		this.workTime = workTime;
	}
	 */
	
	/**
	 * Returns a URL encoded PNG of whatever is presently on the canvas. 
	 * 
	 * @return {String}	URL encoded PNG data 
	 */
	proto.getDataUrl = function() {
		return this.domObject.toDataURL();
	}
	
	proto.zoomLevelIncrease = function() {
		if (this.zoomLevel < 6 && this.zoomLevel >= 1) {
			this.zoomLevel++;
			this.setDimensions();
			return;
		}

		if (this.zoomLevel < 1){
			this.zoomLevel = this.zoomLevel*2;
			this.setDimensions();
		}
	}
	
	proto.zoomLevelDecrease = function() {
		if (this.zoomLevel > 1) {
			this.zoomLevel--;
			this.setDimensions();
			return;
		}
		
		if (this.zoomLevel <= 1 && this.zoomLevel >= 0.250) {
			this.zoomLevel = this.zoomLevel/2;
			this.setDimensions();
		}
	}
	
	proto.bindToEvent_onMousedown = function(callbackFunction) {
		this.eventBindings_onMousedown.push(callbackFunction);
	}
	
	/**
	 * Called when the mouse moves on the canvas
	 * 
	 * @param {Integer}	x	The x coordinate on the canvas
	 * @param {Integer}	y	The y coordinate on the canvas
	 */
	proto.onMouseMove = function(pageX, pageY) {
		this.latestMouseCoords = this.getMousePositionOnCanvas(pageX, pageY);
		this.updateCoords();
	}
	
	proto.updateCoords = function() {
		var schematicCoords = this.getSchematicCoords(this.latestMouseCoords.x, this.latestMouseCoords.y, forAboveLayer = false);
		
		if (
			schematicCoords.x != this.currentShownCoords.x ||
			schematicCoords.y != this.currentShownCoords.y ||
			schematicCoords.z != this.currentShownCoords.z
		) {
			$('#'+this.containerDomId+' span.coords.x').html(schematicCoords.x);
			$('#'+this.containerDomId+' span.coords.y').html(schematicCoords.y);
			$('#'+this.containerDomId+' span.coords.z').html(schematicCoords.z);

			this.currentShownCoords.x = schematicCoords.x;
			this.currentShownCoords.y = schematicCoords.y;
			this.currentShownCoords.z = schematicCoords.z;
		}
	}
	
	proto.exportImage = function() {
		//TODO: can hang on big images, perhaps have some feedback on whether or not it's working
		
		var imageData = document.getElementById(this.elementId).toDataURL();
		
		this.exportImageModal.setContent('<img src="'+imageData+'" />');
		this.exportImageModal.show();
	}
	
	/**
	 * Bind events to the mouse
	 */
	proto.bindMouseEvents = function() {
		//containerDomId
		
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mousemove', {t:this}, function(e) {
			e.data.t.onMouseMove(e.pageX, e.pageY);
		});
		
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mousedown', {t:this}, function(e) {
			e.data.t.gui.input.onKeyDown(e);
		});
		
		/*
		 * Following two bindings are used by bound mouse events to see if we are on top of a canvas
		 * and if so, which one. Then, if we are, we can pass on the event appropriately. 
		 */
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mouseenter', {t:this}, function(e) {
			var self = e.data.t; 
			self.onMouseEnterOrLeave('enter', self);
		});

		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mouseleave', {t:this}, function(e) {
			var self = e.data.t; 
			self.onMouseEnterOrLeave('leave', self);
		});
		

	}

	proto.pan_onMouseMove = function(e) {
		var $div = $('#' + this.containerDomId + ' .scrollable');

		var positionNow = this.getMousePositionOnCanvas(e.pageX, e.pageY);
		var panStart = this.panStart;

		var currentScrollLeft = $div.scrollLeft();
		var currentScrollTop = $div.scrollTop();
		
		if (typeof panStart != "undefined") {
			$div.scrollLeft(currentScrollLeft + (panStart.x - positionNow.x)); 
			$div.scrollTop(currentScrollTop + (panStart.y - positionNow.y)); 
		}
	}
	
	proto.pan_start = function(e) {
		this.panStart = {
			x: this.latestMouseCoords.x,
			y: this.latestMouseCoords.y
		};
		
		/* This was buggy compared to above approach
		if (e.type == 'mousedown') {
			this.panStart = this.getMousePositionOnCanvas(e.pageX, e.pageY);
		}
		*/
	}
	
	proto.scroll = function(direction) {
		var $div = $('#' + this.containerDomId);
		var scrollAmount = this.zoomLevel * 8 + this.borderWidth;
		var currentScrollLeft = $div.scrollLeft();
		var currentScrollTop = $div.scrollTop();
		
		switch (direction) {
			case "left":
				$div.scrollLeft(currentScrollLeft - scrollAmount);
				break;
			case "right":
				$div.scrollLeft(currentScrollLeft + scrollAmount);
				break;
			case "up":
				$div.scrollTop(currentScrollTop - scrollAmount);
				break;
			case "down":
				$div.scrollTop(currentScrollTop + scrollAmount);
				break;
		}
	}
	
	/**
	 * Returns the x and y position of the mouse on the canvas from the page position
	 * 
	 * @param {Integer}	pageX	the x coordinates of the mouse on the web page
	 * @param {Integer}	pageY	the y coordinates of the mouse on the web page
	 * 
	 * @return	{Object}	Of format: {x: {Integer}, y: {Integer}}
	 */

	proto.getMousePositionOnCanvas = function(pageX, pageY) {
		//Where is the grid DOM element relative to the the top of the document:
		
		/*
		//TODO: caching the result does not take the scroll amount into account:
		if (typeof this.offset == 'undefined') {
			this.offset = {
				x: this.$domObject.offset().left,
				y: this.$domObject.offset().top,
			}
		}
		var mouseOnCanvasX = pageX - this.offset.x;
		var mouseOnCanvasY = pageY - this.offset.y;
		
		return {x: mouseOnCanvasX, y: mouseOnCanvasY};
		*/
		
		//original method below:
		var elementOffsetX = this.$domObject.offset().left;
		var elementOffsetY = this.$domObject.offset().top;
		
		var mouseOnCanvasX = pageX - elementOffsetX;
		var mouseOnCanvasY = pageY - elementOffsetY;

		return {x: mouseOnCanvasX, y: mouseOnCanvasY};
	}

	/**
	 * Called by the simulator any time a block needs to be drawn
	 */
	proto.drawBlock = function(xGrid, yGrid) {
		this.checkSizeForDimensionReset();
		
		var World = this.mcSim.World;
		var mcSim = this.mcSim;
		var worldIsLoaded = this.mcSim.worldIsLoaded;
		var drawMethod = this.drawMethod;
		var currentFacing = this.currentFacing;

		var lowerLayersToDraw = this.getLayersToDrawCount();
		
		var aboveLayerCoords = this.getWorldCoordsFromGridCoords(xGrid, yGrid, -1);
		var lowerLayerCoords = [];
		for (var i = 0; i <= lowerLayersToDraw; i++) {
			lowerLayerCoords[i] = this.getWorldCoordsFromGridCoords(xGrid, yGrid, i);
		}
		
		var ctx = this.ctx;
		var layerDownOpacity = this.layerDownOpacity;
		var aboveLayer = mcSim.getBlockObject(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);

		var offsetX = xGrid*(this.zoomLevel*8+this.borderWidth)+this.borderWidth;
		var offsetY = yGrid*(this.zoomLevel*8+this.borderWidth)+this.borderWidth;

		ctx.setTransform(1, 0, 0, 1, 0, 0); //resets transformations (zoom and translate)
		ctx.translate(offsetX, offsetY);
		ctx.scale(this.zoomLevel, this.zoomLevel);
        
		//If we are rendering a normal block in the current, it will take up the whole square, so we can just draw it now and not worry at all about any layers below
		if (mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z).renderAsNormalBlock()) {
			if (aboveLayer.renderAsNormalBlock()) {
				mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z).drawNormalCube_currentLayer(World, lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z, ctx, true);
				this.blockDrawCount++;
			}
			else {
				mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z)[drawMethod + "_currentLayer"](World, lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z, ctx); this.blockDrawCount++;
				var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
				if (aboveLayer.blockID != 0) {
					aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing);
					this.blockDrawCount++;
				}
				else if (aboveEntity != null) {
					var forAboveLayer = true;
					World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing);
					this.blockDrawCount++;
				}

			}
			return;
 		}
		
		//Next we want to know if we will need to draw a white base, to do so we check if any of the layers below are a normal block, which would overwrite the white
		//Also, at the same time we will check if any non-air is found too. 
		var partialBlockFound = false; //for example, a torch, where we can see stuff behind it
		var normalBlockFound = false;
		var deepestNonAirBlock = 0; 
		for (var i = 0; i <= lowerLayersToDraw; i++) {
			if (mcSim.getBlockObject(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z).renderAsNormalBlock()) {
				normalBlockFound = true;
				deepestNonAirBlock = i;
				lowerLayersToDraw = i; 
				break; //As you can't see behind this kind of block, no point in checking about rendering blocks which are below
			}
			else if (
				mcSim.World.getBlockId(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != 0 ||
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != null //if we have a piston retracting, although the block is set to hold air, it will show half the block that is being retracted 
			) {
				partialBlockFound = true;
				deepestNonAirBlock = i;
			}
		}
		if (deepestNonAirBlock < lowerLayersToDraw) lowerLayersToDraw = deepestNonAirBlock; //No need to start drawing before we can see anything
		
		
		//If it's all air, draw for above layer as appropriate and then exit
		if (!normalBlockFound && !partialBlockFound) {
			if (aboveLayer.renderAsNormalBlock()) {
				ctx.fillStyle = "rgb(192,192,192)";
				ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
			}
			else {
				ctx.fillStyle = "rgb(255,255,255)";
				ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
				var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
				if (aboveLayer.blockID != 0) {
					aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing); this.blockDrawCount++;
				}
				else if (aboveEntity != null) {
					var forAboveLayer = true;
					World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing); this.blockDrawCount++;
				}
			}
			return;
		}
		
		//Draw a white base:
		if (!normalBlockFound) {
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
		}
		
		//And now to draw from the bottom up:
		var fogLayerCount = 0;
		var startsWithNormalBlock = false;
		for (var i = lowerLayersToDraw; i>=0; i--) {
			var blockObject = mcSim.getBlockObject(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z);
			//var blockAbove = mcSim.getBlockObject(posX, currentLayer-i+1, posZ); //old line
			if (i != 0) {
				var blockAbove = mcSim.getBlockObject(lowerLayerCoords[i-1].x, lowerLayerCoords[i-1].y, lowerLayerCoords[i-1].z);
			}
			
			/*
			 * If we ever have a solid block, it will always be the first one, so if we do, we want to use a single
			 * draw command to calculate it and it's opacity
			 */
			if (
				i == lowerLayersToDraw &&
				blockObject.renderAsNormalBlock()
			) {
				startsWithNormalBlock = true;
				fogLayerCount++;
				continue;
			}
			
			/*
			 * If statement checks for a series of stacked air blocks and once it reaches the end,
			 * it calculates the opacity all at once, rather than using seperate expensive
			 * draw operations for each layer
			 */
			if (
				i != 0 &&
				blockAbove.blockID == 0 &&
				blockObject.blockID == 0 &&
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) == null &&
				//World.getRetractingBlockEntity(posX, currentLayer-i+1, posZ) == null //old line
				World.getRetractingBlockEntity(lowerLayerCoords[i-1].x, lowerLayerCoords[i-1].y, lowerLayerCoords[i-1].z) == null
			) {
				fogLayerCount++;
				continue;
			}
			
			if (
				fogLayerCount > 0
			) {
				//console.log(fogLayerCount);
				if (startsWithNormalBlock) {
					var alpha = 1-Math.pow(layerDownOpacity, fogLayerCount);
					
					mcSim.getBlockObject(
						lowerLayerCoords[lowerLayersToDraw].x,
						lowerLayerCoords[lowerLayersToDraw].y,
						lowerLayerCoords[lowerLayersToDraw].z
					).drawNormalCube_withOpacity(
						World,
						lowerLayerCoords[lowerLayersToDraw].x,
						lowerLayerCoords[lowerLayersToDraw].y,
						lowerLayerCoords[lowerLayersToDraw].z,
						ctx,
						alpha
					);
					
					startsWithNormalBlock = false;
				}
				else {
					ctx.fillStyle = "rgba(255,255,255,"+(1-Math.pow(layerDownOpacity, fogLayerCount))+")";
					ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
				}
				fogLayerCount = 0;
			}
			
			/*
			 * Finally, do a normal draw operation, provided that it's not air, and it's not a solid block in the bottom most layer
			 * of our lower layers to draw. The solid block in lowest layer is excluded because we have already handled that above.
			 */
			if (
				blockObject.blockID != 0 &&
				!(
					i == lowerLayersToDraw &&
					blockObject.renderAsNormalBlock()
				)
			) {
				blockObject[drawMethod + "_currentLayer"](World, lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z, ctx, currentFacing); this.blockDrawCount++;
				fogLayerCount++;
				continue;
			}
			
			/*
			 * If it's an air block and if a piston is retracting a block from it, draw it
			 */
			if (
				blockObject.blockID == 0 &&
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != null
			) {
				var entity = World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z);
				var forAboveLayer = false;
				World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z, ctx, entity, forAboveLayer, currentFacing); this.blockDrawCount++;
				fogLayerCount++;
				continue;
			}
			
			
		}

		if (aboveLayer.blockID != 0) {
			aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing); this.blockDrawCount++;
		}
		
		var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
		if (aboveEntity != null) {
			var forAboveLayer = true;
			World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing); this.blockDrawCount++;
		}
	}
	
	/**
	 * Redraws all the blocks we can see on the canvas
	 * 
	 * Usually called when zoomlevel or dimensions of the canvas are changed. 
	 */
	proto.drawAllBlocks = function(drawingMore, resumeFrom, startedAt) {
		if (!this.mcSim.worldIsLoaded) {
			this.setLoading(true);
			return;
		}
		
		this.checkSizeForDimensionReset();
		
		this.ctx.setTransform(1, 0, 0, 1, 0, 0); //resets the translate coords
		if (typeof drawingMore != "boolean") drawingMore = false;
		var workTime = this.workTime; //in millisenconds 
		/*
		 * How long we spend in our loop to draw blocks before we use a setTimeout to give the browser a chance to 
		 * update changes to the page, canvas and process any user input.
		 * 
		 * Be aware different browsers / platforms take different amounts of time to "draw" page changes, so the smaller
		 * the value, the longer overall the process takes.
		 * 
		 * For example:
		 * Chrome: about 4ms
		 * Firefox: 8 - 11ms
		 * Safari Mobile (iPad 2 / iPhone 4S): around 220ms (more if you are dragging as it loads)
		 * 
		 * So, using a shorter time on safari mobile greatly increases overall load time, whereas on chrome, makes
		 * very little difference.
		 * 
		 * TODO: Measure the time betwen set timeout and this function being called and then adjust the work time dynamically
		 */
		
		
		//Doesn't always work when put inside the if (!drawingMore) block, it seems that if this function is
		//called twice in quick succession, then it doesn't see a populated this.drawAllBlocks_timer
		//I worked out why this happens, it's because it's only midloop we set the variable
		window.clearTimeout(this.drawAllBlocks_timer);
		
		var resumeFrom;
		if (!drawingMore) {
			resumeFrom = 0;
			this.blockDrawCount = 0;
			//console.profile("Redraw");
			startedAt = new Date().getTime();

			var canvasWidth = this.columns * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
			var canvasHeight = this.rows * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
	
			this.ctx.fillStyle = "rgba("+this.borderColour+",0.5)";

			if (this.drawAllBlocks_lastposition > 0) {
				//Only darken what had already been drawn:
				
				var rowsDrawn = Math.floor(this.drawAllBlocks_lastposition/this.columns);
				var remainingBlocksInLastRow = this.drawAllBlocks_lastposition%this.columns;
				
				//Rows up until partially completed row:
				this.ctx.fillRect(0,0, canvasWidth, rowsDrawn * (this.zoomLevel*8 + this.borderWidth));
				
				//Blocks in the partially completed row:
				this.ctx.fillRect(0, rowsDrawn * (this.zoomLevel*8 + this.borderWidth), remainingBlocksInLastRow * (this.zoomLevel*8 + this.borderWidth), this.zoomLevel*8 + this.borderWidth);
			}
			else {
				//Darken everything:
				this.ctx.fillRect(0,0, canvasWidth, canvasHeight);
			}
			
			
			
		}

		var startTime = new Date().getTime();
		
		var position = 0;

		for (var r = 0; r < this.rows; r++) {
			for (var c = 0; c < this.columns; c++) {
				if (position >= resumeFrom) {
					if ((new Date().getTime()) - startTime > workTime) {
						//var percentDone = Math.floor(position/(this.rows*this.columns)*100);
						//$("#percentDone").html(" "+percentDone+"%");
						var t = this;
						this.drawAllBlocks_lastposition = position;
						this.drawAllBlocks_timer = window.setTimeout(function(){
							t.drawAllBlocks(true, position, startedAt);
						});
						return;
					}
					this.drawBlock(c, r);
				}
				position++;
			}
		}
		this.drawAllBlocks_lastposition = 0;
		
		var timeDiff = new Date().getTime() - startedAt;
		console.log("Redrew %s blocks in %sms. zoomLevel: %s", (this.rows*this.columns), timeDiff, this.zoomLevel);
		//console.profileEnd("Redraw");
		//$("#percentDone").html("Redrew "+(this.rows*this.columns)+" blocks in " + timeDiff + "ms. Total of "+this.blockDrawCount+" drawBlock and fillRect for background and alpha.");
		
		//TODO: Convert to mcSim implementation
		
		/*
		this.paintSelectionBox();
		for (var x in this.redstoneSim.modelData.dataArray) {
			for (var y in this.redstoneSim.modelData.dataArray[x]) {
				//The dataArray has blocks off the grid so that blocks on the edge have
				//neighbor blocks they can check, do not bother rendering them
				if (
					x < this.redstoneSim.modelData.sizeX &&
					x >= 0 && 
					y < this.redstoneSim.modelData.sizeY &&
					y >= 0
				) this.paintBlock(this.redstoneSim.modelData.dataArray[x][y][this.activeLayer]);
			}
		}
		*/
	}
	
	/**
	 * Returns the schematic coordinates from an and x and y position on the canvas
	 * 
	 * @param	{Integer}	canvasX	The x coordinate on the canvas
	 * @param	{Integer}	canvasY	The y coordinate on the canvas
	 * 
	 * @return	{Integer}	Of format: {x: {Integer}, y: {Integer}, z: {Integer}}
	 */
	proto.getSchematicCoords = function(canvasX, canvasY, forAboveLayer) {
		if (this.gui.mcSim.World == null) return {x: '-', y: '-', z: '-'}; //if the world is still loading while we are hovering over, an error happens

		//Offset the position by half the width of the border, so that the border can count for blocks. 
		var offsetCanvasX = canvasX - this.borderWidth/2; 
		var offsetCanvasY = canvasY - this.borderWidth/2;

		//Math.floor rounds a number down:
		var currentX = Math.floor(offsetCanvasX / (this.zoomLevel * 8 + this.borderWidth));
		var currentY = Math.floor(offsetCanvasY / (this.zoomLevel * 8 + this.borderWidth));
		
		var translatedCoords = (forAboveLayer) ? this.getWorldCoordsFromGridCoords(currentX, currentY, -1) : this.getWorldCoordsFromGridCoords(currentX, currentY, 0);
		
		var xReturn = translatedCoords.x;
		var yReturn = translatedCoords.y;
		var zReturn = translatedCoords.z;

		var xMax = this.gui.mcSim.World.worldData.getSizeX();
		var yMax = this.gui.mcSim.World.worldData.getSizeY();
		var zMax = this.gui.mcSim.World.worldData.getSizeZ();
		
		//The mouse move event is captured for the entire screen area alocated for the canvas, even it's smaller. As such, don't show coordinates which are off the grid:
		if (xReturn < 0 || xReturn >= xMax) {
			xReturn = '-';
		}
		if (yReturn < 0 || yReturn >= yMax) {
			yReturn = '-';
		}
		if (zReturn < 0 || zReturn >= zMax) {
			zReturn = '-';
		}

		return {
			x: xReturn,
			y: yReturn,
			z: zReturn
		};
	}
	
	proto.markBlockNeedsUpdate = function(posX, posY, posZ) {
		var gridCoords = this.getGridCoordsFromWorldCoords(posX, posY, posZ);
		
		if (
			this.worldCoordsAreInRenderRange(posX, posY, posZ) &&
			typeof this.blocksMarkedForUpdate[gridCoords.x+"_"+gridCoords.y] == 'undefined'
		) {
			this.blocksMarkedForUpdate[gridCoords.x+"_"+gridCoords.y] = {x: gridCoords.x, y: gridCoords.y};
		}
	}
	
	proto.flushMarkedBlocks = function() {
		for (var i in this.blocksMarkedForUpdate) {
			var x = this.blocksMarkedForUpdate[i].x;
			var y = this.blocksMarkedForUpdate[i].y;
			this.drawBlock(x, y);
		}
		this.blocksMarkedForUpdate = {};
	}

	
	/**
	 * Resizes the canvas element on the page appropriately
	 * 
	 * @param {Object}	options in object notation, can include rows, columns, zoomLevel,
	 * 					and borderWidth 
	 */
	proto.setDimensions = function(options) {
		if (typeof options != "undefined") {
			for (var i in options) {
				if (
					i == "rows" ||
					i == "columns" ||
					i == "zoomLevel" ||
					i == "borderWidth"
				) {
					this[i] = options[i];
				}
			}
		}
		
		var canvasWidth = this.columns * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
		var canvasHeight = this.rows * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
		
		this.$domObject.attr('width', canvasWidth);
		this.$domObject.attr('height', canvasHeight);
		
		this.ctx = this.domObject.getContext("2d");
		
		this.ctx.fillStyle = "rgb("+this.borderColour+")";
		this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		this.$domObject_overlay.attr('width', canvasWidth);
		this.$domObject_overlay.attr('height', canvasHeight);
		this.context_overlay = this.domObject_overlay.getContext("2d");
		this.context_overlay.fillStyle = "rgba(0,0,0,0)";
		this.context_overlay.fillRect(0, 0, canvasWidth, canvasHeight);

		this.drawAllBlocks();
	}
	
	proto.rotateAntiClockwise = function() {
		//Do nothing, unless overridden by an inheriting class
	}
	
	proto.rotateAntiClockwise = function() {
		//Do nothing, unless overridden by an inheriting class
	}
	
}());
