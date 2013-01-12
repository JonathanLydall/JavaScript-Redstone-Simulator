(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Container";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.isBlockContainer = true;

	proto._onBlockAdded = proto.onBlockAdded;
	proto.onBlockAdded = function(par1World, par2, par3, par4)
	{
		this._onBlockAdded(par1World, par2, par3, par4);
		par1World.setBlockTileEntity(par2, par3, par4, this.getBlockEntity());
	}

	/**
	 * Called whenever the block is removed.
	 */
	proto._onBlockRemoval = proto.onBlockRemoval;
	proto.onBlockRemoval = function(par1World, par2, par3, par4)
	{
		this._onBlockRemoval(par1World, par2, par3, par4);
		par1World.removeBlockTileEntity(par2, par3, par4);
	}

	proto._powerBlock = proto.powerBlock;
	proto.powerBlock = function(par1World, par2, par3, par4, par5, par6)
	{
		this._powerBlock(par1World, par2, par3, par4, par5, par6);
		var tileentity = par1World.getBlockTileEntity(par2, par3, par4);

		if (tileentity != null)
		{
			tileentity.onTileEntityPowered(par5, par6);
		}
	}

}());
