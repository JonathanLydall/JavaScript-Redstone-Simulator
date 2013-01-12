(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType__Default";
	var funcName = "BlockType__Unknown";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.material = "air";
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
	}
	
	/**
	 * Draws a blue block with the block ID in it, signfiying the block is not yet implemented 
	 */
	proto.drawGeneric = function(world, posX, posY, posZ, canvas) {
		var fillColour = "rgb(0,0,255)";
		var fontColour = "rgb(255,255,255)";
	
		canvas.fillStyle = fillColour;
		/* Old method, drew a circle
		canvas.beginPath();
		canvas.arc(4, 4, 4, 0, (Math.PI/180)*360, false);
		canvas.fill();
		*/
		canvas.fillRect(0,0,8,8);
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText(this.blockID, 4, 4, 6);
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas);
	}
	
	proto.enumeratePlaceableBlocks = function() {
		return new Array();
	}
}());
