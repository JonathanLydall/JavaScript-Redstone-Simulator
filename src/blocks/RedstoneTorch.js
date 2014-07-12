(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Torch";
	var funcName = "BlockType_RedstoneTorch";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.drawIconBlockMetadataOveride = 4;
		this.tickOnLoad = true;
		this.torchActive = true;
		this.torchUpdates = new Array();
		
		if (!this.isActive()) {
			this.torchActive = false;
		}
	};
		
	proto.isActive = function() {
		if (this.blockType == "torchRedstoneActive") {
			return true;
		}
	
		if (this.blockType == "torchRedstoneIdle") {
			return false;
		}
	};
	
	/**
	 * See if there have been too many torch updates recently, if so, burn out torch
	 * 
	 * @param	{Bool}	logUpdate	Record this in an update when checking for burnout
	 */
	proto.checkForBurnout = function(world, posX, posY, posZ, logUpdate) {
		if(logUpdate) {
			this.torchUpdates.push(
				{
					x: posX,
					y: posY,
					z: posZ,
					updateTime: world.getWorldTime() 
				}
			);
		}
		
		var updateCount = 0;
		for(var i = 0; i < this.torchUpdates.length; i++)
		{
			redstoneupdateinfo = this.torchUpdates[i];
			if(
				redstoneupdateinfo.x == posX &&
				redstoneupdateinfo.y == posY &&
				redstoneupdateinfo.z == posZ &&
				++updateCount >= 8
			) {
				return true;
			}
		}

		return false;
	};
	
	proto.canProvidePower = function() {
		return true;
	};
	
	proto.tickRate = function() {
		return 2;
	};
	
	proto.isPoweringTo = function (world, posX, posY, posZ, direction) {
		//TODO: Confirm last parameter = direction?
		if(!this.torchActive)
		{
			return false;
		}
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		if(blockMetaData == 5 && direction == 1)
		{
			return false;
		}
		if(blockMetaData == 3 && direction == 3)
		{
			return false;
		}
		if(blockMetaData == 4 && direction == 2)
		{
			return false;
		}
		if(blockMetaData == 1 && direction == 5)
		{
			return false;
		}
		return blockMetaData != 2 || direction != 4;
	};
	
	proto.isIndirectlyPowered = function(world, posX, posY, posZ) {
		var direction = world.getBlockMetadata(posX, posY, posZ);
		if(direction == 5 && world.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(direction == 3 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(direction == 4 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(direction == 1 && world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		if (direction == 2 && world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5))
		{
			return true;
		}
		
		return false;
	};

	proto.updateTick = function(world, posX, posY, posZ) {
		var isIndirectlyPowered = this.isIndirectlyPowered(world, posX, posY, posZ);
		for(; this.torchUpdates.length > 0 && world.getWorldTime() - this.torchUpdates[0].updateTime > 100; this.torchUpdates.splice(0,1)) {}
		
		if(this.torchActive) {
			if(isIndirectlyPowered)
			{
				world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.torchRedstoneIdle.blockID, world.getBlockMetadata(posX, posY, posZ));
				if(this.checkForBurnout(world, posX, posY, posZ, true))
				{
					console.log("Redstone torch at %s, %s, %s burnt out.", posX, posY, posZ);
					//TODO: Provide feedback to the user that the torch has burnt out, in the game you get a fizzle sound and a few particles show.
				}
			}
		}
		else if (!isIndirectlyPowered && !this.checkForBurnout(world, posX, posY, posZ, false)) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.torchRedstoneActive.blockID, world.getBlockMetadata(posX, posY, posZ));
		}
	};
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		//TODO: Confirm last parameter = direction?
		
		if(direction == 0)
		{
			return this.isPoweringTo(world, posX, posY, posZ, direction);
		} else
		{
			return false;
		}
	};
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		/*
		from the source:
		super.onNeighborBlockChange(world, i, j, k, l);
		world.scheduleBlockUpdate(i, j, k, blockID, tickRate());
		*/
	
		if (this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
			world.setBlockWithNotify(posX, posY, posZ, world.Block.air.blockID);
		}
		else {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.tickRate());
		}
	};
	
	proto.onBlockAdded = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		var torchActive = this.torchActive;

		if (world.getBlockMetadata(posX, posY, posZ) == 0)
		{
			//super.onBlockAdded(world, posX, posY, posZ);
		}
		if (torchActive)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
	};
	
	proto.onBlockRemoval = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		var torchActive = this.torchActive;
		
		if (torchActive)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
	};
	
	proto.enumeratePlaceableBlocks = function() {
		if (this.blockType == "torchRedstoneActive") {
			return new Array(
				{
					blockID: this.blockID,
					blockMetadata: 0,
					blockType: this.blockType,
					blockName: this.getBlockName(0),
					material: this.material
				}
			);
		}
		else {
			return new Array();
		}
	};
}());
