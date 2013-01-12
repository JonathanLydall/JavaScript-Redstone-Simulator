com.mordritch.mcSim.TileEntity__Default = function() {
	//this.nameToClassMap = new Array();
	//this.classToNameMap = new Array();
	this.xCoord = 0; //int
	this.yCoord = 0; //int
	this.zCoord = 0; //int
	this.tileEntityInvalid = false; //bool
	this.blockMetadata = -1; //int
	this.blockType = null; //in source code it's of type "Block"
	this.worldObj = null;
	
	this.facing = new com.mordritch.mcSim.facing();

	
	/**
	 * Used to import NBT data
	 */
	this.readFromNBT = function(nbttagcompound, worldObj) {
		this.worldObj = worldObj;

		this.xCoord = nbttagcompound.x.payload;
		this.yCoord = nbttagcompound.y.payload;
		this.zCoord = nbttagcompound.z.payload;
		
		//TODO: port: (done above now)
		/*
		 *         
		xCoord = nbttagcompound.getInteger("x");
        yCoord = nbttagcompound.getInteger("y");
        zCoord = nbttagcompound.getInteger("z");

		 */
	}
	
	/**
	 * Used to rotate the entire world or a selection of blocks, torches for example can have their metadata updated appropriately
	 * 
	 * Accepts amount of times to rotate the block 90 degrees clockwise, so, to rotate it 180 degress clockwise, the amount would be 2, 270 would be 3
	 */
	this.rotateSelection = function(amount) {
	}
	
	/**
	 * Used to export NBT data
	 */
	this.writeToNBT = function(nbttagcompound) {
		if (typeof this.entityId == "undefined") {
			throw new Error("entityId not defined, ensure it is defined in the inheriting entity \"class\".");
		}
		nbttagcompound.id = {
			payload: this.entityId,
			type: 8
		};
		
		nbttagcompound.x = {
			payload: this.xCoord,
			type: 3
		};
		
		nbttagcompound.y = {
			payload: this.yCoord,
			type: 3
		};
		
		nbttagcompound.z = {
			payload: this.zCoord,
			type: 3
		};
		
		return nbttagcompound;
		
		
		//TODO: port (done above)
		/*
	        String s = (String)classToNameMap.get(getClass());
	        if (s == null)
	        {
	            throw new RuntimeException((new StringBuilder()).append(getClass()).append(" is missing a mapping! This is a bug!").toString());
	        }
	        else
	        {
	            nbttagcompound.setString("id", s);
	            nbttagcompound.setInteger("x", xCoord);
	            nbttagcompound.setInteger("y", yCoord);
	            nbttagcompound.setInteger("z", zCoord);
	            return;
	        }
		 */
	}
	
	/**
	 * Called for each entity each time the game ticks.
	 */
	this.updateEntity = function() {
		
	}
	
	/**
	 * Called when loading world/shematic data
	 */
	this.createAndLoadEntity = function() {
		//TODO: Port
		
		/*
        TileEntity tileentity = null;
        try
        {
            Class class1 = (Class)nameToClassMap.get(nbttagcompound.getString("id"));
            if (class1 != null)
            {
                tileentity = (TileEntity)class1.newInstance();
            }
        }
        catch (Exception exception)
        {
            exception.printStackTrace();
        }
        if (tileentity != null)
        {
            tileentity.readFromNBT(nbttagcompound);
        }
        else
        {
            System.out.println((new StringBuilder()).append("Skipping TileEntity with id ").append(nbttagcompound.getString("id")).toString());
        }
        return tileentity;
		 */
	}
	
	/**
	 * 
	 */
	this.getBlockMetadata = function() {
		if (this.blockMetadata == -1) {
			this.blockMetadata = this.worldObj.getBlockMetadata(this.xCoord, this.yCoord, this.zCoord);
		}
		return this.blockMetadata;
	}
	
	/**
	 * 
	 */
	this.onInventoryChanged = function() {
		if (this.worldObj != null) {
			
			this.blockMetadata = worldObj.getBlockMetadata(this.xCoord, this.yCoord, this.zCoord);
			//this.worldObj.updateTileEntityChunkAndDoNothing(this.xCoord, this.yCoord, this.zCoord, this); //TODO: Is this needed?
		}
	}
	
	this.getDistanceFrom = function(otherX, otherY, otherZ) {
		var distanceX = (this.xCoord + 0.5) - otherX;
		var distanceY = (this.yCoord + 0.5) - otherY;
		var distanceZ = (this.zCoord + 0.5) - otherZ;
		
		return distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ;
	}
	
	/**
	 * Gets a block object based on the coordinates of the entity
	 * 
	 * @return {Object}	type of block
	 */
	this.getBlockType = function() {
		if (this.blockType == null) {
			this.blockType = this.worldObj.blocksList[this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord)];
		}
		return this.blockType;
	}
	
	this.isInvalid = function() {
		return this.tileEntityInvalid;
	}
	
	this.invalidate = function() {
		this.tileEntityInvalid = true;
	}
	
	this.validate = function() {
		this.tileEntityInvalid = false;
	}
	
	this.onTileEntityPowered = function() {
		
	}
	
	this.updateContainingBlockInfo = function() {
		this.blockType = null;
		this.blockMetadata = -1;
	}
	
}