(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialPortal";
	
	namespace[funcName] = function(par1MapColor) {this.construct(par1MapColor);};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;


	proto._construct = proto.construct;
	proto.construct = function(par1MapColor)
	{
		this._construct(par1MapColor);
	}

	proto.isSolid = function()
	{
		return false;
	}

	/**
	 * Will prevent grass from growing on dirt underneath and kill any grass below it if it returns true
	 */
	proto.getCanBlockGrass = function()
	{
		return false;
	}

	/**
	 * Returns if this material is considered solid or not
	 */
	proto.blocksMovement = function()
	{
		return false;
	}
}());
