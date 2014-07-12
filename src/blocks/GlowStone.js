(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_GlowStone";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = false);
	};

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = true);
	};

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = false);
	};

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = true);
	};

	proto.drawGeneric = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		canvas.fillStyle = (forAboveLayer) ? "rgba(128,128,128,0.5)" : "rgb(0,255,0)";
		canvas.fillRect(0, 0, 8, 8);
	};
}());
