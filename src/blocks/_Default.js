(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "BlockType__Default";
	
	namespace[funcName] = function(){};
	var proto = namespace[funcName].prototype;

	proto.material = "";
	
	/**
	 * Manually called just after "new" keyword is used to instantiate the object 
	 * 
	 * Because Javascript doesn't have true class inheritance, there is no "constructor" function,
	 * instead, this is called manually to complete initiation of the instantiated block type.
	 * 
	 * @param {Object}	blockType 
	 */
	proto._construct = function(blockType, blockID, blockDefinition, Block) {
		this.facing = new com.mordritch.mcSim.facing(); //A collection direction maps TODO: consider having this reside in the Block object, more relevant there
		this.drawIconBlockMetadataOveride = 0; //Used by the drawicon function, if we don't want block icons to be generated for Metadata 0, we can override it per block by setting up this value 
		
		this.blockType = blockType;
		this.blockID = blockID;
		this.blockName = blockDefinition.blockName;
		this.className = blockDefinition.blockName;
		
		this.tickOnLoad = false;
		this._renderAsNormalBlock = true;
		
		if (typeof blockDefinition.material != "undefined") {
			this.setBlockMaterial(blockDefinition.material);
		}
		else if (typeof this.material != "undefined") {
			this.setBlockMaterial(this.material);
		}
		
		this.construct(blockType, blockID, blockDefinition, Block);
	}
	
	proto.setBlockMaterial = function(material) {
		this.blockMaterial = namespace.Material[material];
	}
	
	proto.renderAsNormalBlock = function() {
		return this._renderAsNormalBlock;
	}
	
	/**
	 * When one is inspecting block info, blocks can choose to show extra data here. 
	 */
	proto.getBlockInfo = function(world, posX, posY, posZ) {
		return "No extra block info provided.";
	}
	
	/**
	 * Block specific constructor, can be implemented by inherited blocks, called automatically by
	 * this._construct();
	 */
	proto.construct = function() {
		
	}
	
	/**
	 * Used to rotate the entire world or a selection of blocks, torches for example can have their metadata updated appropriately
	 * 
	 * Accepts amount of times to rotate the block 90 degrees clockwise, so, to rotate it 180 degress clockwise, the amount would be 2, 270 would be 3
	 * 
	 * Returns updated block metadata for the new rotation
	 */
	proto.rotateSelection = function(blockMetadata, amount) {
		return blockMetadata;
	}
	
	/**
	 * Is the block solid?
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 * @return {Boolean}
	 */
	proto.getIsBlockSolid = function(world, posX, posY, posZ) {
		return this.isSolid;
	}
	
	/**
	 * Called when a block has been queued to update at a cetain tick
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.updateTick = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Called when the block is destroyed by a player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.onBlockDestroyedByPlayer = function(world, posX, posY, posZ) {
	
	}
	
	/**
	 * Called when the block is destroyed by a player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} blockID	The block ID which triggered the event 
	 * 
	 */
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, blockID) {
		
	}
	
	/**
	 * Called when "block is added to the world"?
	 * 
	 * I am assuming it's called when for example sand falls, pistons put down their moved blocks
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.onBlockAdded = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Checks to see if its valid to put this block at the specified coordinates
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
        var blocksList = world.Block.blocksList;
        
        var blockId = world.getBlockId(posX, posY, posZ);
        return blockId == 0 || blocksList[blockId].blockMaterial.isGroundCover();
	}
	
	/**
	 * Used by the place block tool as an additional way to compare if block types match for purposes of rotating
	 * the block. For example, signs use this to compare wall signs and sign posts as a match even though their IDs
	 * are different.  
	 */
	proto.sameBlockTypeAs = function(blockId) {
		return false;
	}
	
	/**
	 * Called when block is removed from the world, but not when destroyed by player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
	
	}
	
	/**
	 * I am guessing it's a check to see if we can place the block on the specified side of
	 * the specified block.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} side	Unknown paramater from minecraft source, guessing it's which side of the block
	 * 							we are going to test?
	 * 
	 * @return {Boolean}
	 */
	proto.canPlaceBlockOnSide = function(world, posX, posY, posZ, side) {
		return this.canPlaceBlockAt(world, posX, posY, posZ);
	}
	
	/**
	 * Can the block be placed at the following co-ordinates, certain blocks can't rest on nothing, so
	 * I guess this is a check for that.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @return {Boolean}
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return true;
	}
	
	/**
	 * Event called when a player right clicks the block.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.blockActivated = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.isPoweringTo = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Can provide power
	 * 
	 * Perhaps affects whether or not wires will connect with it?
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @return {Boolean}
	 */
	proto.canProvidePower = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Unknown functionality
	 * 
	 * Guessing it's for blocks like torch which need to fall to the ground if the block they are attached to is
	 * removed.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.canBlockStay = function(world, posX, posY, posZ) {
		return true;
	}
	
	/**
	 * Seems to be implemented by music blocks and pistons
	 * 
	 * Note sure what triggers it's call exactly though.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	u1		unknown parameter from MCP generated sourcecode 
	 * @param {Integer}	u2		unknown parameter from MCP generated sourcecode
	 * 
	 */
	proto.playBlock = function(world, posX, posY, posZ) {
		
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			this.drawNormalCube_currentLayer(world, posX, posY, posZ, canvas);
			return;
		}

		var fillColour = "rgb(255,0,0)";
		var fontColour = "rgb(255,255,255)";
	
		canvas.fillStyle = fillColour;
		canvas.fillRect(0,0,8,8);
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText(this.blockID, 4, 4, 6);
	}
	
	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			canvas.fillRect(0, 0, 8, 8);
			return;
		}
		
		//TODO: Handle not implemented?
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			this.drawNormalCube_currentLayer(world, posX, posY, posZ, canvas);
			return;
		}
		
		//Draws a green circle with a question mark inside, signifies that the child block does not have
		//a drawTopView_currentLayer implemented.
		var circleColour = "rgb(0,255,0)";
		var fontColour = "rgb(0,0,0)";
		
		canvas.fillStyle = circleColour;
		canvas.beginPath();
		canvas.arc(4, 4, 4, 0, (Math.PI/180)*360, false);
		canvas.fill();
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText("?", 4, 4, 6);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			canvas.fillRect(0, 0, 8, 8);
			return;
		}

		//TODO: Handle not implemented?
	}
	
	proto.getNormalCubeColour = function() {
		return [255,255,0];
	} 
	
	proto.getNormalCubeColourByMetadata = function() {
		return [255,255,0];
	}
	
	proto.drawNormalCube_currentLayer = function(world, posX, posY, posZ, canvas, shadowed) {
		var rgbColour = this.getNormalCubeColour(world, posX, posY, posZ);
		var rgbShadow = [128,128,128];
		var alpha = 0.5;
		if (shadowed) {
			for (var i=0; i<3; i++) {
				rgbColour[i] = (alpha * rgbShadow[i] + (1 - alpha) * rgbColour[i]) | 0; //http://stackoverflow.com/questions/746899/how-to-calculate-an-rgb-colour-by-specifying-an-alpha-blending-amount
			}
		}
		canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawNormalCube_withOpacity = function(world, posX, posY, posZ, canvas, alpha, shadowed) {
		var rgbColour = this.getNormalCubeColour(world, posX, posY, posZ);
		var rgbFog = [255,255,255];
		for (var i=0; i<3; i++) {
			rgbColour[i] = (alpha * rgbFog[i] + (1 - alpha) * rgbColour[i]) | 0; //http://stackoverflow.com/questions/746899/how-to-calculate-an-rgb-colour-by-specifying-an-alpha-blending-amount
		}
		canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer) {
		if (forAboveLayer) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
		}
		else {
			var rgbColour = this.getNormalCubeColourByMetadata(entity.storedMetadata);
			canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		}
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer) {
		if (forAboveLayer) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
		}
		else {
			var rgbColour = this.getNormalCubeColourByMetadata(entity.storedMetadata);
			canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		}
		canvas.fillRect(0, 0, 8, 8);
	}
	
	/**
	 * Called by "toggle" tool of the simulator, not implemented in the game.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 */
	proto.toggleBlock = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Used to called by "rotate" tool of the simulator, not implemented in the game.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 */
	proto.rotateBlock = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Used by pistons to see whether or not a block can be moved:
	 */
	proto.getMobilityFlag = function() {
		return this.blockMaterial.mobilityFlag;
	}
	
	/**
	 * Retrieves a block name based on the kind of block.
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * If block's name varies based on their metadata, like with wool, then
	 * that block should override this method.
	 * 
	 * @param 	{Integer} 	blockMetadata	So that if the name changes based on metadata, then the method can take it into account 
	 * @return	{String}
	 */
	proto.getBlockName = function(blockMetadata) {
		return "tile." + this.blockName + ".name";
	}
	
	/**
	 * Used by the gui to get a list of what kind of placeable blocktypes are offered.
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * Certain blocks, like cloth, can offer multiple different kinds of coloured wool,
	 * so would need to override this method.

	 * @param	{Object}	localization	Localization object
	 * @return	{Object}
	 */
	proto.enumeratePlaceableBlocks = function() {
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

	/**
	 * Used to draw icons on a canvas. 
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * Creates a world just big enough to hold enough blocks to draw an icon for the kind of block.
	 * If  the type of block, for example redstone wire, needs other blocks around it to generate
	 * the desired preview icon, then it should override this method.
	 * 
	 * @param	{Object}	blockObj		Containing all the block types
	 * @param	{Object}	canvas			The canvas element to draw to
	 * @param	{Object}	blockMetadata	Metadata of the block for generating the icon
	 */
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		if (blockMetadata == 0) {
			blockMetadata = this.drawIconBlockMetadataOveride;
		}
		
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 1, 1);
		worldData.setBlockAndMetadata(0, 0, 0, this.blockID, blockMetadata);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);
		this.drawTopView_currentLayer(world, 0, 0, 0, canvas);
	}
	
	/**
	 * A helper utility function for draw methods of blocks, used by simulator only, not the game
	 */
	proto.rotateContext = function(amount, context) {
		switch (amount) {
			case 0:
				return;
			case 90:
				context.translate(8, 0);
				context.rotate(Math.PI*0.5);
				return;
			case 180:
				context.translate(8, 8);
				context.rotate(Math.PI*1.0);
				return;
			case 270:
				context.translate(0, 8);
				context.rotate(Math.PI*1.5);
				return;
		}
	}
	
	proto.mirrorContext = function(context) {
		context.translate(8, 0);
		context.scale(-1, 1);
	}
	
	proto.flipContext = function(context) {
		context.translate(0, 8);
		context.scale(1, -1);
	}
}());
