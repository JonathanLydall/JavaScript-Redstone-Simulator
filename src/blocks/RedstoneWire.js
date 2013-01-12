(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_RedstoneWire";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	//proto._super = com.mordritch.mcSim.BlockType_Block.prototype; //doesn't work

	proto.material = "circuits";

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.blocksNeedingUpdate = new Array();
		this.wiresProvidePower = true;
		this.debugCharge = true;
		this.debugCharge = false;
	}
	
	proto.canProvidePower = function() {
		return this.wiresProvidePower;
	}
	
	proto.onBlockAdded = function(world, posX, posY, posZ) {
		//this._super.onBlockAdded(posX, posY, posZ); //TODO: The MCP source code calls the super method, fortunately with "Block", that function does nothing, but could be an issue with other block types.
		
		this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, this.blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
		
		this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ - 1);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ + 1);
		
		if(world.isBlockNormalCube(posX - 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX + 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ - 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ - 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ - 1);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ + 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ + 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ + 1);
		}
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ, direction) {
		var Block = world.Block;
		return world.isBlockNormalCube(posX, posY - 1, posZ) || world.getBlockId(posX, posY - 1, posZ) == Block.glowStone.blockID;
	}
	
	/**
	 * Returns true if the block coordinate passed can provide power, or is a redstone wire, or if its a repeater that is powered.
	 */
	proto.isPowerProviderOrWire = function(world, posX, posY, posZ, direction) {
		var blockID = world.getBlockId(posX, posY, posZ);
		if(blockID == world.Block.redstoneWire.blockID)
		{
			return true;
		}
		
		if(blockID == 0)
		{
			return false;
		}
		
		if(world.Block.blocksList[blockID].canProvidePower() && direction != -1)
		{
			return true;
		}
		
		if(blockID == world.Block.redstoneRepeaterIdle.blockID || blockID == world.Block.redstoneRepeaterActive.blockID)
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			//Original MCP line below:
			//return direction == (blockMetadata & 3) || direction == Direction.footInvisibleFaceRemap[blockMetadata & 3]; // Direction.footInvisibleFaceRemap is an array of ints, with values: 2, 3, 0, 1
			//Replaced by following two lines:			
			var faceRemapArray = new Array(2, 3, 0, 1); //As from Direction.footInvisibleFaceRemap
			return direction == (blockMetadata & 3) || direction == faceRemapArray[blockMetadata & 3]; 
		}

		return false;
	}

	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction)
	{
		if(!this.wiresProvidePower)
		{
			return false;
		} else
		{
			return this.isPoweringTo(world, posX, posY, posZ, direction);
		}
	 }


	proto.isPoweredOrRepeater = function(world, posX, posY, posZ, direction)
	{
		if (this.isPowerProviderOrWire(world, posX, posY, posZ, direction))
		{
			return true;
		}
		var blockID = world.getBlockId(posX, posY, posZ);
		if (blockID == world.Block.redstoneRepeaterActive.blockID)
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			return direction == (blockMetadata & 3);
		}
		else
		{
			return false;
		}
	}
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction)
	{
		if(!this.wiresProvidePower)
		{
			return false;
		}
		if(world.getBlockMetadata(posX, posY, posZ) == 0)
		{
			return false;
		}
		if(direction == 1)
		{
			return true;
		}
		var checkWest = this.isPoweredOrRepeater(world, posX - 1, posY, posZ, 1) || !world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPoweredOrRepeater(world, posX - 1, posY - 1, posZ, -1);
		var checkEast = this.isPoweredOrRepeater(world, posX + 1, posY, posZ, 3) || !world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPoweredOrRepeater(world, posX + 1, posY - 1, posZ, -1);
		var checkNorth = this.isPoweredOrRepeater(world, posX, posY, posZ - 1, 2) || !world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPoweredOrRepeater(world, posX, posY - 1, posZ - 1, -1);
		var checkSouth = this.isPoweredOrRepeater(world, posX, posY, posZ + 1, 0) || !world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPoweredOrRepeater(world, posX, posY - 1, posZ + 1, -1);
		
		if(!world.isBlockNormalCube(posX, posY + 1, posZ))
		{
			if(world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPoweredOrRepeater(world, posX - 1, posY + 1, posZ, -1)) {
				checkWest = true;
			}

			if(world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPoweredOrRepeater(world, posX + 1, posY + 1, posZ, -1)) {
					checkEast = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPoweredOrRepeater(world, posX, posY + 1, posZ - 1, -1)) {
				checkNorth = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPoweredOrRepeater(world, posX, posY + 1, posZ + 1, -1)) {
				checkSouth = true;
			}
		}
		
		if(!checkNorth && !checkEast && !checkWest && !checkSouth && direction >= 2 && direction <= 5) {
				return true;
		}
		if(direction == 2 && checkNorth && !checkWest && !checkEast) {
				return true;
		}
		if(direction == 3 && checkSouth && !checkWest && !checkEast) {
				return true;
		}
		if(direction == 4 && checkWest && !checkNorth && !checkSouth) {
				return true;
		}
		return direction == 5 && checkEast && !checkNorth && !checkSouth;
	}

	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		//super.onBlockRemoval(posX, posY, posZ);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posY, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);

		this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		
		this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ - 1);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ + 1);
		
		if(world.isBlockNormalCube(posX - 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX + 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ - 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ - 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ - 1);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ + 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ + 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ + 1);
		}
	}

	
	proto.notifyWireNeighborsOfNeighborChange = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		
		if(world.getBlockId(posX, posY, posZ) != blockID)
		{
			return;
		} else
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			return;
		}
	}
	
	
	proto.onNeighborBlockChange = function (world, posX, posY, posZ, direction) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var canPlaceBlockAt = this.canPlaceBlockAt(world, posX, posY, posZ);
		
		if(!canPlaceBlockAt) {
			//world.dropBlockAsItem(posX, posY, posZ, blockMetadata, 0);
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
		else {
			this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		}
		
		//super.onNeighborBlockChange(world, posX, posY, posZ, direction); //Block which this is inherited from does nothing in the method
	}

	/**
	 * Check and see if the target block is a "power provider" (IE: does it connect wires);
	 */
	proto.isPowerProviderOrWire = function(world, posX, posY, posZ, direction) {
		var blockID = world.getBlockId(posX, posY, posZ);
		
		if (blockID == world.Block.redstoneWire.blockID) {
			return true;
		}
		
		if (world.Block.blocksList[blockID].canProvidePower(posX, posY, posZ) && direction != -1) {
			return true;
		}
		
		if (blockID == world.Block.redstoneRepeaterIdle.blockID
			|| blockID == world.Block.redstoneRepeaterActive.blockID
		) {
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			var footInvisibleFaceRemap = new Array(2, 3, 0, 1); //take from Direction.
			return (direction == (blockMetadata & 3) || direction == footInvisibleFaceRemap[blockMetadata & 3]) 
		}
		else {
			return false;
		} 
		
	}
	
	proto.updateAndPropagateCurrentStrength = function(world, posX, posY, posZ)
	{
		this.calculateCurrentChanges(world, posX, posY, posZ, posX, posY, posZ);
		var blocksNeedingUpdate = this.blocksNeedingUpdate;
		this.blocksNeedingUpdate = new Array();
		
		//TODO: In the MC source, it uses a hash set, which prevents element duplication, use/implement something equivalent
		
		for(var i = 0; i < blocksNeedingUpdate.length; i++)
		{
			world.notifyBlocksOfNeighborChange(blocksNeedingUpdate[i][0], blocksNeedingUpdate[i][1], blocksNeedingUpdate[i][2], this.blockID);
		}

	}

	proto.getMaxCurrentStrength = function(world, posX, posY, posZ, strength)
	{
		if(world.getBlockId(posX, posY, posZ) != this.blockID)
		{
			return strength;
		}
		
		var otherStrength = world.getBlockMetadata(posX, posY, posZ);
		if(otherStrength > strength)
		{
			return otherStrength;
		} else
		{
			return strength;
		}
	}

	proto.calculateCurrentChanges = function(world, posX, posY, posZ, sourcePosX, sourcePosY, sourcePosZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var wirePowerLevel = 0;
		
		this.wiresProvidePower = false;
		var isBlockIndirectlyGettingPowered = world.isBlockIndirectlyGettingPowered(posX, posY, posZ);
		this.wiresProvidePower = true;
		
		if (isBlockIndirectlyGettingPowered) {
			wirePowerLevel = 15;
		}
		else {
			for (var direction = 0; direction < 4; direction++) {
				var checkX = posX;
				var checkZ = posZ;
				if (direction == 0) {
					checkX--;
				}
				if (direction == 1) {
					checkX++;
				}
				if (direction == 2) {
					checkZ--;
				}
				if (direction == 3) {
					checkZ++;
				}
				if (checkX != sourcePosX || posY != sourcePosY || checkZ != sourcePosZ) {
					wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY, checkZ, wirePowerLevel);
				}
				if (world.isBlockNormalCube(checkX, posY, checkZ) && !world.isBlockNormalCube(posX, posY + 1, posZ)) {
					if (checkX != sourcePosX || posY + 1 != sourcePosY || checkZ != sourcePosZ) {
						wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY + 1, checkZ, wirePowerLevel);
					}
					continue;
				}
				if (!world.isBlockNormalCube(checkX, posY, checkZ) && (checkX != sourcePosX || posY - 1 != sourcePosY || checkZ != sourcePosZ)) {
					wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY - 1, checkZ, wirePowerLevel);
				}
			}

			if (wirePowerLevel > 0) {
				wirePowerLevel--;
			}
			else {
				wirePowerLevel = 0;
			}
		}
		if (blockMetadata != wirePowerLevel) {
			//world.editingBlocks = true;
			world.setBlockMetadataWithNotify(posX, posY, posZ, wirePowerLevel);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
			//world.editingBlocks = false;
			for (var direction = 0; direction < 4; direction++) {
				var checkX = posX;
				var checkZ = posZ;
				var checkY = posY - 1;
				if (direction == 0) {
					checkX--;
				}
				if (direction == 1) {
					checkX++;
				}
				if (direction == 2) {
					checkZ--;
				}
				if (direction == 3) {
					checkZ++;
				}
				if (world.isBlockNormalCube(checkX, posY, checkZ)) {
					checkY += 2;
				}
				var otherWirePowerLevel = 0;
				otherWirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY, checkZ, -1);
				wirePowerLevel = world.getBlockMetadata(posX, posY, posZ);
				if (wirePowerLevel > 0) {
					wirePowerLevel--;
				}
				if (otherWirePowerLevel >= 0 && otherWirePowerLevel != wirePowerLevel) {
					this.calculateCurrentChanges(world, checkX, posY, checkZ, posX, posY, posZ);
				}
				otherWirePowerLevel = this.getMaxCurrentStrength(world, checkX, checkY, checkZ, -1);
				wirePowerLevel = world.getBlockMetadata(posX, posY, posZ);
				if (wirePowerLevel > 0) {
					wirePowerLevel--;
				}
				if (otherWirePowerLevel >= 0 && otherWirePowerLevel != wirePowerLevel) {
					this.calculateCurrentChanges(world, checkX, checkY, checkZ, posX, posY, posZ);
				}
			}

			if (blockMetadata < wirePowerLevel || wirePowerLevel == 0) {
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX - 1, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX + 1, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY - 1, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY + 1, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ - 1));
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ + 1));
			}
		}
	}
	
	proto.getConnectedDirectionsForDrawing = function(world, posX, posY, posZ) {
		var connectedW = this.isPowerProviderOrWire(world, posX - 1, posY, posZ, 1) || !world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPowerProviderOrWire(world, posX - 1, posY - 1, posZ, -1);
		var connectedE = this.isPowerProviderOrWire(world, posX + 1, posY, posZ, 3) || !world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPowerProviderOrWire(world, posX + 1, posY - 1, posZ, -1);
		var connectedN = this.isPowerProviderOrWire(world, posX, posY, posZ - 1, 2) || !world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPowerProviderOrWire(world, posX, posY - 1, posZ - 1, -1);
		var connectedS = this.isPowerProviderOrWire(world, posX, posY, posZ + 1, 0) || !world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPowerProviderOrWire(world, posX, posY - 1, posZ + 1, -1);
		
		if (!world.isBlockNormalCube(posX, posY + 1, posZ)) {
			if(world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPowerProviderOrWire(world, posX - 1, posY + 1, posZ, -1))
			{
				connectedW = true;
			}
			if(world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPowerProviderOrWire(world, posX + 1, posY + 1, posZ, -1))
			{
				connectedE = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPowerProviderOrWire(world, posX, posY + 1, posZ - 1, -1))
			{
				connectedN = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPowerProviderOrWire(world, posX, posY + 1, posZ + 1, -1))
			{
				connectedS = true;
			}
		}
		return {
			N: connectedN,
			E: connectedE,
			S: connectedS,
			W: connectedW
		};
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var connected = this.getConnectedDirectionsForDrawing(world, posX, posY, posZ);
		
		if (blockMetadata > 0) {
			canvas.fillStyle = "rgb(255,0,0)";
		}
		else {
			canvas.fillStyle = "rgb(128,0,0)";
		}
		
		if (connected.N || (connected.S && !connected.E && !connected.W)) {
			canvas.fillRect(3, 0, 2, 5);
		}

		if (connected.E || (connected.W && !connected.N && !connected.S)) {
			canvas.fillRect(3, 3, 5, 2);
		}

		if (connected.S || (connected.N && !connected.E && !connected.W)) {
			canvas.fillRect(3, 3, 2, 5);
		}

		if (connected.W || (connected.E && !connected.N && !connected.S)) {
			canvas.fillRect(0, 3, 5, 2);
		}
		
		if (!connected.N && !connected.E && !connected.S && !connected.W) {
			//since 1.0.0 (possibly earlier) we now always draw a square in the middle if there are no connections, instead of a cross
			canvas.fillRect(2, 3, 4, 2);
			canvas.fillRect(3, 2, 2, 4);
		}

		this.drawDebugCharge(blockMetadata, canvas);
	}
	
	proto.drawDebugCharge = function(charge, canvas) {
		if (this.debugCharge) {
			canvas.fillStyle = "rgba(255,255,255,0.8)";
			canvas.fillRect(0,0,8,8);
			
			canvas.fillStyle = "rgb(0,0,0)";
			canvas.strokeStyle = "rgb(255,255,255)";

			canvas.textBaseline = "middle";
			canvas.textAlign = "center";
			canvas.font = "bold " + (6) + "px arial";
			
			/*
			So, a couple of problems with canvas text in Google's chrome:
			
			1. canvas: the fillText method ignores the maxWidth argument
				http://code.google.com/p/chromium/issues/detail?id=20597
			
			2. strokeText() produces no output when canvas dimensions are set dynamically
				http://code.google.com/p/chromium/issues/detail?id=44017
				
			I may be able to work around #2, by re-creating the canvas elements instead of resizing them,
			however, as this is just debug functionality, not going to much effort.

			*/
			
			canvas.fillText(charge, 4, 4, 6-2);
			//canvas.strokeText(charge, 4, 4, 6-2);
		}
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var connected = this.getConnectedDirectionsForDrawing(world, posX, posY, posZ);
		var NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;
		
		if (blockMetadata > 0) {
			canvas.fillStyle = "rgb(255,0,0)";
		}
		else {
			canvas.fillStyle = "rgb(128,0,0)";
		}
		
		var drawLeft = false;
		var drawMiddle = false;
		var drawRight = false;
		var connections = 0;

		if (connected.N) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawMiddle = true;
					break;
				case NORTH:
					drawMiddle = true;
					break;
				case WEST:
					drawRight = true;
					break;
				case EAST:
					drawLeft = true;
					break;
			}
		}

		if (connected.S) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawMiddle = true;
					break;
				case NORTH:
					drawMiddle = true;
					break;
				case WEST:
					drawLeft = true;
					break;
				case EAST:
					drawRight = true;
					break;
			}
		}

		if (connected.E) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawLeft = true;
					break;
				case NORTH:
					drawRight = true;
					break;
				case WEST:
					drawMiddle = true;
					break;
				case EAST:
					drawMiddle = true;
					break;
			}
		}

		if (connected.W) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawRight = true;
					break;
				case NORTH:
					drawLeft = true;
					break;
				case WEST:
					drawMiddle = true;
					break;
				case EAST:
					drawMiddle = true;
					break;
			}
		}
		
		if ((connections == 1) && (drawLeft || drawRight)) {
			drawLeft = true;
			drawRight = true;
		}
		
		if (drawLeft && !drawRight) {
			canvas.fillRect(0, 6, 5, 2);
		}
		
		if (!drawLeft && drawRight) {
			canvas.fillRect(3, 6, 5, 2);
		}
		
		if (drawLeft && drawRight) {
			canvas.fillRect(0, 6, 8, 2);
		}
		
		if (!drawLeft && !drawRight && !drawMiddle) {
			//No connections
			canvas.fillRect(2, 6, 4, 2);
		}
		
		if (!drawLeft && !drawRight && drawMiddle) {
			canvas.fillRect(3, 6, 2, 2);
		}
		
		this.drawDebugCharge(blockMetadata, canvas);
	}

	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 3, 1, 3);
		worldData.setBlockAndMetadata(1, 0, 0, this.blockID, blockMetadata);

		worldData.setBlockAndMetadata(0, 0, 1, this.blockID, blockMetadata);
		worldData.setBlockAndMetadata(1, 0, 1, this.blockID, blockMetadata);
		worldData.setBlockAndMetadata(2, 0, 1, this.blockID, blockMetadata);

		worldData.setBlockAndMetadata(1, 0, 2, this.blockID, blockMetadata);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);
		this.drawTopView_currentLayer(world, 1, 0, 1, canvas);
	}
}());
