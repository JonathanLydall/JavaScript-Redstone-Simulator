com.mordritch.mcSim.Entity__Default = function() {
	var nbtData;
	
	/**
	 * Does a simple to and from JSON on object to make it referenceless 
	 */
	var clone = function(data) {
		return JSON.parse(JSON.stringify(data));
	}
	
	/**
	 * Used to import NBT data
	 */
	this.readFromNBT = function(sourceNbtData) {
		nbtData = clone(sourceNbtData);
	}
	
	/**
	 * Used to export NBT data
	 */
	this.writeToNBT = function() {
		return clone(nbtData);
	}
	
	/**
	 * Dummy function for now, called once per tick and normally allows entities to update themselves 
	 */
	this.updateEntity = function() {
		
	}
}