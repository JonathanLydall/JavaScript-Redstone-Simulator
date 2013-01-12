(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "MapColor";
	
	namespace[funcName] = function() {};
	func = namespace[funcName];

	
	var generateMapColor = function(colorIndex, colorValue) {
		returnItem = {
			colorIndex: colorIndex,
			colorValue: colorValue
		};
		
		func.mapColorArray[colorIndex] = returnItem;
		return returnItem;
	}

	func.mapColorArray = [];

	func.airColor = generateMapColor(0, 0);
	func.grassColor = generateMapColor(1, 0x7fb238);
	func.sandColor = generateMapColor(2, 0xf7e9a3);
	func.clothColor = generateMapColor(3, 0xa7a7a7);
	func.tntColor = generateMapColor(4, 0xff0000);
	func.iceColor = generateMapColor(5, 0xa0a0ff);
	func.ironColor = generateMapColor(6, 0xa7a7a7);
	func.foliageColor = generateMapColor(7, 31744);
	func.snowColor = generateMapColor(8, 0xffffff);
	func.clayColor = generateMapColor(9, 0xa4a8b8);
	func.dirtColor = generateMapColor(10, 0xb76a2f);
	func.stoneColor = generateMapColor(11, 0x707070);
	func.waterColor = generateMapColor(12, 0x4040ff);
	func.woodColor = generateMapColor(13, 0x685332);
}());
