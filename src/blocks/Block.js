(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType__Default";
	var funcName = "BlockType_Block";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
}());
