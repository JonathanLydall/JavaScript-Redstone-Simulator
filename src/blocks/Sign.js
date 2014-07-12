(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Container";
	var funcName = "BlockType_Sign";

	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "wood";
	
	var textColor = "rgb(0,0,0)";
	var woodColor = "rgb(168,135,84)";
	var shadowColor = "rgba(128,128,128,0.5)";
	this.isFreestanding = false;
	
	var
		WALLMOUNTED_NORTH = 2,
		WALLMOUNTED_EAST = 5,
		WALLMOUNTED_WEST = 4,
		WALLMOUNTED_SOUTH = 3,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.eventBindings = [];
		this.isFreestanding = !!(this.blockType == "signPost");
	};
	
	/*
	 * Added for simulator
	 */
	proto.sameBlockTypeAs = function(blockId) {
		var signPost_BlockId = 63;
		var signWall_BlockId = 68;

		return (blockId == signPost_BlockId || blockId == signWall_BlockId);
	};

	/**
	 * MCP source does not have this method since the code for placing a sign is handled in the ItemSign class. 
	 */
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		var signPost_BlockId = world.Block.signPost.blockID;
		var signWall_BlockId = world.Block.signWall.blockID;
		var placementValid = false;
		
		if (world.getBlockMaterial(posX + 1, posY, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_NORTH);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX - 1, posY, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_SOUTH);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY, posZ + 1).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_EAST);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY, posZ - 1).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_WEST);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY - 1, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signPost_BlockId, 0);
			placementValid = true;
		}
		
		if (!placementValid) {
			throw new Error("Sign placement failed.");
		}
		else {
			this.toggleBlock(world, posX, posY, posZ);
		}
	};
	
	/*
	 * Added for simulator:
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return (
			world.getBlockMaterial(posX, posY - 1, posZ).isSolid() ||
			world.getBlockMaterial(posX, posY, posZ + 1).isSolid() ||
			world.getBlockMaterial(posX, posY, posZ - 1).isSolid() ||
			world.getBlockMaterial(posX + 1, posY, posZ).isSolid() ||
			world.getBlockMaterial(posX - 1, posY, posZ).isSolid()
		);
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var signPost_BlockId = world.Block.signPost.blockID;
		var signWall_BlockId = world.Block.signWall.blockID;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var runAwayLoopPrevention = 0;

		do {
			runAwayLoopPrevention++;
			
			if (runAwayLoopPrevention > 22) throw new Error("Runaway loop!");
			
			if (world.getBlockId(posX, posY, posZ) == signPost_BlockId) {
				blockMetadata = (blockMetadata + 1) & 0xf;
				world.setBlockMetadata(posX, posY, posZ, blockMetadata);
				if (blockMetadata == 0) {
					blockMetadata = WALLMOUNTED_NORTH;
					world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, blockMetadata);
				}
			}
			else {
				blockMetadata = new Array(0,0,5,4,2,3)[blockMetadata];
				world.setBlockMetadata(posX, posY, posZ, blockMetadata);
				if (blockMetadata == WALLMOUNTED_NORTH) {
					blockMetadata == 0;
					world.setBlockAndMetadata(posX, posY, posZ, signPost_BlockId, blockMetadata);
				}
			}
			
			if (!this.checkIfSignPlacementInvalid(world, posX, posY, posZ)) {
				world.notifyBlockChange(posX, posY, posZ, world.getBlockId(posX, posY, posZ));
				break;
			}
		} while (true);
	};
	
	proto.rotateSelection = function(blockMetadata, amount) {
		for (var i=0; i<amount; i++) {
			if (this.blockType == "signWall") {
				blockMetadata = new Array(0, 0, 5, 4, 2, 3)[blockMetadata];
			}
			else {
				blockMetadata = (blockMetadata + 4) & 0xf;
			}
		}

		return blockMetadata;
	};
	
	/*
	 * Added for simulator:
	 */
	proto.checkIfSignPlacementInvalid = function(world, posX, posY, posZ, facing) {
		if (world.getBlockId(posX, posY, posZ) == world.Block.signPost.blockID) {
			return (!world.getBlockMaterial(posX, posY - 1, posZ).isSolid());
		}
		else {
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);

			if (blockMetadata == 2 && world.getBlockMaterial(posX, posY, posZ + 1).isSolid()) {
				return false;
			}

			if (blockMetadata == 3 && world.getBlockMaterial(posX, posY, posZ - 1).isSolid()) {
				return false;
			}

			if (blockMetadata == 4 && world.getBlockMaterial(posX + 1, posY, posZ).isSolid()) {
				return false;
			}

			if (blockMetadata == 5 && world.getBlockMaterial(posX - 1, posY, posZ).isSolid()) {
				return false;
			}
			
			return true;
		}
	};
	
	proto._onNeighborBlockChange = proto.onNeighborBlockChange;
	proto.onNeighborBlockChange = function(par1World, par2, par3, par4, par5)
	{
		var flag = false;

		if (this.isFreestanding)
		{
			if (!par1World.getBlockMaterial(par2, par3 - 1, par4).isSolid())
			{
				flag = true;
			}
		}
		else
		{
			var i = par1World.getBlockMetadata(par2, par3, par4);
			flag = true;

			if (i == 2 && par1World.getBlockMaterial(par2, par3, par4 + 1).isSolid())
			{
				flag = false;
			}

			if (i == 3 && par1World.getBlockMaterial(par2, par3, par4 - 1).isSolid())
			{
				flag = false;
			}

			if (i == 4 && par1World.getBlockMaterial(par2 + 1, par3, par4).isSolid())
			{
				flag = false;
			}

			if (i == 5 && par1World.getBlockMaterial(par2 - 1, par3, par4).isSolid())
			{
				flag = false;
			}
		}

		if (flag)
		{
			//dropBlockAsItem(par1World, par2, par3, par4, par1World.getBlockMetadata(par2, par3, par4), 0);
			par1World.setBlockWithNotify(par2, par3, par4, 0);
		}

		this._onNeighborBlockChange(par1World, par2, par3, par4, par5);
	};
	
	proto.getBlockEntity = function() {
		return new namespace.TileEntity_Sign();
	};

	proto.toggleBlock = function(world, posX, posY, posZ) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		this.triggerEvent('toggleBlock', {
			block: this,
			entity: entity,
			world: world,
			posX: posX,
			posY: posY,
			posZ: posZ
		});
	};
	
	proto.on = function(eventType, callback) {
		this.eventBindings.push({eventType: eventType, callback: callback});
	};
	
	proto.triggerEvent = function(eventType, parameters) {
		parameters.eventType = eventType;
		
		for (var i in this.eventBindings) {
			if (this.eventBindings[i].eventType == eventType) {
				this.eventBindings[i].callback(parameters);
			}
		}
	};
	
	proto.isOpaqueCube = function() {
		return false;
	};
	
	/**
	 * Checks to see if the sign is a single letter and if so, draws just the letter instead and returns true.
	 *
	 */
	proto.checkForAndDrawLabel = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		if (
			entity != null &&
			entity.text[3].length == 0 &&
			entity.text[2].length == 0 &&
			entity.text[1].length == 0 && (
				entity.text[0].length == 1 ||
				(entity.text[0].length == 2 && entity.text[0].charAt(0) == "-")
			)
			
		) {
			var letter = "";
		
			canvas.fillStyle  = (forAboveLayer) ? shadowColor : textColor;
			canvas.textBaseline = "middle";
			canvas.textAlign = "center";
			canvas.font = "bold " + (7) + "px arial";
			

			if (entity.text[0].length == 1) {
				letter = entity.text[0].charAt(0);
			}
			else {
				letter = entity.text[0].charAt(1);
				canvas.fillRect(1, 0.5, 6, 1);
			}
			canvas.fillText(letter, 4, 5, 8);
			
			return true;
		}
		else {
			return false;
		}
	};
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, currentFacing = null, forAboveLayer = false);
	};

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, currentFacing = null, forAboveLayer = true);
	};
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, currentFacing, forAboveLayer) {
		if (this.checkForAndDrawLabel(world, posX, posY, posZ, canvas, forAboveLayer)) {
			return;
		}
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		canvas.fillStyle = (forAboveLayer) ? shadowColor : woodColor;
		
		if (this.blockType == 'signPost') {
			if (blockMetadata != 0) {
				canvas.save();
				canvas.translate(4, 4);
				canvas.rotate(22.5*blockMetadata*Math.PI/180);
				canvas.translate(-4, -4);
			}
			
			canvas.fillStyle = woodColor;
			canvas.fillRect(0.5, 3, 7, 2);
			canvas.fillStyle = textColor;
			canvas.fillRect(1.5, 4, 5, 1);
	
			if (blockMetadata != 0) {
				canvas.restore();
			}
		}
		
		else {
			canvas.save();
			canvas.translate(4, 4);
			switch (blockMetadata) {
				case WALLMOUNTED_NORTH:
				case 0:
					canvas.rotate(0*Math.PI/180);
					break;
				case WALLMOUNTED_EAST:
					canvas.rotate(90*Math.PI/180);
					break;
				case WALLMOUNTED_SOUTH:
					canvas.rotate(180*Math.PI/180);
					break;
				case WALLMOUNTED_WEST:
					canvas.rotate(270*Math.PI/180);
					break;
				default: throw new Error("Unexpected case.");
			}
			canvas.translate(-4, -4);
			
			canvas.beginPath();
			canvas.moveTo(1, 8);
			canvas.lineTo(7, 8);
			canvas.lineTo(7, 6);
			canvas.lineTo(1, 6);
			canvas.fill();
			
			
			canvas.restore();
		}
	};

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	};
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		if (this.checkForAndDrawLabel(world, posX, posY, posZ, canvas, forAboveLayer)) {
			return;
		}
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (forAboveLayer && this.blockType == 'signPost') {
			canvas.fillStyle = shadowColor;
			canvas.fillRect(1, 1, 6, 5);
			canvas.fillRect(3, 6, 2, 2);
		}
		
		if (!forAboveLayer && this.blockType == 'signPost') {
			canvas.fillStyle = woodColor;
			canvas.fillRect(1, 1, 6, 5);
			canvas.fillRect(3, 6, 2, 2);
		
			canvas.fillStyle = textColor;
			canvas.fillRect(2, 2, 2, 1);	
			canvas.fillRect(5, 2, 1, 1);	
		
			canvas.fillRect(2, 4, 1, 1);	
			canvas.fillRect(4, 4, 2, 1);	
		}
		
		var
			DRAW_FRONT = 0,
			DRAW_LEFT = 1,
			DRAW_RIGHT = 2,
			DRAW_BACK = 3,
			drawView = null;
		
		if (this.blockType == 'signWall') {
			switch (currentFacing) {
				case FACING_NORTH:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_RIGHT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_EAST:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_FRONT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_SOUTH:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_LEFT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_WEST:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_BACK;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				default: throw new Error("Unexpected case");
			}

			canvas.fillStyle = (forAboveLayer) ? shadowColor : woodColor;
			
			switch(drawView) {
				case DRAW_FRONT:
					canvas.fillRect(1, 1, 6, 5);
				
					if (!forAboveLayer) {
						canvas.fillStyle = textColor;
						canvas.fillRect(2, 2, 2, 1);	
						canvas.fillRect(5, 2, 1, 1);	
					
						canvas.fillRect(2, 4, 1, 1);	
						canvas.fillRect(4, 4, 2, 1);	
					}
					break;
				case DRAW_BACK:
					canvas.fillRect(1, 1, 6, 5);
					break;
				case DRAW_LEFT:
					canvas.fillRect(0, 1, 2, 5);
					break;
				case DRAW_RIGHT:
					canvas.fillRect(6, 1, 2, 5);
					break;
				default: throw new Error("Unexpected case");
			}
		}
	};
	
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 1, 1);
		worldData.setBlockAndMetadata(0, 0, 0, 63, 2);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);

		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 0,
			posZ = 0,
			canvas,
			blockMetadata = 2,
			forAboveLayer = false
		);
	};

}());
