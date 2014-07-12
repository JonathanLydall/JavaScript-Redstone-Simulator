/*
 * JavaScript Redstone Simulator
 * Copyright (C) 2012  Jonathan Lydall (Email: jonathan.lydall@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA. 
 * 
 */

/**
 * Dumps a hex representation of a string
 * 
 * By Jonathan Lydall (http://mordritch.com/) 
 */
function hexDump(data) {
	var outputString = new String();
	var addressPadding = "0000000";
	var line = 0;
	var countForCurrentLine = 0;
	var asciRepresentation;
	var asciString = "";
	
	outputString +=
		"Address   0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f \n" +
		"---------------------------------------------------------\n" +
		"00000000  ";
	
	for (var i=0; i < data.length; i++) {
		countForCurrentLine++;
		var byteData = data.substr(i, 1);
		
		var number = data.charCodeAt(i) & 0xff;
		var byteHex = (number < 16) ? "0" + number.toString(16) : number.toString(16);
		if (
			(number >= 33 && number <= 126) ||
			(number >= 161 && number <= 172) ||
			(number >= 174 && number <= 255)
		) {
			asciRepresentation = String.fromCharCode(number);
		}
		else {
			asciRepresentation = ".";
		}

		outputString += byteHex + " ";
		asciString += asciRepresentation;
		if (countForCurrentLine == 16) {
			countForCurrentLine = 0;
			line++;
			outputString += asciString + "\n" + addressPadding.substr(0, 7 - line.toString(16).length) + line.toString(16) + "0  ";
			asciString = "";
		}
	}

	if (countForCurrentLine > 0) {
		for (var i=0; i<16 - countForCurrentLine; i++) {
			outputString += "   ";
		}
		outputString += asciString;
	}

	return outputString;
}


function base64_decode (data) {
    /*
    var b64 = Base64.decode(data);
    
    var returnString = '';
    console.log("...finished, took %sms.", new Date().getTime() - start);
    for (var i=1; i<b64.length; i++) {
    	returnString+= String.fromCharCode(b64[i]);
    }
    return returnString;
   	*/
     
    
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Thunder.m
    // +      input by: Aman Gupta
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
    // *     returns 1: 'Kevin van Zonneveld'
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['btoa'] == 'function') {
    //    return btoa(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        dec = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    data += '';

    /*
    var strOut = "";
    for (var i = 0; i < data.length; i++) {
        if (data.charAt(i) == "\r") {
        	i++;
        	continue;
        }
        strOut += data.charAt(i);
    }
    data = strOut;
    */
    
    
    var i = 0;
    
    do { // unpack four hexets into three octets using index points in b64
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');

    return dec;
}


function base64_decode_async(options) {
	options.progress("base64_decode", 0);
	setTimeout(function() {
		base64_decode_async_begin(options);
	},0);
	
}

/**
 * Tries to use window.atob or otherwise falls back to a modified version php.js's base64_decode which runs pseudo asynchronously   
 * @param {Object} options
 */
function base64_decode_async_begin(options) {
	var i = 0;
	var ac = 0;
	var tmp_arr = [];
	if (typeof window.atob == 'undefined') {
		base64_decode_async_continue(options, ac, i, tmp_arr);
	}
	else {
		var data =  window.atob(options.data);
		options.progress("base64_decode", options.data.length);
		
		setTimeout(function() {
		    options.success(data);
		},0);
	    return;
	}
	
}

function base64_decode_async_continue(options, ac, i, tmp_arr) {
    var startTime = new Date().getTime();
    var maxTime = 200;
    var data = options.data;
    var callback_success = options.success;
    var callback_progress = options.progress;
	
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var
    	o1,
    	o2,
    	o3,
    	h1,
    	h2,
    	h3,
    	h4,
    	bits,
    	dec = ""
    	;

    if (!data) {
        return data;
    }

    data += '';

    do { // unpack four hexets into three octets using index points in b64
        if (new Date().getTime() - startTime > maxTime) {
        	callback_progress("base64_decode", i);
        	setTimeout(function() {
				base64_decode_async_continue(options, ac, i, tmp_arr);
        	},0);
        	return;
        }
        
        h1 = b64.indexOf(data.charAt(i++));
        h2 = b64.indexOf(data.charAt(i++));
        h3 = b64.indexOf(data.charAt(i++));
        h4 = b64.indexOf(data.charAt(i++));

        bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

        o1 = bits >> 16 & 0xff;
        o2 = bits >> 8 & 0xff;
        o3 = bits & 0xff;

        if (h3 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1);
        } else if (h4 == 64) {
            tmp_arr[ac++] = String.fromCharCode(o1, o2);
        } else {
            tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
        }
    } while (i < data.length);

    dec = tmp_arr.join('');
    
	callback_progress("base64_decode", i);
	
	setTimeout(function() {
		//So that we can update the progress.		
	    callback_success(dec);
	},0);
    return;

    //return dec;
}

function base64_encode (data) {
    if (typeof window.btoa != "undefined") {
    	return window.btoa(data);
    }
    
    // https://raw.github.com/kvz/phpjs/master/functions/url/base64_encode.js
    // http://kevin.vanzonneveld.net
    // +   original by: Tyler Akins (http://rumkin.com)
    // +   improved by: Bayron Guevara
    // +   improved by: Thunder.m
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Pellentesque Malesuada
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Rafał Kukawski (http://kukawski.pl)
    // *     example 1: base64_encode('Kevin van Zonneveld');
    // *     returns 1: 'S2V2aW4gdmFuIFpvbm5ldmVsZA=='
    // mozilla has this native
    // - but breaks in 2.0.0.12!
    //if (typeof this.window['btoa'] == 'function') {
    //    return btoa(data);
    //}
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
        ac = 0,
        enc = "",
        tmp_arr = [];

    if (!data) {
        return data;
    }

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1 << 16 | o2 << 8 | o3;

        h1 = bits >> 18 & 0x3f;
        h2 = bits >> 12 & 0x3f;
        h3 = bits >> 6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');
    
    var r = data.length % 3;
    
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);

}