function baseConverter (number,ob,nb) {
	// Created 1997 by Brian Risk.  http://brianrisk.com
	// http://www.geneffects.com/briarskin/programming/newJSMathFuncs.html#baseConverter
	// number: number to convert
	// ob: old base to convert from
	// nb: new base to convert to
	
	
	if (typeof number === 'number') number = number.toString(); //Added by myself for the Javascript Redstone Simulator.
	
	number = number.toUpperCase();
	var list = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var dec = 0;
	for (var i = 0; i <=  number.length; i++) {
		dec += (list.indexOf(number.charAt(i))) * (Math.pow(ob , (number.length - i - 1)));
	}
	number = "";
	var magnitude = Math.floor((Math.log(dec))/(Math.log(nb)));
	for (var i = magnitude; i >= 0; i--) {
		var amount = Math.floor(dec/Math.pow(nb,i));
		number = number + list.charAt(amount); 
		dec -= amount*(Math.pow(nb,i));
	}
	return number;
}

//wrapper functions, created for Redstone Javascript simulator: 

function fromBase2(number) {
	//converts to base 10
	var myInt = baseConverter(number,2,10).toString();
	
	return Number(baseConverter(number,2,10).toString());
	 
}

function toBase2(number) {
	//expects base 10 input
	
	if (number >= 8)
		return baseConverter(number,10,2).toString();
		
	if (number >= 4)
		return "0" + baseConverter(number,10,2).toString();
	
	if (number >= 2)
		return "00" + baseConverter(number,10,2).toString();

	if (number >= 1)
		return "000" + baseConverter(number,10,2).toString();
		
	return "0000";
}

function fromBase4(number) {
	//converts to base 10
	var numOut = baseConverter(number,4,10);
	if (numOut == "") {
		return 0;
	}
	else {
		return numOut;	
	}
}

function toBase4(number) {
	//expects base 10 input
	
	if (number >= 4)
		return baseConverter(number,10,4).toString();

	if (number >= 1)
		return "0" + baseConverter(number,10,4).toString();
		
	return "00";
}

function byteToBinary(number) {
	if (typeof number === 'undefined') return "0000 0000";
	var returnNum = baseConverter(number,10,2).toString();
	
	switch(returnNum.length) {
		case 1:
			return "0000 000" + returnNum;
			break;
		case 2:
			return "0000 00" + returnNum;
			break;
		case 3:
			return "0000 0" + returnNum;
			break;
		case 4:
			return "0000 " + returnNum;
			break;
		case 5:
			return "000" + returnNum.substr(1,1) + " " + returnNum.substr(2); 
			break;
		case 6:
			return "00" + returnNum.substr(1,2) + " " + returnNum.substr(3);
			break;
		case 7:
			return "0" + returnNum.substr(1,3) + " " + returnNum.substr(4);
			break;
		case 8:
			return returnNum.substr(1,4) + " " + returnNum.substr(5);
			break;
		default:
			return "0000 0000";
			break;
	}
}

function byteToBase2(number) {
	if (typeof number === 'undefined') return "00000000";
	var returnVal;
	var zeros = "00000000";
	var returnNum = baseConverter(number,10,2).toString();

	if (returnNum.length == 8)
		returnVal = returnNum;
	else
		returnVal = zeros.substr(1, 8 - returnNum.length) + returnNum;
		
	return returnVal;
}

