// number :: String ; because why not.
// oldBase :: Number
// newBase :: Number
// @return String
function baseConverter( number, oldBase, newBase ){
	if( number === "" )
		return "";
	return parseInt( number, oldBase ).toString( newBase );
}

//wrapper functions, created for Redstone Javascript simulator: 

// number :: String
// @return Number
function fromBase2(number) {
	//converts to base 10
	return parseInt( number, 2 );
}

// @return String
function toBase2(number) {
	//expects base 10 input
	var zeros = "0000";
	var result = baseConverter( number, 10, 2 );
	
	return zeros.substr( 0, 4 - result.length ) + result;
}

// @return Number
function fromBase4(number) {
	//converts to base 10
	return parseInt( number, 4 );
}

// @return String
function toBase4(number) {
	//expects base 10 input
	var zeros = "00";
	var result = baseConverter(number,10,4);
	
	return zeros.substr( 0, 2 - result.length ) + result;
}

// @return String
function byteToBase2(number) {
	var zeros = "00000000";
	if (number === undefined) {
		return zeros;
	}
	var returnNum = baseConverter(number,10,2).toString();
	
	return zeros.substr(0, 8 - returnNum.length) + returnNum;
}

// @return String (formatted)
function byteToBinary(number) {
	var result = byteToBase2( number) ;
	return result.substr(0, 4) + " " + result.substr(4, 4);
}