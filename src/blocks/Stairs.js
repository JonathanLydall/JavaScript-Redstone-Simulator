(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Stairs";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.construct = function(blockType, blockID, blockDefinition, Block) {
		this.modelBlock = Block[blockDefinition.modelBlock];
		this.blockMaterial = this.modelBlock.blockMaterial;
	};
	
	proto.isOpaqueCube = function() {
		return false;
	};
	
	proto.renderAsNormalBlock = function() {
		return false;
	};
	
}());
