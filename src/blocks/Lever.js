(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Lever";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	var
		WALL_MOUNTED_FACING_EAST = 1,
		WALL_MOUNTED_FACING_WEST = 2,
		WALL_MOUNTED_FACING_SOUTH = 3,
		WALL_MOUNTED_FACING_NORTH = 4,
		GROUND_WHEN_OFF_POINTS_SOUTH = 5,
		GROUND_WHEN_OFF_POINTS_EAST = 6,
		CEILING_WHEN_OFF_POINTS_SOUTH = 7,
		CEILING_WHEN_OFF_POINTS_EAST = 0,
		LOOKING_TOWARDS_NORTH = 0,
		LOOKING_TOWARDS_EAST = 1,
		LOOKING_TOWARDS_SOUTH = 2,
		LOOKING_TOWARDS_WEST = 3;

	proto.material = "circuits";
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 5;
		this._renderAsNormalBlock = false;
	};

	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		return (world.getBlockMetadata(posX, posY, posZ) & 8) > 0;
	};
	
	proto.canPlaceBlockAt = function (world, posX, posY, posZ) {
        if ( 
	        world.isBlockNormalCube(posX - 1, posY, posZ) ||
	        world.isBlockNormalCube(posX + 1, posY, posZ) ||
	        world.isBlockNormalCube(posX, posY, posZ - 1) ||
	        world.isBlockNormalCube(posX, posY, posZ + 1) ||
	        world.isBlockNormalCube(posX, posY - 1, posZ) ||
	        world.isBlockNormalCube(posX, posY + 1, posZ)
        ) {
        	return true;
        }
    };

	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0) {
			return false;
		}
		
		var leverOrientation = blockMetadata & 7;
		
		if (
			(leverOrientation == 0 && direction == 0) ||
			(leverOrientation == 7 && direction == 0) ||
			(leverOrientation == 6 && direction == 1) ||
			(leverOrientation == 5 && direction == 1) ||
			(leverOrientation == 4 && direction == 2) ||
			(leverOrientation == 3 && direction == 3) ||
			(leverOrientation == 2 && direction == 4) ||
			(leverOrientation == 1 && direction == 5)
		) {
			return true;
		}

	};

	proto.rotateSelection = function(blockMetadata, amount) {
		var isThrown = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 3, 4, 2, 1, 5, 6, 7)[orientation];
		}
		return orientation | isThrown;
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 7;
		do {
			orientation = new Array(4, 3, 5, 2, 1, 6, 7, 0)[orientation];
			world.setBlockMetadataWithNotify(posX, posY, posZ, orientation);
			if (!this.placementInvalid(world, posX, posY, posZ)) {
				break;
			}			
		} while (true);
	};
	
	proto.checkIfAttachedToBlock = function(world, posX, posY, posZ) {
        if (!this.canPlaceBlockAt(world, posX, posY, posZ))
        {
            //dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
            world.setBlockWithNotify(posX, posY, posZ, 0);
            return false;
        }
        else
        {
            return true;
        }
	};
	
	proto.placementInvalid = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ) & 7;
		var placementInvalid = false;

		if (!world.isBlockNormalCube(posX - 1, posY, posZ) && blockMetadata == 1)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX + 1, posY, posZ) && blockMetadata == 2)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY, posZ - 1) && blockMetadata == 3)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY, posZ + 1) && blockMetadata == 4)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY - 1, posZ) && blockMetadata == 5)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY - 1, posZ) && blockMetadata == 6)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY + 1, posZ) && blockMetadata == 7)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY + 1, posZ) && blockMetadata == 0)
		{
			placementInvalid = true;
		}

		return placementInvalid;		
	};
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, neighborBlockId) {
		if (this.checkIfAttachedToBlock(world, posX, posY, posZ))
		{
			if (this.placementInvalid(world, posX, posY, posZ))
			{
				//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	};
	
	proto.onBlockPlaced = function(world, posX, posY, posZ) {
		for (var i=1; i<=6; i++) {
			if (
				(world.isBlockNormalCube(posX - 1, posY, posZ) && i == 1) ||
				(world.isBlockNormalCube(posX + 1, posY, posZ) && i == 2) ||
				(world.isBlockNormalCube(posX, posY, posZ - 1) && i == 3) ||
				(world.isBlockNormalCube(posX, posY, posZ + 1) && i == 4) ||
				(world.isBlockNormalCube(posX, posY - 1, posZ) && i == 5) ||
				(world.isBlockNormalCube(posX, posY - 1, posZ) && i == 6) ||
				(world.isBlockNormalCube(posX, posY + 1, posZ) && i == 7) ||
				(world.isBlockNormalCube(posX, posY + 1, posZ) && i == 0)
			) break;
		}
		world.setBlockMetadata(posX, posY, posZ, i);
	};
	
	proto.canProvidePower = function() {
		return true;
	};
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated (world, posX, posY, posZ);
	};
	
	proto.blockActivated = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 0x7;
		var isThrown = 8 - (blockMetadata & 0x8);
		var blockID = this.blockID;
		
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation + isThrown);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
		if (orientation == 1)
		{
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		}
		else if (orientation == 2)
		{
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		}
		else if (orientation == 3)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		}
		else if (orientation == 4)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
		else if (orientation == 5 || orientation == 6)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		else if (orientation == 7 || orientation == 0)
		{
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
		}
		return true;
	};
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	};

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
		//TODO: Have this make a shadow if anything other than ground mounted
	};

	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		switch (facing) {
			case WALL_MOUNTED_FACING_EAST:
				this.draw(world, posX, posY, posZ, canvas, "top", 90);
				break;
			case WALL_MOUNTED_FACING_WEST:
				this.draw(world, posX, posY, posZ, canvas, "top", 270);
				break;
			case WALL_MOUNTED_FACING_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "top", 180);
				break;
			case WALL_MOUNTED_FACING_NORTH:
				this.draw(world, posX, posY, posZ, canvas, "top", 0);
				break;
			case GROUND_WHEN_OFF_POINTS_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "facingToward", 180);
				break;
			case GROUND_WHEN_OFF_POINTS_EAST:
				this.draw(world, posX, posY, posZ, canvas, "facingToward", 90);
				break;
			case CEILING_WHEN_OFF_POINTS_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "facingAway", 180);
				break;
			case CEILING_WHEN_OFF_POINTS_EAST:
				this.draw(world, posX, posY, posZ, canvas, "facingAway", 90);
				break;
			default:
		}
	};
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards);
		//TODO: Have this make a shadow if anything other than ground mounted
	};
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var 
			view,
			rotated = 0,
			mirrored = false,
			facing = world.getBlockMetadata(posX, posY, posZ) & 0x7;			
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						mirrored = true;
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "leaningRight";
						rotated = 90;
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						mirrored = true;
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "facingToward";
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "top";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "top";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						rotated = 180;
						mirrored = true;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "facingAway";
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "top";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						mirrored = true;
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "top";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			default: throw new Error("Unexpected case");
		}
		
		this.draw(world, posX, posY, posZ, canvas, view, rotated, mirrored);
	};
	
	proto.draw = function(world, posX, posY, posZ, canvas, view, rotated, mirrored) {
		var baseColour = "rgb(64,64,64)";
		var isThrown = ((world.getBlockMetadata(posX, posY, posZ) >>> 3) == 1);
		
		if (isThrown) 
			var poweredColour = "rgb(255,0,0)";
		else 
			var poweredColour = "rgb(128,0,0)";
			
		/*
		 * Top (up, right, down, left)
		 * Behind (always the same)
		 * Front (up, down) powered or not
		 * Side (up down) powered or not
		 */
		
		canvas.save();
		this.rotateContext(rotated, canvas);
		
		switch(view) {
			case "top":
				canvas.fillStyle = poweredColour;
				canvas.fillRect(3, 2, 2, 4);
				
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 6, 4, 2);
				canvas.fillRect(3, 1, 2, 1);
				break;
			case "facingToward":
				if (isThrown) {
					this.rotateContext(180, canvas);					
				}
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 1, 4, 6);
				canvas.fillRect(3, 0, 2, 1);
				
				canvas.fillStyle = poweredColour;
				canvas.fillRect(3, 1, 2, 4);
				break;
			case "facingAway":
				if (isThrown) {
					this.rotateContext(180, canvas);					
				}
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 1, 4, 6);
				canvas.fillRect(3, 0, 2, 1);
				break;
			case "leaningRight":
				if ((isThrown) ? mirrored : !mirrored) {
					canvas.scale(-1, 1);
					canvas.translate(-8, 0);
				}
	
				canvas.translate(4, 0);
				canvas.rotate(Math.PI*0.15);
	
				canvas.fillStyle = poweredColour;
				canvas.fillRect(2, 1, 2, 5);
	
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 0, 2, 1+0.5);
	
				canvas.rotate(-Math.PI*0.15);
				canvas.translate(-4, 0);
	
				if (mirrored) {
					canvas.translate(8, 0);
					canvas.scale(-1, 1);
				}
	
				canvas.fillStyle = baseColour;
				canvas.fillRect(1, 6, 6, 2);
				return;
		}
		canvas.restore();
	};
}());
