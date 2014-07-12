com.mordritch.mcSim.TileEntity__Unknown = function() {};


	com.mordritch.mcSim.TileEntity__Unknown.prototype = new com.mordritch.mcSim.TileEntity__Default();

	/**
	 * Used to import NBT data
	 */
	com.mordritch.mcSim.TileEntity__Unknown.prototype._readFromNBT = com.mordritch.mcSim.TileEntity__Unknown.prototype.readFromNBT; //a super method of sorts
	com.mordritch.mcSim.TileEntity__Unknown.prototype.readFromNBT = function(nbttagcompound) {
		this._readFromNBT(nbttagcompound);
		this.mappingId = nbttagcompound.id.payload;
		this.entityId = nbttagcompound.id.payload;
		this.loaded_NBT_Data = nbttagcompound;
	};
	
	/**
	 * Used to export NBT data
	 */
	com.mordritch.mcSim.TileEntity__Unknown.prototype._writeToNBT = com.mordritch.mcSim.TileEntity__Unknown.prototype.writeToNBT; //a super method of sorts
	com.mordritch.mcSim.TileEntity__Unknown.prototype.writeToNBT = function() {
		var nbttagcompound = this.loaded_NBT_Data;
		return this._writeToNBT(nbttagcompound);
	};
