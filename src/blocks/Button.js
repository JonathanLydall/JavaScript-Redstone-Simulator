(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Button";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "circuits";
	
	var
		FACING_EAST = 1,
		FACING_WEST = 2,
		FACING_SOUTH = 3,
		FACING_NORTH = 4;
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 3;
		this._renderAsNormalBlock = false;
		this.tickOnLoad = true;
	};
	
	proto.tickRate = function() {
		return 20;
	};
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ)
	{
		if (world.isBlockNormalCube(posX - 1, posY, posZ))
		{
			return true;
		}
		if (world.isBlockNormalCube(posX + 1, posY, posZ))
		{
			return true;
		}
		if (world.isBlockNormalCube(posX, posY, posZ - 1))
		{
			return true;
		}
		return world.isBlockNormalCube(posX, posY, posZ + 1);
	};
	
	proto.placementIsValid = function(world, posX, posY, posZ, direction) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 7;
		return !(
			(!world.isBlockNormalCube(posX - 1, posY, posZ) && facing == 1) ||
			(!world.isBlockNormalCube(posX + 1, posY, posZ) && facing == 2) ||
			(!world.isBlockNormalCube(posX, posY, posZ - 1) && facing == 3) ||
			(!world.isBlockNormalCube(posX, posY, posZ + 1) && facing == 4)
		);
	};

	proto.rotateSelection = function(blockMetadata, amount) {
		var isPressed = blockMetadata & 0x8;
		var facing = blockMetadata & 0x7;
		for (var i=0; i<amount; i++) {
			facing = new Array(0, 3, 4, 2, 1)[facing];
		}
		return facing | isPressed;
	};
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 7;
		console.log("rotatating.");
		do {
			facing = new Array(0, 3, 4, 2, 1)[facing];
			world.setBlockMetadataWithNotify(posX, posY, posZ, facing);
			if (this.placementIsValid(world, posX, posY, posZ)) {
				break;
			}			
		} while (true);
	};
	
	/**
	 * For buttons, we should need to see if the button needs to be destroyed if the block it was resting on is now gone. 
	 */
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, direction) {
		if (this.redundantCanPlaceBlockAt(world, posX, posY, posZ))
		{
			if (!this.placementIsValid(world, posX, posY, posZ, direction)) {
				//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	};
	
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		/*
		//Original function as per source:
        int i = par1World.getBlockMetadata(par2, par3, par4);
        int j = i & 8;
        i &= 7;

        if (par5 == 2 && par1World.isBlockNormalCube(par2, par3, par4 + 1))
        {
            i = 4;
        }
        else if (par5 == 3 && par1World.isBlockNormalCube(par2, par3, par4 - 1))
        {
            i = 3;
        }
        else if (par5 == 4 && par1World.isBlockNormalCube(par2 + 1, par3, par4))
        {
            i = 2;
        }
        else if (par5 == 5 && par1World.isBlockNormalCube(par2 - 1, par3, par4))
        {
            i = 1;
        }
        else
        {
            i = getOrientation(par1World, par2, par3, par4);
        }

        par1World.setBlockMetadataWithNotify(par2, par3, par4, i + j);
		*/
		var blockMetadata;
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = FACING_NORTH;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = FACING_WEST;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = FACING_SOUTH;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = FACING_EAST;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}
		
	};

	/**
	 * The MCP variable name
	 */
	proto.redundantCanPlaceBlockAt = function(world, posX, posY, posZ)
	{
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

	proto.blockActivated = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 7;
		var isPressed = 8 - (blockMetadata & 8);
		if (isPressed == 0)
		{
			return true;
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation + isPressed);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "random.click", 0.3F, 0.6F);
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
		else
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		world.scheduleBlockUpdate(posX, posY, posZ, blockID, this.tickRate());
		return true;
	};
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated(world, posX, posY, posZ);
	};

	proto.isPoweringTo = function(world, posX, posY, posZ, direction)
	{
		return (world.getBlockMetadata(posX, posY, posZ) & 8) > 0;
	};
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction)
	{
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0)
		{
			return false;
		}
		var orientation = blockMetadata & 7;
		if (orientation == 5 && direction == 1)
		{
			return true;
		}
		if (orientation == 4 && direction == 2)
		{
			return true;
		}
		if (orientation == 3 && direction == 3)
		{
			return true;
		}
		if (orientation == 2 && direction == 4)
		{
			return true;
		}
		return orientation == 1 && direction == 5;
	};
	
	proto.canProvidePower = function() {
		return true;
	};
	
	proto.updateTick = function(world, posX, posY, posZ)
	{
		if (world.isRemote)
		{
			return;
		}
		
		var blockID = this.blockID;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0)
		{
			return;
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata & 7);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
		var orientation = blockMetadata & 7;
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
		else
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "random.click", 0.3F, 0.5F);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
	};
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, false);
	};

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, true);
	};

	/**
	 * @param forAboveLayer	It's faded when drawing for the above layer
	 */
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		/*
		0x1: Facing east
		0x2: Facing west
		0x3: Facing south
		0x4: Facing north
		*/
		
		switch (orientation) {
			case 1:
				this.draw(world, posX, posY, posZ, canvas, "right", forAboveLayer);
				break;
			case 2:
				this.draw(world, posX, posY, posZ, canvas, "left", forAboveLayer);
				break;
			case 3:
				this.draw(world, posX, posY, posZ, canvas, "down", forAboveLayer);
				break;
			case 4:
				this.draw(world, posX, posY, posZ, canvas, "up", forAboveLayer);
				break;
		}
	};
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, false);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, true);
	};
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards, forAboveLayer) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		/*
		0x1: Facing east
		0x2: Facing west
		0x3: Facing south
		0x4: Facing north
		*/
		
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			FACING_EAST = 1,
			FACING_WEST = 2,
			FACING_SOUTH = 3,
			FACING_NORTH = 4;
			
		var direction;
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "away";
						break;
					case FACING_NORTH:
						direction = "towards";
						break;
					case FACING_WEST:
						direction = "right";
						break;
					case FACING_EAST:
						direction = "left";
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "towards";
						break;
					case FACING_NORTH:
						direction = "away";
						break;
					case FACING_WEST:
						direction = "left";
						break;
					case FACING_EAST:
						direction = "right";
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "left";
						break;
					case FACING_NORTH:
						direction = "right";
						break;
					case FACING_WEST:
						direction = "away";
						break;
					case FACING_EAST:
						direction = "towards";
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "right";
						break;
					case FACING_NORTH:
						direction = "left";
						break;
					case FACING_WEST:
						direction = "towards";
						break;
					case FACING_EAST:
						direction = "away";
						break;
				}
				break;
		}
		
		this.draw(world, posX, posY, posZ, canvas, direction, forAboveLayer);
	};

	proto.draw = function(world, posX, posY, posZ, canvas, direction, forAboveLayer) {
		var isPressed = (world.getBlockMetadata(posX, posY, posZ) & 8) == 0x8;
		
		if (isPressed) {
			var poweredColour = "255,0,0";
			var thickness = 2;
		}
		else {
			var poweredColour = "128,0,0";
			var thickness = 4;
		}
		
		if (forAboveLayer) {
			poweredColour = "rgba(128,128,128,0.5)"; 
		}
		else {
			poweredColour = "rgb("+poweredColour+")"; 
		}

		canvas.fillStyle = poweredColour;

		switch (direction) {
			case "left":
				canvas.fillRect((8-thickness), 1, thickness, 6);
				break;
			case "right":
				canvas.fillRect(0, 1, thickness, 6);
				break;
			case "up":
				canvas.fillRect(1, (8-thickness), 6, thickness);
				break;
			case "down":
				canvas.fillRect(1, 0, 6, thickness);
				break;
			case "towards":
				canvas.fillRect(1, 2, 6, 4);
				break;
			case "away":
				canvas.fillRect(1, 2, 6, 4);
				canvas.fillStyle = "rgb(0,0,0)";
				canvas.fillRect(2, 2, 4, 4);
				break;
		}
	};
}());
