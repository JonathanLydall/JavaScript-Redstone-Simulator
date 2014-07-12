(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Door";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
	};
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		//TODO: Implement, toggles, the blockID between iron/wood
	};
	
	proto.blockActivated = function(world, posX, posY, posZ, entityplayer)
	{
		var blockID = this.blockID;
		if (blockID == world.Block.doorSteel.BlockID)
		{
			return true;
		}
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) != 0)
		{
			if (world.getBlockId(posX, posY - 1, posZ) == blockID)
			{
				this.blockActivated(world, posX, posY - 1, posZ, entityplayer);
			}
			return true;
		}
		if (world.getBlockId(posX, posY + 1, posZ) == blockID)
		{
			world.setBlockMetadataWithNotify(posX, posY + 1, posZ, (blockMetadata ^ 4) + 8);
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata ^ 4);
		world.markBlocksDirty(posX, posY - 1, posZ, posX, posY, posZ);
		//world.playAuxSFXAtEntity(entityplayer, 1003, posX, posY, posZ, 0);
		return true;
	};
	
	proto.getFullMetadata = function(world, posX, posY, posZ) {
        var thisMetadata = world.getBlockMetadata(posX, posY, posZ);
        var isTopHalf = (thisMetadata & 8) != 0;
        var bottomHalfMetadata;
        var topHalfMetadata;

        if (isTopHalf)
        {
            bottomHalfMetadata = world.getBlockMetadata(posX, posY - 1, posZ);
            topHalfMetadata = thisMetadata;
        }
        else
        {
            bottomHalfMetadata = thisMetadata;
            topHalfMetadata = world.getBlockMetadata(posX, posY + 1, posZ);
        }

        var hingeIsOnLeft = (topHalfMetadata & 1) != 0;
        var returnData = bottomHalfMetadata & 7 | (isTopHalf ? 8 : 0) | (hingeIsOnLeft ? 0x10 : 0);
        return returnData;
	};
	
	proto.onPoweredBlockChange = function(world, posX, posY, posZ, doorIsPowered)
	{
        var metadata = this.getFullMetadata(world, posX, posY, posZ);
        var isOpen = (metadata & 4) != 0;

        if (isOpen == doorIsPowered)
        {
            return;
        }

        var doorFacing = metadata & 7;
        doorFacing ^= 4;

        if ((metadata & 8) != 0)
        {
            world.setBlockMetadataWithNotify(posX, posY - 1, posZ, doorFacing);
            world.markBlocksDirty(posX, posY - 1, posZ, posX, posY, posZ);
        }
        else
        {
            world.setBlockMetadataWithNotify(posX, posY, posZ, doorFacing);
            world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
        }
        //world.playAuxSFXAtEntity(null, 1003, posX, posY, posZ, 0);
	};
	
	proto.onBlockPlaced = function(world, posX, posY, posZ) {
		var topByte = 0;
		var bottomByte = 0;
		
		topByte = topByte | 8; //IsTopHalf bit
		topByte = topByte | 1; //hingeIsOnLeft bit
		bottomByte = bottomByte | 1; //facing North
		
		world.editingBlocks = true;
		world.setBlockAndMetadataWithNotify(posX, posY, posZ, this.blockID, bottomByte);
		world.setBlockAndMetadataWithNotify(posX, posY + 1, posZ, this.blockID, topByte);
		world.editingBlocks = false;
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, this.blockID);
	};
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, sourceBlockID)
	{
		var blockID = this.blockID;
		var Block = world.Block;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) != 0)
		{
			if (world.getBlockId(posX, posY - 1, posZ) != blockID)
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
			if (sourceBlockID > 0 && sourceBlockID != blockID)
			{
				this.onNeighborBlockChange(world, posX, posY - 1, posZ, sourceBlockID);
			}
		}
		else
		{
			var doorPlacementNoLongerValid = false;
			if (world.getBlockId(posX, posY + 1, posZ) != blockID)
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
				doorPlacementNoLongerValid = true;
			}
			if (posY != 0 && !world.isBlockNormalCube(posX, posY - 1, posZ))
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
				doorPlacementNoLongerValid = true;
				if (world.getBlockId(posX, posY + 1, posZ) == blockID)
				{
					world.setBlockWithNotify(posX, posY + 1, posZ, 0);
				}
			}
			if (doorPlacementNoLongerValid)
			{
				if (!world.isRemote)
				{
					//this.dropBlockAsItem(world, posX, posY, posZ, blockMetadata, 0);
				}
			}
			else
			{
				var isDoorPowered = world.isBlockIndirectlyGettingPowered(posX, posY, posZ) || world.isBlockIndirectlyGettingPowered(posX, posY + 1, posZ);
				if ((isDoorPowered || sourceBlockID > 0 && Block.blocksList[sourceBlockID].canProvidePower() || sourceBlockID == 0) && sourceBlockID != blockID)
				{
					this.onPoweredBlockChange(world, posX, posY, posZ, isDoorPowered);
				}
			}
		}
	};
	
	/* 
	 * http://www.minecraftwiki.net/wiki/Data_values#Doors :
	 * 
	 * Common to both door tiles, the top bit (0x8) is as follows:
	 * 		0: The bottom half of the door
	 * 		1: The top half of the door
	 * Top Sections
	 * 		The least-significant bit (0x1) is as follows, assuming you're facing the same direction the door faces while closed:
	 * 			0: Hinge is on the right (this is the default for single doors)
	 * 			1: Hinge is on the left (this will be used for the other half of a double-door combo)
	 * 		The other two bits (0x2 and 0x4) are always zero.
	 * 		The only valid values for a top section, therefore, are 8 (binary 1000) and 9 (binary 1001).
	 * Bottom Sections
	 * 		The second bit (0x4) determines the door's state:
	 * 			0: Closed
	 * 			1: Open
	 * 		The bottom two bits determine which direction the door faces (these directions given for which direction the door faces while closed)
	 * 			0: Facing west
	 * 			1: Facing north
	 * 			2: Facing east
	 * 			3: Facing south
	 */
	proto.isTopHalf = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		return ((blockMetadata & 0x8) == 0x8);
	};
	
	proto.isOpen = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY-1, posZ) : world.getBlockMetadata(posX, posY, posZ);
		return ((blockMetadata & 0x4) == 0x4);
	};
	
	proto.getFacing = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY-1, posZ) : world.getBlockMetadata(posX, posY, posZ);
		return blockMetadata & 0x3;
	};
	
	proto.setFacing = function(world, posX, posY, posZ, facing) {
		if (facing > 0x3) {
			throw new Error("Cannot be more than 2 bits");
		}
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var metadata = ((isOpen) ? 0x4 : 0x0) | facing;

		if (this.isTopHalf(world, posX, posY, posZ, metadata)) {
			world.setBlockMetadataWithNotify(posX, posY-1, posZ, metadata);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY, posZ, metadata);
		}
	};
	
	proto.hingeIsOnLeft = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY, posZ) : world.getBlockMetadata(posX, posY+1, posZ);
		return ((blockMetadata & 0x1) != 0x1);
	};
	
	proto.setHingeIsOnLeft = function(world, posX, posY, posZ, isOnLeft) {
		var metadata = (isOnLeft) ? 8 : 9;
		if (this.isTopHalf(world, posX, posY, posZ, metadata)) {
			world.setBlockMetadataWithNotify(posX, posY, posZ, metadata);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY+1, posZ, metadata);
		}
	};
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isTopHalf = blockMetadata & 0x8;
		var isOpen = blockMetadata & 0x4;
		var facing =  blockMetadata & 0x3;
		
		if (isTopHalf == 0x8) {
			return blockMetadata; //only the 
		} 
		else {
			for (var i=0; i<amount; i++) {
				facing = new Array(1, 2, 3, 0)[facing];
			}
			return isTopHalf | isOpen | facing;
		}
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var facing = this.getFacing(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		if (hingeIsOnLeft) {
			this.setFacing(world, posX, posY, posZ, new Array(1, 2, 3, 0)[facing]);
		}
		this.setHingeIsOnLeft(world, posX, posY, posZ, !hingeIsOnLeft);
	};

	proto._canPlaceBlockAt = proto.canPlaceBlockAt;
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		if (posY >= 255) {
			return false;
		}
		else {
			return world.isBlockNormalCube(posX, posY - 1, posZ) && this._canPlaceBlockAt(world, posX, posY, posZ) && this._canPlaceBlockAt(world, posX, posY + 1, posZ);
		}
	};

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, forAboveLayer = false);
	};
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, forAboveLayer = true);
	};
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var colourPowered = "rgb(255,0,0)";
		var colourUnpowered = "rgb(128,0,0)";
		var colourWood = "rgb(168,135,84)";
		var colourIron = "rgb(192,192,192)";
		var shadowColor = "rgba(128,128,128,0.5)";
		
		var orientation = this.getFacing(world, posX, posY, posZ);
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		
		var
			FACING_WEST = 0,
			FACING_NORTH = 1,
			FACING_EAST = 2,
			FACING_SOUTH = 3;
		
		canvas.save();
		
		if (hingeIsOnLeft) {
			switch(orientation) {
				case FACING_NORTH:
					if (isOpen) {
						this.rotateContext(90, canvas);
					}
					else {
						this.mirrorContext(canvas);
					}
					break;
				case FACING_EAST:
					if (isOpen) {
						this.rotateContext(180, canvas);
					}
					else {
						this.flipContext(canvas);
						this.rotateContext(90, canvas);
					}
					break;
				case FACING_SOUTH:
					if (isOpen) {
						this.rotateContext(270, canvas);
						this.rotateContext(canvas);
					}
					else {
						this.mirrorContext(canvas);
						this.rotateContext(180, canvas);
					}
					break;
				case FACING_WEST:
					if (isOpen) {
					}
					else {
						this.flipContext(canvas);
						this.rotateContext(270, canvas);
					}
					break;
			}
		}
		else {
			switch(orientation) {
				case FACING_NORTH:
					if (isOpen) {
						this.rotateContext(90, canvas);
						this.flipContext(canvas);
					}
					break;
				case FACING_EAST:
					if (isOpen) {
						this.mirrorContext(canvas);
					}
					else {
						this.rotateContext(90, canvas);
					}
					break;
				case FACING_SOUTH:
					if (isOpen) {
						this.flipContext(canvas);
						this.rotateContext(90, canvas);
					}
					else {
						this.rotateContext(180, canvas);
					}
					break;
				case FACING_WEST:
					if (isOpen) {
						this.flipContext(canvas);
					}
					else {
						this.rotateContext(270, canvas);
					}
					break;
			}
		}
		
		if (forAboveLayer && !this.isTopHalf(world, posX, posY, posZ)) {
			canvas.fillStyle = shadowColor;
			canvas.fillRect(0, 0, 8, 2);
		}
		else if (!forAboveLayer) {
			canvas.fillStyle = (this.blockID == world.Block.doorWood.blockID) ? colourWood : colourIron;
			canvas.fillRect(2, 0, 6, 2);
	
			canvas.fillStyle = (isOpen) ? colourPowered : colourUnpowered;
			canvas.fillRect(0, 0, 2, 2);
		}
		
		canvas.restore();
	};
	
	proto.getBlockInfo = function(world, posX, posY, posZ) {
		returnData =
			"facing: " + new Array("West(0)", "North(1)", "East(2)", "South(3)")[this.getFacing(world, posX, posY, posZ)] + "\n" +
			"isOpen: " + this.isOpen(world, posX, posY, posZ) + "\n" +
			"isTopHalf: " + this.isTopHalf(world, posX, posY, posZ) + "\n" +
			"hingeIsOnLeft: " + this.hingeIsOnLeft(world, posX, posY, posZ) + "\n" +
		"";
		return returnData;
	};
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var facing = this.getFacing(world, posX, posY, posZ);
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var isTopHalf = this.isTopHalf(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		
		var
			FACING_WEST = 0,
			FACING_NORTH = 1,
			FACING_EAST = 2,
			FACING_SOUTH = 3;
			
		var
			LOOKING_NORTH = 0,
			LOOKING_EAST = 1,
			LOOKING_SOUTH = 2,
			LOOKING_WEST = 3;
			
		var drawDoor = false;
		var drawHinge = false;
		var drawHingeOnLeft = false;
		
		//By default, hinge is always on the right
		
		switch (lookingTowards) {
			case LOOKING_NORTH:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_EAST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_WEST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_SOUTH:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
				}
				break;
			case LOOKING_EAST:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_EAST:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_WEST:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_SOUTH:
						drawDoor = isOpen;
						drawHinge = !isOpen || (isOpen && hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
				}
				break;
			case LOOKING_SOUTH:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_EAST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_WEST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_SOUTH:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
				}
				break;
			case LOOKING_WEST:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_EAST:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_WEST:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_SOUTH:
						drawDoor = isOpen;
						drawHinge = !isOpen || (isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
				}
				break;
		}
		
		this.drawSideView_generic(world, posX, posY, posZ, canvas, drawDoor, drawHinge, drawHingeOnLeft);
	};
	
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		canvas.scale(0.5, 0.5);
		canvas.translate(4,0);

		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 2, 1);
		worldData.setBlockAndMetadata(0, 0, 0, this.blockID, 3);
		worldData.setBlockAndMetadata(0, 1, 0, this.blockID, 8);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);

		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 1,
			posZ = 0,
			canvas,
			drawDoor = true,
			drawHinge = true,
			drawHingeOnLeft = true
		);
		canvas.translate(0,8);
		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 0,
			posZ = 0,
			canvas,
			drawDoor = true,
			drawHinge = true,
			drawHingeOnLeft = true
		);
	};

	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, drawDoor, drawHinge, drawHingeOnLeft) {
		var colourPowered = "rgb(255,0,0)";
		var colourUnpowered = "rgb(128,0,0)";
		var colourWood = "rgb(168,135,84)";
		var colourIron = "rgb(192,192,192)";
		var colourDoorKnob = "rgb(0,0,0)";
		
		var isPowered = this.isOpen(world, posX, posY, posZ);
		var isTopHalf = this.isTopHalf(world, posX, posY, posZ);
		
		var doorColour = (this.blockID == 64) ? colourWood : colourIron; 
		var colouredHingeColour = (isPowered) ? colourPowered : colourUnpowered;
		var sideColour = (drawHinge) ? colouredHingeColour : doorColour;
		
		if (!drawHingeOnLeft) {
			canvas.save();
			this.mirrorContext(canvas);
		}
		
		canvas.fillStyle = sideColour;
		canvas.fillRect(0, 0, 2, 8);
		
		if (drawDoor) {
			canvas.fillStyle = doorColour;
			if (isTopHalf) {
				canvas.fillRect(2, 0, 6, 2);
				canvas.fillRect(2, 4, 6, 1);
				canvas.fillRect(2, 7, 6, 1);
				
				canvas.fillRect(4, 0, 1, 8);
				canvas.fillRect(7, 0, 1, 8);
			}
			else {
				canvas.fillRect(2, 0, 6, 8);
	
				canvas.fillStyle = colourDoorKnob;
				canvas.fillRect(6, 1, 1, 1);
			}
		}

		if (!drawHingeOnLeft) {
			canvas.restore();
		}
	};
}());
