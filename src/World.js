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

com.mordritch.mcSim.World = function(BlockObj, worldDataObj) {
	var namespace = com.mordritch.mcSim;
	
	this.Block = BlockObj;
	this.worldData = worldDataObj;
	
	
	
	this.construct = function() {
		this.loadedTileEntityList = {}; //A list of all loaded entities
		this.addedTileEntityList = {}; //If we are in the middle of scanning the loadedTileEntityList, then we put new entities in here until the scanning is done
		this.scanningTileEntities = false; //When true, tile entities are queued to be loaded, rather than added then and there
		this.scheduledUpdates = new Array();
		this.isRemote = false; //some functions use this to determine if it's a multiplayer world.

		
		//Effectively a callback list. On the game, this is used by World to tell the renderer that things have changed,
		//each object in the element should implement methods as per the IWorldAccess interface in the MCP source code.
		this.worldAccesses = new Array();  

		this.worldTime = 0; //TODO: Migrate into a worldinfo class, like in the games source code.
		this.editingBlocks = false;
	}

	/**
	 * In the source code, this is inside a "worldInfo" object
	 */
	this.getWorldTime = function() {
		//TODO: Migrate into the WorldInfo class, like in the games source code
		return this.worldTime;
	}
	
	this.getBlockMaterial = function(par1, par2, par3)
	{
		var i = this.getBlockId(par1, par2, par3);

		if (i == 0)
		{
			return namespace.Material.air;
		}
		else
		{
			return this.Block.blocksList[i].blockMaterial;
		}
	}

	/**
	 * Adds an object to the this.worldAccesses array.
	 * 
	 * In the game, each object in this array is called during certain events, like if a block needs to be redrawn.
	 * In the MCP source code, each object is required to have implemented the IWorldAccess interface. 
	 */
	this.addWorldAccess = function(worldAccess) {
		this.worldAccesses.push(worldAccess);
	}
	
	/**
	 * Inverse of this.addWorldAccess();
	 */
	this.removeWorldAccess = function(worldAccess) {
		for (var i in this.worldAccesses) {
			if (this.worldAccesses[i] == worldAccess) {
				this.worldAccesses.splice(i,1);
				return;
			}
		}
	}
	
	/**
     * Checks if the block is a solid, normal cube. If the chunk does not exist, or is not loaded, it returns the
     * boolean parameter.
	 */
	this.isBlockNormalCubeDefault = function(xPos, yPos, zPos, defaultResponse) {
        /*
        //NA in context of simulator which at this time does not use chunks
        if (xPos < 0xfe363c80 || zPos < 0xfe363c80 || xPos >= 0x1c9c380 || zPos >= 0x1c9c380)
        {
            return defaultResponse;
        }

        Chunk chunk = chunkProvider.provideChunk(xPos >> 4, zPos >> 4);

        if (chunk == null || chunk.isEmpty())
        {
            return defaultResponse;
        }
		*/
		
        var block = this.Block.blocksList[this.getBlockId(xPos, yPos, zPos)];

        if (block == null)
        {
            return false;
        }
        else
        {
            return block.blockMaterial.isOpaque() && block.renderAsNormalBlock();
        }
	}
	
	/**
	 * This seems to notify the renderer to update the blocks.
	 * 
	 * Seems to be called when tileEntities have changed or when blockFlowing changes.
	 * 
	 * Also called, each time a blockId is set.
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockNeedsUpdate(posX, posY, posZ);
		}
	}
	
	/**
	 * Also, seems to notify the renderer to update the blocks.
	 * 
	 * Seems only called by BlockCake.eatCakeSlice();
	 */
	this.markBlockAsNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockRangeNeedsUpdate(posX, posY, posZ, posX, posY, posZ);
		}
	}
	
	/**
	 * Also, seems to notify the renderer to update the blocks.
	 * 
	 * Seems used by most blocktypes if they change
	 */
	this.markBlocksDirty = function(posX1, posY1, posZ1, posX2, posY2, posZ2) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockRangeNeedsUpdate(posX1, posY1, posZ1, posX2, posY2, posZ2);
		}
	}
	
	/**
	 * Removes refference to a tile entity at a particular coordinate
	 * 
	 * This will allow the garbage collector to eventually free the memory
	 * 
	 * @param	{Int}	posX	Coordinate of tile entity
	 * @param	{Int}	posY	Coordinate of tile entity
	 * @param	{Int}	posZ	Coordinate of tile entity
	 * 
	 */
	this.removeBlockTileEntity = function(posX, posY, posZ) {
		var tileEntity = this.getBlockTileEntity(posX, posY, posZ);
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		
		if (
			tileEntity != null &&
			this.scanningTileEntities
		) {
			tileEntity.invalidate();
			delete this.addedTileEntityList[id];
		}
		else {
			if (tileEntity != null) {
				delete this.addedTileEntityList[id];
				delete this.loadedTileEntityList[id];
			}

			//Not ported from source code:
			/*
			Chunk chunk = getChunkFromChunkCoords(posX >> 4, posZ >> 4);
			if (chunk != null)
			{
				chunk.removeChunkBlockTileEntity(posX & 0xf, posY, posZ & 0xf);
			}
			*/
		}
	}
	
	/**
	 * Loads tick data from a saved world
	 */
	this.loadTickData = function() {
		var nbtTickData = this.worldData.getTickData();
		
		this.scheduledUpdates = [];
		for (var i = 0; i<nbtTickData.length; i++) {
			this.scheduleBlockUpdate(
				nbtTickData[i].x.payload,
				nbtTickData[i].y.payload,
				nbtTickData[i].z.payload,
				nbtTickData[i].i.payload, //block ID
				nbtTickData[i].t.payload
			);
		}
	}
	
	/**
	 * Simulator specific. Commits tick data to the schematic file, sends it over in NBT format
	 */
	this.commitTickData = function() {
		var tickData = [];
		var scheduledUpdates = this.scheduledUpdates;
		var worldTime = this.getWorldTime();
		var TAG_Int = 3;
		/*
		this.scheduledUpdates.push(
			{
				posX: posX,
				posY: posY,
				posZ: posZ,
				blockID: blockID,
				worldTime: this.getWorldTime() + ticksFromNow
			}
		);
		*/
		
		for (var i = 0; i<scheduledUpdates.length; i++) {
			tickData.push({
				x: {
					payload: scheduledUpdates[i].posX,
					type: TAG_Int
				},
				y: {
					payload: scheduledUpdates[i].posY,
					type: TAG_Int
				},
				z: {
					payload: scheduledUpdates[i].posZ,
					type: TAG_Int
				},
				i: {
					payload: scheduledUpdates[i].blockID,
					type: TAG_Int
				},
				t: {
					payload: scheduledUpdates[i].worldTime - worldTime,
					type: TAG_Int
				}
			});
		}
		
		this.worldData.setTickData(tickData);
	}
	
	/**
	 * Simulator specific.  
	 */
	this.commitEntities = function() {
		var nbtData = [];
		
		for (var i=0; i<this.loadedEntityList.length; i++) {
			nbtData.push(this.loadedEntityList[i].writeToNBT());
		}
		
		this.worldData.setEntities(nbtData);
	}
	
	/**
	 * Simulator specific.  
	 */
	this.commitTileEntities = function() {
		var nbtData = [];
		
		for (var i in this.loadedTileEntityList) {
			nbtData.push(this.loadedTileEntityList[i].writeToNBT());
		}
		
		this.worldData.setTileEntities(nbtData);
	}
	
	this.loadAll = function() {
		this.loadEntities();
		this.loadTickData();
		this.loadTileEntities();
	}
	
	this.commitAll = function() {
		this.commitEntities();
		this.commitTickData();
		this.commitTileEntities();
	}
	
	/**
	 * Get's a tile entity at a particular coordinate
	 * 
	 * @param	{Int}	posX	Coordinate of tile entity
	 * @param	{Int}	posY	Coordinate of tile entity
	 * @param	{Int}	posZ	Coordinate of tile entity
	 * 
	 * @return	{Object}	TileEntity or null if not present
	 */
	this.getBlockTileEntity = function(posX, posY, posZ) {
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		
		if (
			typeof this.loadedTileEntityList[id] != 'undefined' &&
			!this.loadedTileEntityList[id].isInvalid()
		) {
			return this.loadedTileEntityList[id]
		}
		
		///asdasd;
		
		if (
			typeof this.addedTileEntityList[id] != 'undefined' &&
			!this.addedTileEntityList[id].isInvalid()
		) {
			return this.addedTileEntityList[id]
		}
		return null;
		
		
		//Implementation from game below, for our purposes we will just loop through an array
		/*
	this.getBlockTileEntity = function(i, j, k) {
		label0:
		{
				var tileentity;
				label1:
				{
					var chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
					if (chunk == null)
					{
						break label0;
					}
					tileentity = chunk.getChunkBlockTileEntity(i & 0xf, j, k & 0xf);
					if (tileentity != null)
					{
						break label1;
					}
					var iterator = addedTileEntityList.iterator();
					var tileentity1;
					do
					{
						if (!iterator.hasNext())
						{
								break label1;
						}
						tileentity1 = iterator.next();
					}
					while (tileentity1.isInvalid() || tileentity1.xCoord != i || tileentity1.yCoord != j || tileentity1.zCoord != k);
					tileentity = tileentity1;
				}
				return tileentity;
		}
		return null;
			 */
	}
	
	/**
	 * Sets a blocks tile entity
	 */
	this.setBlockTileEntity = function(posX, posY, posZ, tileentity) {
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		if (
			tileentity != null &&
			!tileentity.isInvalid()
		) {
			tileentity.xCoord = posX;
			tileentity.yCoord = posY;
			tileentity.zCoord = posZ;

			if (this.scanningTileEntities) {
				this.addedTileEntityList[id] = tileentity; 
			}
			else {
				this.loadedTileEntityList[id] = tileentity; 
			}
		}
		
		this.markBlockNeedsUpdate(posX, posY, posZ); //Simulator only
	}
	
	/**
	 * If a block is getting powered, for example by a torch underneath it, or wire running into it.
	 */
	this.isBlockGettingPowered = function (posX, posY, posZ)
	{
		if(this.isBlockProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		return this.isBlockProvidingPowerTo(posX + 1, posY, posZ, 5);
	}

	/**
	 * 
	 */
	this.isBlockIndirectlyGettingPowered = function (posX, posY, posZ)
	{
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		
		return this.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5);
	}
	
	/**
	 * 
	 */
	this.isBlockIndirectlyProvidingPowerTo = function(posX, posY, posZ, direction)
	{
		if(this.isBlockNormalCube(posX, posY, posZ))
		{
			return this.isBlockGettingPowered(posX, posY, posZ);
		}
		var blockID = this.getBlockId(posX, posY, posZ);
		if(blockID == 0)
		{
			return false;
		} else
		{
			return this.Block.blocksList[blockID].isPoweringTo(this, posX, posY, posZ, direction);
		}
	}
	
	/**
	 * 
	 */
	this.isBlockProvidingPowerTo = function(posX, posY, posZ, direction)
	{
		var blockID = this.getBlockId(posX, posY, posZ);
		if(blockID == 0)
		{
			return false;
		} else
		{
			return this.Block.blocksList[blockID].isIndirectlyPoweringTo(this, posX, posY, posZ, direction);
		}
	}
	
	/**
	 * 
	 */
	this.getBlockId = function(posX, posY, posZ) {
		if (posY < 0) {
			return 1; //TODO: make this customizable, for now it's returning the stone blockId, make it choose from user definable option
		}
		return this.worldData.getBlockId(posX, posY, posZ);
	}
	
	/**
	 * 
	 */
	this.getBlockMetadata = function(posX, posY, posZ) {
		return this.worldData.getBlockMetadata(posX, posY, posZ);
	}

	/**
	 * Calls the "powerBlock" method for a block at particular coordinates.
	 * 
	 * MCP has called this "playNoteAt" as before pistons, this is all it did, however, it
	 * may (or should) really be named something more appropriate now, perhaps: "powerBlockAt"
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.playNoteAt = function(posX, posY, posZ, uknownParam1, uknownParam2) {
		var blockID = this.getBlockId(posX, posY, posZ);
		if (blockID > 0) {
			this.Block.blocksList[blockID].powerBlock(this, posX, posY, posZ, uknownParam1, uknownParam2);
		}
		
	}
	
	/**
	 * Checks if the specified block has "isNormalCube" set true
	 */
	this.isBlockNormalCube = function(posX, posY, posZ) {
		var block = this.Block.blocksList[this.getBlockId(posX, posY, posZ)];
		//Old of above, which is wrong: var block = this.Block.blocksList[this.getBlockId(posX, posY, posZ)].isBlockNormalCube(posX, posY, posZ);
		if (typeof block == "undefined" || typeof block.blockType == "undefined") {
			return false;
		}
		else {
			return (block.blockMaterial.isOpaque() && block.renderAsNormalBlock());
		}
		
		//IsOpaque checks if blockMaterial has the "isTranslucent" property
		//renderAsNormalBlock is just a property of the blocktype
	}
	
	/**
	 * 
	 */
	this.setBlockAndMetadata = function(posX, posY, posZ, blockID, blockMetadata)
	{
		if (
			posX < 0 ||
			posY < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posY >= this.worldData.getSizeY() ||
			posZ >= this.worldData.getSizeZ()
		) {
			return false;
		}
		
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//var returnValue = chunk.setBlockIDWithMetadata(i & 0xf, j, k & 0xf, l, i1);
		//updateAllLightTypes(i, j, k);
		//return returnValue;
		
		//Functionality from chunk.setBlockIDWithMetadata implemented below: 
		
		var oldBlockId = this.worldData.getBlockId(posX, posY, posZ);
		var oldBlockMetadata = this.worldData.getBlockMetadata(posX, posY, posZ);
		
		if (blockID == oldBlockId && oldBlockMetadata == blockMetadata) {
			return false;
		}
		
		this.worldData.setBlockID(posX, posY, posZ, blockID);
		if (oldBlockId != 0) {
			this.Block.blocksList[oldBlockId].onBlockRemoval(this, posX, posY, posZ);
		}
		this.worldData.setBlockMetadata(posX, posY, posZ, blockMetadata);
		this.Block.blocksList[blockID].onBlockAdded(this, posX, posY, posZ);

		this.markBlockNeedsUpdate(posX, posY, posZ); //Normally this happens via updateAllLightTypes(i, j, k) and a whole lot of other calls, we are ignoring lighting data for now.
		return true;
	}
	
	/**
	 * Blocks being moved by pistons, chests, furnaces 
	 */
	this.loadTileEntities = function(tileEntities) {
		var tileEntities = this.worldData.getTileEntities();
		this.loadedTileEntityList = {}; //Clear it
		
		for (var i = 0; i<tileEntities.length; i++) {
			var id = 'entity_' + tileEntities[i].x.payload + '_' + tileEntities[i].y.payload + '_' + tileEntities[i].z.payload;
			switch (tileEntities[i].id.payload) {
				case "Piston":
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity_Piston();
					break;
				case "Sign":
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity_Sign();
					break;
				default:
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity__Unknown();
					break;
			}
			this.loadedTileEntityList[id].readFromNBT(tileEntities[i], this);
		}
	}
	
	
	/**
	 * Mobs, fires
	 * 
	 * For now, no entities are implemented 
	 */
	this.loadEntities = function() {
		var id;
		var entity;
		var entities = this.worldData.getEntities();
		this.loadedEntityList = [];
		
		for (var i = 0; i<entities.length; i++) {
			switch (entities[i].id.payload) {
				default:
					entity = new com.mordritch.mcSim.Entity__Unknown();
					entity.readFromNBT(entities[i], this);
					this.loadedEntityList.push(entity);
					break;
			}
			
		}
	}
	
	/**
	 * Called at the same regularity of tick()
	 * 
	 * Mobs are entities, special blocks like pistons, furnaces, chests are tileEntities. This calls the "updateEnity" routine of all loaded one
	 * 
	 * At this time, entities updates are not yet supported
	 */
	this.updateEntities = function() {
		this.scanningTileEntities = true;
		for (var i in this.loadedTileEntityList) {
			var tileEntity = this.loadedTileEntityList[i];
			if (!tileEntity.isInvalid() && tileEntity.worldObj != null) {
				tileEntity.updateEntity();
			}
			
			if (tileEntity.isInvalid()) {
				delete this.loadedTileEntityList[i];
			}
		}
		this.scanningTileEntities = false;
		
        /*
        TODO: See if we need to do this too, below is from the source code
        if (!entityRemoval.isEmpty())
        {
            loadedTileEntityList.removeAll(entityRemoval);
            entityRemoval.clear();
        }
        */
       
		//While scanningTileEntities was set, all new tileEntities were added to addedTileEntityList, code below migrates 
		for (var i in this.addedTileEntityList) {
			var tileentity1 = this.addedTileEntityList[i];
			if (!tileentity1.isInvalid()) {
				var presentInLoadedTileEntityList = false;
				for (var j in this.loadedTileEntityList) {
					if (this.loadedTileEntityList[j] == tileentity1) {
						presentInLoadedTileEntityList = true;
						break;
					} 
				}
				
				if (!presentInLoadedTileEntityList)
				{
					this.loadedTileEntityList[i] = tileentity1;
				}
				
				/*
				Commented out code below is from the original source, we will manyally implement the setChunkBlockTileEntity:
				
				if (chunkExists(tileentity1.xCoord >> 4, tileentity1.zCoord >> 4))
				{
					var chunk1 = getChunkFromChunkCoords(tileentity1.xCoord >> 4, tileentity1.zCoord >> 4);
					if (chunk1 != null)
					{
						chunk1.setChunkBlockTileEntity(tileentity1.xCoord & 0xf, tileentity1.yCoord, tileentity1.zCoord & 0xf, tileentity1);
					}
				}
				*/
				tileentity1.worldObj = this;

				if (this.getBlockId(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord) == 0 || !(this.Block.blocksList[this.getBlockId(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord)] instanceof com.mordritch.mcSim.BlockType_Container)) {
					
				}
				else {
					tileentity1.validate();
					//chunkTileEntityMap.put(chunkposition, tileentity);
					
				}
					
				this.markBlockNeedsUpdate(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord);
			}
		}
		this.addedTileEntityList = {};
	}
	
	/**
	 * Called by a block to schedule an update for x ticks from now. For example a torch would call itself to be updated
	 * 2 ticks from now on a neighbor change, and would then see it's changed to on / off then.
	 */
	this.scheduleBlockUpdate = function(posX, posY, posZ, blockID, ticksFromNow) {
		var foundExisting = false;
		var scheduledUpdate;
		
		for (var i = 0; i<this.scheduledUpdates.length; i++) {
			scheduledUpdate = this.scheduledUpdates[i];
			
			if (
				scheduledUpdate.posX == posX &&
				scheduledUpdate.posY == posY &&
				scheduledUpdate.posZ == posZ &&
				scheduledUpdate.blockID == blockID
			) {
				foundExisting = true;
				break;
			}
		}
		
		if (!foundExisting) {
			this.scheduledUpdates.push(
				{
					posX: posX,
					posY: posY,
					posZ: posZ,
					blockID: blockID,
					worldTime: this.getWorldTime() + ticksFromNow
				}
			);
		}
	}
	
	/**
	 * 
	 */
	this.setBlockAndMetadataWithNotify = function (posX, posY, posZ, blockID, blockMetadata)
	{
		if(this.setBlockAndMetadata(posX, posY, posZ, blockID, blockMetadata)) {
				this.notifyBlockChange(posX, posY, posZ, blockID);
				return true;
		}
		else {
				return false;
		}
	}

	/**
	 * 
	 */
	this.setBlockWithNotify = function(posX, posY, posZ, blockID) {
		if (this.setBlock(posX, posY, posZ, blockID)) {
			this.notifyBlockChange(posX, posY, posZ, blockID);
			return true;
		}
		else {
			return false;
		}
	}

	/**
	 * 
	 */
	this.notifyBlocksOfNeighborChange = function(posX, posY, posZ, blockID) {
	
		this.notifyBlockOfNeighborChange(posX - 1, posY, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX + 1, posY, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY - 1, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY + 1, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY, posZ - 1, blockID);
		this.notifyBlockOfNeighborChange(posX, posY, posZ + 1, blockID);
	}
	
	/**
	 * 
	 */
	this.notifyBlockOfNeighborChange = function(posX, posY, posZ, blockID) {
		if (this.editingBlocks) {
			return;
		}
		var block = this.Block.blocksList[this.getBlockId(posX, posY ,posZ)];
		//Block block = Block.blocksList[getBlockId(i, j, k)];
		
		if(typeof block != "undefined")
		{
				block.onNeighborBlockChange(this, posX, posY, posZ, blockID);
		}
	}
	
	/**
	 * 
	 */
	this.notifyBlockChange = function(posX, posY, posZ, blockID) {
		this.markBlockNeedsUpdate(posX, posY, posZ);
		this.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
	}
	
	/**
	 * 
	 */
	this.setBlockMetadataWithNotify = function(posX, posY, posZ, blockMetadata) {
		if (this.setBlockMetadata(posX, posY, posZ, blockMetadata))
		{
				var blockID = this.getBlockId(posX, posY, posZ);
				if(this.Block.blocksList[blockID & 0xff].requiresSelfNotify)
				{
					this.notifyBlockChange(posX, posY, posZ, blockID);
				}
				else {
					this.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
				}
		}
	}
	
	/**
	 * 
	 */
	this.setBlockMetadata = function(posX, posY, posZ, blockMetadata)
	{
		if (
			posX < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posZ >= this.worldData.getSizeZ()
		) {
				return false;
		}
		
		if (posY < 0) {
				return false;
		}
		
		if (posY >= this.worldData.getSizeY()) {
				return false;
		}
	
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//i &= 0xf;
		//k &= 0xf;
		//return chunk.setBlockMetadata(i, j, k, l);
		
		this.worldData.setBlockMetadata(posX, posY, posZ, blockMetadata);
		return true;
	}
	
	/**
	 * Checks all ticks in the queue and will update blocks scheduled for an update based on the world time. 
	 */
	this.tickUpdates = function() {
		var scheduledUpdate;
		var scheduledUpdates = this.scheduledUpdates;
		this.scheduledUpdates = new Array();
		
		for (var i in scheduledUpdates) {
			scheduledUpdate = scheduledUpdates[i];
			if (this.getWorldTime() >= scheduledUpdate.worldTime) {
				if (this.getBlockId(scheduledUpdate.posX, scheduledUpdate.posY, scheduledUpdate.posZ) == scheduledUpdate.blockID) {
					this.Block.blocksList[scheduledUpdate.blockID].updateTick(
						this,
						scheduledUpdate.posX,
						scheduledUpdate.posY,
						scheduledUpdate.posZ
					);
				}
			}
			else {
				this.scheduledUpdates.push(scheduledUpdate);
			}
		}
	}
	
	/**
	 * In MCP, this does a variety of functions like spawn mobs and eventually call tickupdates.
	 */
	this.tick = function() {
		//Randomly performs tick on blocks with tickonload set:
		
		var randX;
		var randY;
		var randZ;
		var block;
		
		/**
		 * The game normally does 20 random ticks per chunk:
		 */
		var x16 = this.worldData.getSizeX()/16;
		if (x16 < 1) x16 = 1;
		
		var z16 = this.worldData.getSizeZ()/16;
		if (z16 < 1) z16 = 1;
		
		for (var i=0; i < Math.floor(20*x16*z16); i++) {
			randX = Math.floor(Math.random()*this.worldData.getSizeX());
			randY = Math.floor(Math.random()*this.worldData.getSizeY());
			randZ = Math.floor(Math.random()*this.worldData.getSizeZ());
			block = this.Block.blocksList[this.getBlockId(randX, randY, randZ)];
			
			if (block.tickOnLoad) {
				block.updateTick(this, randX, randY, randZ);
				//console.log("Yep: "+randX+" "+randY+" "+randZ);
			}
			else {
				//console.log("Nope: "+randX+" "+randY+" "+randZ);
			}
		}
		this.worldTime++;
		this.tickUpdates();
	}
	
	/**
	 * 
	 */
	this.setBlock = function(posX, posY, posZ, blockID)
	{
		if (
			posX < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posZ >= this.worldData.getSizeZ()
		) {
				return false;
		}
		
		if (posY < 0) {
				return false;
		}
		
		if (posY >= this.worldData.getSizeY()) {
				return false;
		}
		
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//boolean flag = chunk.setBlockID(i & 0xf, j, k & 0xf, l);
		//updateAllLightTypes(i, j, k);
		//return flag;
		
		//Following 4 lines achieve what is relevant to the simulator from the function calls in the commented 4 lines above. 
		this.worldData.setBlockID(posX, posY, posZ, blockID);
		this.Block.blocksList[blockID].onBlockAdded(this, posX, posY, posZ);
		this.markBlockNeedsUpdate(posX, posZ, posY); //Normally this happens via updateAllLightTypes(i, j, k) and a whole lot of other calls, we are ignoring lighting data for now.
		return true;
	}

	/**
	 * Simulator only, not in the game.
	 * 
	 * Check if an air block has any neightbor which is a piston moving block and if it's retracting, and was facing into this
	 * block, then we know this block will eventually need a portion of the retracting block drawn. 
	 */
	this.getRetractingBlockEntity = function(posX, posY, posZ) {
		if (
			this.getBlockId(posX-1, posY, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX-1, posY, posZ).extending &&
			this.getBlockTileEntity(posX-1, posY, posZ).storedOrientation == 5
		) {
			return this.getBlockTileEntity(posX-1, posY, posZ);
		}
		
		if (
			this.getBlockId(posX+1, posY, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX+1, posY, posZ).extending &&
			this.getBlockTileEntity(posX+1, posY, posZ).storedOrientation == 4
		) {
			return this.getBlockTileEntity(posX+1, posY, posZ);
		}
		
		if (
			this.getBlockId(posX, posY-1, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY-1, posZ).extending &&
			this.getBlockTileEntity(posX, posY-1, posZ).storedOrientation == 1
		) {
			return this.getBlockTileEntity(posX, posY-1, posZ);
		}
		
		if (
			this.getBlockId(posX, posY+1, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY+1, posZ).extending &&
			this.getBlockTileEntity(posX, posY+1, posZ).storedOrientation == 0
		) {
			return this.getBlockTileEntity(posX, posY+1, posZ);
		}
		
		if (
			this.getBlockId(posX, posY, posZ-1) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY, posZ-1).extending &&
			this.getBlockTileEntity(posX, posY, posZ-1).storedOrientation == 3
		) {
			return this.getBlockTileEntity(posX, posY, posZ-1);
		}
		
		if (
			this.getBlockId(posX, posY, posZ+1) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY, posZ+1).extending &&
			this.getBlockTileEntity(posX, posY, posZ+1).storedOrientation == 2
		) {
			return this.getBlockTileEntity(posX, posY, posZ+1);
		}
		
		return null;
	}
	
	
	this.construct();
}
