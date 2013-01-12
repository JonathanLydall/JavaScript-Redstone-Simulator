/**
 * Wool
 */
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Cloth";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.material = "cloth";
	
	proto.clothColours = [
		[203,203,203], //0 white
		[233,119,42 ], //1 orange
		[185,57, 196], //2 magenta
		[83, 123,206], //3 light blue
		[176,164,23 ], //4 yellow
		[53, 174,43 ], //5 lime
		[211,112,139], //6 pink
		[61, 61, 61 ], //7 grey
		[144,153,153], //8 light grey
		[36, 107,137], //9 cyan
		[119,46, 183], //10 purple
		[36, 47, 141], //11 blue
		[86, 51, 27 ], //12 brown
		[51, 71, 22 ], //13 green
		[150,41, 37 ], //14 red
		[22, 18, 18 ]  //15 black
	];
	
	/* deprecated?
	proto.getClothColourAsRgb = function(world, posX, posY, posZ) {
		var index = world.getBlockMetadata(posX, posY, posZ);
		
		var red = this.clothColours[index][0];
		var green = this.clothColours[index][1]; 
		var blue = this.clothColours[index][2];
		
		return "rgb("+red+","+green+","+blue+")";
	}
	*/
	
	proto.getNormalCubeColour = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		return this.getNormalCubeColourByMetadata(blockMetadata);
	}
	
	proto.getNormalCubeColourByMetadata = function(blockMetadata) {
		//We don't want to pass back a reference or that could get edited later on by mistake.
		return [
			this.clothColours[blockMetadata][0],
			this.clothColours[blockMetadata][1],
			this.clothColours[blockMetadata][2]
		];
	}
	
	proto.getLocalizedBlockName = function(world, posX, posY, posZ, localization) {
		return localization.getString("tile.cloth." + this.getColorName(world.getBlockMetadata(posX, posY, posZ)) + ".name");
	}
	
	/**
	 * Gets the internal name of the wool's colour based on its metadata
	 * 
	 * @param	{Int}	Metadata Value of Wool Block, on which color is based
	 * @return	{String}
	 */
	proto.getColorName = function(blockMetadata) {
		
	}
	
	proto.getBlockName = function(blockMetadata) {
		var blockColor = new Array(
			"white",
			"orange",
			"magenta",
			"lightBlue",
			"yellow",
			"lime",
			"pink",
			"gray",
			"silver",
			"cyan",
			"purple",
			"blue",
			"brown",
			"green",
			"red",
			"black"
		);
		return "tile.cloth." + blockColor[blockMetadata] + ".name";
	}

	proto.enumeratePlaceableBlocks = function() {
		var returnArray = new Array();
		for (var i=0; i<=0xf; i++) {
			returnArray.push(
				{
					blockID: this.blockID,
					blockMetadata: i,
					blockType: this.blockType,
					blockName: this.getBlockName(i),
					material: this.material
				}
			);
		}
		
		return returnArray;
	}
}());
