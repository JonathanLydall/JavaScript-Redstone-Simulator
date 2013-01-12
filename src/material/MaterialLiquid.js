(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialLiquid";
	
	namespace[funcName] = function(par1MapColor) {this.construct(par1MapColor);};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto._construct = proto.construct;
	proto.construct = function(par1MapColor)
	{
		this._construct(par1MapColor);
		this.setGroundCover();
		this.setNoPushMobility();
	}

	/**
	 * Returns if blocks of these materials are liquids.
	 */
	proto.isLiquid = function()
	{
		return true;
	}

	/**
	 * Returns if this material is considered solid or not
	 */
	proto.blocksMovement = function()
	{
		return false;
	}

	proto.isSolid = function()
	{
		return false;
	}

}());
