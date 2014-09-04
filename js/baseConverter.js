// number :: String ; because why not.
// oldBase :: Number
// newBase :: Number
// @return String
function baseConverter( number, oldBase, newBase ){
	if( number === "" )
		return "";
	return parseInt( number, oldBase ).toString( newBase );
}

function formatNumberString( template, string ){
	return template.substr( 0, template.length - string.length ) + string;
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
	return formatNumberString( "0000", baseConverter( number, 10, 2 ) );
}

// @return Number
function fromBase4(number) {
	//converts to base 10
	return parseInt( number, 4 );
}

// @return String
function toBase4(number) {
	//expects base 10 input
	return formatNumberString( "00", baseConverter( number, 10, 4 ) );
}

// @return String
function byteToBase2(number) {
	var zeros = "00000000";
	if (number === undefined)
		return zeros;
	return formatNumberString( zeros, baseConverter( number, 10, 2 ) );
}

// @return String (formatted)
function byteToBinary(number) {
	var result = byteToBase2( number );
	return result.substr( 0, 4 ) + " " + result.substr( 4, 4 );
}