(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Torch";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	var
		POINTING_EAST = 1,
		POINTING_WEST = 2,
		POINTING_SOUTH = 3,
		POINTING_NORTH = 4,
		STANDING_ON_GROUND = 5;
	
	proto.material = "circuits";
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 4;
	};

	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			return true;
		}

		return this.canPlaceTorchOn(world, posX, posY - 1, posZ);
	};
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		if (this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
			world.setBlockWithNotify(posX, posY, posZ, world.Block.air.blockID);
		}
	};
	
	proto.checkIftorchPlacementInvalid = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var removeTorch = false;

		if (!world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true) && blockMetadata == 1)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true) && blockMetadata == 2)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true) && blockMetadata == 3)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true) && blockMetadata == 4)
		{
			removeTorch = true;
		}

		if (!this.canPlaceTorchOn(world, posX, posY - 1, posZ) && blockMetadata == 5)
		{
			removeTorch = true;
		}
		
		return removeTorch;
	};
	
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		/*
		//Original function as per source:
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (facing == 1 && canPlaceTorchOn(world, posX, posY - 1, posZ))
		{
			blockMetadata = 5;
		}

		if (facing == 2 && world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = 4;
		}

		if (facing == 3 && world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = 3;
		}

		if (facing == 4 && world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = 2;
		}

		if (facing == 5 && world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = 1;
		}

		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);

		*/
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (this.canPlaceTorchOn(world, posX, posY - 1, posZ))
		{
			blockMetadata = 5;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = 4;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = 3;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = 2;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = 1;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}
	};

	proto.canPlaceTorchOn = function(world, posX, posY, posZ) {
		var Block = world.Block;
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ, true))
		{
			return true;
		}

		var blockId = world.getBlockId(posX, posY, posZ);

		if (blockId == Block.fence.blockID || blockId == Block.netherFence.blockID || blockId == Block.glass.blockID)
		{
			return true;
		}

		if (Block.blocksList[blockId] != null && (Block.blocksList[blockId] instanceof namespace.BlockType_Stairs))
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);

			if ((4 & blockMetadata) != 0)
			{
				return true;
			}
		}

		return false;
	};
	
	proto.rotateSelection = function(blockMetadata, amount) {
		for (var i=0; i<amount; i++) {
			blockMetadata = new Array(0, 3, 4, 2, 1, 5)[blockMetadata];
		}
		return blockMetadata;
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var originalMetadata = blockMetadata;
		do {
			blockMetadata = new Array(0, 3, 5, 2, 1, 4)[blockMetadata];
			world.setBlockMetadata(posX, posY, posZ, blockMetadata);
			if (!this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
				world.notifyBlockChange(posX, posY, posZ, world.getBlockId(posX, posY, posZ));
				break;
			}			
		} while (true);
	};
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, false);
	};
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, true);
	};
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		layerView = (forAboveLayer) ? "shadow" : "side"; 

		var
			POINTING_EAST = 1,
			POINTING_WEST = 2,
			POINTING_SOUTH = 3,
			POINTING_NORTH = 4,
			POINTING_UP = 5;

		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		switch (blockMetadata) {
			case POINTING_EAST:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 90);
				break;
			case POINTING_WEST:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 270);
				break;
			case POINTING_SOUTH:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 180);
				break;
			case POINTING_NORTH:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 0);
				break;
			case POINTING_UP:
				this.drawGeneric(world, posX, posY, posZ, canvas, "towards");
				break;
			default: throw new Error("Unexpected case");
		}
		
	};
		
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, false);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, true);
	};
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards, forAboveLayer) {
		var rotatedBy, view;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			POINTING_EAST = 1,
			POINTING_WEST = 2,
			POINTING_SOUTH = 3,
			POINTING_NORTH = 4,
			POINTING_UP = 5;
			
		layerView = (forAboveLayer) ? "shadow" : "side"; 

		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_SOUTH:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_EAST:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_WEST:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_SOUTH:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_EAST:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_WEST:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_SOUTH:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_EAST:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_WEST:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_SOUTH:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_EAST:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_WEST:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
		}
		
		this.drawGeneric(world, posX, posY, posZ, canvas, view, rotatedBy);
	};
	
	proto.drawGeneric = function(world, posX, posY, posZ, canvas, view, rotatedBy) {
		var torchColour = {
			torchRedstoneActive: "rgb(255,0,0)",
			torchRedstoneIdle: "rgb(128,0,0)",
			torchWood: "rgb(255,128,0)"
		}[this.blockType];

		var stickColour = "rgb(97,66,38)";
		
		if (view == "towards") {
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();
			return;
		}
		
		if (view == "away") {
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();

			canvas.beginPath();
			canvas.fillStyle = stickColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(
				4,	//x coord
				4,	//y coord
				1, 		//radius
				0,						//start point
				(Math.PI / 180) * 360,	//end point
				false					//clockwise
			);
			canvas.fill();
			return;
		}
		
		if (view == "side") {
			canvas.save();
			this.rotateContext(rotatedBy, canvas);
			
			canvas.fillStyle = stickColour;
			canvas.fillRect(3, 3, 2, 5);
	
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();
			canvas.restore();
			return;
		}
		
		if (view =="shadow") {
			canvas.save();
			this.rotateContext(rotatedBy, canvas);
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			
			canvas.moveTo(3, 8);
			canvas.beginPath();
			canvas.lineTo(3, 4);
			canvas.arc(4, 4, 2, (Math.PI / 180) * 100, (Math.PI / 180) * 80, false);
			canvas.lineTo(3, 4);
			canvas.lineTo(5, 4);
			canvas.lineTo(5, 8);
			canvas.lineTo(3, 8);
			canvas.fill();
			canvas.restore();
			return;
		}
	};
}());
