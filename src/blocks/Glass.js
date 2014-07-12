(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_BlockBreakable";
	var funcName = "BlockType_Glass";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(153,217,234)";
		canvas.fillRect(0, 0, 8, 8);
	};
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(153,217,234)";
		canvas.fillRect(0, 0, 8, 8);
	};

	proto.getNormalCubeColourByMetadata = function(blockMetadata) {
		return [153,217,234];
	};
}());
