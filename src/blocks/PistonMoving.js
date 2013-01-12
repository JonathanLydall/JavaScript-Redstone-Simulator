(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Container";
	var funcName = "BlockType_PistonMoving";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	var
		ORIENTATION_DOWN = 0,
		ORIENTATION_UP = 1,
		ORIENTATION_NORTH = 2,
		ORIENTATION_SOUTH = 3,
		ORIENTATION_WEST = 4,
		ORIENTATION_EAST = 5,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;

	proto.material = "piston";
	
	proto.getDrawViewAndRotation = namespace.BlockType_PistonBase.prototype.getDrawViewAndRotation;
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = false, currentFacing = FACING_DOWN);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = true, currentFacing = FACING_DOWN);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = false, currentFacing);
	}
	
	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = true, currentFacing);
	}
	
	proto.drawGenericView_moving = function(world, posX, posY, posZ, canvas, forAboveLayer, lookingTowards) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		var blockView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;
		var view = (lookingTowards == FACING_DOWN) ? "Top" : "Side";
		var storedBlock = world.Block.blocksList[entity.storedBlockID];

		if (blockView == "towards" || blockView == "away") {
			storedBlock["draw" + view + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			return;
		}

		var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;	

		switch(entity.storedOrientation) {
			case ORIENTATION_DOWN:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY-1, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX, posY+1, posZ);
				break;
			case ORIENTATION_UP:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY+1, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX, posY-1, posZ);
				break;
			case ORIENTATION_NORTH:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY, posZ-1);
				var entityBehindOf = world.getBlockTileEntity(posX, posY, posZ+1);
				break;
			case ORIENTATION_SOUTH:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY, posZ+1);
				var entityBehindOf = world.getBlockTileEntity(posX, posY, posZ-1);
				break;
			case ORIENTATION_WEST:
				var entityInFrontOf = world.getBlockTileEntity(posX-1, posY, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX+1, posY, posZ);
				break;
			case ORIENTATION_EAST:
				var entityInFrontOf = world.getBlockTileEntity(posX+1, posY, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX-1, posY, posZ);
				break;
			default: throw new Error("Unexpected case");
		}
		
		canvas.save();
		this.rotateContext(rotateAmount, canvas);
		canvas.beginPath();
		canvas.rect(0,0,8,8);
		canvas.closePath();
		canvas.clip();
		
		if (entity.extending) {
			switch (entity.progress) {
				case 0:
					canvas.translate(0, 6);
					break;
				case 0.5:
					canvas.translate(0, 4);
					break;
				case 1:
					canvas.translate(0, 2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			storedBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			if (
				entityInFrontOf != null &&
				entityInFrontOf.storedOrientation == entity.storedOrientation
			) {
				this.rotateContext(rotateAmount, canvas);
				canvas.translate(0, -8);
				this.rotateContext(360-rotateAmount, canvas);
				var otherBlock = world.Block.blocksList[entityInFrontOf.storedBlockID];
				otherBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entityInFrontOf, forAboveLayer, lookingTowards);
			}
		}
		else {
			switch (entity.progress) {
				case 0:
					canvas.translate(0, -6);
					break;
				case 0.5:
					canvas.translate(0, -4);
					break;
				case 1:
					canvas.translate(0, -2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			storedBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			if (
				entityBehindOf != null &&
				entityBehindOf.storedOrientation == entity.storedOrientation
			) {
				this.rotateContext(rotateAmount, canvas);
				canvas.translate(0, 8);
				this.rotateContext(360-rotateAmount, canvas);
				var otherBlock = world.Block.blocksList[entityBehindOf.storedBlockID];
				otherBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entityBehindOf, forAboveLayer, lookingTowards);
			}
		}
		canvas.restore();
	}

	proto.rotateSelection = function(blockMetadata, amount) {
		//The stored block will be called by the part of the rotateSelection function which updated entities
		return 0;
	}

	proto.drawTopView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		this.drawGenericView_moving_fromAir(world, posX, posY, posZ, canvas, entity, forAboveLayer, FACING_DOWN);
	}

	proto.drawSideView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		this.drawGenericView_moving_fromAir(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
	}

	proto.drawGenericView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		var storedBlock = world.Block.blocksList[entity.storedBlockID];
		var blockView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;
		var drawView = (lookingTowards == FACING_DOWN) ? "Top" : "Side";

		if (blockView == "towards" || blockView == "away") {
			storedBlock["draw" + drawView + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			return;
		}

		var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;
		
		canvas.save();
		this.rotateContext(rotateAmount, canvas);
        canvas.beginPath();
        canvas.rect(0,0,8,8);
        canvas.closePath();
        canvas.clip();
		
		switch (entity.progress) {
			case 0:
				canvas.translate(0, 2);
				break;
			case 0.5:
				canvas.translate(0, 4);
				break;
			case 1:
				canvas.translate(0, 6);
				break;
			default: throw new Error("Unexpected case");
		}
		this.rotateContext(360-rotateAmount, canvas);
		storedBlock["draw" + drawView + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
		
		canvas.restore();
	}

	proto.getBlockEntity = function() {
		return null;
	}
	
	proto.onBlockAdded = function(world, posX, posY, posZ) {
	}
	
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		var tileentity = world.getBlockTileEntity(posX, posY, posZ);
		if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
		{
			tileentity.clearPistonTileEntity();
		}
		else
		{
			//super.onBlockRemoval(world, i, j, k); //TODO: Make a plan
		}
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		//source code seems to do nothing:
		/*
        if (!world.isRemote)
        {
            if (world.getBlockTileEntity(i, j, k) != null);
        }
		 */
	}
	
	proto.getTileEntity = function(blockID, blockMetadata, orientation, flag, flag1, world)
    {
        var tileEntityPiston = new com.mordritch.mcSim.TileEntity_Piston();
        tileEntityPiston.construct(blockID, blockMetadata, orientation, flag, flag1, world);
        return tileEntityPiston;
    }
    
	proto.getTileEntityAtLocation = function(world, posX, posY, posZ) {
        var tileentity = world.getBlockTileEntity(posX, posY, posZ);
        if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
        {
            return tileentity;
        }
        else
        {
            return null;
        }
	}

	proto.enumeratePlaceableBlocks = function() {
		return new Array();
	}
}());
