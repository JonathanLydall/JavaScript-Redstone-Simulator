(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "TileEntity__Default";
	var funcName = "TileEntity_Piston";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.storedBlockID = 0;
	proto.storedMetadata = 0;
	proto.storedOrientation = 0; //the side the front of the piston is on
	proto.extending = false; //if this piston is extending or not
	proto.shouldHeadBeRendered = false;
	proto.progress = 0.0;
	proto.lastProgress = 0.0; //the progress in (de)extending
	proto.pushedObjects = [];
	proto.worldObj = null;
	
	proto.construct = function(storedBlockID, storedMetadata, storedOrientation, extending, shouldHeadBeRendered, worldObj) {
		this.storedBlockID = storedBlockID;
		this.storedMetadata = storedMetadata;
		this.storedOrientation = storedOrientation;
		this.extending = extending;
		this.shouldHeadBeRendered = shouldHeadBeRendered;
		this.worldObj = worldObj;
		this.entityId = "Piston"; //used by the base class's writeToNBT() method
	};

	proto.rotateSelection = function(amount) {
		var storedBlock = this.worldObj.Block.blocksList[this.storedBlockID];
		this.storedMetadata = storedBlock.rotateSelection(this.storedMetadata, amount);
	};

	proto.getStoredBlockID = function() {
		return this.storedBlockID;
	};
	
	/**
	 * Returns block data at the location of this entity (client-only).
	 */
	proto.getBlockMetadata = function() {
		return this.storedMetadata;
	};
	
	/**
	 * Returns true if a piston is extending
	 */
	proto.isExtending = function() {
		return this.extending;
	};
	
	/**
	 * Returns the orientation of the piston as an int
	 */
	proto.getPistonOrientation = function() {
		return this.storedOrientation;
	};
	
	proto.shouldRenderHead = function() {
		return this.shouldHeadBeRendered;
	};
	
	/**
	 * Get interpolated progress value (between lastProgress and progress) given the fractional time between ticks as an
	 * argument.
	 */
	proto.getProgress = function(par1) {
		if (par1 > 1.0) par1 = 1.0;

		return this.lastProgress + (progress - lastProgress) * par1;
	};
	
	proto.getOffsetX = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsXForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsXForSide[storedOrientation];
		}
	};
	
	proto.getOffsetY = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsYForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsYForSide[storedOrientation];
		}
	};
	
	proto.getOffsetZ = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsZForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsZForSide[storedOrientation];
		}
	};
	
	/* Used by renderer only?
	proto.updatePushedObjects = function(par1, par2)
	{
		if (!this.extending)
		{
			par1--;
		}
		else
		{
			par1 = 1.0 - par1;
		}

		AxisAlignedBB axisalignedbb = Block.pistonMoving.getAxisAlignedBB(worldObj, xCoord, yCoord, zCoord, storedBlockID, par1, storedOrientation);

		if (axisalignedbb != null)
		{
			List list = worldObj.getEntitiesWithinAABBExcludingEntity(null, axisalignedbb);

			if (!list.isEmpty())
			{
				pushedObjects.addAll(list);
				Entity entity;

				for (Iterator iterator = pushedObjects.iterator(); iterator.hasNext(); entity.moveEntity(par2 * (float)Facing.offsetsXForSide[storedOrientation], par2 * (float)Facing.offsetsYForSide[storedOrientation], par2 * (float)Facing.offsetsZForSide[storedOrientation]))
				{
					entity = (Entity)iterator.next();
				}

				pushedObjects.clear();
			}
		}
	}
	*/

	/**
	 * removes a pistons tile entity (and if the piston is moving, stops it)
	 */
	proto.clearPistonTileEntity = function() {
		if (this.lastProgress < 1.0 && this.worldObj != null) {
			this.lastProgress = this.progress = 1.0;
			this.worldObj.removeBlockTileEntity(this.xCoord, this.yCoord, this.zCoord);
			this.invalidate();

			if (this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord) == this.worldObj.Block.pistonMoving.blockID) {
				this.worldObj.setBlockAndMetadataWithNotify(this.xCoord, this.yCoord, this.zCoord, this.storedBlockID, this.storedMetadata);
			}
		}
	};
	
	/**
	 * Allows the entity to update its state. Overridden in most subclasses, e.g. the mob spawner uses this to count
	 * ticks and creates a new spawn inside its implementation.
	 */
	proto.updateEntity = function() {
        this.worldObj.markBlockNeedsUpdate(this.xCoord, this.yCoord, this.zCoord);
		this.lastProgress = this.progress;

		if (this.lastProgress >= 1.0) {
			//this.updatePushedObjects(1.0, 0.25); //For renderer only?
			this.worldObj.removeBlockTileEntity(this.xCoord, this.yCoord, this.zCoord);
			this.invalidate();

			if (this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord) == this.worldObj.Block.pistonMoving.blockID) {
				this.worldObj.setBlockAndMetadataWithNotify(this.xCoord, this.yCoord, this.zCoord, this.storedBlockID, this.storedMetadata);
			}

			return;
		}

		this.progress += 0.5;

		if (this.progress >= 1.0) {
			this.progress = 1.0;
		}

		if (this.extending) {
			//this.updatePushedObjects(this.progress, (this.progress - this.lastProgress) + 0.0625); //For renderer only?
		}
	};
	
	/**
	 * Reads a tile entity from NBT.
	 */
	proto._readFromNBT = proto.readFromNBT; //a super method of sorts
	proto.readFromNBT = function(nbttagcompound, worldObj)
	{
		this._readFromNBT(nbttagcompound, worldObj);
		
		var storedBlockID = nbttagcompound.blockId.payload;
		var storedMetadata = nbttagcompound.blockData.payload;
		var storedOrientation = nbttagcompound.facing.payload;
		var progress = nbttagcompound.progress.payload;
		var extending = nbttagcompound.extending.payload;
		
		//function(storedBlockID, storedMetadata, storedOrientation, extending, shouldHeadBeRendered, worldObj)
		this.construct(
			storedBlockID,
			storedMetadata,
			storedOrientation,
			extending,
			false,
			worldObj
		);
		
		/*
		super.readFromNBT(par1NBTTagCompound);
		storedBlockID = par1NBTTagCompound.getInteger("blockId");
		storedMetadata = par1NBTTagCompound.getInteger("blockData");
		storedOrientation = par1NBTTagCompound.getInteger("facing");
		lastProgress = progress = par1NBTTagCompound.getFloat("progress");
		extending = par1NBTTagCompound.getBoolean("extending");
		*/
	};

	/**
	 * Writes a tile entity to NBT.
	 */
	proto._writeToNBT = proto.writeToNBT; //a super method of sorts
	proto.writeToNBT = function()
	{
		var nbttagcompound = this._writeToNBT({});
		
		nbttagcompound.blockId = {
			payload: this.storedBlockID,
			type: 3
		};
		
		nbttagcompound.blockData = {
			payload: this.storedMetadata,
			type: 3
		};
		
		nbttagcompound.facing = {
			payload: this.storedOrientation,
			type: 3
		};
		
		nbttagcompound.progress = {
			payload: this.lastProgress,
			type: 5
		};
		
		nbttagcompound.extending = {
			payload: (this.extending) ? 1 : 0,
			type: 1
		};
		return nbttagcompound;

		/*
		super.writeToNBT(par1NBTTagCompound);
		par1NBTTagCompound.setInteger("blockId", storedBlockID);
		par1NBTTagCompound.setInteger("blockData", storedMetadata);
		par1NBTTagCompound.setInteger("facing", storedOrientation);
		par1NBTTagCompound.setFloat("progress", lastProgress);
		par1NBTTagCompound.setBoolean("extending", extending);
		*/
	};
}());
