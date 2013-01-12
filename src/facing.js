/**
 * Some functions use these arrays as a referrence to work out offset based on direction
 * 
 * For example:
 * offsetsXForSide[blockDirection] //where blockDirection = 5
 */

com.mordritch.mcSim.facing = function() {
	this.faceToSide = new Array(1, 0, 3, 2, 5, 4);
	this.offsetsXForSide = new Array(0, 0, 0, 0, -1, 1);
	this.offsetsYForSide = new Array(-1, 1, 0, 0, 0, 0);
	this.offsetsZForSide = new Array(0, 0, -1, 1, 0, 0);
}