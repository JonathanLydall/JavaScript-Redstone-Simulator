/*
function hexDump(data) {
	var h = 0;
	var buffer = "";
	var hex;
	var o = 0;
	var address = "";

	for (var i=0; i<data.length; i++) {
		byteVal = data.charCodeAt(i) & 0xff
		hex = byteVal.toString(16);
		if (hex.length == 1) {
			hex = "0"+hex;
		}
		
		buffer = buffer + hex + " "; 
		h++;
		if (h == 16) {
			h = 0;
			address = o.toString(16);
			while (address.length < 8) {
				address = "0"+address;
			}
			
			console.log("0x"+address+"   "+buffer);
			buffer = "";
			o += 16;
		}
	}
	address = o.toString(16);
	while (address.length < 8) {
		address = "0"+address;
	}
	console.log("0x"+address+"   "+buffer);
}
*/