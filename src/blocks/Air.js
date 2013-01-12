com.mordritch.mcSim.BlockType_Air = function(){}
	com.mordritch.mcSim.BlockType_Air.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Air.prototype.construct = function() {
		this._renderAsNormalBlock = false;
	}
	
	com.mordritch.mcSim.BlockType_Air.prototype.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		//It's air, it looks like nothing!
	}
	