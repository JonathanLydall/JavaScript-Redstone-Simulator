(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PistonExtension";
	
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
	
	proto.getDrawViewAndRotation = namespace.BlockType_PistonBase.prototype.getDrawViewAndRotation;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.facing = new com.mordritch.mcSim.facing();
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = true);
	}
	
	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata = entity.storedMetadata, forAboveLayer);
	}

	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata = entity.storedMetadata, forAboveLayer);
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	}

	proto.draw_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		blockMetadata = (typeof blockMetadata != 'undefined') ? blockMetadata : world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 0x7;
		var rotatedBy = this.getDrawViewAndRotation(currentFacing, orientation).rotateBy;
		var view = this.getDrawViewAndRotation(currentFacing, orientation).view;

		var stickyColour = "rgb(181, 230, 29)";
		var woodColour = "rgb(168,135,84)";
		var stoneColour = "rgb(64, 64, 64)";
		var poweredColour = "rgb(255,0,0)";
		var unpoweredOnWoodColour = "rgb(128,0,0)";
		var unpoweredOnStoneColour = "rgb(255,255,255)";
		
		var stickyOrWood = ((blockMetadata & 0x8) == 0x8) ? stickyColour : woodColour;

		switch (view) {
			case "towards":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.lineTo(1, 0);
					canvas.moveTo(1, 1);
					canvas.moveTo(4, 1);
					canvas.moveTo(4, 3);
					canvas.moveTo(6, 3);
					canvas.moveTo(6, 1);
					canvas.moveTo(7, 1);
					canvas.moveTo(7, 7);
					canvas.moveTo(6, 7);
					canvas.moveTo(6, 5);
					canvas.moveTo(4, 5);
					canvas.moveTo(4, 7);
					canvas.moveTo(1, 7);
					canvas.moveTo(1, 0);
					
					canvas.moveTo(0, 0);
					canvas.moveTo(0, 8);
					canvas.moveTo(8, 8);
					canvas.moveTo(8, 0);
					canvas.moveTo(1, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 8);
					
					canvas.fillStyle = poweredColour;
					canvas.fillRect(1, 1, 3, 6);
					canvas.fillRect(4, 3, 2, 2);
					canvas.fillRect(6, 1, 1, 6);
				}
				break;
			case "away":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.lineTo(1, 0);
					canvas.moveTo(1, 1);
					canvas.moveTo(4, 1);
					canvas.moveTo(4, 3);
					canvas.moveTo(6, 3);
					canvas.moveTo(6, 1);
					canvas.moveTo(7, 1);
					canvas.moveTo(7, 7);
					canvas.moveTo(6, 7);
					canvas.moveTo(6, 5);
					canvas.moveTo(4, 5);
					canvas.moveTo(4, 7);
					canvas.moveTo(1, 7);
					canvas.moveTo(1, 0);
					
					canvas.moveTo(0, 0);
					canvas.moveTo(0, 8);
					canvas.moveTo(8, 8);
					canvas.moveTo(8, 0);
					canvas.moveTo(1, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 8);
					
					canvas.fillStyle = stoneColour;
					canvas.fillRect(2, 2, 4, 4);
				}
				break;
			case "side":
				canvas.save();
				this.rotateContext(rotatedBy, canvas);
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.moveTo(0, 0);
	
					canvas.lineTo(0, 0);
					canvas.lineTo(8, 0);
					canvas.lineTo(8, 2);
					canvas.lineTo(5, 2);
					canvas.lineTo(5, 8);
					canvas.lineTo(3, 8);
					canvas.lineTo(3, 2);
					canvas.lineTo(0, 2);
					canvas.lineTo(0, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 2);
					
					canvas.fillStyle = stoneColour;
					canvas.fillRect(3, 2, 2, 6);
				}
				canvas.restore();
				break;
			default: throw new Error("Unexepected case")
		}
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isSticky = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 1, 5, 4, 2, 3)[orientation];
		}
		return orientation | isSticky;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ)
	{
		return false;
	}

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, l)
	{
		var direction = this.getDirectionMeta(world.getBlockMetadata(posX, posY, posZ));
		var blockID = world.getBlockId(posX - this.facing.offsetsXForSide[direction], posY - this.facing.offsetsYForSide[direction], posZ - this.facing.offsetsZForSide[direction]);
		if (blockID != world.Block.pistonBase.blockID && blockID != world.Block.pistonStickyBase.blockID)
		{
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
		else
		{
			world.Block.blocksList[blockID].onNeighborBlockChange(world, posX - this.facing.offsetsXForSide[direction], posY - this.facing.offsetsYForSide[direction], posZ - this.facing.offsetsZForSide[direction], l);
		}
	}

	proto.getDirectionMeta = function(blockMetadata)
	{
		return blockMetadata & 0x7;
	}

	proto.onBlockRemoval = function(world, posX, posY, posZ)
	{
		//super.onBlockRemoval(world, posX, posY, posZ); //FIXME
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var faceToSide = this.facing.faceToSide[this.getDirectionMeta(blockMetadata)];
		posX += this.facing.offsetsXForSide[faceToSide];
		posY += this.facing.offsetsYForSide[faceToSide];
		posZ += this.facing.offsetsZForSide[faceToSide];
		var blockID = world.getBlockId(posX, posY, posZ);
		if (blockID == world.Block.pistonBase.blockID || blockID == world.Block.pistonStickyBase.blockID)
		{
			var newBlockMetadata = world.getBlockMetadata(posX, posY, posZ);
			if (world.Block.pistonBase.isExtended(newBlockMetadata))
			{
				//world.Block.blocksList[blockID].dropBlockAsItem(world, posX, posY, posZ, newBlockMetadata, 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	}

	proto.enumeratePlaceableBlocks = function() {
		return [];
	}
}());
