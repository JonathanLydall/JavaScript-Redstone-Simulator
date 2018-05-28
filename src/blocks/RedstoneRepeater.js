(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_RedstoneRepeater";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "circuits";
	proto.repeaterState = new Array(1,2,3,4);
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
		
		if (this.blockType == "redstoneRepeaterActive") {
			this.isRepeaterPowered = true;
		}
		
		if (this.blockType == "redstoneRepeaterIdle") {
			this.isRepeaterPowered = false;
		}
	};
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		return this.isPoweringTo(world, posX, posY, posZ, direction);
	};
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated(world, posX, posY, posZ);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
	};
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var facing = blockMetadata & 0x3;
		var delay = blockMetadata & 0xc;
		for (var i=0; i<amount; i++) {
			facing = new Array(1, 2, 3, 0)[facing];
		}
		return facing | delay;
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var repeaterOrientation = blockMetadata & 0x3;
		repeaterOrientation = (repeaterOrientation + 1) & 0x3;
		world.setBlockAndMetadataWithNotify(posX, posY, posZ, this.blockID, repeaterOrientation | (blockMetadata & 0xc));
	};
	
	proto.blockActivated = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var repeaterDelay = (blockMetadata & 0xc) >> 0x2;
		repeaterDelay = repeaterDelay + 1 << 0x2 & 0xc;
		world.setBlockMetadataWithNotify(posX, posY, posZ, repeaterDelay | blockMetadata & 0x3);
		return true;
	};
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return world.isBlockNormalCube(posX, posY - 1, posZ);
	};

	proto.canBlockStay = function(world, posX, posY, posZ) {
		return this.canPlaceBlockAt(world, posX, posY, posZ);
	};

	proto.onBlockAdded = function (world, posX, posY, posZ)
	{
		world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
	};
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		if (!this.isRepeaterPowered) {
			return false;
		}
		var repeaterDirection = world.getBlockMetadata(posX, posY, posZ) & 3;
		
		if (repeaterDirection == 0 && direction == 3) {
			return true;
		}
		if (repeaterDirection == 1 && direction == 4) {
			return true;
		}
		if (repeaterDirection == 2 && direction == 2) {
			return true;
		}
		return repeaterDirection == 3 && direction == 5;
	};
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, direction) {
		if (!this.canBlockStay(world, posX, posY, posZ)) {
			//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0); //NA for the simulator
			world.setBlockWithNotify(posX, posY, posZ, 0);
			return;
		}
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var ignoreTick = this.ignoreTick(world, posX, posY, posZ, blockMetadata);
		var repeaterDelay = (blockMetadata & 0xc) >> 2;

		if (this.isLocked(world, posX, posY, posZ, blockMetadata)) {
			return; // don't trigger update if repeater is locked
		}
		else if (this.isRepeaterPowered && !ignoreTick) {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.repeaterState[repeaterDelay] * 2);
		}
		else if (!this.isRepeaterPowered && ignoreTick) {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.repeaterState[repeaterDelay] * 2);
		}
	};

	proto.isLocked = function (world, posX, posY, posZ, blockMetadata) {
		var repeaterDirection= blockMetadata & 3;
		var repeaterBlockId = world.Block.redstoneRepeaterActive.blockID;
		switch (repeaterDirection) {
			case 3:
			case 1:
				return (world.getBlockId(posX, posY, posZ + 1) === repeaterBlockId && world.isBlockProvidingPowerTo(posX, posY, posZ + 1, 3))
					|| (world.getBlockId(posX, posY, posZ - 1) === repeaterBlockId && world.isBlockProvidingPowerTo(posX, posY, posZ - 1, 2));

			case 0:
			case 2:
				return (world.getBlockId(posX + 1, posY, posZ) === repeaterBlockId && world.isBlockProvidingPowerTo(posX + 1, posY, posZ, 5))
					|| (world.getBlockId(posX - 1, posY, posZ) === repeaterBlockId && world.isBlockProvidingPowerTo(posX - 1, posY, posZ, 4));
		}
		return false;
	}
	
	proto.ignoreTick = function (world, posX, posY, posZ, blockMetadata) {
		var repeaterDirection= blockMetadata & 3;
		switch (repeaterDirection) {
			case 0:
				return world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3) || world.getBlockId(posX, posY, posZ + 1) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX, posY, posZ + 1) > 0;

			case 2:
				return world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2) || world.getBlockId(posX, posY, posZ - 1) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX, posY, posZ - 1) > 0;

			case 3:
				return world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5) || world.getBlockId(posX + 1, posY, posZ) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX + 1, posY, posZ) > 0;

			case 1:
				return world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4) || world.getBlockId(posX - 1, posY, posZ) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX - 1, posY, posZ) > 0;
		}
		return false;
	};
	
	proto.updateTick = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var ignoreTick = this.ignoreTick(world, posX, posY, posZ, blockMetadata);
		if (this.isRepeaterPowered && !ignoreTick) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.redstoneRepeaterIdle.blockID, blockMetadata);
		}
		else if (!this.isRepeaterPowered) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.redstoneRepeaterActive.blockID, blockMetadata);
			if (!ignoreTick) {
				var repeaterDelay = (blockMetadata & 0xc) >> 2;
				world.scheduleBlockUpdate(posX, posY, posZ, world.Block.redstoneRepeaterActive.blockID, this.repeaterState[repeaterDelay] * 2);
			}
		}
	};

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	};
		
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	};
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		
		/*
		Low (1st & 2nd) bits:
		0x0: Facing north
		0x1: Facing east
		0x2: Facing south
		0x3: Facing west
		*/
		var facing = blockMetaData & 0x3;
		
		switch (facing) {
			case 0:
				this.draw(world, posX, posY, posZ, canvas, "top", 0);
				break;
			case 1:
				this.draw(world, posX, posY, posZ, canvas, "top", 90);
				break;
			case 2:
				this.draw(world, posX, posY, posZ, canvas, "top", 180);
				break;
			case 3:
				this.draw(world, posX, posY, posZ, canvas, "top", 270);
				break;
		}
	};
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		var facing = blockMetaData & 0x3;

		var view;
		var rotated = 0;
		var mirrored = false;
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			FACING_NORTH = 0,
			FACING_EAST = 1,
			FACING_SOUTH = 2,
			FACING_WEST = 3;
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (facing) {
					case FACING_EAST:
						view = "side";
						mirrored = false;
						break;
					case FACING_SOUTH:
						view = "top";
						rotated = 0;
						break;
					case FACING_WEST:
						view = "side";
						mirrored = true;
						break;
					case FACING_NORTH:
						view = "top";
						rotated = 180;
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (facing) {
					case FACING_EAST:
						view = "side";
						mirrored = true;
						break;
					case FACING_SOUTH:
						view = "top";
						rotated = 180;
						break;
					case FACING_WEST:
						view = "side";
						mirrored = false;
						break;
					case FACING_NORTH:
						view = "top";
						rotated = 0;
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (facing) {
					case FACING_EAST:
						view = "top";
						rotated = 180;
						break;
					case FACING_SOUTH:
						view = "side";
						mirrored = false;
						break;
					case FACING_WEST:
						view = "top";
						rotated = 0;
						break;
					case FACING_NORTH:
						view = "side";
						mirrored = true;
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (facing) {
					case FACING_EAST:
						view = "top";
						rotated = 0;
						break;
					case FACING_SOUTH:
						view = "side";
						mirrored = true;
						break;
					case FACING_WEST:
						view = "top";
						rotated = 180;
						break;
					case FACING_NORTH:
						view = "side";
						mirrored = false;
						break;
				}
				break;
		}
		proto.draw(world, posX, posY, posZ, canvas, view, rotated, mirrored);
	};

	proto.draw = function(world, posX, posY, posZ, canvas, view, rotated, mirrored) {
		var poweredColour = "rgb(255,0,0)";
		var unpoweredColour = "rgb(128,0,0)";
		var unusedColour = "rgb(192,192,192)";
		var lockedColour = "rgb(64, 64, 64)";
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		
 		/*
 		High (3rd & 4th) bits:
		0x0: 1 tick delay
		0x1: 2 tick delay
		0x2: 3 tick delay
		0x3: 4 tick delay
		*/
		var delay = (blockMetaData >>> 2) + 1;
		var isLocked = this.isLocked(world, posX, posY, posZ, blockMetaData);
		
		var delayColour1 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour2 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour3 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour4 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		
		var delayColour2 = (delay >= 2) ? delayColour2 : unusedColour;
		var delayColour3 = (delay >= 3) ? delayColour3 : unusedColour;
		var delayColour4 = (delay >= 4) ? delayColour4 : unusedColour;
		
		if (view == "top") {
			canvas.save();
			this.rotateContext(rotated, canvas);

			if (isLocked) {
				canvas.fillStyle = lockedColour;
				canvas.fillRect(0, 3, 8, 2);
			}

			canvas.fillStyle = delayColour1;
			canvas.fillRect(3, 0, 2, 2);

			if (delayColour2 != delayColour1) {
				canvas.fillStyle = delayColour2;
			}
			canvas.fillRect(2, 2, 4, 2);

			if (delayColour3 != delayColour2) {
				canvas.fillStyle = delayColour3;
			}
			canvas.fillRect(1, 4, 6, 2);

			if (delayColour4 != delayColour3) {
				canvas.fillStyle = delayColour4;
			}
			canvas.fillRect(0, 6, 8, 2);

			canvas.restore();
		}
		
		if (view == "side") {
			if (mirrored) {
				canvas.save();
				canvas.translate(8, 0);
				canvas.scale(-1, 1);
			}
			
			canvas.fillStyle = delayColour1;
			canvas.fillRect(0, 6, 2, 2);

			if (delayColour2 != delayColour1) {
				canvas.fillStyle = delayColour2;
			}
			canvas.fillRect(2, 5, 2, 3);

			if (delayColour3 != delayColour2) {
				canvas.fillStyle = delayColour3;
			}
			canvas.fillRect(4, 4, 2, 4);

			if (delayColour4 != delayColour3) {
				canvas.fillStyle = delayColour4;
			}
			canvas.fillRect(6, 3, 2, 5);

			if (mirrored) {
				canvas.restore();
			}
		}
	};

	proto.enumeratePlaceableBlocks = function() {
		if (this.blockType == "redstoneRepeaterIdle") {
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
