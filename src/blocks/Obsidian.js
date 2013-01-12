com.mordritch.mcSim.BlockType_Obsidian = function(){}
	com.mordritch.mcSim.BlockType_Obsidian.prototype = new com.mordritch.mcSim.BlockType_Stone();
	
	com.mordritch.mcSim.BlockType_Obsidian.prototype.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(163,73,164)";
		canvas.fillRect(0, 0, 8, 8);
	}
