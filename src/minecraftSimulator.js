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

com.mordritch.mcSim.MinecraftSimulator = function() {
	this.worldIsLoaded = false;
	this.modelViews = [];
	
	this.init = function() {
		this.Block = new com.mordritch.mcSim.Block(); //consistent with MCP name
		this.World = null //consistent with MCP name, will be populated with world data
		this.updateTicker = new com.mordritch.mcSim.ticker(this);
	}
	
	/**
	 * In the source code, resides in the renderer
	 * 
	 * This is called by blocks as they need their look updated.
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.modelViews) {
			//TODO: Consider passing this.World along to the draw routine
			
			//The game also always re-renders all neighboring blocks:
			this.modelViews[i].markBlockNeedsUpdate(posX, posY, posZ);
		}
	}
	
	/**
	 * In the source code, resides in the renderer
	 * 
	 * This is called by ranges of blocks as they need their look updated.
	 */
	this.markBlockRangeNeedsUpdate = function(posX1, posY1, posZ1, posX2, posY2, posZ2) {
		for (var i in this.modelViews) {
			//TODO: Make this mark all the blocks in the range.
			//TODO: Consider passing this.World along to the draw routine
			this.modelViews[i].markBlockNeedsUpdate(posX1, posY1, posZ1);
		}
	}
	
	/**
	 * Called anytime we start or load a schematic, to ensure we don't have things like entities or tickData lying around;
	 */
	this.preLoad = function() {
		this.worldIsLoaded = false;
		this.updateTicker.stopRunning();
	}
	
	/**
	 * Loads world into the simulator
	 * 
	 * If no world was asked to be loaded, it makes a new blank world.
	 */
	this.loadWorld = function (worldToLoad, startTickingWorldOnLoad) {
		this.preLoad();
		if (typeof worldToLoad["Schematic"] != "undefined") {
			//If we were passed a schematic
			var worldData = new com.mordritch.mcSim.World_Schematic(worldToLoad);
		} 
		else if (typeof worldToLoad["Level"] != "undefined") {
			//If we were passed the chunk of a level
			var worldData = new com.mordritch.mcSim.World_Level(worldToLoad);
		}
		else {
			console.log(worldToLoad);
			throw new Error("com.mordritch.mcSim.MinecraftSimulator.loadWorld(): Unrecognized world type.");
		}
		this.postLoad(worldData, startTickingWorldOnLoad);
	}
	
	this.postLoad = function(worldData, startTickingWorldOnLoad) {
		for (var i in this.modelViews) {
			this.modelViews[i].setDimensions({
				columns: worldData.getSizeX(),
				rows: worldData.getSizeZ()
			});
			this.modelViews[i].drawAllBlocks();
		}
		
		this.worldData = worldData;
		this.World = new com.mordritch.mcSim.World(this.Block, worldData);
		this.World.loadAll();
		
		this.World.addWorldAccess(this);
		this.worldIsLoaded = true;
		if (startTickingWorldOnLoad) this.updateTicker.startRunning();

		for (var i in this.modelViews) {
			//TODO: Consider passing this.World along to the draw routine
			this.modelViews[i].setLoading(false);
		}
	}
	
	/**
	 * saveWorld 
	 */
	this.saveWorld = function() {
		this.World.commitAll();
		return this.World.worldData.getNbtData();
	}
	
	/**
	 * Called to start a new schematic
	 */
	this.makeNew = function(xDefaultSize, yDefaultSize, zDefaultSize, startTickingOnLoad) {
		this.preLoad();
		var worldData = new com.mordritch.mcSim.World_Schematic(null, xDefaultSize, yDefaultSize, zDefaultSize);
		this.postLoad(worldData, startTickingOnLoad);
	}
	
	/**
	 * Idea is that we can use a global flag to decide whether or not to show console output.
	 * 
	 * Not yet in use though.
	 */
	this.consoleOut = function(text) {
		console.log(text);
	}
	
	/**
	 * Add a model view to modelViews array:
	 * 
	 * 
	 * @param {Object} modelView
	 */
	this.bindModelView = function(modelView) {
		this.modelViews.push(modelView);
	}
	
	/**
	 * Searches the modelViews array for a model view and removes it.
	 * 
	 * @param {Object} modelView to search for and then remove
	 */
	this.unbindModelView = function(modelView) {
		for (var i in this.modelViews) {
			if (this.modelViews[i] = modelView) {
				this.modelViews.splice(i,1);
				break;
			}
		}
	}
	
	/**
	 * Returns the block object at specified coordinates.
	 * 
	 * Not implemented in the game, only in mcSim
	 * 
	 * @param {Integer} posX	Coordinate of the block which needs to be drawn
	 * @param {Integer} posY	Coordinate of the block which needs to be drawn
	 * @param {Integer} posZ	Coordinate of the block which needs to be drawn
	 * 
	 * @return {Object}	The initialized block object at the specifed coordinates 
	 */
	this.getBlockObject = function(posX, posY, posZ) {
		var Block = this.Block;
		
		var blockID = this.World.getBlockId(posX, posY, posZ);
		
		if (typeof Block.blocksList[blockID] != "undefined") {
			return Block.blocksList[blockID];
		}
		else {
			return Block.unknown;
		}
	}
	
	/**
	 * Returns the name of a type of block at a particular coordinate
	 * 
	 * Not implemented in the game, only in mcSim
	 * 
	 * @param {Integer} posX	Coordinate of the block which needs to be drawn
	 * @param {Integer} posY	Coordinate of the block which needs to be drawn
	 * @param {Integer} posZ	Coordinate of the block which needs to be drawn
	 * 
	 * @return {String}			Name of the block type, returns a default value of unknown if not defined
	 */
	this.getBlockType = function(posX, posY, posZ) {
		var Block = this.Block;
		
		var blockID = this.World.getBlockId(posX, posY, posZ);
		
		if (typeof Block.blocksList[blockID] != "undefined") {
			return Block.blocksList[blockID].blockType;
		}
		else {
			return Block.unknown.blockType;
		}
	}
	
	/**
	 * Unique to MC Sim. Calls toggleBlock method for block at particular coords
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.toggleBlock = function (posX, posY, posZ) {
		var block = this.getBlockObject(posX, posY, posZ);
		block.toggleBlock(this.World, posX, posY, posZ);
		//console.log("Toggle block called: " + this.World.getWorldTime());
		//console.log("Toggle block called: "+posX+" "+posY+" "+posZ);
	}
	
	/**
	 * Unique to MC Sim. Calls rotateBlock method for block at particular coords
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.rotateBlock = function (posX, posY, posZ) {
		var block = this.getBlockObject(posX, posY, posZ);
		block.rotateBlock(this.World, posX, posY, posZ);
	}
	
	this.init();
}
