(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PistonBase";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	var
		ORIENTATION_DOWN = 0,
		ORIENTATION_UP = 1,
		ORIENTATION_NORTH = 2,
		ORIENTATION_SOUTH = 3,
		ORIENTATION_WEST = 4,
		ORIENTATION_EAST = 5,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;

	proto.material = "piston";
	proto.isSticky = false; //bool
	proto.ignoreUpdates = false; //bool

	proto.construct = function(i, j, isSticky)
	{
		this.drawIconBlockMetadataOveride = 2;
		
		if (this.blockType == "pistonStickyBase") {
			this.isSticky = true;
		}
		else {
			this.isSticky = false;
		}
		
		//super(i, j, Material.piston); //TODO: make a plan
		this._renderAsNormalBlock = false;
		this.facing = new com.mordritch.mcSim.facing();
		//setStepSound(soundStoneFootstep);
		//setHardness(0.5);
	};
	
	proto.isOpaqueCube = function() {
		false;
	};
	
	proto.getRearEntity = function(world, entity) {
		var rearEntity;

		switch (entity.storedOrientation) {
			case ORIENTATION_DOWN:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord+1, entity.zCoord);
				break;
			case ORIENTATION_UP:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord-1, entity.zCoord);
				break;
			case ORIENTATION_NORTH:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord, entity.zCoord+1);
				break;
			case ORIENTATION_SOUTH:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord, entity.zCoord-1);
				break;
			case ORIENTATION_WEST:
				rearEntity = world.getBlockTileEntity(entity.xCoord+1, entity.yCoord, entity.zCoord);
				break;
			case ORIENTATION_EAST:
				rearEntity = world.getBlockTileEntity(entity.xCoord-1, entity.yCoord, entity.zCoord);
				break;
			default: throw new Error("Unexpected case");
		}
		
		return rearEntity;
	};

	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.drawMoving_generic(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing);
	};

	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.drawMoving_generic(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing = FACING_DOWN);
	};

	/**
	 * Used to draw portion of a whole block which is extending or retracting
	 * 
	 * Simulator only, not in minecraft.
	 */
	proto.drawMoving_generic = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		var storedMetadata = entity.storedMetadata;
		var rearEntity = this.getRearEntity(world, entity);
		var view = (lookingTowards == FACING_DOWN) ? "Top" : "Side";
		var drawView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;

		if (
			drawView == "towards" ||
			drawView == "away" ||
			!entity.shouldHeadBeRendered &&
			rearEntity != null &&
			typeof rearEntity.storedOrientation != 'undefined' &&
			rearEntity.storedOrientation == entity.storedOrientation
		) {
			//Draw as normal, with an offset which was done by the calling function
			if (forAboveLayer) {
				this["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata);
			}
			else {
				this["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata);
			}
			return;
		}
		
		if (
			posX == entity.xCoord &&
			posY == entity.yCoord &&
			posZ == entity.zCoord
		) {
			//We are the base part, rather than the head, we need to undo the offset and render an extended base
			canvas.save();
			var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;
			this.rotateContext(rotateAmount, canvas);

			switch (entity.progress) {
				case 0:
					canvas.translate(0, 6);
					break;
				case 0.5:
					canvas.translate(0, 4);
					break;
				case 1:
					canvas.translate(0, 2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			if (forAboveLayer) {
				this["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata | 0x8, forAboveLayer); //setting that bit makes it extended
			}
			else {
				this["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata | 0x8, forAboveLayer); //setting that bit makes it extended
			}
			canvas.restore();
		}
		else {
			//Draw the extension
			var pistonExtension = world.Block.pistonExtension;
			// Layout of metadata for pistons and heads are different, so we need to convert, with both, the first 3 bits is the orientiation,
			// with extension, 4th bit is sticky/not sticky while with base, 4th bit is whether or not the piston is extended
			if (this.isSticky) {
				var metadataForPistonExtension = storedMetadata | 0x8; //Set the 4th (isSticky) bit
			}
			else {
				var metadataForPistonExtension = storedMetadata & 0x7; //Only pass the first 3 bits, leaving the 8th bit unset, making it not sticky
			}
			
			if (forAboveLayer) {
				pistonExtension["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, metadataForPistonExtension);
			}
			else {
				pistonExtension["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, metadataForPistonExtension);
			} 
		}
	};

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = false);
	};

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = true);
	};

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	};
	
	proto.draw_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		if (typeof blockMetadata == 'undefined') blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		var isExtended = this.isExtended(blockMetadata);
		var orientation = this.getOrientation(blockMetadata);
		var drawView, rotatedBy;

		var view = this.getDrawViewAndRotation(currentFacing, orientation).view;
		var rotatedBy = this.getDrawViewAndRotation(currentFacing, orientation).rotateBy;
		
		var stickyColour = "rgb(181, 230, 29)";
		var woodColour = "rgb(168,135,84)";
		var stoneColour = "rgb(64, 64, 64)";
		var poweredColour = "rgb(255,0,0)";
		var unpoweredOnWoodColour = "rgb(128,0,0)";
		var unpoweredOnStoneColour = "rgb(255,255,255)";
		var stickyOrWood = (this.isSticky) ? stickyColour : woodColour;
			
		var drawSize = 8;
		

		switch (view) {
			case "towards":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.moveTo(1, 0);
					canvas.lineTo(1, 1);
					canvas.lineTo(4, 1);
					canvas.lineTo(4, 3);
					canvas.lineTo(6, 3);
					canvas.lineTo(6, 1);
					canvas.lineTo(7, 1);
					canvas.lineTo(7, 7);
					canvas.lineTo(6, 7);
					canvas.lineTo(6, 5);
					canvas.lineTo(4, 5);
					canvas.lineTo(4, 7);
					canvas.lineTo(1, 7);
					canvas.lineTo(1, 0);
					
					canvas.lineTo(0, 0);
					canvas.lineTo(0, 8);
					canvas.lineTo(8, 8);
					canvas.lineTo(8, 0);
					canvas.lineTo(1, 0);
					canvas.fill();
				}
				else {
					if (!isExtended) {
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(0, 0, drawSize, drawSize);
					
						canvas.fillStyle = unpoweredOnWoodColour;
						canvas.fillRect(1, 1, 3, 6);
						canvas.fillRect(4, 3, 2, 2);
						canvas.fillRect(6, 1, 1, 6);
					}
					else {
						canvas.fillStyle = stoneColour;
						canvas.fillRect(0, 0, drawSize, drawSize);
	
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(3, 3, 2, 2);
					}
				}
				break;
			case "away":
				canvas.fillStyle = stoneColour;
				canvas.fillRect(0, 0, drawSize, drawSize);
				
				canvas.fillStyle = stickyOrWood;
				canvas.fillRect(1, 1, 6, 6);

				if (isExtended) {
					canvas.fillStyle = poweredColour;
				}
				else {
					canvas.fillStyle = unpoweredOnStoneColour;
				}
				canvas.fillRect(1, 1, 3, 6);
				canvas.fillRect(4, 3, 2, 2);
				canvas.fillRect(6, 1, 1, 6);

				break;
			case "side":
				canvas.save();
				this.rotateContext(rotatedBy, canvas);
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					if (!isExtended) {
						canvas.beginPath();
						canvas.moveTo(0, 0);
						canvas.lineTo(8, 0);
						canvas.lineTo(8, 2);
						canvas.lineTo(5, 2);
						canvas.lineTo(5, 3);
						canvas.lineTo(6, 3);
						canvas.lineTo(6, 4);
						canvas.lineTo(8, 4);
						canvas.lineTo(8, 0);
						canvas.lineTo(8, 8);
	
						canvas.lineTo(0, 8);
						canvas.lineTo(0, 4);
						canvas.lineTo(2, 4);
						canvas.lineTo(2, 3);
						canvas.lineTo(3, 3);
						canvas.lineTo(3, 2);
						canvas.lineTo(0, 2);
						canvas.lineTo(0, 0);
						canvas.fill();
					}
					else {
						canvas.beginPath();
						canvas.moveTo(2, 0);
						canvas.lineTo(6, 0);
						canvas.lineTo(6, 4);
						canvas.lineTo(8, 4);
						canvas.lineTo(8, 8);
						canvas.lineTo(0, 8);
	
						canvas.lineTo(0, 4);
						canvas.lineTo(2, 4);
						canvas.lineTo(2, 0);
						canvas.fill();
					}
				}
				else {
					if (isExtended) {
						canvas.fillStyle = stoneColour;
						canvas.fillRect(2, 0, 4, 4);
					}
					else {
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(0, 0, drawSize, 2);
						
						canvas.fillStyle = stoneColour;
						canvas.fillRect(2, 3, 4, 1);
						canvas.fillRect(3, 2, 2, 1);
					}
					canvas.fillRect(0, 4, 8, 4);
				}
				canvas.restore();
				break;
			default:
				throw new Error("Uknown view: "+view);
		}
	};

	/* Relevent to game's renderer
	proto.getBlockTextureFromSideAndMetadata = function(i, j)
	{
		var k = this.getOrientation(j);
		if (k > 5)
		{
			return this.blockIndexInTexture;
		}
		if (i == k)
		{
			if (isExtended(j) || minX > 0.0 || minY > 0.0 || minZ > 0.0 || maxX < 1.0 || maxY < 1.0 || maxZ < 1.0)
			{
				return 110;
			}
			else
			{
				return blockIndexInTexture;
			}
		}
		return i != this.facing.faceToSide[k] ? 108 : 109;
	}
	*/

	/* Relevent to game's renderer
	proto.getRenderType = function()
	{
		return 16;
	}
	*/

	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		world.setBlockMetadataWithNotify(posX, posY, posZ, ORIENTATION_NORTH);
	};

	proto.blockActivated = function(world, posX, posY, posZ)
	{
		return false;
	};

	/**
	 * Unused? 
	 */
	/*
	proto.onBlockPlacedBy = function(world, posX, posY, posZ)
	{
		var orientation = 2;
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation);
		if (!world.isRemote && !this.ignoreUpdates)
		{
			this.updatePistonState(world, posX, posY, posZ);
		}
	}
	*/

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, l)
	{
		if (!world.isRemote && !this.ignoreUpdates)
		{
			this.updatePistonState(world, posX, posY, posZ);
		}
	};

	proto.onBlockAdded = function(world, posX, posY, posZ)
	{
		if (
			!world.isRemote && world.getBlockTileEntity(posX, posY, posZ) == null &&
			!this.ignoreUpdates
		) {
			this.updatePistonState(world, posX, posY, posZ);
		}
	};

	proto.updatePistonState = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = this.getOrientation(blockMetadata);
		var isIndirectlyPowered = this.isIndirectlyPowered(world, posX, posY, posZ, orientation);
		if (blockMetadata == 7)
		{
			return;
		}
		if (isIndirectlyPowered && !this.isExtended(blockMetadata))
		{
			if (this.canExtend(world, posX, posY, posZ, orientation))
			{
				world.setBlockMetadata(posX, posY, posZ, orientation | 8);
				world.playNoteAt(posX, posY, posZ, 0, orientation);
			}
		}
		else if (!isIndirectlyPowered && this.isExtended(blockMetadata))
		{
			world.setBlockMetadata(posX, posY, posZ, orientation);
			world.playNoteAt(posX, posY, posZ, 1, orientation);
		}
	};

	proto.isIndirectlyPowered = function(world, posX, posY, posZ, direction)
	{
		if (direction != 0 && world.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if (direction != 1 && world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if (direction != 2 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if (direction != 3 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if (direction != 5 && world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5))
		{
			return true;
		}
		if (direction != 4 && world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ, 0))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 2, posZ, 1))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ - 1, 2))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ + 1, 3))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY + 1, posZ, 4))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY + 1, posZ, 5)) {
			return true;
		}
		
		return false;
	};

	proto.powerBlock = function(world, posX, posY, posZ, isExtendedParamater, orientation) {
		this.ignoreUpdates = true;
		if (isExtendedParamater == 0)
		{
			if (this.tryExtend(world, posX, posY, posZ, orientation))
			{
				world.setBlockMetadataWithNotify(posX, posY, posZ, orientation | 8);
				//world.playSoundEffect(posX + 0.5, posY + 0.5, posZ + 0.5, "tile.piston.out", 0.5, world.rand.nextFloat() * 0.25 + 0.6);
			}
			else
			{
				world.setBlockMetadata(posX, posY, posZ, orientation);
			}
		}
		else if (isExtendedParamater == 1)
		{
			var tileentity = world.getBlockTileEntity(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation]);
			if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
			{
				tileentity.clearPistonTileEntity();
			}
			world.setBlockAndMetadata(posX, posY, posZ, world.Block.pistonMoving.blockID, orientation);
			world.setBlockTileEntity(posX, posY, posZ, world.Block.pistonMoving.getTileEntity(this.blockID, orientation, orientation, false, true, world));
			if (this.isSticky)
			{
				var stickyOffsetX = posX + this.facing.offsetsXForSide[orientation] * 2;
				var stickyOffsetY = posY + this.facing.offsetsYForSide[orientation] * 2;
				var stickyOffsetZ = posZ + this.facing.offsetsZForSide[orientation] * 2;
				var stickyBlockID = world.getBlockId(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
				var stickyBlockMetadata = world.getBlockMetadata(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
				var flag = false;
				if (stickyBlockID == world.Block.pistonMoving.blockID)
				{
					var tileentity1 = world.getBlockTileEntity(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
					if (tileentity1 != null && (tileentity1 instanceof com.mordritch.mcSim.TileEntity_Piston))
					{
						var tileentitypiston = tileentity1;
						if (tileentitypiston.getPistonOrientation() == orientation && tileentitypiston.isExtending())
						{
							tileentitypiston.clearPistonTileEntity();
							stickyBlockID = tileentitypiston.getStoredBlockID();
							stickyBlockMetadata = tileentitypiston.getBlockMetadata();
							flag = true;
						}
					}
				}
				if (!flag && stickyBlockID > 0 && this.canPushBlock(stickyBlockID, world, stickyOffsetX, stickyOffsetY, stickyOffsetZ, false) && (world.Block.blocksList[stickyBlockID].getMobilityFlag() == 0 || stickyBlockID == world.Block.pistonBase.blockID || stickyBlockID == world.Block.pistonStickyBase.blockID))
				{
					posX += this.facing.offsetsXForSide[orientation];
					posY += this.facing.offsetsYForSide[orientation];
					posZ += this.facing.offsetsZForSide[orientation];
					world.setBlockAndMetadata(posX, posY, posZ, world.Block.pistonMoving.blockID, stickyBlockMetadata);
					world.setBlockTileEntity(posX, posY, posZ, world.Block.pistonMoving.getTileEntity(stickyBlockID, stickyBlockMetadata, orientation, false, false, world));
					this.ignoreUpdates = false;
					world.setBlockWithNotify(stickyOffsetX, stickyOffsetY, stickyOffsetZ, 0);
					this.ignoreUpdates = true;
				}
				else if (!flag)
				{
					this.ignoreUpdates = false;
					world.setBlockWithNotify(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation], 0);
					this.ignoreUpdates = true;
				}
			}
			else
			{
				this.ignoreUpdates = false;
				world.setBlockWithNotify(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation], 0);
				this.ignoreUpdates = true;
			}
			//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "tile.piston.in", 0.5F, world.rand.nextFloat() * 0.15F + 0.6F);
		}
		this.ignoreUpdates = false;
	};

	/* Relevent to game's renderer
	proto.setBlockBoundsBasedOnState = function(world, i, j, k)
	{
		var l = world.getBlockMetadata(i, j, k);
		if (isExtended(l))
		{
			switch (getOrientation(l))
			{
				case 0:
					setBlockBounds(0.0, 0.25, 0.0, 1.0, 1.0, 1.0);
					break;

				case 1:
					setBlockBounds(0.0, 0.0, 0.0, 1.0, 0.75, 1.0);
					break;

				case 2:
					setBlockBounds(0.0, 0.0, 0.25, 1.0, 1.0, 1.0);
					break;

				case 3:
					setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 0.75);
					break;

				case 4:
					setBlockBounds(0.25, 0.0, 0.0, 1.0, 1.0, 1.0);
					break;

				case 5:
					setBlockBounds(0.0, 0.0, 0.0, 0.75, 1.0, 1.0);
					break;
			}
		}
		else
		{
			setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
		}
	}
	*/

	/* Relevent to game's renderer
	proto.setBlockBoundsForItemRender = function()
	{
		setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
	}
	*/

	/* Relevent to game's renderer
	proto.getCollidingBoundingBoxes = function(world, i, j, k, axisalignedbb, arraylist)
	{
		setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
		//super.getCollidingBoundingBoxes(world, i, j, k, axisalignedbb, arraylist); TODO: Make a plan
	}
	*/

	proto.getOrientation = function(blockMetadata)
	{
		return blockMetadata & 0x7;
	};

	proto.isExtended = function(blockMetadata)
	{
		return (blockMetadata & 0x8) != 0;
	};

	/**
	 * Not implemented, it's for the game, to deternmine which way the piston faces based on the placing player's position 
	proto.determineOrientation = function(world, i, j, k)
	{
		if (Math.abs(entityplayer.posX - i) < 2.0 && Math.abs(entityplayer.posZ - k) < 2.0)
		{
			var d = (entityplayer.posY + 1.8200000000000001) - entityplayer.yOffset;
			if (d - j > 2)
			{
				return 1;
			}
			if (j - d > 0.0)
			{
				return 0;
			}
		}
		var l = MathHelper.floor_double(((entityplayer.rotationYaw * 4) / 360) + 0.5) & 3;
		if (l == 0)
		{
			return 2;
		}
		if (l == 1)
		{
			return 5;
		}
		if (l == 2)
		{
			return 3;
		}
		return l != 3 ? 0 : 4;
	}
	 */

	proto.canPushBlock = function(blockID, world, posX, posY, posZ, flag)
	{
		if (blockID == world.Block.obsidian.blockID)
		{
			return false;
		}
		if (blockID == world.Block.pistonBase.blockID || blockID == world.Block.pistonStickyBase.blockID)
		{
			if (this.isExtended(world.getBlockMetadata(posX, posY, posZ)))
			{
				return false;
			}
		}
		else
		{
			/*
			if (world.Block.blocksList[blockID].getHardness() == -1)
			{
				return false;
			}
			*/
			if (world.Block.blocksList[blockID].getMobilityFlag() == 2)
			{
				return false;
			}
			if (!flag && world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				return false;
			}
		}
		return !(world.Block.blocksList[blockID] instanceof com.mordritch.mcSim.BlockType_Container);
	};
	
	proto.canExtend = function(world, posX, posY, posZ, direction)
	{
		var offsetX = posX + this.facing.offsetsXForSide[direction];
		var offsetY = posY + this.facing.offsetsYForSide[direction];
		var offsetZ = posZ + this.facing.offsetsZForSide[direction];
		
		var i = 0;
		do
		{
			if (i >= 13)
			{
				break;
			}
			//if (offsetY <= 0 || offsetY >= world.worldData.getSizeY() - 1) //original
			if (offsetY < 0 || offsetY >= world.worldData.getSizeY())
			{
				return false;
			}
			var blockID = world.getBlockId(offsetX, offsetY, offsetZ);
			if (blockID == 0)
			{
				break;
			}
			if (!this.canPushBlock(blockID, world, offsetX, offsetY, offsetZ, true))
			{
				return false;
			}
			if (world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				break;
			}
			if (i == 12)
			{
				return false;
			}
			offsetX += this.facing.offsetsXForSide[direction];
			offsetY += this.facing.offsetsYForSide[direction];
			offsetZ += this.facing.offsetsZForSide[direction];
			i++;
		}
		while (true);
		return true;
	};

	proto.tryExtend = function(world, posX, posY, posZ, direction)
	{
		var offsetX = posX + this.facing.offsetsXForSide[direction];
		var offsetY = posY + this.facing.offsetsYForSide[direction];
		var offsetZ = posZ + this.facing.offsetsZForSide[direction];
		
		var i = 0;
		do
		{
			if (i >= 13)
			{
				break;
			}
			//if (offsetY <= 0 || offsetY >= world.worldData.getSizeY() - 1) //the original from the source
			if (offsetY < 0 || offsetY >= world.worldData.getSizeY())
			{
				return false;
			}
			var blockID = world.getBlockId(offsetX, offsetY, offsetZ);
			if (blockID == 0)
			{
				break;
			}
			if (!this.canPushBlock(blockID, world, offsetX, offsetY, offsetZ, true))
			{
				return false;
			}
			if (world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				//world.Block.blocksList[blockID].dropBlockAsItem(world, offsetX, offsetY, offsetZ, world.getBlockMetadata(offsetX, offsetY, offsetZ), 0);
				world.setBlockWithNotify(offsetX, offsetY, offsetZ, 0);
				break;
			}
			if (i == 12)
			{
				return false;
			}
			offsetX += this.facing.offsetsXForSide[direction];
			offsetY += this.facing.offsetsYForSide[direction];
			offsetZ += this.facing.offsetsZForSide[direction];
			i++;
		}
		while (true);
		
		var offsetZofBlockToCheck = 0; //int
		for (; offsetX != posX || offsetY != posY || offsetZ != posZ; offsetZ = offsetZofBlockToCheck)
		{
			var offsetXofBlockToCheck = offsetX - this.facing.offsetsXForSide[direction];
			var offsetYofBlockToCheck = offsetY - this.facing.offsetsYForSide[direction];
			offsetZofBlockToCheck = offsetZ - this.facing.offsetsZForSide[direction];
			var blockID = world.getBlockId(offsetXofBlockToCheck, offsetYofBlockToCheck, offsetZofBlockToCheck);
			var blockMetadata = world.getBlockMetadata(offsetXofBlockToCheck, offsetYofBlockToCheck, offsetZofBlockToCheck);
			if (blockID == this.blockID && offsetXofBlockToCheck == posX && offsetYofBlockToCheck == posY && offsetZofBlockToCheck == posZ)
			{
				world.setBlockAndMetadata(offsetX, offsetY, offsetZ, world.Block.pistonMoving.blockID, direction | (this.isSticky ? 8 : 0));
				world.setBlockTileEntity(offsetX, offsetY, offsetZ, world.Block.pistonMoving.getTileEntity(world.Block.pistonExtension.blockID, direction | (this.isSticky ? 8 : 0), direction, true, false, world));
			}
			else
			{
				world.setBlockAndMetadata(offsetX, offsetY, offsetZ, world.Block.pistonMoving.blockID, blockMetadata);
				world.setBlockTileEntity(offsetX, offsetY, offsetZ, world.Block.pistonMoving.getTileEntity(blockID, blockMetadata, direction, true, false, world));
			}
			offsetX = offsetXofBlockToCheck;
			offsetY = offsetYofBlockToCheck;
		}

		return true;
	};
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isExtended = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 1, 5, 4, 2, 3)[orientation];
		}
		return orientation | isExtended;
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if (this.isExtended(blockMetadata)) {
			console.log("Cannot rotate piston at %s, %s, %s, already extended.", posX, posY, posZ);
			return;
		}
		
		var orientation = this.getOrientation(blockMetadata);
		var blockMetadata = new Array(1, 2, 5, 4, 0, 3)[orientation];
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
	};

	proto.getDrawViewAndRotation = function(currentFacing, orientation) {
		var view, rotateBy;
		
		switch (currentFacing) {
			case FACING_DOWN:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_UP:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 90;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_NORTH:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 90;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_EAST:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_WEST:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_EAST:
						view = "away";
						rotateBy = 0;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_SOUTH:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 270;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_WEST:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_WEST:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_EAST:
						view = "towards";
						rotateBy = 0;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			default: throw new Error("Unexpected case");
		}
		return {view: view, rotateBy: rotateBy};
	};
}());
