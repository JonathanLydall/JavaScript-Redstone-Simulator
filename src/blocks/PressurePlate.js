(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PressurePlate";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.construct = function() {
		this.tickOnLoad = true;
		this._renderAsNormalBlock = false;
	}
	
	proto.tickRate = function() {
		return 20;
	}
	
	proto.updateTick = function(world, posX, posY, posZ) {
		//Not implemented, in the simulator, pressure plates behave more like switches, since there aren't things
		//around to put weight on them, so instead we just toggle them on and off.
    }
    
	proto.toggleBlock = function(world, posX, posY, posZ) {
		blockMetadata = world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1;
		
		if (blockMetadata) {
			world.setBlockMetadataWithNotify(posX, posY, posZ, 0);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY, posZ, 1);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		}
	}
    
    
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if (blockMetadata > 0)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		//super.onBlockRemoval(world, posX, posY, posZ);
	}
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		return world.getBlockMetadata(posX, posY, posZ) > 0;
	}
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		if (world.getBlockMetadata(posX, posY, posZ) == 0) {
			return false;
		}
		else {
			return direction == 1;
		}
	}
	
	proto.canProvidePower = function() {
		return true;
	}
	
	proto.getMobilityFlag = function() {
		return 1;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		var Block = world.Block;
		return world.isBlockNormalCube(posX, posY - 1, posZ) || world.getBlockId(posX, posY - 1, posZ) == Block.fence.blockID;
	}

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, neighborBlockId) {
		if (!this.canPlaceBlockAt(world, posX, posY, posZ)) {
			//this.dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		if (this.blockType == "pressurePlateStone") {
			var plateColour = "rgb(64,64,64)"; //dark grey
		} else {
			var plateColour = "rgb(168,135,84)"; //brown
		}

		if (world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1) {
			var poweredColour = "rgb(255,0,0)";
		}
		else {
			var poweredColour = "rgb(128,0,0)";
		}

		canvas.fillStyle = poweredColour;
		canvas.fillRect(1, 1, 6, 6);
		
		canvas.fillStyle = plateColour;
		canvas.fillRect(2, 2, 4, 4);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		if (this.blockType == "pressurePlateStone") {
			canvas.fillStyle = "rgb(64,64,64)"; //dark grey
		} else {
			canvas.fillStyle = "rgb(168,135,84)"; //brown
		}

		if (world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1) {
			canvas.fillRect(1, 7, 6, 1);
		}
		else {
			canvas.fillRect(1, 5, 6, 3);
		}
	}
}());
