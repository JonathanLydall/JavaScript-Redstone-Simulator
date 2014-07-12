(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "TileEntity__Default";
	var funcName = "TileEntity_Sign";
	
	namespace[funcName] = function() {this.construct();};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.worldObj = null;
	proto.entityId = "Sign";
	
	proto.construct = function() {
		this.text = new Array("", "", "", "");
	};
	
	/**
	 * Reads a tile entity from NBT.
	 */
	proto._readFromNBT = proto.readFromNBT; //a super method of sorts
	proto.readFromNBT = function(nbttagcompound, worldObj)
	{
		this._readFromNBT(nbttagcompound, worldObj);
		
		var text = [
			nbttagcompound.Text1.payload,
			nbttagcompound.Text2.payload,
			nbttagcompound.Text3.payload,
			nbttagcompound.Text4.payload
		];
		
		this.worldObj = worldObj;
		this.text = text;
	};

	/**
	 * Writes a tile entity to NBT.
	 */
	proto._writeToNBT = proto.writeToNBT; //a super method of sorts
	proto.writeToNBT = function()
	{
		var nbttagcompound = this._writeToNBT({});
		
		nbttagcompound.Text1 = {
			payload: this.text[0],
			type: 8
		};
		
		nbttagcompound.Text2 = {
			payload: this.text[1],
			type: 8
		};
		
		nbttagcompound.Text3 = {
			payload: this.text[2],
			type: 8
		};
		
		nbttagcompound.Text4 = {
			payload: this.text[3],
			type: 8
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
