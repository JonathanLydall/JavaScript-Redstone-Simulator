; 
//Initialize a name space, deliberately not a class or using variables to try avoid any potential namespace
//conflict (except for "com" still potentially being in conflict)
if (typeof window["com"] == "undefined") window["com"] = {};
if (typeof window.com["mordritch"] == "undefined") window.com["mordritch"] = {};
if (typeof window.com.mordritch["mcSim"] == "undefined") window.com.mordritch["mcSim"] = {};
; 
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/classes/binary-parser [rev. #1]

/*
 * Edit by Jonathan Lydall
 * @ http://mordritch.com
 * 2011-12-21
 * 
 * Added .toLong and .fromLong methods
 */

BinaryParser = function(bigEndian, allowExceptions){
	this.bigEndian = bigEndian, this.allowExceptions = allowExceptions;
};
with({p: BinaryParser.prototype}){
	p.encodeFloat = function(number, precisionBits, exponentBits){
		var bias = Math.pow(2, exponentBits - 1) - 1, minExp = -bias + 1, maxExp = bias, minUnnormExp = minExp - precisionBits,
		status = isNaN(n = parseFloat(number)) || n == -Infinity || n == +Infinity ? n : 0,
		exp = 0, len = 2 * bias + 1 + precisionBits + 3, bin = new Array(len),
		signal = (n = status !== 0 ? 0 : n) < 0, n = Math.abs(n), intPart = Math.floor(n), floatPart = n - intPart,
		i, lastBit, rounded, j, result;
		for(i = len; i; bin[--i] = 0);
		for(i = bias + 2; intPart && i; bin[--i] = intPart % 2, intPart = Math.floor(intPart / 2));
		for(i = bias + 1; floatPart > 0 && i; (bin[++i] = ((floatPart *= 2) >= 1) - 0) && --floatPart);
		for(i = -1; ++i < len && !bin[i];);
		if(bin[(lastBit = precisionBits - 1 + (i = (exp = bias + 1 - i) >= minExp && exp <= maxExp ? i + 1 : bias + 1 - (exp = minExp - 1))) + 1]){
			if(!(rounded = bin[lastBit]))
				for(j = lastBit + 2; !rounded && j < len; rounded = bin[j++]);
			for(j = lastBit + 1; rounded && --j >= 0; (bin[j] = !bin[j] - 0) && (rounded = 0));
		}
		for(i = i - 2 < 0 ? -1 : i - 3; ++i < len && !bin[i];);

		(exp = bias + 1 - i) >= minExp && exp <= maxExp ? ++i : exp < minExp &&
			(exp != bias + 1 - len && exp < minUnnormExp && this.warn("encodeFloat::float underflow"), i = bias + 1 - (exp = minExp - 1));
		(intPart || status !== 0) && (this.warn(intPart ? "encodeFloat::float overflow" : "encodeFloat::" + status),
			exp = maxExp + 1, i = bias + 2, status == -Infinity ? signal = 1 : isNaN(status) && (bin[i] = 1));
		for(n = Math.abs(exp + bias), j = exponentBits + 1, result = ""; --j; result = (n % 2) + result, n = n >>= 1);
		for(n = 0, j = 0, i = (result = (signal ? "1" : "0") + result + bin.slice(i, i + precisionBits).join("")).length, r = [];
			i; n += (1 << j) * result.charAt(--i), j == 7 && (r[r.length] = String.fromCharCode(n), n = 0), j = (j + 1) % 8);
		r[r.length] = n ? String.fromCharCode(n) : "";
		return (this.bigEndian ? r.reverse() : r).join("");
	};
	p.encodeInt = function(number, bits, signed){
		var max = Math.pow(2, bits), r = [];
		(number >= max || number < -(max >> 1)) && this.warn("encodeInt::overflow") && (number = 0);
		number < 0 && (number += max);
		for(; number; r[r.length] = String.fromCharCode(number % 256), number = Math.floor(number / 256));
		for(bits = -(-bits >> 3) - r.length; bits--; r[r.length] = "\0");
		return (this.bigEndian ? r.reverse() : r).join("");
	};
	p.decodeFloat = function(data, precisionBits, exponentBits){
		var b = ((b = new this.Buffer(this.bigEndian, data)).checkBuffer(precisionBits + exponentBits + 1), b),
			bias = Math.pow(2, exponentBits - 1) - 1, signal = b.readBits(precisionBits + exponentBits, 1),
			exponent = b.readBits(precisionBits, exponentBits), significand = 0,
			divisor = 2, curByte = b.buffer.length + (-precisionBits >> 3) - 1,
			byteValue, startBit, mask;
		do
			for(byteValue = b.buffer[ ++curByte ], startBit = precisionBits % 8 || 8, mask = 1 << startBit;
				mask >>= 1; (byteValue & mask) && (significand += 1 / divisor), divisor *= 2);
		while(precisionBits -= startBit);
		return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
			: (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
			: Math.pow(2, exponent - bias) * (1 + significand) : 0);
	};
	p.decodeInt = function(data, bits, signed){
		var b = new this.Buffer(this.bigEndian, data), x = b.readBits(0, bits), max = Math.pow(2, bits);
		return signed && x >= max / 2 ? x - max : x;
	};
	
	with({p: (p.Buffer = function(bigEndian, buffer){
		this.bigEndian = bigEndian || 0, this.buffer = [], this.setBuffer(buffer);
	}).prototype}){
		p.readBits = function(start, length){
			//shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
			function shl(a, b){
				for(++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
				return a;
			}
			if(start < 0 || length <= 0)
				return 0;
			this.checkBuffer(start + length);
			for(var offsetLeft, offsetRight = start % 8, curByte = this.buffer.length - (start >> 3) - 1,
				lastByte = this.buffer.length + (-(start + length) >> 3), diff = curByte - lastByte,
				sum = ((this.buffer[ curByte ] >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1))
				+ (diff && (offsetLeft = (start + length) % 8) ? (this.buffer[ lastByte++ ] & ((1 << offsetLeft) - 1))
				<< (diff-- << 3) - offsetRight : 0); diff; sum += shl(this.buffer[ lastByte++ ], (diff-- << 3) - offsetRight)
			);
			return sum;
		};
		p.setBuffer = function(data){
			if(data){
				/*
				 * Edit below by Jonathan Lydall, fixes problem where charCodeAt doesn't work correctly on values > 127
				 * 
				 * 2011-12-22
				 */
				//for(var l, i = l = data.length, b = this.buffer = new Array(l); i; b[l - i] = data.charCodeAt(--i)); //original
				for(var l, i = l = data.length, b = this.buffer = new Array(l); i; b[l - i] = data.charCodeAt(--i) & 0xff);
				this.bigEndian && b.reverse();
			}
		};
		p.hasNeededBits = function(neededBits){
			return this.buffer.length >= -(-neededBits >> 3);
		};
		p.checkBuffer = function(neededBits){
			if(!this.hasNeededBits(neededBits))
				throw new Error("checkBuffer::missing bytes");
		};
	}
	p.warn = function(msg){
		if(this.allowExceptions)
			throw new Error(msg);
		return 1;
	};
	p.toSmall = function(data){return this.decodeInt(data, 8, true);};
	p.fromSmall = function(number){return this.encodeInt(number, 8, true);};
	p.toByte = function(data){return this.decodeInt(data, 8, false);};
	p.fromByte = function(number){return this.encodeInt(number, 8, false);};
	p.toShort = function(data){return this.decodeInt(data, 16, true);};
	p.fromShort = function(number){return this.encodeInt(number, 16, true);};
	p.toWord = function(data){return this.decodeInt(data, 16, false);};
	p.fromWord = function(number){return this.encodeInt(number, 16, false);};
	p.toInt = function(data){return this.decodeInt(data, 32, true);};
	p.fromInt = function(number){return this.encodeInt(number, 32, true);};
	p.toLong = function(data){return this.decodeInt(data, 64, true);};
	p.fromLong = function(number){return this.encodeInt(number, 64, true);};
	p.toDWord = function(data){return this.decodeInt(data, 32, false);};
	p.fromDWord = function(number){return this.encodeInt(number, 32, false);};
	p.toFloat = function(data){return this.decodeFloat(data, 23, 8);};
	p.fromFloat = function(number){return this.encodeFloat(number, 23, 8);};
	p.toDouble = function(data){return this.decodeFloat(data, 52, 11);};
	p.fromDouble = function(number){return this.encodeFloat(number, 52, 11);};
}; 
/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * 
 */

(function(){
	function NbtParser() {
		this.TAG_End = 0;
		this.TAG_Byte = 1;
		this.TAG_Short = 2;
		this.TAG_Int = 3;
		this.TAG_Long = 4;
		this.TAG_Float = 5;
		this.TAG_Double = 6;
		this.TAG_Byte_Array = 7;
		this.TAG_String = 8;
		this.TAG_List = 9;
		this.TAG_Compound = 10;
		this.TAG_Int_Array = 11;
	
		this.binaryParser = new BinaryParser(true, false);
		this.expectedStartingTag = this.TAG_Compound;
	
		this.readByte = function(peekOnly) {return this.binaryParser.toByte(this.readBuffer(8,peekOnly))};
		this.readShort = function(peekOnly) {return this.binaryParser.toShort(this.readBuffer(16,peekOnly))};
		this.readInt = function(peekOnly) {return this.binaryParser.toInt(this.readBuffer(32),peekOnly)};
		this.readLong = function(peekOnly) {return this.binaryParser.toLong(this.readBuffer(64),peekOnly)};
		this.readFloat = function(peekOnly) {return this.binaryParser.toFloat(this.readBuffer(32),peekOnly)};
		this.readDouble = function(peekOnly) {return this.binaryParser.toDouble(this.readBuffer(64),peekOnly)};
		this.readString = function() {return this.readBuffer(8 * this.readShort())};
	
		this.writeByte = function(number) {return String.fromCharCode(number)};
		this.writeShort = function(number) {return this.binaryParser.fromShort(number)};
		this.writeInt = function(number) {return this.binaryParser.fromInt(number)};
		this.writeLong = function(number) {return this.binaryParser.fromLong(number)};
		this.writeFloat = function(number) {return this.binaryParser.fromFloat(number)};
		this.writeDouble = function(number) {return this.binaryParser.fromDouble(number)};
		this.writeString = function(string) {return this.writeShort(string.length) + string;}
		
		/**
		 * Returns string of data of a length in bits
		 * 
		 * @param {Integer}	bitLength	length of data to return in terms of number of bits
		 * @param {Bool}	peekOnly	If true, we doin't move the pointer
		 * @return {String}
		 */
		this.readBuffer = function(bitLength, peekOnly) {
			var byteLength;
			var returnData;
			
			if (typeof peekOnly == undefined) peekOnly = false;
			
			byteLength = bitLength/8;
	
			if (byteLength < 1) { 
				//Sometimes we are asked to read strings of zero length, this is not unusual for blocks like signs without text on every line
				returnData = "";
			}
			else {
				if (this.pointer + byteLength > this.binaryNbtData.length) {
					throw new Error("NbtParser.readBuffer(): Unexpectedly reached end of NBT data of length "+this.binaryNbtData.length+" (0x"+(this.binaryNbtData.length - 1).toString(16)+"). Tried reading "+byteLength+" bytes of data at position "+this.pointer+" (0x"+this.pointer.toString(16)+").");
				}
				else {
					returnData = this.binaryNbtData.substr(this.pointer, byteLength);
				}
			}
	
			if (!peekOnly) this.pointer += byteLength;
			return returnData;
		}
	
		this.decode = function(options) {
			//console.log(hexDump(options.data));
			var binaryData = options.data;
			var callback = options.success;
			var progress = options.progress;
			var updateInterval = options.updateInterval;
			var cancel = options.cancel;
			
			//Check if it's gzipped (starts with 0x1F and 0x8B):
			if (
				(binaryData.charCodeAt(0) & 0xff) == 0x1f &&
				(binaryData.charCodeAt(1) & 0xff) == 0x8b
			) {
				var t = this;
				com.mordritch.mcSim.gzip.inflateAsync({
					data: binaryData,
					success: function(data) {
						t.decodeNonGzipped(data, callback);
					},
					progressInterval: updateInterval,
					progress: function(type, progressAmount, messaging) {
						progress(type, progressAmount, messaging);
						//console.log(type, progressAmount);
					},
					cancel: cancel
				});
			}
			else {
				this.decodeNonGzipped(binaryData, callback);
			}
		}
		
		/**
		 * Decodes uncompressed NBT data
		 * 
		 * Returns as an object structured to represent the NBT data
		 * 
		 * @param	{String}	binaryNbtData
		 * @return	{Object}
		 */
		this.decodeNonGzipped = function(binaryNbtData, callback) {
			var returnData = {};
			var starterTagId;
			var starterTagName;
			
			this.binaryNbtData = binaryNbtData;
			this.pointer = 0;
			
			starterTagId = this.readByte();
	
			//I don't know if it's alpha levels in general, or my chunk extractor/decompressor, but
			//chunks seem to start with a TAG_Compound which has a name length of 0. That is, files
			//start with 0x0a0000. 
			if (this.readShort(true) == 0) {
				this.pointer += 2;
				starterTagId = this.readByte();
			}
	
	
			if (starterTagId != this.expectedStartingTag) {
				throw new Error("NbtParser.decode(): Bad starting tag for NBT data, expected 0x"+this.byteToHex(this.expectedStartingTag)+" but got 0x"+this.byteToHex(starterTagId)+".");
			}
			starterTagName = this.readString();
			
			returnData[starterTagName] = {
				"type": starterTagId,
				"payload": this.readTagData(starterTagId)
			};
			
			callback(returnData);
		}
		
		/**
		 * Returns a hex representation of a byte value
		 * 
		 * Intended for values from 0 to 255, but won't show an error for values higher, will merely return more than 2
		 * hex characters. Used in the thrown exceptions.
		 * 
		 * @param {Integer} The number to convert to hex
		 * 
		 * @return {String} Hex representation
		 */
		this.byteToHex = function(number) {
			if (number < 17) {
				return "0" + number.toString(16);
			}
			else {
				return number.toString(16);
			}
		}
		
		/**
		 * Get the tagData associated with the tag type
		 * 
		 * @param {Integer} The tag type of the data we will need to read
		 * 
		 * @return {Object} 
		 */
		this.readTagData = function(tagId) {
			switch (tagId) {
				case this.TAG_End:
					break;
				case this.TAG_Byte:
					return this.readTagData_byte();
					break;
				case this.TAG_Short:
					return this.readTagData_short();
					break;
				case this.TAG_Int:
					return this.readTagData_int();
					break;
				case this.TAG_Long:
					return this.readTagData_long();
					break;
				case this.TAG_Float:
					return this.readTagData_float();
					break;
				case this.TAG_Double:
					return this.readTagData_double();
					break;
				case this.TAG_Byte_Array:
					return this.readTagData_byteArray();
					break;
				case this.TAG_String:
					return this.readTagData_string();
					break;
				case this.TAG_List:
					return this.readTagData_list();
					break;
				case this.TAG_Compound:
					return this.readTagData_compound();
					break;
				case this.TAG_Int_Array:
					return this.readTagData_intArray();
					break;
				default:
					throw new Error("NbtParser.readTagData(): Unknown tag type 0x"+this.byteToHex(tagId)+" encountered. Current pointer position is "+this.pointer+" (0x"+this.pointer.toString(16)+").");
					break;
			}
		}
		
		this.readTagData_byte = function() {
			return this.readByte();
		}
		
		this.readTagData_short = function() {
			return this.readShort();
		}
		
		this.readTagData_int = function() {
			return this.readInt();
		}
		
		this.readTagData_long = function() {
			return this.readLong();
		}
		
		this.readTagData_float = function() {
			return this.readFloat();
		}
		
		this.readTagData_double = function() {
			return this.readDouble();
		}
		
		this.readTagData_string = function() {
			return this.readString();
		}
		
		this.readTagData_byteArray = function() {
			var byteLength = this.readInt();
			var byteString = this.readBuffer(byteLength*8);
			var byteArray = [];
	
			for (var i = 0; i < byteLength; i++) {
				byteArray.push(byteString.charCodeAt(i) & 0xff);
			}
	
			return byteArray;
		}
		
		this.readTagData_intArray = function() {
			var arrayLength = this.readInt();
			var intArray = [];
	
			for (var i = 0; i < arrayLength; i++) {
				intArray.push(this.readInt());
			}
	
			return byteArray;
		}
		
		this.readTagData_list = function() {
			var tagId = this.readByte();
			var length = this.readInt();
			var returnArray = new Array();
			
			for (var i = 0; i < length; i++) {
				returnArray.push(this.readTagData(tagId));
			}
			
			return {"ofType": tagId, "list": returnArray};
		}
		
		this.readTagData_compound = function() {
			var returnData = {};
			var tagId;
			var tagName;
			
			
			tagId = this.readByte();
			while (tagId != this.TAG_End) {
				tagName = this.readString();
				returnData[tagName] = {"type": tagId, "payload": this.readTagData(tagId)};
				tagId = this.readByte();
			}
			return returnData;
		}
	
		/**
		 * Takes a Javascript object and encodes it into NBT data 
		 * 
		 * @param	{String}	data							The object to encode, must be in expected structure
		 * @param	{Bool}		encloseInUnnamedCompoundTag		Whether or not to write the data as enclosed in a unnamed compound tag.
		 * 														It seems that Alpha level chunks do this.
		 * @return	{Bool}		gzipDeflate						Whether or not to compress it first
		 */
		this.encode = function(options) {
			var returnData = "";
			var starterTagId;
			var starterTagName;
			
			this.returnData = "";
			
			if (typeof options.encloseInUnnamedCompoundTag == "undefined")
				options.encloseInUnnamedCompoundTag = false;
			if (typeof options.gzipDeflate == "undefined")
				options.gzipDeflate = true;

			var data = options.data;
			var gzipDeflate = options.gzipDeflate;
			var encloseInUnnamedCompoundTag = options.encloseInUnnamedCompoundTag;
			
			var count = 0;
			for (starterTagName in data) {
				count++;
			}
			if (count > 1) {
				throw new Error("NbtParser.encode(): Too many elements in root node, expected 1 but found " + count + ".");
			}
			
			starterTagId = data[starterTagName].type;
			if (starterTagId != this.expectedStartingTag) {
				throw new Error("NbtParser.encode(): Bad starting tag for NBT data, expected 0x"+this.byteToHex(this.expectedStartingTag)+" but got 0x"+this.byteToHex(starterTagId)+".");
			}
			
			
			this.writeTagData_compound(data);
			
			/**
			 * Alpha chunks are enclosed in an unnamed compound tag 
			 */
			if (encloseInUnnamedCompoundTag) {
				this.returnData =
					"" + //Ensure it's a string
					this.writeByte(this.TAG_Compound) +
					this.writeShort(0) +
					this.returnData +
					this.writeByte(this.TAG_End);
			}

			
			
			if (gzipDeflate) {
				//TODO: gzip deflate the data
			}
			
			//console.log(hexDump(this.returnData));
			options.success(this.returnData);
		}
	
		/**
		 * Generate binary version of data for a tag
		 * 
		 * @param {Integer} tagId	The tag type of the data we will need to read
		 * @param {Object}	data	The data to process
		 * 
		 * @return {Object} 
		 */
		this.writeTagData = function(tagId, data) {
			switch (tagId) {
				case this.TAG_End:
					break;
				case this.TAG_Byte:
					this.writeTagData_byte(data);
					break;
				case this.TAG_Short:
					this.writeTagData_short(data);
					break;
				case this.TAG_Int:
					this.writeTagData_int(data);
					break;
				case this.TAG_Long:
					this.writeTagData_long(data);
					break;
				case this.TAG_Float:
					this.writeTagData_float(data);
					break;
				case this.TAG_Double:
					this.writeTagData_double(data);
					break;
				case this.TAG_Byte_Array:
					this.writeTagData_byteArray(data);
					break;
				case this.TAG_String:
					this.writeTagData_string(data);
					break;
				case this.TAG_List:
					this.writeTagData_list(data);
					break;
				case this.TAG_Compound:
					this.writeTagData_compound(data);
					break;
				case this.TAG_Int_Array:
					this.writeTagData_intArray(data);
					break;
				default:
					throw new Error("NbtParser.writeTagData(): Unknown tag type 0x"+this.byteToHex(tagId)+" encountered.");
					break;
			}
		}
		
		this.writeTagData_byte = function(number) {
			this.returnData += this.writeByte(number);
		}
		
		this.writeTagData_short = function(number) {
			this.returnData += this.writeShort(number);
		}
		
		this.writeTagData_int = function(number) {
			this.returnData += this.writeInt(number);
		}
		
		this.writeTagData_long = function(number) {
			this.returnData += this.writeLong(number);
		}
		
		this.writeTagData_float = function(number) {
			this.returnData += this.writeFloat(number);
		}
		
		this.writeTagData_double = function(number) {
			this.returnData += this.writeDouble(number);
		}
		

		this.writeTagData_byteArray = function(byteArray) {
			this.returnData += this.writeInt(byteArray.length);
			for (var i=0; i < byteArray.length;	i++) {
				this.returnData += String.fromCharCode(byteArray[i]);
			};
		}
		
		this.writeTagData_intArray = function(intArray) {
			this.returnData += this.writeInt(intArray.length);
			for (var i=0; i < intArray.length;	i++) {
				this.returnData +=  this.writeInt(intArray[i]);
			};
		}
		
		this.writeTagData_string = function(string) {
			this.returnData += this.writeString(string);
		}
		
		this.writeTagData_list = function(data) {
			var ofTagId = data.ofType;
			var length = data.list.length;

			this.returnData += this.writeByte(ofTagId) + this.writeInt(length);

			for (var i=0; i<length; i++) {
				this.writeTagData(ofTagId, data.list[i]);
			}
		}
		
		this.writeTagData_compound = function(data) {
			for (var tagName in data) {
					//if (data[tagName].type == 7) continue;
					var before = this.returnData.length;
					this.returnData += this.writeByte(data[tagName].type);
					this.returnData += this.writeString(tagName);
					this.writeTagData(data[tagName].type, data[tagName].payload);
					//console.log("tag: %s, name: %s(%s), before: %s, after: %s, difference: %s, difference (excluding tag type and name): %s", data[tagName].type, tagName, tagName.length, before, this.returnData.length, this.returnData.length - before, this.returnData.length - before - 3 - tagName.length);
			}
			this.returnData += this.writeByte(this.TAG_End);
		}
	}

	com.mordritch.mcSim.NbtParser = NbtParser;
})();; 
(function(){
	var namespace = window.com.mordritch.mcSim;
	/*
	 * Homepage: http://www.onicos.com/staff/iz/amuse/javascript/expert/
	 * http://www.onicos.com/staff/iz/amuse/javascript/expert/deflate.txt
	 */
	
	/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
	 * Version: 1.0.1
	 * LastModified: Dec 25 1999
	 */
	
	/* Interface:
	 * data = zip_deflate(src);
	 */
	
	/* constant parameters */
	var zip_WSIZE = 32768;		// Sliding Window size
	var zip_STORED_BLOCK = 0;
	var zip_STATIC_TREES = 1;
	var zip_DYN_TREES    = 2;
	
	/* for deflate */
	var zip_DEFAULT_LEVEL = 6;
	var zip_FULL_SEARCH = true;
	var zip_INBUFSIZ = 32768;	// Input buffer size
	var zip_INBUF_EXTRA = 64;	// Extra buffer
	var zip_OUTBUFSIZ = 1024 * 8;
	var zip_window_size = 2 * zip_WSIZE;
	var zip_MIN_MATCH = 3;
	var zip_MAX_MATCH = 258;
	var zip_BITS = 16;
	// for SMALL_MEM
	var zip_LIT_BUFSIZE = 0x2000;
	var zip_HASH_BITS = 13;
	// for MEDIUM_MEM
	// var zip_LIT_BUFSIZE = 0x4000;
	// var zip_HASH_BITS = 14;
	// for BIG_MEM
	// var zip_LIT_BUFSIZE = 0x8000;
	// var zip_HASH_BITS = 15;
	if(zip_LIT_BUFSIZE > zip_INBUFSIZ)
	    alert("error: zip_INBUFSIZ is too small");
	if((zip_WSIZE<<1) > (1<<zip_BITS))
	    alert("error: zip_WSIZE is too large");
	if(zip_HASH_BITS > zip_BITS-1)
	    alert("error: zip_HASH_BITS is too large");
	if(zip_HASH_BITS < 8 || zip_MAX_MATCH != 258)
	    alert("error: Code too clever");
	var zip_DIST_BUFSIZE = zip_LIT_BUFSIZE;
	var zip_HASH_SIZE = 1 << zip_HASH_BITS;
	var zip_HASH_MASK = zip_HASH_SIZE - 1;
	var zip_WMASK = zip_WSIZE - 1;
	var zip_NIL = 0; // Tail of hash chains
	var zip_TOO_FAR = 4096;
	var zip_MIN_LOOKAHEAD = zip_MAX_MATCH + zip_MIN_MATCH + 1;
	var zip_MAX_DIST = zip_WSIZE - zip_MIN_LOOKAHEAD;
	var zip_SMALLEST = 1;
	var zip_MAX_BITS = 15;
	var zip_MAX_BL_BITS = 7;
	var zip_LENGTH_CODES = 29;
	var zip_LITERALS =256;
	var zip_END_BLOCK = 256;
	var zip_L_CODES = zip_LITERALS + 1 + zip_LENGTH_CODES;
	var zip_D_CODES = 30;
	var zip_BL_CODES = 19;
	var zip_REP_3_6 = 16;
	var zip_REPZ_3_10 = 17;
	var zip_REPZ_11_138 = 18;
	var zip_HEAP_SIZE = 2 * zip_L_CODES + 1;
	var zip_H_SHIFT = parseInt((zip_HASH_BITS + zip_MIN_MATCH - 1) /
				   zip_MIN_MATCH);
	
	/* variables */
	var zip_free_queue;
	var zip_qhead, zip_qtail;
	var zip_initflag;
	var zip_outbuf = null;
	var zip_outcnt, zip_outoff;
	var zip_complete;
	var zip_window;
	var zip_d_buf;
	var zip_l_buf;
	var zip_prev;
	var zip_bi_buf;
	var zip_bi_valid;
	var zip_block_start;
	var zip_ins_h;
	var zip_hash_head;
	var zip_prev_match;
	var zip_match_available;
	var zip_match_length;
	var zip_prev_length;
	var zip_strstart;
	var zip_match_start;
	var zip_eofile;
	var zip_lookahead;
	var zip_max_chain_length;
	var zip_max_lazy_match;
	var zip_compr_level;
	var zip_good_match;
	var zip_nice_match;
	var zip_dyn_ltree;
	var zip_dyn_dtree;
	var zip_static_ltree;
	var zip_static_dtree;
	var zip_bl_tree;
	var zip_l_desc;
	var zip_d_desc;
	var zip_bl_desc;
	var zip_bl_count;
	var zip_heap;
	var zip_heap_len;
	var zip_heap_max;
	var zip_depth;
	var zip_length_code;
	var zip_dist_code;
	var zip_base_length;
	var zip_base_dist;
	var zip_flag_buf;
	var zip_last_lit;
	var zip_last_dist;
	var zip_last_flags;
	var zip_flags;
	var zip_flag_bit;
	var zip_opt_len;
	var zip_static_len;
	var zip_deflate_data;
	var zip_deflate_pos;
	
	/* constant tables */
	var zip_extra_lbits = new Array(
	    0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0);
	var zip_extra_dbits = new Array(
	    0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13);
	var zip_extra_blbits = new Array(
	    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7);
	var zip_bl_order = new Array(
	    16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15);
	var zip_configuration_table = new Array(
		new zip_DeflateConfiguration(0,    0,   0,    0),
		new zip_DeflateConfiguration(4,    4,   8,    4),
		new zip_DeflateConfiguration(4,    5,  16,    8),
		new zip_DeflateConfiguration(4,    6,  32,   32),
		new zip_DeflateConfiguration(4,    4,  16,   16),
		new zip_DeflateConfiguration(8,   16,  32,   32),
		new zip_DeflateConfiguration(8,   16, 128,  128),
		new zip_DeflateConfiguration(8,   32, 128,  256),
		new zip_DeflateConfiguration(32, 128, 258, 1024),
		new zip_DeflateConfiguration(32, 258, 258, 4096));
	
	/* objects (deflate) */
	
	function zip_DeflateCT() {
	    this.fc = 0; // frequency count or bit string
	    this.dl = 0; // father node in Huffman tree or length of bit string
	}
	
	function zip_DeflateTreeDesc() {
	    this.dyn_tree = null;	// the dynamic tree
	    this.static_tree = null;	// corresponding static tree or NULL
	    this.extra_bits = null;	// extra bits for each code or NULL
	    this.extra_base = 0;	// base index for extra_bits
	    this.elems = 0;		// max number of elements in the tree
	    this.max_length = 0;	// max bit length for the codes
	    this.max_code = 0;		// largest code with non zero frequency
	}
	
	/* Values for max_lazy_match, good_match and max_chain_length, depending on
	 * the desired pack level (0..9). The values given below have been tuned to
	 * exclude worst case performance for pathological files. Better values may be
	 * found for specific files.
	 */
	function zip_DeflateConfiguration(a, b, c, d) {
	    this.good_length = a; // reduce lazy search above this match length
	    this.max_lazy = b;    // do not perform lazy search above this match length
	    this.nice_length = c; // quit search above this match length
	    this.max_chain = d;
	}
	
	function zip_DeflateBuffer() {
	    this.next = null;
	    this.len = 0;
	    this.ptr = new Array(zip_OUTBUFSIZ);
	    this.off = 0;
	}
	
	/* routines (deflate) */
	
	function zip_deflate_start(level) {
	    var i;
	
	    if(!level)
		level = zip_DEFAULT_LEVEL;
	    else if(level < 1)
		level = 1;
	    else if(level > 9)
		level = 9;
	
	    zip_compr_level = level;
	    zip_initflag = false;
	    zip_eofile = false;
	    if(zip_outbuf != null)
		return;
	
	    zip_free_queue = zip_qhead = zip_qtail = null;
	    zip_outbuf = new Array(zip_OUTBUFSIZ);
	    zip_window = new Array(zip_window_size);
	    zip_d_buf = new Array(zip_DIST_BUFSIZE);
	    zip_l_buf = new Array(zip_INBUFSIZ + zip_INBUF_EXTRA);
	    zip_prev = new Array(1 << zip_BITS);
	    zip_dyn_ltree = new Array(zip_HEAP_SIZE);
	    for(i = 0; i < zip_HEAP_SIZE; i++)
		zip_dyn_ltree[i] = new zip_DeflateCT();
	    zip_dyn_dtree = new Array(2*zip_D_CODES+1);
	    for(i = 0; i < 2*zip_D_CODES+1; i++)
		zip_dyn_dtree[i] = new zip_DeflateCT();
	    zip_static_ltree = new Array(zip_L_CODES+2);
	    for(i = 0; i < zip_L_CODES+2; i++)
		zip_static_ltree[i] = new zip_DeflateCT();
	    zip_static_dtree = new Array(zip_D_CODES);
	    for(i = 0; i < zip_D_CODES; i++)
		zip_static_dtree[i] = new zip_DeflateCT();
	    zip_bl_tree = new Array(2*zip_BL_CODES+1);
	    for(i = 0; i < 2*zip_BL_CODES+1; i++)
		zip_bl_tree[i] = new zip_DeflateCT();
	    zip_l_desc = new zip_DeflateTreeDesc();
	    zip_d_desc = new zip_DeflateTreeDesc();
	    zip_bl_desc = new zip_DeflateTreeDesc();
	    zip_bl_count = new Array(zip_MAX_BITS+1);
	    zip_heap = new Array(2*zip_L_CODES+1);
	    zip_depth = new Array(2*zip_L_CODES+1);
	    zip_length_code = new Array(zip_MAX_MATCH-zip_MIN_MATCH+1);
	    zip_dist_code = new Array(512);
	    zip_base_length = new Array(zip_LENGTH_CODES);
	    zip_base_dist = new Array(zip_D_CODES);
	    zip_flag_buf = new Array(parseInt(zip_LIT_BUFSIZE / 8));
	}
	
	function zip_deflate_end() {
	    zip_free_queue = zip_qhead = zip_qtail = null;
	    zip_outbuf = null;
	    zip_window = null;
	    zip_d_buf = null;
	    zip_l_buf = null;
	    zip_prev = null;
	    zip_dyn_ltree = null;
	    zip_dyn_dtree = null;
	    zip_static_ltree = null;
	    zip_static_dtree = null;
	    zip_bl_tree = null;
	    zip_l_desc = null;
	    zip_d_desc = null;
	    zip_bl_desc = null;
	    zip_bl_count = null;
	    zip_heap = null;
	    zip_depth = null;
	    zip_length_code = null;
	    zip_dist_code = null;
	    zip_base_length = null;
	    zip_base_dist = null;
	    zip_flag_buf = null;
	}
	
	function zip_reuse_queue(p) {
	    p.next = zip_free_queue;
	    zip_free_queue = p;
	}
	
	function zip_new_queue() {
	    var p;
	
	    if(zip_free_queue != null)
	    {
		p = zip_free_queue;
		zip_free_queue = zip_free_queue.next;
	    }
	    else
		p = new zip_DeflateBuffer();
	    p.next = null;
	    p.len = p.off = 0;
	
	    return p;
	}
	
	function zip_head1(i) {
	    return zip_prev[zip_WSIZE + i];
	}
	
	function zip_head2(i, val) {
	    return zip_prev[zip_WSIZE + i] = val;
	}
	
	/* put_byte is used for the compressed output, put_ubyte for the
	 * uncompressed output. However unlzw() uses window for its
	 * suffix table instead of its output buffer, so it does not use put_ubyte
	 * (to be cleaned up).
	 */
	function zip_put_byte(c) {
	    zip_outbuf[zip_outoff + zip_outcnt++] = c;
	    if(zip_outoff + zip_outcnt == zip_OUTBUFSIZ)
		zip_qoutbuf();
	}
	
	/* Output a 16 bit value, lsb first */
	function zip_put_short(w) {
	    w &= 0xffff;
	    if(zip_outoff + zip_outcnt < zip_OUTBUFSIZ - 2) {
		zip_outbuf[zip_outoff + zip_outcnt++] = (w & 0xff);
		zip_outbuf[zip_outoff + zip_outcnt++] = (w >>> 8);
	    } else {
		zip_put_byte(w & 0xff);
		zip_put_byte(w >>> 8);
	    }
	}
	
	/* ==========================================================================
	 * Insert string s in the dictionary and set match_head to the previous head
	 * of the hash chain (the most recent string with same hash key). Return
	 * the previous length of the hash chain.
	 * IN  assertion: all calls to to INSERT_STRING are made with consecutive
	 *    input characters and the first MIN_MATCH bytes of s are valid
	 *    (except for the last MIN_MATCH-1 bytes of the input file).
	 */
	function zip_INSERT_STRING() {
	    zip_ins_h = ((zip_ins_h << zip_H_SHIFT)
			 ^ (zip_window[zip_strstart + zip_MIN_MATCH - 1] & 0xff))
		& zip_HASH_MASK;
	    zip_hash_head = zip_head1(zip_ins_h);
	    zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;
	    zip_head2(zip_ins_h, zip_strstart);
	}
	
	/* Send a code of the given tree. c and tree must not have side effects */
	function zip_SEND_CODE(c, tree) {
	    zip_send_bits(tree[c].fc, tree[c].dl);
	}
	
	/* Mapping from a distance to a distance code. dist is the distance - 1 and
	 * must not have side effects. dist_code[256] and dist_code[257] are never
	 * used.
	 */
	function zip_D_CODE(dist) {
	    return (dist < 256 ? zip_dist_code[dist]
		    : zip_dist_code[256 + (dist>>7)]) & 0xff;
	}
	
	/* ==========================================================================
	 * Compares to subtrees, using the tree depth as tie breaker when
	 * the subtrees have equal frequency. This minimizes the worst case length.
	 */
	function zip_SMALLER(tree, n, m) {
	    return tree[n].fc < tree[m].fc ||
	      (tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m]);
	}
	
	/* ==========================================================================
	 * read string data
	 */
	
	
	function zip_read_buff(buff, offset, n) {
	    var i;
	    for(i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i++) {
			buff[offset + i] = zip_deflate_data.charCodeAt(zip_deflate_pos++) & 0xff;
			async_crc32 = (async_crc32 >>> 8) ^ crc32_table[(async_crc32 ^ buff[offset + i]) & 0xff]; //added for asynchronous work. (J. Lydall / Mordritch)
	    }
	    return i;
	}
	
	/* ==========================================================================
	 * Initialize the "longest match" routines for a new file
	 */
	function zip_lm_init() {
	    var j;
	
	    /* Initialize the hash table. */
	    for(j = 0; j < zip_HASH_SIZE; j++)
	//	zip_head2(j, zip_NIL);
		zip_prev[zip_WSIZE + j] = 0;
	    /* prev will be initialized on the fly */
	
	    /* Set the default configuration parameters:
	     */
	    zip_max_lazy_match = zip_configuration_table[zip_compr_level].max_lazy;
	    zip_good_match     = zip_configuration_table[zip_compr_level].good_length;
	    if(!zip_FULL_SEARCH)
		zip_nice_match = zip_configuration_table[zip_compr_level].nice_length;
	    zip_max_chain_length = zip_configuration_table[zip_compr_level].max_chain;
	
	    zip_strstart = 0;
	    zip_block_start = 0;
	
	    zip_lookahead = zip_read_buff(zip_window, 0, 2 * zip_WSIZE);
	    if(zip_lookahead <= 0) {
		zip_eofile = true;
		zip_lookahead = 0;
		return;
	    }
	    zip_eofile = false;
	    /* Make sure that we always have enough lookahead. This is important
	     * if input comes from a device such as a tty.
	     */
	    while(zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
		zip_fill_window();
	
	    /* If lookahead < MIN_MATCH, ins_h is garbage, but this is
	     * not important since only literal bytes will be emitted.
	     */
	    zip_ins_h = 0;
	    for(j = 0; j < zip_MIN_MATCH - 1; j++) {
	//      UPDATE_HASH(ins_h, window[j]);
		zip_ins_h = ((zip_ins_h << zip_H_SHIFT) ^ (zip_window[j] & 0xff)) & zip_HASH_MASK;
	    }
	}
	
	/* ==========================================================================
	 * Set match_start to the longest match starting at the given string and
	 * return its length. Matches shorter or equal to prev_length are discarded,
	 * in which case the result is equal to prev_length and match_start is
	 * garbage.
	 * IN assertions: cur_match is the head of the hash chain for the current
	 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
	 */
	function zip_longest_match(cur_match) {
	    var chain_length = zip_max_chain_length; // max hash chain length
	    var scanp = zip_strstart; // current string
	    var matchp;		// matched string
	    var len;		// length of current match
	    var best_len = zip_prev_length;	// best match length so far
	
	    /* Stop when cur_match becomes <= limit. To simplify the code,
	     * we prevent matches with the string of window index 0.
	     */
	    var limit = (zip_strstart > zip_MAX_DIST ? zip_strstart - zip_MAX_DIST : zip_NIL);
	
	    var strendp = zip_strstart + zip_MAX_MATCH;
	    var scan_end1 = zip_window[scanp + best_len - 1];
	    var scan_end  = zip_window[scanp + best_len];
	
	    /* Do not waste too much time if we already have a good match: */
	    if(zip_prev_length >= zip_good_match)
		chain_length >>= 2;
	
	//  Assert(encoder->strstart <= window_size-MIN_LOOKAHEAD, "insufficient lookahead");
	
	    do {
	//    Assert(cur_match < encoder->strstart, "no future");
		matchp = cur_match;
	
		/* Skip to next match if the match length cannot increase
		    * or if the match length is less than 2:
		*/
		if(zip_window[matchp + best_len]	!= scan_end  ||
		   zip_window[matchp + best_len - 1]	!= scan_end1 ||
		   zip_window[matchp]			!= zip_window[scanp] ||
		   zip_window[++matchp]			!= zip_window[scanp + 1]) {
		    continue;
		}
	
		/* The check at best_len-1 can be removed because it will be made
	         * again later. (This heuristic is not always a win.)
	         * It is not necessary to compare scan[2] and match[2] since they
	         * are always equal when the other bytes match, given that
	         * the hash keys are equal and that HASH_BITS >= 8.
	         */
		scanp += 2;
		matchp++;
	
		/* We check for insufficient lookahead only every 8th comparison;
	         * the 256th check will be made at strstart+258.
	         */
		do {
		} while(zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			zip_window[++scanp] == zip_window[++matchp] &&
			scanp < strendp);
	
	      len = zip_MAX_MATCH - (strendp - scanp);
	      scanp = strendp - zip_MAX_MATCH;
	
	      if(len > best_len) {
		  zip_match_start = cur_match;
		  best_len = len;
		  if(zip_FULL_SEARCH) {
		      if(len >= zip_MAX_MATCH) break;
		  } else {
		      if(len >= zip_nice_match) break;
		  }
	
		  scan_end1  = zip_window[scanp + best_len-1];
		  scan_end   = zip_window[scanp + best_len];
	      }
	    } while((cur_match = zip_prev[cur_match & zip_WMASK]) > limit
		    && --chain_length != 0);
	
	    return best_len;
	}
	
	/* ==========================================================================
	 * Fill the window when the lookahead becomes insufficient.
	 * Updates strstart and lookahead, and sets eofile if end of input file.
	 * IN assertion: lookahead < MIN_LOOKAHEAD && strstart + lookahead > 0
	 * OUT assertions: at least one byte has been read, or eofile is set;
	 *    file reads are performed for at least two bytes (required for the
	 *    translate_eol option).
	 */
	function zip_fill_window() {
	    var n, m;
	
	    // Amount of free space at the end of the window.
	    var more = zip_window_size - zip_lookahead - zip_strstart;
	
	    /* If the window is almost full and there is insufficient lookahead,
	     * move the upper half to the lower one to make room in the upper half.
	     */
	    if(more == -1) {
		/* Very unlikely, but possible on 16 bit machine if strstart == 0
	         * and lookahead == 1 (input done one byte at time)
	         */
		more--;
	    } else if(zip_strstart >= zip_WSIZE + zip_MAX_DIST) {
		/* By the IN assertion, the window is not empty so we can't confuse
	         * more == 0 with more == 64K on a 16 bit machine.
	         */
	//	Assert(window_size == (ulg)2*WSIZE, "no sliding with BIG_MEM");
	
	//	System.arraycopy(window, WSIZE, window, 0, WSIZE);
		for(n = 0; n < zip_WSIZE; n++)
		    zip_window[n] = zip_window[n + zip_WSIZE];
	      
		zip_match_start -= zip_WSIZE;
		zip_strstart    -= zip_WSIZE; /* we now have strstart >= MAX_DIST: */
		zip_block_start -= zip_WSIZE;
	
		for(n = 0; n < zip_HASH_SIZE; n++) {
		    m = zip_head1(n);
		    zip_head2(n, m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL);
		}
		for(n = 0; n < zip_WSIZE; n++) {
		    /* If n is not on any hash chain, prev[n] is garbage but
		     * its value will never be used.
		     */
		    m = zip_prev[n];
		    zip_prev[n] = (m >= zip_WSIZE ? m - zip_WSIZE : zip_NIL);
		}
		more += zip_WSIZE;
	    }
	    // At this point, more >= 2
	    if(!zip_eofile) {
		n = zip_read_buff(zip_window, zip_strstart + zip_lookahead, more);
		if(n <= 0)
		    zip_eofile = true;
		else
		    zip_lookahead += n;
	    }
	}
	
	/* ==========================================================================
	 * Processes a new input file and return its compressed length. This
	 * function does not perform lazy evaluationof matches and inserts
	 * new strings in the dictionary only for unmatched strings or for short
	 * matches. It is used only for the fast compression options.
	 */
	function zip_deflate_fast() {
	    while(zip_lookahead != 0 && zip_qhead == null) {
		var flush; // set if current block must be flushed
	
		/* Insert the string window[strstart .. strstart+2] in the
		 * dictionary, and set hash_head to the head of the hash chain:
		 */
		zip_INSERT_STRING();
	
		/* Find the longest match, discarding those <= prev_length.
		 * At this point we have always match_length < MIN_MATCH
		 */
		if(zip_hash_head != zip_NIL &&
		   zip_strstart - zip_hash_head <= zip_MAX_DIST) {
		    /* To simplify the code, we prevent matches with the string
		     * of window index 0 (in particular we have to avoid a match
		     * of the string with itself at the start of the input file).
		     */
		    zip_match_length = zip_longest_match(zip_hash_head);
		    /* longest_match() sets match_start */
		    if(zip_match_length > zip_lookahead)
			zip_match_length = zip_lookahead;
		}
		if(zip_match_length >= zip_MIN_MATCH) {
	//	    check_match(strstart, match_start, match_length);
	
		    flush = zip_ct_tally(zip_strstart - zip_match_start,
					 zip_match_length - zip_MIN_MATCH);
		    zip_lookahead -= zip_match_length;
	
		    /* Insert new strings in the hash table only if the match length
		     * is not too large. This saves time but degrades compression.
		     */
		    if(zip_match_length <= zip_max_lazy_match) {
			zip_match_length--; // string at strstart already in hash table
			do {
			    zip_strstart++;
			    zip_INSERT_STRING();
			    /* strstart never exceeds WSIZE-MAX_MATCH, so there are
			     * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
			     * these bytes are garbage, but it does not matter since
			     * the next lookahead bytes will be emitted as literals.
			     */
			} while(--zip_match_length != 0);
			zip_strstart++;
		    } else {
			zip_strstart += zip_match_length;
			zip_match_length = 0;
			zip_ins_h = zip_window[zip_strstart] & 0xff;
	//		UPDATE_HASH(ins_h, window[strstart + 1]);
			zip_ins_h = ((zip_ins_h<<zip_H_SHIFT) ^ (zip_window[zip_strstart + 1] & 0xff)) & zip_HASH_MASK;
	
	//#if MIN_MATCH != 3
	//		Call UPDATE_HASH() MIN_MATCH-3 more times
	//#endif
	
		    }
		} else {
		    /* No match, output a literal byte */
		    flush = zip_ct_tally(0, zip_window[zip_strstart] & 0xff);
		    zip_lookahead--;
		    zip_strstart++;
		}
		if(flush) {
		    zip_flush_block(0);
		    zip_block_start = zip_strstart;
		}
	
		/* Make sure that we always have enough lookahead, except
		 * at the end of the input file. We need MAX_MATCH bytes
		 * for the next match, plus MIN_MATCH bytes to insert the
		 * string following the next match.
		 */
		while(zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
		    zip_fill_window();
	    }
	}
	
	function zip_deflate_better() {
	    /* Process the input block. */
	    while(zip_lookahead != 0 && zip_qhead == null) {
		/* Insert the string window[strstart .. strstart+2] in the
		 * dictionary, and set hash_head to the head of the hash chain:
		 */
		zip_INSERT_STRING();
	
		/* Find the longest match, discarding those <= prev_length.
		 */
		zip_prev_length = zip_match_length;
		zip_prev_match = zip_match_start;
		zip_match_length = zip_MIN_MATCH - 1;
	
		if(zip_hash_head != zip_NIL &&
		   zip_prev_length < zip_max_lazy_match &&
		   zip_strstart - zip_hash_head <= zip_MAX_DIST) {
		    /* To simplify the code, we prevent matches with the string
		     * of window index 0 (in particular we have to avoid a match
		     * of the string with itself at the start of the input file).
		     */
		    zip_match_length = zip_longest_match(zip_hash_head);
		    /* longest_match() sets match_start */
		    if(zip_match_length > zip_lookahead)
			zip_match_length = zip_lookahead;
	
		    /* Ignore a length 3 match if it is too distant: */
		    if(zip_match_length == zip_MIN_MATCH &&
		       zip_strstart - zip_match_start > zip_TOO_FAR) {
			/* If prev_match is also MIN_MATCH, match_start is garbage
			 * but we will ignore the current match anyway.
			 */
			zip_match_length--;
		    }
		}
		/* If there was a match at the previous step and the current
		 * match is not better, output the previous match:
		 */
		if(zip_prev_length >= zip_MIN_MATCH &&
		   zip_match_length <= zip_prev_length) {
		    var flush; // set if current block must be flushed
	
	//	    check_match(strstart - 1, prev_match, prev_length);
		    flush = zip_ct_tally(zip_strstart - 1 - zip_prev_match,
					 zip_prev_length - zip_MIN_MATCH);
	
		    /* Insert in hash table all strings up to the end of the match.
		     * strstart-1 and strstart are already inserted.
		     */
		    zip_lookahead -= zip_prev_length - 1;
		    zip_prev_length -= 2;
		    do {
			zip_strstart++;
			zip_INSERT_STRING();
			/* strstart never exceeds WSIZE-MAX_MATCH, so there are
			 * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
			 * these bytes are garbage, but it does not matter since the
			 * next lookahead bytes will always be emitted as literals.
			 */
		    } while(--zip_prev_length != 0);
		    zip_match_available = 0;
		    zip_match_length = zip_MIN_MATCH - 1;
		    zip_strstart++;
		    if(flush) {
			zip_flush_block(0);
			zip_block_start = zip_strstart;
		    }
		} else if(zip_match_available != 0) {
		    /* If there was no match at the previous position, output a
		     * single literal. If there was a match but the current match
		     * is longer, truncate the previous match to a single literal.
		     */
		    if(zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff)) {
			zip_flush_block(0);
			zip_block_start = zip_strstart;
		    }
		    zip_strstart++;
		    zip_lookahead--;
		} else {
		    /* There is no previous match to compare with, wait for
		     * the next step to decide.
		     */
		    zip_match_available = 1;
		    zip_strstart++;
		    zip_lookahead--;
		}
	
		/* Make sure that we always have enough lookahead, except
		 * at the end of the input file. We need MAX_MATCH bytes
		 * for the next match, plus MIN_MATCH bytes to insert the
		 * string following the next match.
		 */
		while(zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
		    zip_fill_window();
	    }
	}
	
	function zip_init_deflate() {
	    if(zip_eofile)
		return;
	    zip_bi_buf = 0;
	    zip_bi_valid = 0;
	    zip_ct_init();
	    zip_lm_init();
	
	    zip_qhead = null;
	    zip_outcnt = 0;
	    zip_outoff = 0;
	
	    if(zip_compr_level <= 3)
	    {
		zip_prev_length = zip_MIN_MATCH - 1;
		zip_match_length = 0;
	    }
	    else
	    {
		zip_match_length = zip_MIN_MATCH - 1;
		zip_match_available = 0;
	    }
	
	    zip_complete = false;
	}
	
	/* ==========================================================================
	 * Same as above, but achieves better compression. We use a lazy
	 * evaluation for matches: a match is finally adopted only if there is
	 * no better match at the next window position.
	 */
	function zip_deflate_internal(buff, off, buff_size) {
	    var n;
	
	    if(!zip_initflag)
	    {
			zip_init_deflate();
			zip_initflag = true;
			if(zip_lookahead == 0) { // empty
			    zip_complete = true;
			    return 0;
			}
	    }
	
	    if((n = zip_qcopy(buff, off, buff_size)) == buff_size)
			return buff_size;
	
	    if(zip_complete)
			return n;
	
	    if(zip_compr_level <= 3) // optimized for speed
			zip_deflate_fast();
	    else
			zip_deflate_better();

	    if(zip_lookahead == 0) {
			if(zip_match_available != 0)
			    zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff);
			zip_flush_block(1);
			zip_complete = true;
	    }
	    return n + zip_qcopy(buff, n + off, buff_size - n);
	}
	
	function zip_qcopy(buff, off, buff_size) {
	    var n, i, j;
	
	    n = 0;
	    while(zip_qhead != null && n < buff_size)
	    {
		i = buff_size - n;
		if(i > zip_qhead.len)
		    i = zip_qhead.len;
	//      System.arraycopy(qhead.ptr, qhead.off, buff, off + n, i);
		for(j = 0; j < i; j++)
		    buff[off + n + j] = zip_qhead.ptr[zip_qhead.off + j];
		
		zip_qhead.off += i;
		zip_qhead.len -= i;
		n += i;
		if(zip_qhead.len == 0) {
		    var p;
		    p = zip_qhead;
		    zip_qhead = zip_qhead.next;
		    zip_reuse_queue(p);
		}
	    }
	
	    if(n == buff_size)
		return n;
	
	    if(zip_outoff < zip_outcnt) {
		i = buff_size - n;
		if(i > zip_outcnt - zip_outoff)
		    i = zip_outcnt - zip_outoff;
		// System.arraycopy(outbuf, outoff, buff, off + n, i);
		for(j = 0; j < i; j++)
		    buff[off + n + j] = zip_outbuf[zip_outoff + j];
		zip_outoff += i;
		n += i;
		if(zip_outcnt == zip_outoff)
		    zip_outcnt = zip_outoff = 0;
	    }
	    return n;
	}
	
	/* ==========================================================================
	 * Allocate the match buffer, initialize the various tables and save the
	 * location of the internal file attribute (ascii/binary) and method
	 * (DEFLATE/STORE).
	 */
	function zip_ct_init() {
	    var n;	// iterates over tree elements
	    var bits;	// bit counter
	    var length;	// length value
	    var code;	// code value
	    var dist;	// distance index
	
	    if(zip_static_dtree[0].dl != 0) return; // ct_init already called
	
	    zip_l_desc.dyn_tree		= zip_dyn_ltree;
	    zip_l_desc.static_tree	= zip_static_ltree;
	    zip_l_desc.extra_bits	= zip_extra_lbits;
	    zip_l_desc.extra_base	= zip_LITERALS + 1;
	    zip_l_desc.elems		= zip_L_CODES;
	    zip_l_desc.max_length	= zip_MAX_BITS;
	    zip_l_desc.max_code		= 0;
	
	    zip_d_desc.dyn_tree		= zip_dyn_dtree;
	    zip_d_desc.static_tree	= zip_static_dtree;
	    zip_d_desc.extra_bits	= zip_extra_dbits;
	    zip_d_desc.extra_base	= 0;
	    zip_d_desc.elems		= zip_D_CODES;
	    zip_d_desc.max_length	= zip_MAX_BITS;
	    zip_d_desc.max_code		= 0;
	
	    zip_bl_desc.dyn_tree	= zip_bl_tree;
	    zip_bl_desc.static_tree	= null;
	    zip_bl_desc.extra_bits	= zip_extra_blbits;
	    zip_bl_desc.extra_base	= 0;
	    zip_bl_desc.elems		= zip_BL_CODES;
	    zip_bl_desc.max_length	= zip_MAX_BL_BITS;
	    zip_bl_desc.max_code	= 0;
	
	    // Initialize the mapping length (0..255) -> length code (0..28)
	    length = 0;
	    for(code = 0; code < zip_LENGTH_CODES-1; code++) {
		zip_base_length[code] = length;
		for(n = 0; n < (1<<zip_extra_lbits[code]); n++)
		    zip_length_code[length++] = code;
	    }
	    // Assert (length == 256, "ct_init: length != 256");
	
	    /* Note that the length 255 (match length 258) can be represented
	     * in two different ways: code 284 + 5 bits or code 285, so we
	     * overwrite length_code[255] to use the best encoding:
	     */
	    zip_length_code[length-1] = code;
	
	    /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
	    dist = 0;
	    for(code = 0 ; code < 16; code++) {
		zip_base_dist[code] = dist;
		for(n = 0; n < (1<<zip_extra_dbits[code]); n++) {
		    zip_dist_code[dist++] = code;
		}
	    }
	    // Assert (dist == 256, "ct_init: dist != 256");
	    dist >>= 7; // from now on, all distances are divided by 128
	    for( ; code < zip_D_CODES; code++) {
		zip_base_dist[code] = dist << 7;
		for(n = 0; n < (1<<(zip_extra_dbits[code]-7)); n++)
		    zip_dist_code[256 + dist++] = code;
	    }
	    // Assert (dist == 256, "ct_init: 256+dist != 512");
	
	    // Construct the codes of the static literal tree
	    for(bits = 0; bits <= zip_MAX_BITS; bits++)
		zip_bl_count[bits] = 0;
	    n = 0;
	    while(n <= 143) { zip_static_ltree[n++].dl = 8; zip_bl_count[8]++; }
	    while(n <= 255) { zip_static_ltree[n++].dl = 9; zip_bl_count[9]++; }
	    while(n <= 279) { zip_static_ltree[n++].dl = 7; zip_bl_count[7]++; }
	    while(n <= 287) { zip_static_ltree[n++].dl = 8; zip_bl_count[8]++; }
	    /* Codes 286 and 287 do not exist, but we must include them in the
	     * tree construction to get a canonical Huffman tree (longest code
	     * all ones)
	     */
	    zip_gen_codes(zip_static_ltree, zip_L_CODES + 1);
	
	    /* The static distance tree is trivial: */
	    for(n = 0; n < zip_D_CODES; n++) {
		zip_static_dtree[n].dl = 5;
		zip_static_dtree[n].fc = zip_bi_reverse(n, 5);
	    }
	
	    // Initialize the first block of the first file:
	    zip_init_block();
	}
	
	/* ==========================================================================
	 * Initialize a new block.
	 */
	function zip_init_block() {
	    var n; // iterates over tree elements
	
	    // Initialize the trees.
	    for(n = 0; n < zip_L_CODES;  n++) zip_dyn_ltree[n].fc = 0;
	    for(n = 0; n < zip_D_CODES;  n++) zip_dyn_dtree[n].fc = 0;
	    for(n = 0; n < zip_BL_CODES; n++) zip_bl_tree[n].fc = 0;
	
	    zip_dyn_ltree[zip_END_BLOCK].fc = 1;
	    zip_opt_len = zip_static_len = 0;
	    zip_last_lit = zip_last_dist = zip_last_flags = 0;
	    zip_flags = 0;
	    zip_flag_bit = 1;
	}
	
	/* ==========================================================================
	 * Restore the heap property by moving down the tree starting at node k,
	 * exchanging a node with the smallest of its two sons if necessary, stopping
	 * when the heap property is re-established (each father smaller than its
	 * two sons).
	 */
	function zip_pqdownheap(
	    tree,	// the tree to restore
	    k) {	// node to move down
	    var v = zip_heap[k];
	    var j = k << 1;	// left son of k
	
	    while(j <= zip_heap_len) {
		// Set j to the smallest of the two sons:
		if(j < zip_heap_len &&
		   zip_SMALLER(tree, zip_heap[j + 1], zip_heap[j]))
		    j++;
	
		// Exit if v is smaller than both sons
		if(zip_SMALLER(tree, v, zip_heap[j]))
		    break;
	
		// Exchange v with the smallest son
		zip_heap[k] = zip_heap[j];
		k = j;
	
		// And continue down the tree, setting j to the left son of k
		j <<= 1;
	    }
	    zip_heap[k] = v;
	}
	
	/* ==========================================================================
	 * Compute the optimal bit lengths for a tree and update the total bit length
	 * for the current block.
	 * IN assertion: the fields freq and dad are set, heap[heap_max] and
	 *    above are the tree nodes sorted by increasing frequency.
	 * OUT assertions: the field len is set to the optimal bit length, the
	 *     array bl_count contains the frequencies for each bit length.
	 *     The length opt_len is updated; static_len is also updated if stree is
	 *     not null.
	 */
	function zip_gen_bitlen(desc) { // the tree descriptor
	    var tree		= desc.dyn_tree;
	    var extra		= desc.extra_bits;
	    var base		= desc.extra_base;
	    var max_code	= desc.max_code;
	    var max_length	= desc.max_length;
	    var stree		= desc.static_tree;
	    var h;		// heap index
	    var n, m;		// iterate over the tree elements
	    var bits;		// bit length
	    var xbits;		// extra bits
	    var f;		// frequency
	    var overflow = 0;	// number of elements with bit length too large
	
	    for(bits = 0; bits <= zip_MAX_BITS; bits++)
		zip_bl_count[bits] = 0;
	
	    /* In a first pass, compute the optimal bit lengths (which may
	     * overflow in the case of the bit length tree).
	     */
	    tree[zip_heap[zip_heap_max]].dl = 0; // root of the heap
	
	    for(h = zip_heap_max + 1; h < zip_HEAP_SIZE; h++) {
		n = zip_heap[h];
		bits = tree[tree[n].dl].dl + 1;
		if(bits > max_length) {
		    bits = max_length;
		    overflow++;
		}
		tree[n].dl = bits;
		// We overwrite tree[n].dl which is no longer needed
	
		if(n > max_code)
		    continue; // not a leaf node
	
		zip_bl_count[bits]++;
		xbits = 0;
		if(n >= base)
		    xbits = extra[n - base];
		f = tree[n].fc;
		zip_opt_len += f * (bits + xbits);
		if(stree != null)
		    zip_static_len += f * (stree[n].dl + xbits);
	    }
	    if(overflow == 0)
		return;
	
	    // This happens for example on obj2 and pic of the Calgary corpus
	
	    // Find the first bit length which could increase:
	    do {
		bits = max_length - 1;
		while(zip_bl_count[bits] == 0)
		    bits--;
		zip_bl_count[bits]--;		// move one leaf down the tree
		zip_bl_count[bits + 1] += 2;	// move one overflow item as its brother
		zip_bl_count[max_length]--;
		/* The brother of the overflow item also moves one step up,
		 * but this does not affect bl_count[max_length]
		 */
		overflow -= 2;
	    } while(overflow > 0);
	
	    /* Now recompute all bit lengths, scanning in increasing frequency.
	     * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
	     * lengths instead of fixing only the wrong ones. This idea is taken
	     * from 'ar' written by Haruhiko Okumura.)
	     */
	    for(bits = max_length; bits != 0; bits--) {
		n = zip_bl_count[bits];
		while(n != 0) {
		    m = zip_heap[--h];
		    if(m > max_code)
			continue;
		    if(tree[m].dl != bits) {
			zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
			tree[m].fc = bits;
		    }
		    n--;
		}
	    }
	}
	
	  /* ==========================================================================
	   * Generate the codes for a given tree and bit counts (which need not be
	   * optimal).
	   * IN assertion: the array bl_count contains the bit length statistics for
	   * the given tree and the field len is set for all tree elements.
	   * OUT assertion: the field code is set for all tree elements of non
	   *     zero code length.
	   */
	function zip_gen_codes(tree,	// the tree to decorate
			   max_code) {	// largest code with non zero frequency
	    var next_code = new Array(zip_MAX_BITS+1); // next code value for each bit length
	    var code = 0;		// running code value
	    var bits;			// bit index
	    var n;			// code index
	
	    /* The distribution counts are first used to generate the code values
	     * without bit reversal.
	     */
	    for(bits = 1; bits <= zip_MAX_BITS; bits++) {
		code = ((code + zip_bl_count[bits-1]) << 1);
		next_code[bits] = code;
	    }
	
	    /* Check that the bit counts in bl_count are consistent. The last code
	     * must be all ones.
	     */
	//    Assert (code + encoder->bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
	//	    "inconsistent bit counts");
	//    Tracev((stderr,"\ngen_codes: max_code %d ", max_code));
	
	    for(n = 0; n <= max_code; n++) {
		var len = tree[n].dl;
		if(len == 0)
		    continue;
		// Now reverse the bits
		tree[n].fc = zip_bi_reverse(next_code[len]++, len);
	
	//      Tracec(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
	//	  n, (isgraph(n) ? n : ' '), len, tree[n].fc, next_code[len]-1));
	    }
	}
	
	/* ==========================================================================
	 * Construct one Huffman tree and assigns the code bit strings and lengths.
	 * Update the total bit length for the current block.
	 * IN assertion: the field freq is set for all tree elements.
	 * OUT assertions: the fields len and code are set to the optimal bit length
	 *     and corresponding code. The length opt_len is updated; static_len is
	 *     also updated if stree is not null. The field max_code is set.
	 */
	function zip_build_tree(desc) { // the tree descriptor
	    var tree	= desc.dyn_tree;
	    var stree	= desc.static_tree;
	    var elems	= desc.elems;
	    var n, m;		// iterate over heap elements
	    var max_code = -1;	// largest code with non zero frequency
	    var node = elems;	// next internal node of the tree
	
	    /* Construct the initial heap, with least frequent element in
	     * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
	     * heap[0] is not used.
	     */
	    zip_heap_len = 0;
	    zip_heap_max = zip_HEAP_SIZE;
	
	    for(n = 0; n < elems; n++) {
		if(tree[n].fc != 0) {
		    zip_heap[++zip_heap_len] = max_code = n;
		    zip_depth[n] = 0;
		} else
		    tree[n].dl = 0;
	    }
	
	    /* The pkzip format requires that at least one distance code exists,
	     * and that at least one bit should be sent even if there is only one
	     * possible code. So to avoid special checks later on we force at least
	     * two codes of non zero frequency.
	     */
	    while(zip_heap_len < 2) {
		var xnew = zip_heap[++zip_heap_len] = (max_code < 2 ? ++max_code : 0);
		tree[xnew].fc = 1;
		zip_depth[xnew] = 0;
		zip_opt_len--;
		if(stree != null)
		    zip_static_len -= stree[xnew].dl;
		// new is 0 or 1 so it does not have extra bits
	    }
	    desc.max_code = max_code;
	
	    /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
	     * establish sub-heaps of increasing lengths:
	     */
	    for(n = zip_heap_len >> 1; n >= 1; n--)
		zip_pqdownheap(tree, n);
	
	    /* Construct the Huffman tree by repeatedly combining the least two
	     * frequent nodes.
	     */
	    do {
		n = zip_heap[zip_SMALLEST];
		zip_heap[zip_SMALLEST] = zip_heap[zip_heap_len--];
		zip_pqdownheap(tree, zip_SMALLEST);
	
		m = zip_heap[zip_SMALLEST];  // m = node of next least frequency
	
		// keep the nodes sorted by frequency
		zip_heap[--zip_heap_max] = n;
		zip_heap[--zip_heap_max] = m;
	
		// Create a new node father of n and m
		tree[node].fc = tree[n].fc + tree[m].fc;
	//	depth[node] = (char)(MAX(depth[n], depth[m]) + 1);
		if(zip_depth[n] > zip_depth[m] + 1)
		    zip_depth[node] = zip_depth[n];
		else
		    zip_depth[node] = zip_depth[m] + 1;
		tree[n].dl = tree[m].dl = node;
	
		// and insert the new node in the heap
		zip_heap[zip_SMALLEST] = node++;
		zip_pqdownheap(tree, zip_SMALLEST);
	
	    } while(zip_heap_len >= 2);
	
	    zip_heap[--zip_heap_max] = zip_heap[zip_SMALLEST];
	
	    /* At this point, the fields freq and dad are set. We can now
	     * generate the bit lengths.
	     */
	    zip_gen_bitlen(desc);
	
	    // The field len is now set, we can generate the bit codes
	    zip_gen_codes(tree, max_code);
	}
	
	/* ==========================================================================
	 * Scan a literal or distance tree to determine the frequencies of the codes
	 * in the bit length tree. Updates opt_len to take into account the repeat
	 * counts. (The contribution of the bit length codes will be added later
	 * during the construction of bl_tree.)
	 */
	function zip_scan_tree(tree,// the tree to be scanned
			       max_code) {  // and its largest code of non zero frequency
	    var n;			// iterates over all tree elements
	    var prevlen = -1;		// last emitted length
	    var curlen;			// length of current code
	    var nextlen = tree[0].dl;	// length of next code
	    var count = 0;		// repeat count of the current code
	    var max_count = 7;		// max repeat count
	    var min_count = 4;		// min repeat count
	
	    if(nextlen == 0) {
		max_count = 138;
		min_count = 3;
	    }
	    tree[max_code + 1].dl = 0xffff; // guard
	
	    for(n = 0; n <= max_code; n++) {
		curlen = nextlen;
		nextlen = tree[n + 1].dl;
		if(++count < max_count && curlen == nextlen)
		    continue;
		else if(count < min_count)
		    zip_bl_tree[curlen].fc += count;
		else if(curlen != 0) {
		    if(curlen != prevlen)
			zip_bl_tree[curlen].fc++;
		    zip_bl_tree[zip_REP_3_6].fc++;
		} else if(count <= 10)
		    zip_bl_tree[zip_REPZ_3_10].fc++;
		else
		    zip_bl_tree[zip_REPZ_11_138].fc++;
		count = 0; prevlen = curlen;
		if(nextlen == 0) {
		    max_count = 138;
		    min_count = 3;
		} else if(curlen == nextlen) {
		    max_count = 6;
		    min_count = 3;
		} else {
		    max_count = 7;
		    min_count = 4;
		}
	    }
	}
	
	  /* ==========================================================================
	   * Send a literal or distance tree in compressed form, using the codes in
	   * bl_tree.
	   */
	function zip_send_tree(tree, // the tree to be scanned
			   max_code) { // and its largest code of non zero frequency
	    var n;			// iterates over all tree elements
	    var prevlen = -1;		// last emitted length
	    var curlen;			// length of current code
	    var nextlen = tree[0].dl;	// length of next code
	    var count = 0;		// repeat count of the current code
	    var max_count = 7;		// max repeat count
	    var min_count = 4;		// min repeat count
	
	    /* tree[max_code+1].dl = -1; */  /* guard already set */
	    if(nextlen == 0) {
	      max_count = 138;
	      min_count = 3;
	    }
	
	    for(n = 0; n <= max_code; n++) {
		curlen = nextlen;
		nextlen = tree[n+1].dl;
		if(++count < max_count && curlen == nextlen) {
		    continue;
		} else if(count < min_count) {
		    do { zip_SEND_CODE(curlen, zip_bl_tree); } while(--count != 0);
		} else if(curlen != 0) {
		    if(curlen != prevlen) {
			zip_SEND_CODE(curlen, zip_bl_tree);
			count--;
		    }
		    // Assert(count >= 3 && count <= 6, " 3_6?");
		    zip_SEND_CODE(zip_REP_3_6, zip_bl_tree);
		    zip_send_bits(count - 3, 2);
		} else if(count <= 10) {
		    zip_SEND_CODE(zip_REPZ_3_10, zip_bl_tree);
		    zip_send_bits(count-3, 3);
		} else {
		    zip_SEND_CODE(zip_REPZ_11_138, zip_bl_tree);
		    zip_send_bits(count-11, 7);
		}
		count = 0;
		prevlen = curlen;
		if(nextlen == 0) {
		    max_count = 138;
		    min_count = 3;
		} else if(curlen == nextlen) {
		    max_count = 6;
		    min_count = 3;
		} else {
		    max_count = 7;
		    min_count = 4;
		}
	    }
	}
	
	/* ==========================================================================
	 * Construct the Huffman tree for the bit lengths and return the index in
	 * bl_order of the last bit length code to send.
	 */
	function zip_build_bl_tree() {
	    var max_blindex;  // index of last bit length code of non zero freq
	
	    // Determine the bit length frequencies for literal and distance trees
	    zip_scan_tree(zip_dyn_ltree, zip_l_desc.max_code);
	    zip_scan_tree(zip_dyn_dtree, zip_d_desc.max_code);
	
	    // Build the bit length tree:
	    zip_build_tree(zip_bl_desc);
	    /* opt_len now includes the length of the tree representations, except
	     * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
	     */
	
	    /* Determine the number of bit length codes to send. The pkzip format
	     * requires that at least 4 bit length codes be sent. (appnote.txt says
	     * 3 but the actual value used is 4.)
	     */
	    for(max_blindex = zip_BL_CODES-1; max_blindex >= 3; max_blindex--) {
		if(zip_bl_tree[zip_bl_order[max_blindex]].dl != 0) break;
	    }
	    /* Update opt_len to include the bit length tree and counts */
	    zip_opt_len += 3*(max_blindex+1) + 5+5+4;
	//    Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
	//	    encoder->opt_len, encoder->static_len));
	
	    return max_blindex;
	}
	
	/* ==========================================================================
	 * Send the header for a block using dynamic Huffman trees: the counts, the
	 * lengths of the bit length codes, the literal tree and the distance tree.
	 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
	 */
	function zip_send_all_trees(lcodes, dcodes, blcodes) { // number of codes for each tree
	    var rank; // index in bl_order
	
	//    Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
	//    Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
	//	    "too many codes");
	//    Tracev((stderr, "\nbl counts: "));
	    zip_send_bits(lcodes-257, 5); // not +255 as stated in appnote.txt
	    zip_send_bits(dcodes-1,   5);
	    zip_send_bits(blcodes-4,  4); // not -3 as stated in appnote.txt
	    for(rank = 0; rank < blcodes; rank++) {
	//      Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
		zip_send_bits(zip_bl_tree[zip_bl_order[rank]].dl, 3);
	    }
	
	    // send the literal tree
	    zip_send_tree(zip_dyn_ltree,lcodes-1);
	
	    // send the distance tree
	    zip_send_tree(zip_dyn_dtree,dcodes-1);
	}
	
	/* ==========================================================================
	 * Determine the best encoding for the current block: dynamic trees, static
	 * trees or store, and output the encoded block to the zip file.
	 */
	function zip_flush_block(eof) { // true if this is the last block for a file
	    var opt_lenb, static_lenb; // opt_len and static_len in bytes
	    var max_blindex;	// index of last bit length code of non zero freq
	    var stored_len;	// length of input block
	
	    stored_len = zip_strstart - zip_block_start;
	    zip_flag_buf[zip_last_flags] = zip_flags; // Save the flags for the last 8 items
	
	    // Construct the literal and distance trees
	    zip_build_tree(zip_l_desc);
	//    Tracev((stderr, "\nlit data: dyn %ld, stat %ld",
	//	    encoder->opt_len, encoder->static_len));
	
	    zip_build_tree(zip_d_desc);
	//    Tracev((stderr, "\ndist data: dyn %ld, stat %ld",
	//	    encoder->opt_len, encoder->static_len));
	    /* At this point, opt_len and static_len are the total bit lengths of
	     * the compressed block data, excluding the tree representations.
	     */
	
	    /* Build the bit length tree for the above two trees, and get the index
	     * in bl_order of the last bit length code to send.
	     */
	    max_blindex = zip_build_bl_tree();
	
	    // Determine the best encoding. Compute first the block length in bytes
	    opt_lenb	= (zip_opt_len   +3+7)>>3;
	    static_lenb = (zip_static_len+3+7)>>3;
	
	//    Trace((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u dist %u ",
	//	   opt_lenb, encoder->opt_len,
	//	   static_lenb, encoder->static_len, stored_len,
	//	   encoder->last_lit, encoder->last_dist));
	
	    if(static_lenb <= opt_lenb)
		opt_lenb = static_lenb;
	    if(stored_len + 4 <= opt_lenb // 4: two words for the lengths
	       && zip_block_start >= 0) {
		var i;
	
		/* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
		 * Otherwise we can't have processed more than WSIZE input bytes since
		 * the last block flush, because compression would have been
		 * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
		 * transform a block into a stored block.
		 */
		zip_send_bits((zip_STORED_BLOCK<<1)+eof, 3);  /* send block type */
		zip_bi_windup();		 /* align on byte boundary */
		zip_put_short(stored_len);
		zip_put_short(~stored_len);
	
	      // copy block
	/*
	      p = &window[block_start];
	      for(i = 0; i < stored_len; i++)
		put_byte(p[i]);
	*/
		for(i = 0; i < stored_len; i++)
		    zip_put_byte(zip_window[zip_block_start + i]);
	
	    } else if(static_lenb == opt_lenb) {
		zip_send_bits((zip_STATIC_TREES<<1)+eof, 3);
		zip_compress_block(zip_static_ltree, zip_static_dtree);
	    } else {
		zip_send_bits((zip_DYN_TREES<<1)+eof, 3);
		zip_send_all_trees(zip_l_desc.max_code+1,
				   zip_d_desc.max_code+1,
				   max_blindex+1);
		zip_compress_block(zip_dyn_ltree, zip_dyn_dtree);
	    }
	
	    zip_init_block();
	
	    if(eof != 0)
		zip_bi_windup();
	}
	
	/* ==========================================================================
	 * Save the match info and tally the frequency counts. Return true if
	 * the current block must be flushed.
	 */
	function zip_ct_tally(
		dist, // distance of matched string
		lc) { // match length-MIN_MATCH or unmatched char (if dist==0)
	    zip_l_buf[zip_last_lit++] = lc;
	    if(dist == 0) {
		// lc is the unmatched char
		zip_dyn_ltree[lc].fc++;
	    } else {
		// Here, lc is the match length - MIN_MATCH
		dist--;		    // dist = match distance - 1
	//      Assert((ush)dist < (ush)MAX_DIST &&
	//	     (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
	//	     (ush)D_CODE(dist) < (ush)D_CODES,  "ct_tally: bad match");
	
		zip_dyn_ltree[zip_length_code[lc]+zip_LITERALS+1].fc++;
		zip_dyn_dtree[zip_D_CODE(dist)].fc++;
	
		zip_d_buf[zip_last_dist++] = dist;
		zip_flags |= zip_flag_bit;
	    }
	    zip_flag_bit <<= 1;
	
	    // Output the flags if they fill a byte
	    if((zip_last_lit & 7) == 0) {
		zip_flag_buf[zip_last_flags++] = zip_flags;
		zip_flags = 0;
		zip_flag_bit = 1;
	    }
	    // Try to guess if it is profitable to stop the current block here
	    if(zip_compr_level > 2 && (zip_last_lit & 0xfff) == 0) {
		// Compute an upper bound for the compressed length
		var out_length = zip_last_lit * 8;
		var in_length = zip_strstart - zip_block_start;
		var dcode;
	
		for(dcode = 0; dcode < zip_D_CODES; dcode++) {
		    out_length += zip_dyn_dtree[dcode].fc * (5 + zip_extra_dbits[dcode]);
		}
		out_length >>= 3;
	//      Trace((stderr,"\nlast_lit %u, last_dist %u, in %ld, out ~%ld(%ld%%) ",
	//	     encoder->last_lit, encoder->last_dist, in_length, out_length,
	//	     100L - out_length*100L/in_length));
		if(zip_last_dist < parseInt(zip_last_lit/2) &&
		   out_length < parseInt(in_length/2))
		    return true;
	    }
	    return (zip_last_lit == zip_LIT_BUFSIZE-1 ||
		    zip_last_dist == zip_DIST_BUFSIZE);
	    /* We avoid equality with LIT_BUFSIZE because of wraparound at 64K
	     * on 16 bit machines and because stored blocks are restricted to
	     * 64K-1 bytes.
	     */
	}
	
	  /* ==========================================================================
	   * Send the block data compressed using the given Huffman trees
	   */
	function zip_compress_block(
		ltree,	// literal tree
		dtree) {	// distance tree
	    var dist;		// distance of matched string
	    var lc;		// match length or unmatched char (if dist == 0)
	    var lx = 0;		// running index in l_buf
	    var dx = 0;		// running index in d_buf
	    var fx = 0;		// running index in flag_buf
	    var flag = 0;	// current flags
	    var code;		// the code to send
	    var extra;		// number of extra bits to send
	
	    if(zip_last_lit != 0) do {
		if((lx & 7) == 0)
		    flag = zip_flag_buf[fx++];
		lc = zip_l_buf[lx++] & 0xff;
		if((flag & 1) == 0) {
		    zip_SEND_CODE(lc, ltree); /* send a literal byte */
	//	Tracecv(isgraph(lc), (stderr," '%c' ", lc));
		} else {
		    // Here, lc is the match length - MIN_MATCH
		    code = zip_length_code[lc];
		    zip_SEND_CODE(code+zip_LITERALS+1, ltree); // send the length code
		    extra = zip_extra_lbits[code];
		    if(extra != 0) {
			lc -= zip_base_length[code];
			zip_send_bits(lc, extra); // send the extra length bits
		    }
		    dist = zip_d_buf[dx++];
		    // Here, dist is the match distance - 1
		    code = zip_D_CODE(dist);
	//	Assert (code < D_CODES, "bad d_code");
	
		    zip_SEND_CODE(code, dtree);	  // send the distance code
		    extra = zip_extra_dbits[code];
		    if(extra != 0) {
			dist -= zip_base_dist[code];
			zip_send_bits(dist, extra);   // send the extra distance bits
		    }
		} // literal or match pair ?
		flag >>= 1;
	    } while(lx < zip_last_lit);
	
	    zip_SEND_CODE(zip_END_BLOCK, ltree);
	}
	
	/* ==========================================================================
	 * Send a value on a given number of bits.
	 * IN assertion: length <= 16 and value fits in length bits.
	 */
	var zip_Buf_size = 16; // bit size of bi_buf
	function zip_send_bits(
		value,	// value to send
		length) {	// number of bits
	    /* If not enough room in bi_buf, use (valid) bits from bi_buf and
	     * (16 - bi_valid) bits from value, leaving (width - (16-bi_valid))
	     * unused bits in value.
	     */
	    if(zip_bi_valid > zip_Buf_size - length) {
		zip_bi_buf |= (value << zip_bi_valid);
		zip_put_short(zip_bi_buf);
		zip_bi_buf = (value >> (zip_Buf_size - zip_bi_valid));
		zip_bi_valid += length - zip_Buf_size;
	    } else {
		zip_bi_buf |= value << zip_bi_valid;
		zip_bi_valid += length;
	    }
	}
	
	/* ==========================================================================
	 * Reverse the first len bits of a code, using straightforward code (a faster
	 * method would use a table)
	 * IN assertion: 1 <= len <= 15
	 */
	function zip_bi_reverse(
		code,	// the value to invert
		len) {	// its bit length
	    var res = 0;
	    do {
		res |= code & 1;
		code >>= 1;
		res <<= 1;
	    } while(--len > 0);
	    return res >> 1;
	}
	
	/* ==========================================================================
	 * Write out any remaining bits in an incomplete byte.
	 */
	function zip_bi_windup() {
	    if(zip_bi_valid > 8) {
		zip_put_short(zip_bi_buf);
	    } else if(zip_bi_valid > 0) {
		zip_put_byte(zip_bi_buf);
	    }
	    zip_bi_buf = 0;
	    zip_bi_valid = 0;
	}
	
	function zip_qoutbuf() {
	    if(zip_outcnt != 0) {
		var q, i;
		q = zip_new_queue();
		if(zip_qhead == null)
		    zip_qhead = zip_qtail = q;
		else
		    zip_qtail = zip_qtail.next = q;
		q.len = zip_outcnt - zip_outoff;
	//      System.arraycopy(zip_outbuf, zip_outoff, q.ptr, 0, q.len);
		for(i = 0; i < q.len; i++)
		    q.ptr[i] = zip_outbuf[zip_outoff + i];
		zip_outcnt = zip_outoff = 0;
	    }
	}
	
	function zip_deflate(str, level) {
	    var out, buff;
	    var i, j;
	
	    zip_deflate_data = str;
	    zip_deflate_pos = 0;
	    if(typeof level == "undefined")
		level = zip_DEFAULT_LEVEL;
	    zip_deflate_start(level);
	
	    buff = new Array(1024);
	    out = "";
	    while((i = zip_deflate_internal(buff, 0, buff.length)) > 0) {
		for(j = 0; j < i; j++)
		    out += String.fromCharCode(buff[j]);
	    }
	    zip_deflate_data = null; // G.C.
	    return out;
	}
	
	/**
	 * Asynchronous version 
	 */
	var async_callback_cancel;
	var async_callback_success;
	var async_callback_progress;
	var async_progress_interval = 350;
	var async_progress_interval = 17;
	var async_crc32;
	var async_messaging = {
		requestCancel: false
	}
	var crc32_table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];

	function deflateAsync(options) {
	    async_messaging.requestCancel = false;
	    async_callback_cancel = options.cancel;
	    async_callback_success = options.success;
	    async_callback_progress = options.progress;
	    var data = options.data;
	    
	    var out, buff;
	    var i, j;
	    async_crc32 = 0 ^ (-1);
	
	    zip_deflate_data = data;
	    zip_deflate_pos = 0;
	    if(typeof level == "undefined")
		level = zip_DEFAULT_LEVEL;
	    zip_deflate_start(level);
	
	    buff = new Array(1024);
	    out = "";
	    i = zip_deflate_internal(buff, 0, buff.length);
	    j = 0;
	    setTimeout(function() {
		    deflateAsyncContinue(i, j, buff, out);
	    },0);
	}
	
	function deflateAsyncContinue(i, j, buff, deflatedString) {
	    if (async_messaging.requestCancel) {
	    	async_callback_cancel();
	    	return;
	    }
	    
	    var startTime = new Date().getTime();
	    var firstRun = true;
	    
	    while((i = (firstRun) ? i : zip_deflate_internal(buff, 0, buff.length)) > 0) {
			for(j = (firstRun) ? j : 0; j < i; j++) {
			    firstRun = false;

			    if (new Date().getTime() - startTime > async_progress_interval) {
			    	if (typeof async_callback_progress == "function") {
			    		async_callback_progress("gzip_deflate", zip_deflate_pos, async_messaging);
			    	}

			    	setTimeout(function() {
			    		deflateAsyncContinue(i, j, buff, deflatedString);
			    	},0);
			    	return;
			    }

			    deflatedString += String.fromCharCode(buff[j]);
			}
	    }
	    

	    async_crc32 = async_crc32 ^ (-1);
	    async_crc32 = (async_crc32 < 0) ? async_crc32 + 0x100000000 : async_crc32;
	    
		/*
		// CRC32 Troubleshooting
		var goodCrc32 = crc32_func(zip_deflate_data);
		console.log("Match: %s, Good: %s, Attempt: %s", (goodCrc32 == async_crc32) ? "MATCH" : "FAIL", goodCrc32, async_crc32);
		async_crc32 = goodCrc32;
		*/

	    zip_deflate_data = null; // G.C.

		//setTimeout called so that DOM can show the 100%;
   		async_callback_progress("gzip_deflate", zip_deflate_pos, async_messaging);
    	setTimeout(function() {
		    async_callback_success(deflatedString, async_crc32);
		},0);
	}
	
	var crc32_func = function(str) {
		var crc32_table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];

		var crc = 0 ^ (-1);
		var length = str.length;
		 
		for(var i=0; i<length; i++) {
			crc = (crc >>> 8) ^ crc32_table[(crc ^ str.charCodeAt(i)) & 0xFF];
		}
		
		crc = crc ^ (-1);
		crc = (crc < 0) ? crc + 0x100000000 : crc;
		
	    return crc;
	};

	namespace.deflate = zip_deflate;
	namespace.deflateAsync = deflateAsync;
})();
; 
function gzipInflater() {
	var namespace = window.com.mordritch.mcSim;

	/*
	 * Homepage: http://www.onicos.com/staff/iz/amuse/javascript/expert/
	 * http://www.onicos.com/staff/iz/amuse/javascript/expert/inflate.txt
	 */

	/* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
	 * Version: 1.0.0.1
	 * LastModified: Dec 25 1999
	 */
	
	/* Interface:
	 * data = zip_inflate(src);
	 */
	
	/* constant parameters */
	var zip_WSIZE = 32768;		// Sliding Window size
	var zip_STORED_BLOCK = 0;
	var zip_STATIC_TREES = 1;
	var zip_DYN_TREES    = 2;
	
	/* for inflate */
	var zip_lbits = 9; 		// bits in base literal/length lookup table
	var zip_dbits = 6; 		// bits in base distance lookup table
	var zip_INBUFSIZ = 32768;	// Input buffer size
	var zip_INBUF_EXTRA = 64;	// Extra buffer
	
	/* variables (inflate) */
	var zip_slide;
	var zip_wp;			// current position in slide
	var zip_fixed_tl = null;	// inflate static
	var zip_fixed_td;		// inflate static
	var zip_fixed_bl, fixed_bd;	// inflate static
	var zip_bit_buf;		// bit buffer
	var zip_bit_len;		// bits in bit buffer
	var zip_method;
	var zip_eof;
	var zip_copy_leng;
	var zip_copy_dist;
	var zip_tl, zip_td;	// literal/length and distance decoder tables
	var zip_bl, zip_bd;	// number of bits decoded by tl and td
	
	var zip_inflate_data;
	var zip_inflate_pos;
	
	
	/* constant tables (inflate) */
	var zip_MASK_BITS = new Array(
	    0x0000,
	    0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff,
	    0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff);
	// Tables for deflate from PKZIP's appnote.txt.
	var zip_cplens = new Array( // Copy lengths for literal codes 257..285
	    3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
	    35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0);
	/* note: see note #13 above about the 258 in this list. */
	var zip_cplext = new Array( // Extra bits for literal codes 257..285
	    0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
	    3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99); // 99==invalid
	var zip_cpdist = new Array( // Copy offsets for distance codes 0..29
	    1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
	    257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
	    8193, 12289, 16385, 24577);
	var zip_cpdext = new Array( // Extra bits for distance codes
	    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
	    7, 7, 8, 8, 9, 9, 10, 10, 11, 11,
	    12, 12, 13, 13);
	var zip_border = new Array(  // Order of the bit length code lengths
	    16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
	/* objects (inflate) */
	
	var zip_HuftList = function(){
	    this.next = null;
	    this.list = null;
	}
	
	var zip_HuftNode = function() {
	    this.e = 0; // number of extra bits or operation
	    this.b = 0; // number of bits in this code or subcode
	
	    // union
	    this.n = 0; // literal, length base, or distance base
	    this.t = null; // (zip_HuftNode) pointer to next level of table
	}
	
	var zip_HuftBuild = function(b,	// code lengths in bits (all assumed <= BMAX)
			       n,	// number of codes (assumed <= N_MAX)
			       s,	// number of simple-valued codes (0..s-1)
			       d,	// list of base values for non-simple codes
			       e,	// list of extra bits for non-simple codes
			       mm	// maximum lookup bits
			   ) {
	    this.BMAX = 16;   // maximum bit length of any code
	    this.N_MAX = 288; // maximum number of codes in any set
	    this.status = 0;	// 0: success, 1: incomplete table, 2: bad input
	    this.root = null;	// (zip_HuftList) starting table
	    this.m = 0;		// maximum lookup bits, returns actual
	
	/* Given a list of code lengths and a maximum table size, make a set of
	   tables to decode that set of codes.	Return zero on success, one if
	   the given code set is incomplete (the tables are still built in this
	   case), two if the input is invalid (all zero length codes or an
	   oversubscribed set of lengths), and three if not enough memory.
	   The code with value 256 is special, and the tables are constructed
	   so that no bits beyond that code are fetched when that code is
	   decoded. */
	    {
		var a;			// counter for codes of length k
		var c = new Array(this.BMAX+1);	// bit length count table
		var el;			// length of EOB code (value 256)
		var f;			// i repeats in table every f entries
		var g;			// maximum code length
		var h;			// table level
		var i;			// counter, current code
		var j;			// counter
		var k;			// number of bits in current code
		var lx = new Array(this.BMAX+1);	// stack of bits per table
		var p;			// pointer into c[], b[], or v[]
		var pidx;		// index of p
		var q;			// (zip_HuftNode) points to current table
		var r = new zip_HuftNode(); // table entry for structure assignment
		var u = new Array(this.BMAX); // zip_HuftNode[BMAX][]  table stack
		var v = new Array(this.N_MAX); // values in order of bit length
		var w;
		var x = new Array(this.BMAX+1);// bit offsets, then code stack
		var xp;			// pointer into x or c
		var y;			// number of dummy codes added
		var z;			// number of entries in current table
		var o;
		var tail;		// (zip_HuftList)
	
		tail = this.root = null;
		for(i = 0; i < c.length; i++)
		    c[i] = 0;
		for(i = 0; i < lx.length; i++)
		    lx[i] = 0;
		for(i = 0; i < u.length; i++)
		    u[i] = null;
		for(i = 0; i < v.length; i++)
		    v[i] = 0;
		for(i = 0; i < x.length; i++)
		    x[i] = 0;
	
		// Generate counts for each bit length
		el = n > 256 ? b[256] : this.BMAX; // set length of EOB code, if any
		p = b; pidx = 0;
		i = n;
		do {
		    c[p[pidx]]++;	// assume all entries <= BMAX
		    pidx++;
		} while(--i > 0);
		if(c[0] == n) {	// null input--all zero length codes
		    this.root = null;
		    this.m = 0;
		    this.status = 0;
		    return;
		}
	
		// Find minimum and maximum length, bound *m by those
		for(j = 1; j <= this.BMAX; j++)
		    if(c[j] != 0)
			break;
		k = j;			// minimum code length
		if(mm < j)
		    mm = j;
		for(i = this.BMAX; i != 0; i--)
		    if(c[i] != 0)
			break;
		g = i;			// maximum code length
		if(mm > i)
		    mm = i;
	
		// Adjust last length count to fill out codes, if needed
		for(y = 1 << j; j < i; j++, y <<= 1)
		    if((y -= c[j]) < 0) {
			this.status = 2;	// bad input: more codes than bits
			this.m = mm;
			return;
		    }
		if((y -= c[i]) < 0) {
		    this.status = 2;
		    this.m = mm;
		    return;
		}
		c[i] += y;
	
		// Generate starting offsets into the value table for each length
		x[1] = j = 0;
		p = c;
		pidx = 1;
		xp = 2;
		while(--i > 0)		// note that i == g from above
		    x[xp++] = (j += p[pidx++]);
	
		// Make a table of values in order of bit lengths
		p = b; pidx = 0;
		i = 0;
		do {
		    if((j = p[pidx++]) != 0)
			v[x[j]++] = i;
		} while(++i < n);
		n = x[g];			// set n to length of v
	
		// Generate the Huffman codes and for each, make the table entries
		x[0] = i = 0;		// first Huffman code is zero
		p = v; pidx = 0;		// grab values in bit order
		h = -1;			// no tables yet--level -1
		w = lx[0] = 0;		// no bits decoded yet
		q = null;			// ditto
		z = 0;			// ditto
	
		// go through the bit lengths (k already is bits in shortest code)
		for(; k <= g; k++) {
		    a = c[k];
		    while(a-- > 0) {
			// here i is the Huffman code of length k bits for value p[pidx]
			// make tables up to required level
			while(k > w + lx[1 + h]) {
			    w += lx[1 + h]; // add bits already decoded
			    h++;
	
			    // compute minimum size table less than or equal to *m bits
			    z = (z = g - w) > mm ? mm : z; // upper limit
			    if((f = 1 << (j = k - w)) > a + 1) { // try a k-w bit table
				// too few codes for k-w bit table
				f -= a + 1;	// deduct codes from patterns left
				xp = k;
				while(++j < z) { // try smaller tables up to z bits
				    if((f <<= 1) <= c[++xp])
					break;	// enough codes to use up j bits
				    f -= c[xp];	// else deduct codes from patterns
				}
			    }
			    if(w + j > el && w < el)
				j = el - w;	// make EOB code end at table
			    z = 1 << j;	// table entries for j-bit table
			    lx[1 + h] = j; // set table size in stack
	
			    // allocate and link in new table
			    q = new Array(z);
			    for(o = 0; o < z; o++) {
				q[o] = new zip_HuftNode();
			    }
	
			    if(tail == null)
				tail = this.root = new zip_HuftList();
			    else
				tail = tail.next = new zip_HuftList();
			    tail.next = null;
			    tail.list = q;
			    u[h] = q;	// table starts after link
	
			    /* connect to last table, if there is one */
			    if(h > 0) {
				x[h] = i;		// save pattern for backing up
				r.b = lx[h];	// bits to dump before this table
				r.e = 16 + j;	// bits in this table
				r.t = q;		// pointer to this table
				j = (i & ((1 << w) - 1)) >> (w - lx[h]);
				u[h-1][j].e = r.e;
				u[h-1][j].b = r.b;
				u[h-1][j].n = r.n;
				u[h-1][j].t = r.t;
			    }
			}
	
			// set up table entry in r
			r.b = k - w;
			if(pidx >= n)
			    r.e = 99;		// out of values--invalid code
			else if(p[pidx] < s) {
			    r.e = (p[pidx] < 256 ? 16 : 15); // 256 is end-of-block code
			    r.n = p[pidx++];	// simple code is just the value
			} else {
			    r.e = e[p[pidx] - s];	// non-simple--look up in lists
			    r.n = d[p[pidx++] - s];
			}
	
			// fill code-like entries with r //
			f = 1 << (k - w);
			for(j = i >> w; j < z; j += f) {
			    q[j].e = r.e;
			    q[j].b = r.b;
			    q[j].n = r.n;
			    q[j].t = r.t;
			}
	
			// backwards increment the k-bit code i
			for(j = 1 << (k - 1); (i & j) != 0; j >>= 1)
			    i ^= j;
			i ^= j;
	
			// backup over finished tables
			while((i & ((1 << w) - 1)) != x[h]) {
			    w -= lx[h];		// don't need to update q
			    h--;
			}
		    }
		}
	
		/* return actual size of base table */
		this.m = lx[1];
	
		/* Return true (1) if we were given an incomplete table */
		this.status = ((y != 0 && g != 1) ? 1 : 0);
	    } /* end of constructor */
	}
	
	
	/* routines (inflate) */
	
	var zip_GET_BYTE = function() {
	    if(zip_inflate_data.length == zip_inflate_pos)
		return -1;
	    return zip_inflate_data.charCodeAt(zip_inflate_pos++) & 0xff;
	}
	
	var zip_NEEDBITS = function(n) {
	    while(zip_bit_len < n) {
		zip_bit_buf |= zip_GET_BYTE() << zip_bit_len;
		zip_bit_len += 8;
	    }
	}
	
	var zip_GETBITS = function(n) {
	    return zip_bit_buf & zip_MASK_BITS[n];
	}
	
	var zip_DUMPBITS = function(n) {
	    zip_bit_buf >>= n;
	    zip_bit_len -= n;
	}
	
	function zip_inflate_codes(buff, off, size) {
	    /* inflate (decompress) the codes in a deflated (compressed) block.
	       Return an error code or zero if it all goes ok. */
	    var e;		// table entry flag/number of extra bits
	    var t;		// (zip_HuftNode) pointer to table entry
	    var n;
	
	    if(size == 0)
	      return 0;
	
	    // inflate the coded data
	    n = 0;
	    for(;;) {			// do until end of block
		zip_NEEDBITS(zip_bl);
		t = zip_tl.list[zip_GETBITS(zip_bl)];
		e = t.e;
		while(e > 16) {
		    if(e == 99)
			return -1;
		    zip_DUMPBITS(t.b);
		    e -= 16;
		    zip_NEEDBITS(e);
		    t = t.t[zip_GETBITS(e)];
		    e = t.e;
		}
		zip_DUMPBITS(t.b);
	
		if(e == 16) {		// then it's a literal
		    zip_wp &= zip_WSIZE - 1;
		    buff[off + n++] = zip_slide[zip_wp++] = t.n;
		    if(n == size)
			return size;
		    continue;
		}
	
		// exit if end of block
		if(e == 15)
		    break;
	
		// it's an EOB or a length
	
		// get length of block to copy
		zip_NEEDBITS(e);
		zip_copy_leng = t.n + zip_GETBITS(e);
		zip_DUMPBITS(e);
	
		// decode distance of block to copy
		zip_NEEDBITS(zip_bd);
		t = zip_td.list[zip_GETBITS(zip_bd)];
		e = t.e;
	
		while(e > 16) {
		    if(e == 99)
			return -1;
		    zip_DUMPBITS(t.b);
		    e -= 16;
		    zip_NEEDBITS(e);
		    t = t.t[zip_GETBITS(e)];
		    e = t.e;
		}
		zip_DUMPBITS(t.b);
		zip_NEEDBITS(e);
		zip_copy_dist = zip_wp - t.n - zip_GETBITS(e);
		zip_DUMPBITS(e);
	
		// do the copy
		while(zip_copy_leng > 0 && n < size) {
		    zip_copy_leng--;
		    zip_copy_dist &= zip_WSIZE - 1;
		    zip_wp &= zip_WSIZE - 1;
		    buff[off + n++] = zip_slide[zip_wp++]
			= zip_slide[zip_copy_dist++];
		}
	
		if(n == size)
		    return size;
	    }
	
	    zip_method = -1; // done
	    return n;
	}
	
	function zip_inflate_stored(buff, off, size) {
	    /* "decompress" an inflated type 0 (stored) block. */
	    var n;
	
	    // go to byte boundary
	    n = zip_bit_len & 7;
	    zip_DUMPBITS(n);
	
	    // get the length and its complement
	    zip_NEEDBITS(16);
	    n = zip_GETBITS(16);
	    zip_DUMPBITS(16);
	    zip_NEEDBITS(16);
	    if(n != ((~zip_bit_buf) & 0xffff))
		return -1;			// error in compressed data
	    zip_DUMPBITS(16);
	
	    // read and output the compressed data
	    zip_copy_leng = n;
	
	    n = 0;
	    while(zip_copy_leng > 0 && n < size) {
		zip_copy_leng--;
		zip_wp &= zip_WSIZE - 1;
		zip_NEEDBITS(8);
		buff[off + n++] = zip_slide[zip_wp++] =
		    zip_GETBITS(8);
		zip_DUMPBITS(8);
	    }
	
	    if(zip_copy_leng == 0)
	      zip_method = -1; // done
	    return n;
	}
	
	function zip_inflate_fixed(buff, off, size) {
	    /* decompress an inflated type 1 (fixed Huffman codes) block.  We should
	       either replace this with a custom decoder, or at least precompute the
	       Huffman tables. */
	
	    // if first time, set up tables for fixed blocks
	    if(zip_fixed_tl == null) {
		var i;			// temporary variable
		var l = new Array(288);	// length list for huft_build
		var h;	// zip_HuftBuild
	
		// literal table
		for(i = 0; i < 144; i++)
		    l[i] = 8;
		for(; i < 256; i++)
		    l[i] = 9;
		for(; i < 280; i++)
		    l[i] = 7;
		for(; i < 288; i++)	// make a complete, but wrong code set
		    l[i] = 8;
		zip_fixed_bl = 7;
	
		h = new zip_HuftBuild(l, 288, 257, zip_cplens, zip_cplext,
				      zip_fixed_bl);
		if(h.status != 0) {
		    alert("HufBuild error: "+h.status);
		    return -1;
		}
		zip_fixed_tl = h.root;
		zip_fixed_bl = h.m;
	
		// distance table
		for(i = 0; i < 30; i++)	// make an incomplete code set
		    l[i] = 5;
		zip_fixed_bd = 5;
	
		h = new zip_HuftBuild(l, 30, 0, zip_cpdist, zip_cpdext, zip_fixed_bd);
		if(h.status > 1) {
		    zip_fixed_tl = null;
		    alert("HufBuild error: "+h.status);
		    return -1;
		}
		zip_fixed_td = h.root;
		zip_fixed_bd = h.m;
	    }
	
	    zip_tl = zip_fixed_tl;
	    zip_td = zip_fixed_td;
	    zip_bl = zip_fixed_bl;
	    zip_bd = zip_fixed_bd;
	    return zip_inflate_codes(buff, off, size);
	}
	
	function zip_inflate_dynamic(buff, off, size) {
	    // decompress an inflated type 2 (dynamic Huffman codes) block.
	    var i;		// temporary variables
	    var j;
	    var l;		// last length
	    var n;		// number of lengths to get
	    var t;		// (zip_HuftNode) literal/length code table
	    var nb;		// number of bit length codes
	    var nl;		// number of literal/length codes
	    var nd;		// number of distance codes
	    var ll = new Array(286+30); // literal/length and distance code lengths
	    var h;		// (zip_HuftBuild)
	
	    for(i = 0; i < ll.length; i++)
		ll[i] = 0;
	
	    // read in table lengths
	    zip_NEEDBITS(5);
	    nl = 257 + zip_GETBITS(5);	// number of literal/length codes
	    zip_DUMPBITS(5);
	    zip_NEEDBITS(5);
	    nd = 1 + zip_GETBITS(5);	// number of distance codes
	    zip_DUMPBITS(5);
	    zip_NEEDBITS(4);
	    nb = 4 + zip_GETBITS(4);	// number of bit length codes
	    zip_DUMPBITS(4);
	    if(nl > 286 || nd > 30)
	      return -1;		// bad lengths
	
	    // read in bit-length-code lengths
	    for(j = 0; j < nb; j++)
	    {
		zip_NEEDBITS(3);
		ll[zip_border[j]] = zip_GETBITS(3);
		zip_DUMPBITS(3);
	    }
	    for(; j < 19; j++)
		ll[zip_border[j]] = 0;
	
	    // build decoding table for trees--single level, 7 bit lookup
	    zip_bl = 7;
	    h = new zip_HuftBuild(ll, 19, 19, null, null, zip_bl);
	    if(h.status != 0)
		return -1;	// incomplete code set
	
	    zip_tl = h.root;
	    zip_bl = h.m;
	
	    // read in literal and distance code lengths
	    n = nl + nd;
	    i = l = 0;
	    while(i < n) {
		zip_NEEDBITS(zip_bl);
		t = zip_tl.list[zip_GETBITS(zip_bl)];
		j = t.b;
		zip_DUMPBITS(j);
		j = t.n;
		if(j < 16)		// length of code in bits (0..15)
		    ll[i++] = l = j;	// save last length in l
		else if(j == 16) {	// repeat last length 3 to 6 times
		    zip_NEEDBITS(2);
		    j = 3 + zip_GETBITS(2);
		    zip_DUMPBITS(2);
		    if(i + j > n)
			return -1;
		    while(j-- > 0)
			ll[i++] = l;
		} else if(j == 17) {	// 3 to 10 zero length codes
		    zip_NEEDBITS(3);
		    j = 3 + zip_GETBITS(3);
		    zip_DUMPBITS(3);
		    if(i + j > n)
			return -1;
		    while(j-- > 0)
			ll[i++] = 0;
		    l = 0;
		} else {		// j == 18: 11 to 138 zero length codes
		    zip_NEEDBITS(7);
		    j = 11 + zip_GETBITS(7);
		    zip_DUMPBITS(7);
		    if(i + j > n)
			return -1;
		    while(j-- > 0)
			ll[i++] = 0;
		    l = 0;
		}
	    }
	
	    // build the decoding tables for literal/length and distance codes
	    zip_bl = zip_lbits;
	    h = new zip_HuftBuild(ll, nl, 257, zip_cplens, zip_cplext, zip_bl);
	    if(zip_bl == 0)	// no literals or lengths
		h.status = 1;
	    if(h.status != 0) {
		if(h.status == 1)
		    ;// **incomplete literal tree**
		return -1;		// incomplete code set
	    }
	    zip_tl = h.root;
	    zip_bl = h.m;
	
	    for(i = 0; i < nd; i++)
		ll[i] = ll[i + nl];
	    zip_bd = zip_dbits;
	    h = new zip_HuftBuild(ll, nd, 0, zip_cpdist, zip_cpdext, zip_bd);
	    zip_td = h.root;
	    zip_bd = h.m;
	
	    if(zip_bd == 0 && nl > 257) {   // lengths but no distances
		// **incomplete distance tree**
		return -1;
	    }
	
	    if(h.status == 1) {
		;// **incomplete distance tree**
	    }
	    if(h.status != 0)
		return -1;
	
	    // decompress until an end-of-block code
	    return zip_inflate_codes(buff, off, size);
	}
	
	function zip_inflate_start() {
	    var i;
	
	    if(zip_slide == null)
		zip_slide = new Array(2 * zip_WSIZE);
	    zip_wp = 0;
	    zip_bit_buf = 0;
	    zip_bit_len = 0;
	    zip_method = -1;
	    zip_eof = false;
	    zip_copy_leng = zip_copy_dist = 0;
	    zip_tl = null;
	}
	
	function zip_inflate_internal(buff, off, size) {
	    // decompress an inflated entry
	    var n, i;
	
	    n = 0;
	    while(n < size) {
		if(zip_eof && zip_method == -1)
		    return n;
	
		if(zip_copy_leng > 0) {
		    if(zip_method != zip_STORED_BLOCK) {
			// STATIC_TREES or DYN_TREES
			while(zip_copy_leng > 0 && n < size) {
			    zip_copy_leng--;
			    zip_copy_dist &= zip_WSIZE - 1;
			    zip_wp &= zip_WSIZE - 1;
			    buff[off + n++] = zip_slide[zip_wp++] =
				zip_slide[zip_copy_dist++];
			}
		    } else {
			while(zip_copy_leng > 0 && n < size) {
			    zip_copy_leng--;
			    zip_wp &= zip_WSIZE - 1;
			    zip_NEEDBITS(8);
			    buff[off + n++] = zip_slide[zip_wp++] = zip_GETBITS(8);
			    zip_DUMPBITS(8);
			}
			if(zip_copy_leng == 0)
			    zip_method = -1; // done
		    }
		    if(n == size)
			return n;
		}
	
		if(zip_method == -1) {
		    if(zip_eof)
			break;
	
		    // read in last block bit
		    zip_NEEDBITS(1);
		    if(zip_GETBITS(1) != 0)
			zip_eof = true;
		    zip_DUMPBITS(1);
	
		    // read in block type
		    zip_NEEDBITS(2);
		    zip_method = zip_GETBITS(2);
		    zip_DUMPBITS(2);
		    zip_tl = null;
		    zip_copy_leng = 0;
		}
	
		switch(zip_method) {
		  case 0: // zip_STORED_BLOCK
		    i = zip_inflate_stored(buff, off + n, size - n);
		    break;
	
		  case 1: // zip_STATIC_TREES
		    if(zip_tl != null)
			i = zip_inflate_codes(buff, off + n, size - n);
		    else
			i = zip_inflate_fixed(buff, off + n, size - n);
		    break;
	
		  case 2: // zip_DYN_TREES
		    if(zip_tl != null)
			i = zip_inflate_codes(buff, off + n, size - n);
		    else
			i = zip_inflate_dynamic(buff, off + n, size - n);
		    break;
	
		  default: // error
		    i = -1;
		    break;
		}
	
		if(i == -1) {
		    if(zip_eof)
			return 0;
		    return -1;
		}
		n += i;
	    }
	    return n;
	}
	
	this.zip_inflate = function(str) {
	    var out, buff;
	    var i, j;
	
	    zip_inflate_start();
	    zip_inflate_data = str;
	    zip_inflate_pos = 0;
	
	    buff = new Array(1024);
	    out = "";
	    while((i = zip_inflate_internal(buff, 0, buff.length)) > 0) {
			for(j = 0; j < i; j++)
			    out += String.fromCharCode(buff[j]);
	    }
	    zip_inflate_data = null; // G.C.
	    return out;
	}
	
	var async_cancel_requested;
	var async_cancel_callback;
	var async_callback;
	var async_progress_callback;
	var async_progress_interval;
	var crc32_table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];
	
	this.inflateAsync = function(options) {
	    if (typeof options.data == "undefined")
	    	throw("inflateAsync() - .data not set") 
	    if (typeof options.success != "function")
	    	throw("inflateAsync() - .success not set or not a function") 
	    if (typeof options.progress != "undefined" && typeof options.progress != "function")
	    	throw("inflateAsync() - .progress not a function")
	    
	    if (typeof options.progressInterval == "undefined") {
	    	options.progressInterval = 1000;
	    }
	    
	    var buff;
	    var i;
	    var crc32 = 0 ^ (-1);
	    
	    zip_inflate_start();
	    zip_inflate_data = options.data;
	    zip_inflate_pos = 0;
	    
	    async_callback = options.success;
	    async_progress_callback = options.progress;
	    async_progress_interval = options.progressInterval;
	    async_cancel_callback = options.cancel;
	    async_cancel_requested = {cancel: false};
	
	    buff = new Array(1024);
	    
	    i = zip_inflate_internal(buff, 0, buff.length);
	    inflateAsyncContinue(i, 0, buff, "", crc32);

	}
	
	function inflateAsyncContinue(i, j, buff, deflatedString, crc32) {
		if (async_cancel_requested.cancel) {
			async_cancel_callback();
			return;
		}
			
		var firstRun = true;
		var startTime = new Date().getTime();
		
	    while((i = (firstRun) ? i : zip_inflate_internal(buff, 0, buff.length)) > 0) {
			for(j = (firstRun) ? j : 0; j < i; j++) {
				firstRun = false;
			    
			    if (new Date().getTime() - startTime > async_progress_interval) {
			    	if (typeof async_progress_callback == "function") async_progress_callback("gzip_inflate", deflatedString.length, async_cancel_requested);
			    	
			    	setTimeout(function() {
			    		inflateAsyncContinue(i, j, buff, deflatedString, crc32);
			    	},0);
			    	return;
			    }
				crc32 = (crc32 >>> 8) ^ crc32_table[(crc32 ^ buff[j]) & 0xFF];
			    deflatedString += String.fromCharCode(buff[j]);
			}
	    }

    	if (typeof async_progress_callback == "function") async_progress_callback("gzip_inflate", deflatedString.length, async_cancel_requested);
    	setTimeout(function() {
			//This timeout let's the browser update the progress to show 100%
			zip_inflate_data = null; // G.C.
			crc32 = crc32 ^ (-1);
			async_callback(deflatedString, (crc32 < 0) ? crc32 + 0x100000000 : crc32);
	    },0);
	}

}

; 
(function(){

	var namespace = window.com.mordritch.mcSim;
	var zip_inflate = new gzipInflater().zip_inflate;
	var zip_inflate_async = namespace.inflateAsync;

	var zip_deflate = namespace.deflate;
	var zip_deflate_async = namespace.deflateAsync;
	
	var readByte = function(input, offset) {
		return input.charCodeAt(offset) & 0xff;
	}
	
	var writeByte = function(input) {
		return String.fromCharCode(input);
	}
	
	var readUInt32 = function(input, offset) {
		returnValue = (
			((readByte(input, offset +3) << 24)) |
			(readByte(input, offset +2) << 16) |
			(readByte(input, offset +1) << 8) |
			(readByte(input, offset))
		);
		//ECMA bitwise operations work as signed 32 bit ints, will need conversion
		return (returnValue < 0) ? returnValue + 0x100000000 : returnValue;
	}
	
	var writeUInt32 = function(input) {
		if (input < 0 || input > 0xffffffff)
			throw("gzip.writeUInt32() - Value ("+input+") out of range, but be from 0 to " +0xffffffff);
		
		return "" +
			String.fromCharCode(input >> 0 & 0xff) +
			String.fromCharCode(input >> 8 & 0xff) +
			String.fromCharCode(input >> 16 & 0xff) +
			String.fromCharCode(input >> 24 & 0xff);
	}
	
	var hasGzipIdentifier = function(input) {
		return (
			readByte(input.substr(0,1)) == GZIP_ID1 &&
			readByte(input.substr(1,1)) == GZIP_ID2
		);
	}
	
	var GZIP_ID1 = 0x1f;
	var GZIP_ID2 = 0x8b;
	var COMPRESSION_METHOD = 0x08; //0x08 = Deflate
	var GZIP_FLAGS = 0x00;
	var COMPRESSION_FLAGS = 0x00;
	var OS_IDENTIFIER = 0xff; //Unknown operating system
	
	var BIT_FLAG_FTEXT = 0;
	var BIT_FLAG_FHCRC = 1;
	var BIT_FLAG_FEXTRA = 2;
	var BIT_FLAG_FNAME = 3;
	var BIT_FLAG_FCOMMENT = 4;
	
	function readZeroTerminatedString(input, offset) {
		var i = offset;
		var returnString = "";
		while (readByte(input.substr(i, 1)) != 0x00) {
			if (i > input.length) {
				throw("gzip.readZeroTerminatedString() - Reached end of file while trying to read zero terminated string");
			}
			returnString+= input.substr(i, 1);
			i++;
		}
		return returnString;
	} 
	
	var writeHeader = function() {
		var unixTimeStamp = Math.round(new Date().getTime() / 1000);
		
		var header = 
			writeByte(GZIP_ID1) + 					// IDentification byte 1
			writeByte(GZIP_ID2) + 					// IDentification byte 2
			writeByte(COMPRESSION_METHOD) +			// Compression Method
			writeByte(GZIP_FLAGS) + 				// Flags
			writeUInt32(unixTimeStamp) + 			// Modification time
			writeByte(COMPRESSION_FLAGS) +			// Extra Flags
			writeByte(OS_IDENTIFIER);				// Operating System
		
		return header;
	}
	

	function hasFlag(input, flag) {
		return (input & flag == flag);
	}

	var deflate = function(input) {
		var header = writeHeader();
		var deflatedData =
			zip_deflate(input);

		var footer = 
			writeUInt32(crc32(input)) +	// CRC32 of the input file
			writeUInt32(input.length);	// Length of the input file
			
		return header + deflatedData + footer;
	}
	
	var deflateAsync = function(options) {
		var data = options.data;
		var successCallback = options.success;
		var progressCallback = options.progress;
		var cancelCallback = options.cancel;

		zip_deflate_async({
			data: data,
			success: function(returnedData, returnedCrc32) {
				var returnData =
					writeHeader() +
					returnedData +
					writeUInt32(crc32(options.data)) +		
					//writeUInt32(returnedCrc32) +		
					writeUInt32(data.length);
					 
				successCallback(returnData);
			},
			progress: function(currentTask, progress, messaging) {
				progressCallback(currentTask, progress, messaging);
			},
			cancel: function() {
				cancelCallback();
			}
		});
	}
	
	
	var inflate = function(input) {
		var pointer = 0;
		var startTime = new Date().getTime();
		
		if (!hasGzipIdentifier(input)) {
			throw("gzip.inflate() - File not recognized as GZIP");
		}
		pointer += 2;
		
		var method = readByte(input, pointer);
		switch (method) {
			case COMPRESSION_METHOD:
				break;
			default:
				throw("gzip.inflate() - Unknown compression method used");
		}
		pointer += 1;
		
		var flagsByte = readByte(input, pointer);
		pointer += 1;
		
		if (hasFlag(flagsByte, BIT_FLAG_FEXTRA)) {
			//gzip header has extra fields present, reading of which not implemented
			throw("gzip.inflate() - Extra fields flag is set, not supported in this implemented");
		}

		if (hasFlag(flagsByte, BIT_FLAG_FNAME)) {
			//Has a file name
			console.log("has nmae");
			pointer += readZeroTerminatedString(input, offset).length + 1;
		}
		
		if (hasFlag(flagsByte, BIT_FLAG_FCOMMENT)) {
			//Has a comment
			console.log("has comment");
			pointer += readZeroTerminatedString(input, offset).length + 1;
		}
		
		if (hasFlag(flagsByte, BIT_FLAG_FHCRC)) {
			//Has a CRC16 of the header data immediately before the compressed data, ignored by this implementation
			pointer += 2;
		}
		
		pointer += 4; //the date and time the original file was modified
		pointer += 2; //the extra field data
		
		var compressedDataLength = input.length - 8 - pointer;
		var compressedData = input.substr(pointer, compressedDataLength);
		
		var uncompressedData = zip_inflate(compressedData);
		pointer += compressedDataLength;
		
		var uncompressedCrc32 = readUInt32(input, pointer);
		pointer += 4;
		
		var uncompressedLength = readUInt32(input, pointer);
		pointer += 4;
		
		if (uncompressedLength != uncompressedData.length) {
			throw("gzip.inflate() - Uncompressed data ("+uncompressedData.length+") length differs from original uncompressed data length ("+uncompressedLength+")");
		}
		
		var calculated_crc32 = crc32(uncompressedData);
		
		if (calculated_crc32 != uncompressedCrc32) {
			console.log(hexDump(uncompressedData));
			throw("gzip.inflate() - CRC32 fail. Calculated value: "+calculated_crc32+", Recorded Value: "+uncompressedCrc32);
		}
		
		console.log("gzip.inflate() - Finished in %sms.", new Date().getTime() - startTime);
		
		return uncompressedData;
	}
	
	function inflateAsync(options) {
	    if (typeof options.data == "undefined")
	    	throw("inflateAsync() - .data not set") 
	    if (typeof options.success != "function")
	    	throw("inflateAsync() - .success not set or not a function") 
	    if (typeof options.progress != "undefined" && typeof options.progress != "function")
	    	throw("inflateAsync() - .progress not a function") 

		var pointer = 0;
		var input = options.data;
		var callback = options.success;
		
		//var startTime = new Date().getTime();
		
		if (!hasGzipIdentifier(input)) {
			throw("gzip.inflate() - File not recognized as GZIP");
		}
		pointer += 2;
		
		var method = readByte(input, pointer);
		switch (method) {
			case COMPRESSION_METHOD:
				break;
			default:
				throw("gzip.inflate() - Unknown compression method used");
		}
		pointer += 1;
		
		var flagsByte = readByte(input, pointer);
		pointer += 1;
		
		if (hasFlag(flagsByte, BIT_FLAG_FEXTRA)) {
			//gzip header has extra fields present, reading of which not implemented
			throw("gzip.inflate() - Extra fields flag is set, not supported in this implementation");
		}

		if (hasFlag(flagsByte, BIT_FLAG_FNAME)) {
			//Has a file name
			console.log("has name");
			pointer += readZeroTerminatedString(input, offset).length + 1;
		}
		
		if (hasFlag(flagsByte, BIT_FLAG_FCOMMENT)) {
			//Has a comment
			console.log("has comment");
			pointer += readZeroTerminatedString(input, offset).length + 1;
		}
		
		if (hasFlag(flagsByte, BIT_FLAG_FHCRC)) {
			//Has a CRC16 of the header data immediately before the compressed data, ignored by this implementation
			pointer += 2;
		}
		
		pointer += 4; //the date and time the original file was modified
		pointer += 2; //the extra field data
		
		var compressedDataLength = input.length - 8 - pointer;
		var compressedData = input.substr(pointer, compressedDataLength);
		
		pointer += compressedDataLength;

		var uncompressedCrc32 = readUInt32(input, pointer);
		pointer += 4;
		
		var uncompressedLength = readUInt32(input, pointer);
		pointer += 4;
		
		var gzip = new gzipInflater();
		gzip.inflateAsync({
			data: compressedData,
			progress: function(type, progressAmount, messaging) {
				options.progress("Inflating GZIP data...", Math.round((progressAmount/uncompressedLength)*100)+"%", messaging);
			},
			progressInterval: options.progressInterval,
			success: function(uncompressedData, crc32_response) {
				if (uncompressedLength != uncompressedData.length) {
					throw("gzip.inflate() - Uncompressed data ("+uncompressedData.length+") length differs from original uncompressed data length ("+uncompressedLength+")");
				}
				console.log("Data length correct.");
				if (crc32_response != uncompressedCrc32) {
					throw("gzip.inflate() - CRC32 fail. Stored: %s, Computed: %s", uncompressedCrc32, crc32_response);
				}
				//console.log("CRC32 pass.");
				callback(uncompressedData);
			},
			cancel: options.cancel
		});
		//console.log("gzip.inflate() - Finished in %sms.", new Date().getTime() - startTime);
	}
	
	// Inspired by: http://www.webtoolkit.info/javascript-crc32.html
	// - Removed unicode support
	// - Improved performance with numeric array lookup instead of substrings
	
	var crc32 = function(str) {
		var crc32_table = [0, 1996959894, 3993919788, 2567524794, 124634137, 1886057615, 3915621685, 2657392035, 249268274, 2044508324, 3772115230, 2547177864, 162941995, 2125561021, 3887607047, 2428444049, 498536548, 1789927666, 4089016648, 2227061214, 450548861, 1843258603, 4107580753, 2211677639, 325883990, 1684777152, 4251122042, 2321926636, 335633487, 1661365465, 4195302755, 2366115317, 997073096, 1281953886, 3579855332, 2724688242, 1006888145, 1258607687, 3524101629, 2768942443, 901097722, 1119000684, 3686517206, 2898065728, 853044451, 1172266101, 3705015759, 2882616665, 651767980, 1373503546, 3369554304, 3218104598, 565507253, 1454621731, 3485111705, 3099436303, 671266974, 1594198024, 3322730930, 2970347812, 795835527, 1483230225, 3244367275, 3060149565, 1994146192, 31158534, 2563907772, 4023717930, 1907459465, 112637215, 2680153253, 3904427059, 2013776290, 251722036, 2517215374, 3775830040, 2137656763, 141376813, 2439277719, 3865271297, 1802195444, 476864866, 2238001368, 4066508878, 1812370925, 453092731, 2181625025, 4111451223, 1706088902, 314042704, 2344532202, 4240017532, 1658658271, 366619977, 2362670323, 4224994405, 1303535960, 984961486, 2747007092, 3569037538, 1256170817, 1037604311, 2765210733, 3554079995, 1131014506, 879679996, 2909243462, 3663771856, 1141124467, 855842277, 2852801631, 3708648649, 1342533948, 654459306, 3188396048, 3373015174, 1466479909, 544179635, 3110523913, 3462522015, 1591671054, 702138776, 2966460450, 3352799412, 1504918807, 783551873, 3082640443, 3233442989, 3988292384, 2596254646, 62317068, 1957810842, 3939845945, 2647816111, 81470997, 1943803523, 3814918930, 2489596804, 225274430, 2053790376, 3826175755, 2466906013, 167816743, 2097651377, 4027552580, 2265490386, 503444072, 1762050814, 4150417245, 2154129355, 426522225, 1852507879, 4275313526, 2312317920, 282753626, 1742555852, 4189708143, 2394877945, 397917763, 1622183637, 3604390888, 2714866558, 953729732, 1340076626, 3518719985, 2797360999, 1068828381, 1219638859, 3624741850, 2936675148, 906185462, 1090812512, 3747672003, 2825379669, 829329135, 1181335161, 3412177804, 3160834842, 628085408, 1382605366, 3423369109, 3138078467, 570562233, 1426400815, 3317316542, 2998733608, 733239954, 1555261956, 3268935591, 3050360625, 752459403, 1541320221, 2607071920, 3965973030, 1969922972, 40735498, 2617837225, 3943577151, 1913087877, 83908371, 2512341634, 3803740692, 2075208622, 213261112, 2463272603, 3855990285, 2094854071, 198958881, 2262029012, 4057260610, 1759359992, 534414190, 2176718541, 4139329115, 1873836001, 414664567, 2282248934, 4279200368, 1711684554, 285281116, 2405801727, 4167216745, 1634467795, 376229701, 2685067896, 3608007406, 1308918612, 956543938, 2808555105, 3495958263, 1231636301, 1047427035, 2932959818, 3654703836, 1088359270, 936918000, 2847714899, 3736837829, 1202900863, 817233897, 3183342108, 3401237130, 1404277552, 615818150, 3134207493, 3453421203, 1423857449, 601450431, 3009837614, 3294710456, 1567103746, 711928724, 3020668471, 3272380065, 1510334235, 755167117];

		var crc = 0 ^ (-1);
		var length = str.length;
		 
		for(var i=0; i<length; i++) {
			crc = (crc >>> 8) ^ crc32_table[(crc ^ str.charCodeAt(i)) & 0xFF];
		}
		
		crc = crc ^ (-1);
		crc = (crc < 0) ? crc + 0x100000000 : crc;
		
	    return crc;
	};
	
	namespace.gzip = {
		deflate: deflate,
		deflateAsync: deflateAsync,
		inflate: inflate,
		inflateAsync: inflateAsync
	};

})();; 
/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * 
 */

com.mordritch.mcSim.World_Schematic = function(schematic, defaultSizeX, defaultSizeY, defaultSizeZ) {
	this.schematic = schematic;
	this.defaultSizeX = defaultSizeX;
	this.defaultSizeY = defaultSizeY; 
	this.defaultSizeZ = defaultSizeZ;
	this.loadedTileEntities = {}; 
	
	this.construct = function() {
		if (this.schematic == null) {
			this.makeNew(this.defaultSizeX, this.defaultSizeY, this.defaultSizeZ);
		}
		else {
			//Not all programs export TileTicks with schematics (EG: MCEdit), if there is no TileTicks NBT node, this creates it
			if (typeof this.schematic.Schematic.payload.TileTicks == 'undefined')
				this.schematic.Schematic.payload.TileTicks =
					{
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					}; 
		}
	}
	
	/**
	 * Returns a referrence which can be used by the nbtParser to save 
	 */
	this.getNbtData = function() {
		return this.schematic;
	}
	
	/**
	 * Makes this instantiation generate and use a new schematic filled with air
	 */
	this.makeNew = function(sizeX, sizeY, sizeZ) {
		var blockByteArray = [];
		var dataByteArray = [];
		
		for (var i = 0; i < sizeX*sizeY*sizeZ; i++) {
			blockByteArray.push(0);
			dataByteArray.push(0);
		}
		 
		this.schematic = {
			Schematic: {
				type: 10,
				payload: {
					Height: {
						type: 2, 
						payload: sizeY
					},
					Length: {
						type: 2,
						payload: sizeZ
					},
					Width: {
						type: 2,
						payload: sizeX
					},
					Entities: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					TileEntities: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					TileTicks: {
						type: 9,
						payload: {
							ofType: 10,
							list: []
						}
					},
					Materials: {
						type: 8,
						payload: "Alpha"
					},
					Blocks: {
						type: 7,
						payload: blockByteArray
					},
					Data: {
						type: 7,
						payload: dataByteArray
					}
				}
			}
		};
	}

	/**
	 * Returns position within the bytearray derived from minecraft coordinates
	 * 
	 * Since BlockId and meta data layout are the same, we can use a common function
	 * to calculate the offset for both.
	 * 
	 * The overrideSize parameters are used by the setSize function.
	 * 
	 * @param	{Integer}	x				In terms of minecraft co-ordinate system
	 * @param	{Integer}	y				In terms of minecraft co-ordinate system
	 * @param	{Integer}	z				In terms of minecraft co-ordinate system
	 * @param	{Integer}	overrideSizeX	(Optional) Use this size instead of the schematics size
	 * @param	{Integer}	overrideSizeY	(Optional) Use this size instead of the schematics size
	 * @param	{Integer}	overrideSizeZ	(Optional) Use this size instead of the schematics size 
	 * @return	{Integer}					The offset of the byte
	 */
	this.getPosition = function(x, y, z, overrideSizeX, overrideSizeY, overrideSizeZ) {
		/*
		The Minecraft coordinate system is as follows:
		(http://www.minecraftwiki.net/wiki/Alpha_Level_Format/Chunk_File_Format#Block_Format)

		X 			increases East, decreases West
		Y 			increases upwards, decreases downwards
		Z			increases South, decreases North
		*/
		
		var schematicSizeX = this.schematic.Schematic.payload.Width.payload;
		var schematicSizeY = this.schematic.Schematic.payload.Height.payload;
		var schematicSizeZ = this.schematic.Schematic.payload.Length.payload;
		
		if (typeof overrideSizeX != "undefined") schematicSizeX = overrideSizeX;
		if (typeof overrideSizeY != "undefined") schematicSizeY = overrideSizeY;
		if (typeof overrideSizeZ != "undefined") schematicSizeZ = overrideSizeZ; 
		
		if (x >= schematicSizeX || x < 0)
			throw new Error("DataSchematic.getPosition(): x is out of bounds.")
		
		if (y >= schematicSizeY || y < 0)
			throw new Error("DataSchematic.getPosition(): y is out of bounds.")
		
		if (z >= schematicSizeZ || z < 0)
			throw new Error("DataSchematic.getPosition(): z is out of bounds.")
		
		return x + (z * schematicSizeX) + (y * schematicSizeX * schematicSizeZ);
	}
	
	/**
	 * Returns the blockID at specified minecraft world co-ordinates
	 */
	this.getBlockId = function(x, y, z) {
		//If a function calls for a blocktype which is off the grid, return 0 (air)
		if (
			x >= this.getSizeX() || x < 0
			|| y >= this.getSizeY()	|| y < 0
			|| z >= this.getSizeZ()	|| z < 0
		) {
			return 0;
		}
		else {
			return this.schematic.Schematic.payload.Blocks.payload[this.getPosition(x,y,z)];
		}
	}
	
	/**
	 * Returns the meta data for block at specified minecraft world co-ordinates
	 */
	this.getBlockMetadata = function(x, y, z) {
		//If a function calls for a blocktype which is off the grid, return 0
		if (
			x >= this.getSizeX() || x < 0
			|| y >= this.getSizeY()	|| y < 0
			|| z >= this.getSizeZ()	|| z < 0
		) {
			return 0;
		}
		else {
			return this.schematic.Schematic.payload.Data.payload[this.getPosition(x,y,z)];
		}
	}

	/**
	 * Sets a block and its metadata to specified values 
	 */
	this.setBlockAndMetadata = function(x, y, z, blockID, metadata) {
		if (blockID > 0xff || blockID < 0x00) throw new Error("World_Schematic.setBlockAndMetadata(): blockID value must be from 0 to 255.");
		var position = this.getPosition(x, y, z);
		this.schematic.Schematic.payload.Blocks.payload[position] = blockID; 
		this.setBlockMetadata(x, y, z, metadata);
	}

	this.setBlockID = function(x, y, z, blockID) {
		this.setBlockAndMetadata(x, y, z, blockID, 0);
	}
	
	this.setBlockMetadata = function(x, y, z, blockMetadata) {
		if (blockMetadata > 0xf || blockMetadata < 0x00) throw new Error("World_Schematic.setBlockMetadata(): value must be from 0 to 127.");
		var position = this.getPosition(x, y, z);
		this.schematic.Schematic.payload.Data.payload[position] = blockMetadata;
	}

	/**
	 * Sets a block and its metadata to specified values and resizes the schematic if values fall out of bounds
	 * 
	 * @param x
	 * @param y
	 * @param z
	 * @param blockID
	 * @param metadata
	 *
	 */
	this.forceSetBlockAndMetadata = function(x, y, z, blockID, metadata) {
		if (
			x < 0 ||
			y < 0 ||
			z < 0 ||
			x > this.getSizeX() -1 ||
			y > this.getSizeY() -1 ||
			z > this.getSizeZ() -1
		) {
			this.setDimensions(
				// if dimension is greater than or equal to the total size of the
				// schematic then set the size of the schematic to match; if not
				// get the current size of the schematic and add the inverse of the
				// dimension if the dimension is less than zero
				x >= this.getSizeX() ? x + 1 : this.getSizeX() + (x < 0 ? x * -1 : 0),
				y >= this.getSizeY() ? y + 1 : this.getSizeY() + (y < 0 ? y * -1 : 0),
				z >= this.getSizeZ() ? z + 1 : this.getSizeZ() + (z < 0 ? z * -1 : 0),
				// offset the schematic to the inverse of the dimension if
				// the dimension is less than zero
				x < 0 ? x * -1 : 0,
				y < 0 ? y * -1 : 0,
				z < 0 ? z * -1 : 0
			);
		}
		// because we've already offset the schematic we'll now
		// reset any dimensions below zero
		if ( x < 0 ) x = 0;
		if ( y < 0 ) y = 0;
		if ( z < 0 ) z = 0;
		this.setBlockAndMetadata(x, y, z, blockID, metadata);
	}
	
	/**
	 * Change the dimensions of the schematic
	 * 
	 * One can use the offset to decide where the old data will be in relation
	 * to the updated size
	 * 
	 * It's important that tileEntities, entities and tickdata are dumped from the world into the schematic
	 * before processing so that their coordinates can be updated accordingly
	 */
	this.setDimensions = function(sizeX, sizeY, sizeZ, offsetX, offsetY, offsetZ) {
		var oldBlocksArray = this.schematic.Schematic.payload.Blocks.payload;
		var oldDataArray = this.schematic.Schematic.payload.Data.payload;
		var oldSizeX = this.schematic.Schematic.payload.Width.payload;
		var oldSizeY = this.schematic.Schematic.payload.Height.payload;
		var oldSizeZ = this.schematic.Schematic.payload.Length.payload;
		
		this.schematic.Schematic.payload.Blocks.payload = [];
		this.schematic.Schematic.payload.Data.payload = [];
		this.schematic.Schematic.payload.Width.payload = sizeX;
		this.schematic.Schematic.payload.Height.payload = sizeY;
		this.schematic.Schematic.payload.Length.payload = sizeZ;
		
		//Migrate blocks and data:
		var newOffSet = 0;
		for (var iy = 0; iy < sizeY; iy++) {
			for (var iz = 0; iz < sizeZ; iz++) {
				for (var ix = 0; ix < sizeX; ix++) {
					//For loops deliberately nested in this order so that getPosition increments normally
					if (
						ix - offsetX >= 0 && ix - offsetX < oldSizeX
						&&
						iy - offsetY >= 0 && iy - offsetY < oldSizeY
						&&
						iz - offsetZ >= 0 && iz - offsetZ < oldSizeZ
					) {
						var oldOffSet = this.getPosition(ix-offsetX, iy-offsetY, iz-offsetZ, oldSizeX, oldSizeY, oldSizeZ);

						this.schematic.Schematic.payload.Blocks.payload[newOffSet] = oldBlocksArray[oldOffSet];
						this.schematic.Schematic.payload.Data.payload[newOffSet] = oldDataArray[oldOffSet];
					}
					else {
						//out of range, set it to blank
						this.schematic.Schematic.payload.Blocks.payload[newOffSet] = 0;
						this.schematic.Schematic.payload.Data.payload[newOffSet] = 0;
					}
					newOffSet++;
				}
			}
		}
		
		//Migrate tile entities and any which are no longer within the schematic dimensions
		var tileEntities = this.schematic.Schematic.payload.TileEntities.payload.list;
		for (var i = 0, newTileEntities = []; i < tileEntities.length; i++) {
			tileEntities[i].x.payload = tileEntities[i].x.payload + offsetX;
			tileEntities[i].y.payload = tileEntities[i].y.payload + offsetY;
			tileEntities[i].z.payload = tileEntities[i].z.payload + offsetZ;

			if (
				tileEntities[i].x.payload < sizeX && 
				tileEntities[i].y.payload < sizeY && 
				tileEntities[i].z.payload < sizeZ
			) {
				newTileEntities.push(tileEntities[i]);
			}
		}
		this.schematic.Schematic.payload.TileEntities.payload.list = newTileEntities;
		
		//Migrate entities and any which are no longer within the schematic dimensions
		var entities = this.schematic.Schematic.payload.Entities.payload.list;
		for (var i = 0, newEntities = []; i < entities.length; i++) {
			entities[i].Pos.payload.list[0] = entities[i].Pos.payload[0].list + offsetX;
			entities[i].Pos.payload.list[1] = entities[i].Pos.payload[1].list + offsetY;
			entities[i].Pos.payload.list[2] = entities[i].Pos.payload[2].list + offsetZ;

			if (
				entities[i].Pos.payload.list[0] < sizeX && 
				entities[i].Pos.payload.list[1] < sizeY && 
				entities[i].Pos.payload.list[2] < sizeZ
			) {
				newEntities.push(entities[i]);
			}
		}
		this.schematic.Schematic.payload.Entities.payload.list = newEntities;
		
		//Migrate tick data and any which are no longer within the schematic dimensions
		var tileTicks = this.schematic.Schematic.payload.TileTicks.payload.list;
		for (var i = 0, newTileTicks = []; i < tileTicks.length; i++) {
			tileTicks[i].x.payload = tileTicks[i].x.payload + offsetX;
			tileTicks[i].y.payload = tileTicks[i].y.payload + offsetY;
			tileTicks[i].z.payload = tileTicks[i].z.payload + offsetZ;

			if (
				tileTicks[i].x.payload < sizeX && 
				tileTicks[i].y.payload < sizeY && 
				tileTicks[i].z.payload < sizeZ
			) {
				newTileTicks.push(tileTicks[i]);
			}
			this.schematic.Schematic.payload.TileTicks.payload.list = newTileTicks;
		}
	}
	
	/**
	 * Rotates a selection of blocks where amount is the number of times to rotate the area clockwise by 90 degrees
	 * 
	 * Assumes that tickData and entities 
	 */
	this.rotateSelection = function(amount, startX, startZ, sizeX, sizeZ) {
		//TODO: Assumes for whole schematic, ignoring start and size parameters
		var AMOUNT_90 = 90;
		var AMOUNT_180 = 180;
		var AMOUNT_270 = 270;
		
		var newBlocks = [];
		var newData = [];
		var newSizeX, newSizeZ;
		var deltaX, deltaZ; 
		var blockId, blockMetadata;
		var oldPosition;
		var oldSizeX = this.getSizeX(); 
		var oldSizeY = this.getSizeY(); 
		var oldSizeZ = this.getSizeZ(); 
		var oldPosX, oldPosZ, newPosX, newPosZ;
		
		//For loop deliberately nested in that order so that getPosition function result increments normally, allowing us to just "push" into our array
		switch (amount) {
			case AMOUNT_90:
				newSizeX = oldSizeZ;
				newSizeZ = oldSizeX;
				for (var y=0; y<oldSizeY; y++) { for (var z=0; z<newSizeZ; z++) { for (var x=0; x<newSizeX; x++) {
					oldPosX = z;
					oldPosZ = newSizeX - x - 1;
					oldPosition = this.getPosition(oldPosX, y, oldPosZ, oldSizeX, oldSizeY, oldSizeZ);

					blockId = this.schematic.Schematic.payload.Blocks.payload[oldPosition];
					blockMetadata = this.schematic.Schematic.payload.Data.payload[oldPosition];

					newBlocks.push(blockId);
					newData.push(blockMetadata);
				} }	}
				this.schematic.Schematic.payload.Width.payload = newSizeX;
				this.schematic.Schematic.payload.Length.payload = newSizeZ;
				break;
			case AMOUNT_180:
				newSizeX = oldSizeX;
				newSizeZ = oldSizeZ;
				for (var y=0; y<oldSizeY; y++) { for (var z=0; z<newSizeZ; z++) { for (var x=0; x<newSizeX; x++) {
					oldPosition = this.getPosition(oldSizeX-x-1, y, oldSizeZ-z-1, oldSizeX, oldSizeY, oldSizeZ);

					blockId = this.schematic.Schematic.payload.Blocks.payload[oldPosition];
					blockMetadata = this.schematic.Schematic.payload.Data.payload[oldPosition];

					newBlocks.push(blockId);
					newData.push(blockMetadata);
				} }	}
				break;
			case AMOUNT_270:
				newSizeX = oldSizeZ;
				newSizeZ = oldSizeX;
				for (var y=0; y<oldSizeY; y++) { for (var z=0; z<newSizeZ; z++) { for (var x=0; x<newSizeX; x++) {
					oldPosition = this.getPosition(oldSizeX-z-1, y, x, oldSizeX, oldSizeY, oldSizeZ);

					blockId = this.schematic.Schematic.payload.Blocks.payload[oldPosition];
					blockMetadata = this.schematic.Schematic.payload.Data.payload[oldPosition];

					newBlocks.push(blockId);
					newData.push(blockMetadata);
				} }	}
				this.schematic.Schematic.payload.Width.payload = newSizeX;
				this.schematic.Schematic.payload.Length.payload = newSizeZ;
				break;
			default: throw new Error("Unexpected amount: " + amount);
		}
		this.schematic.Schematic.payload.Blocks.payload = newBlocks;
		this.schematic.Schematic.payload.Data.payload = newData;
		
		//Migrate tile entities
		var tileEntities = this.schematic.Schematic.payload.TileEntities.payload.list;
		switch (amount) {
			case AMOUNT_90:
				for (var i = 0; i < tileEntities.length; i++) {
					oldPosX = tileEntities[i].x.payload;
					oldPosZ = tileEntities[i].z.payload;
					newPosX = oldSizeZ - oldPosZ - 1;
					newPosZ = oldPosX;
					
					tileEntities[i].x.payload = newPosX; 
					tileEntities[i].z.payload = newPosZ;
				}
				break;
			case AMOUNT_180:
				for (var i = 0; i < tileEntities.length; i++) {
					oldPosX = tileEntities[i].x.payload;
					oldPosZ = tileEntities[i].z.payload;
					newPosX = oldSizeX - oldPosX - 1;
					newPosZ = oldSizeZ - oldPosZ - 1;
					
					tileEntities[i].x.payload = newPosX; 
					tileEntities[i].z.payload = newPosZ;
				}
				break;
			case AMOUNT_270:
				for (var i = 0; i < tileEntities.length; i++) {
					oldPosX = tileEntities[i].x.payload;
					oldPosZ = tileEntities[i].z.payload;
					newPosX = oldPosZ;
					newPosZ = oldSizeX - oldPosX - 1;
					
					tileEntities[i].x.payload = newPosX; 
					tileEntities[i].z.payload = newPosZ;
				}
				break;
			default: throw new Error("Unexpected amount: " + amount);
		}
		
		//Migrate entities
		var entities = this.schematic.Schematic.payload.Entities.payload.list;
		switch (amount) {
			case AMOUNT_90:
				for (var i = 0; i < entities.length; i++) {
					oldPosX = entities[i].Pos.payload.list[0];
					oldPosZ = entities[i].Pos.payload.list[2];
					newPosX = oldSizeZ - oldPosZ - 1;
					newPosZ = oldPosX;
					
					entities[i].Pos.payload.list[0] = newPosX;
					entities[i].Pos.payload.list[2] = newPosZ;
				}
				break;
			case AMOUNT_180:
				for (var i = 0; i < entities.length; i++) {
					oldPosX = entities[i].Pos.payload.list[0];
					oldPosZ = entities[i].Pos.payload.list[2];
					newPosX = oldSizeX - oldPosX - 1;
					newPosZ = oldSizeZ - oldPosZ - 1;
					
					entities[i].Pos.payload.list[0] = newPosX;
					entities[i].Pos.payload.list[2] = newPosZ;
				}
				break;
			case AMOUNT_270:
				for (var i = 0; i < entities.length; i++) {
					oldPosX = entities[i].Pos.payload.list[0];
					oldPosZ = entities[i].Pos.payload.list[2];
					newPosX = oldPosZ;
					newPosZ = oldSizeX - oldPosX - 1;
					
					entities[i].Pos.payload.list[0] = newPosX;
					entities[i].Pos.payload.list[2] = newPosZ;
				}
				break;
			default: throw new Error("Unexpected amount: " + amount);
		}
		
		//Migrate tick data
		var tileTicks = this.schematic.Schematic.payload.TileTicks.payload.list;
		switch (amount) {
			case AMOUNT_90:
				for (var i = 0; i < tileTicks.length; i++) {
					oldPosX = tileTicks[i].x.payload
					oldPosZ = tileTicks[i].z.payload
					newPosX = oldSizeZ - oldPosZ - 1;
					newPosZ = oldPosX;

					tileTicks[i].x.payload = newPosX;
					tileTicks[i].z.payload = newPosZ;
				}
				break;
			case AMOUNT_180:
				for (var i = 0; i < tileTicks.length; i++) {
					oldPosX = tileTicks[i].x.payload
					oldPosZ = tileTicks[i].z.payload
					newPosX = oldSizeX - oldPosX - 1;
					newPosZ = oldSizeZ - oldPosZ - 1;

					tileTicks[i].x.payload = newPosX;
					tileTicks[i].z.payload = newPosZ;
				}
				break;
			case AMOUNT_270:
				for (var i = 0; i < tileTicks.length; i++) {
					oldPosX = tileTicks[i].x.payload
					oldPosZ = tileTicks[i].z.payload
					newPosX = oldPosZ;
					newPosZ = oldSizeX - oldPosX - 1;

					tileTicks[i].x.payload = newPosX;
					tileTicks[i].z.payload = newPosZ;
				}
				break;
			default: throw new Error("Unexpected amount: " + amount);
		}
	}
	
	/**
	 * Returns the x size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeX = function() {
		return this.schematic.Schematic.payload.Width.payload;
	}
	
	/**
	 * Returns the y size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeY = function() {
		return this.schematic.Schematic.payload.Height.payload;
	}
	
	/**
	 * Returns the z size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeZ = function() {
		return this.schematic.Schematic.payload.Length.payload;
	}
	
	/**
	 * @return {Array}	All Entities as an array of NBT objects
	 */
	this.getEntities = function() {
		return this.schematic.Schematic.payload.Entities.payload.list;
	}
	
	/**
	 * @param	entities	All Entities as an array of NBT objects
	 */
	this.setEntities = function(entities) {
		this.schematic.Schematic.payload.Entities.payload.list = entities;
	}
	
	/**
	 * @return {Array}	All TileEntities as an array of NBT objects
	 */
	this.getTileEntities = function() {
		return this.schematic.Schematic.payload.TileEntities.payload.list;
	}
	
	/**
	 * @param	tileEntities	All TileEntities as an array of NBT objects
	 */
	this.setTileEntities = function(tileEntities) {
		this.schematic.Schematic.payload.TileEntities.payload.list = tileEntities;
	}
	
	/**
	 * @return {Array}	All TileTicks as an array of NBT objects
	 */
	this.getTickData = function() {
		return this.schematic.Schematic.payload.TileTicks.payload.list;
	}
	
	/**
	 * @param	tileTicks	All TileTicks as an array of NBT objects
	 */
	this.setTickData = function(tileTicks) {
		this.schematic.Schematic.payload.TileTicks.payload.list = tileTicks;
	}
	
	/**
	 * Removes internal reference to the schematic object allowing it to be freed by the garbage collector.
	 * 
	 * We can't force freeing of memory in Javascript, but as long as there is no referrence to the object
	 * then the garbage collector should eventually free it up. 
	 */
	this.destroy = function() {
		delete this.schematic;
	}
    
	/**
	 * @param x
	 * @param y
	 * @param z
	 * @return object containing values x, y, z representing the chunk position
	 */
	this.getBlockChunkPosition = function(x, y, z){
		x = Math.floor( x / 16 );
		y = Math.floor( y / 16 );
		z = Math.floor( z / 16 );
		return {
	  		x: x,
	  		y: y,
	  		z: z
	  	};
	}

	this.construct();	
}
; 
/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] huh?');
							}
						}
					}
					else {
						throw('[sprintf] huh?');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] huh?');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};
; 
com.mordritch.mcSim.World_Level = function(level) {
	this.level = level;
	
	this.chunkSizeX = 16;
	this.chunkSizeY = 128;
	this.chunkSizeZ = 16;
	
	/**
	 * Makes this instantiation generate and use a new schematic filled with air
	 */
	/*
	this.makeNew = function(sizeX, sizeY, sizeZ) {
		var schematicSizeX = 16;
		var schematicSizeY = 128;
		var schematicSizeZ = 16;

		var byteArrayContents = "";
		
		for (var i = 0; i < sizeX*sizeY*sizeZ; i++) {
			byteArrayContents += String.fromCharCode(0);
		}
		 
		this.schematic = {
			Level: {
				type: 10,
				payload: {
					Height: {
						type: 2, 
						payload: 128
					},
					Length: {
						type: 2,
						payload: 16
					},
					Width: {
						type: 2,
						payload: 16
					},
					Entities: {
						type: 9,
						payload: {
							type: 10,
							payload: new Array()
						}
					},
					TileEntities: {
						type: 9,
						payload: {
							type: 10,
							payload: new Array()
						}
					},
					Materials: {
						type: 8,
						payload: "Alpha"
					},
					Blocks: {
						type: 7,
						payload: byteArrayContents
					},
					Data: {
						type: 7,
						payload: byteArrayContents
					}
				}
			}
		};
	}
	*/

	/**
	 * Returns the position:
	 */
	this.getPosition = function(x, y, z) {
		/*
		The Minecraft coordinate system is as follows:
		(http://www.minecraftwiki.net/wiki/Alpha_Level_Format/Chunk_File_Format#Block_Format)

		X 			increases East, decreases West
		Y 			increases upwards, decreases downwards
		Z			increases South, decreases North
		
		unsigned char BlockID = Blocks[ y + z * ChunkSizeY(=128) + x * ChunkSizeY(=128) * ChunkSizeZ(=16) ];
		*/
		
		if (x >= this.chunkSizeX || x < 0)
			throw new Error("WorldTypeLevel.getPosition(): x is out of bounds.")
		
		if (y >= this.chunkSizeY || y < 0)
			throw new Error("WorldTypeLevel.getPosition(): y is out of bounds.")
		
		if (z >= this.chunkSizeZ || z < 0)
			throw new Error("WorldTypeLevel.getPosition(): z is out of bounds.")
		
		return y + z * this.chunkSizeY + x * this.chunkSizeY * this.chunkSizeZ;
	}
	
	/**
	 * Returns the blockID at specified minecraft world co-ordinates
	 */
	this.getBlockId = function(x, y, z) {
		//If a function calls for a blocktype which is off the grid, return 0 (air)
		if (
			x >= this.getSizeX() || x < 0
			|| y >= this.getSizeY()	|| y < 0
			|| z >= this.getSizeZ()	|| z < 0
		) {
			return 0;
		}
		else {
			return this.level.Level.payload.Blocks.payload.charCodeAt(this.getPosition(x,y,z)) & 0xff;
		}
	}
	
	/**
	 * Returns the meta data for block at specified minecraft world co-ordinates
	 */
	this.getBlockMetadata = function(x, y, z) {
		var position = Math.floor(this.getPosition(x,y,z)/2);
		var fullByte = this.level.Level.payload.Data.payload.charCodeAt(position) & 0xff;

		if (this.getPosition(x,y,z)%2 == 0) {
			return fullByte & 0x3;
		}
		else {
			return fullByte >>> 4;
		}
	}
	
	/**
	 * Returns the x size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeX = function() {
		return this.chunkSizeX;
	}
	
	/**
	 * Returns the y size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeY = function() {
		return this.chunkSizeY;
	}
	
	/**
	 * Returns the z size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeZ = function() {
		return this.chunkSizeX;
	}
	
	/**
	 * Retrieve a Tile Entity
	 */
	this.getTileEntity = function(x, y, z) {
		//TODO: Implement
	}
	
	/**
	 * Retrieve an entity
	 */
	this.getEntity = function(x, y, z) {
		
	}
	
	/**
	 * Removes internal reference to the schematic object allowing it to be freed by the garbage collector.
	 * 
	 * We can't force freeing of memory in Javascript, but as long as there is no referrence to the object
	 * then the garbage collector should eventually free it up. 
	 */
	this.destroy = function() {
		this.level = undefined;
	}
}
; 
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
		countForCurrentLine++
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

}; 
$(document).ready(function () {
	//IE does not have a "console" object unless the debugger is running, let's create one if this is the case.
	if (typeof window['console'] == 'undefined') window['console'] = new function() {this.log = function() {};};
	
	if (!window.HTMLCanvasElement) {
		return; //canvas unsupported
	}
	
	nameSpace = com.mordritch.mcSim;
	nameSpace.domIdCounter = 0; //A counter for creating unique named DOM IDs
	nameSpace.gui = new com.mordritch.mcSim.Gui_FullApp();
});

function g() {
	nameSpace = com.mordritch.mcSim;
	nameSpace.domIdCounter = 0; //A counter for creating unique named DOM IDs
	nameSpace.gui = new com.mordritch.mcSim.Gui_FullApp();
}


//TODO: Have these moved into another file perhaps?

// Use the browser's built-in functionality to quickly and safely escape the
// string
if (typeof window.escapeHtml == "undefined") {
	window.escapeHtml = function(str) {
	    var div = document.createElement('div');
	    div.appendChild(document.createTextNode(str));
	    return div.innerHTML;
	}
}

// UNSAFE with unsafe strings; only use on previously-escaped ones!
if (typeof window.unescapeHtml == "undefined") {
	window.unescapeHtml = function(escapedStr) {
	    var div = document.createElement('div');
	    div.innerHTML = escapedStr;
	    var child = div.childNodes[0];
	    return child ? child.nodeValue : '';
	}
}; 
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
; 
(function(){
	var namespace = com.mordritch.mcSim;
	
	namespace.Material_ = function(par1MapColor) {
		this.canBurn = false; /** Bool defining if the block can burn or not. */
		this.groundCover = false; /** Indicates if the material is a form of ground cover, e.g. Snow */
		this.isTranslucent = false; /** Indicates if the material is translucent */
		this.materialMapColor; //of type MapColor /** The color index used to draw the blocks of this material on maps. */
		this.canHarvest = false; /* Determines if the materials is one that can be collected by the player. */
		this.mobilityFlag = 0; /** Mobility information flag. 0 indicates that this block is normal, 1 indicates that it can't push other blocks, 2 indicates that it can't be pushed. */
	
		this.construct = function(par1MapColor)
		{
			this.canHarvest = true;
			this.materialMapColor = par1MapColor;
		}
	
		/**
		 * Returns if blocks of these materials are liquids.
		 */
		this.isLiquid = function()
		{
			return false;
		}
	
		this.isSolid = function()
		{
			return true;
		}
	
		/**
		 * Will prevent grass from growing on dirt underneath and kill any grass below it if it returns true
		 */
		this.getCanBlockGrass = function()
		{
			return true;
		}
	
		/**
		 * Returns if this material is considered solid or not
		 */
		this.blocksMovement = function()
		{
			return true;
		}
	
		/**
		 * Marks the material as translucent
		 */
		this.setTranslucent = function()
		{
			this.isTranslucent = true;
			return this;
		}
	
		/**
		 * Disables the ability to harvest this material.
		 */
		this.setNoHarvest = function()
		{
			this.canHarvest = false;
			return this;
		}
	
		/**
		 * Set the canBurn bool to True and return the current object.
		 */
		this.setBurning = function()
		{
			this.canBurn = true;
			return this;
		}
	
		/**
		 * Returns if the block can burn or not.
		 */
		this.getCanBurn = function()
		{
			return this.canBurn;
		}
	
		/**
		 * Sets the material as a form of ground cover, e.g. Snow
		 */
		this.setGroundCover = function()
		{
			this.groundCover = true;
			return this;
		}
	
		/**
		 * Return whether the material is a form of ground cover, e.g. Snow
		 */
		this.isGroundCover = function()
		{
			return this.groundCover;
		}
	
		/**
		 * Indicates if the material is translucent
		 */
		this.isOpaque = function()
		{
			if (this.isTranslucent)
			{
				return false;
			}
			else
			{
				return this.blocksMovement();
			}
		}
	
		/**
		 * Returns true if material can be harvested by player.
		 */
		this.isHarvestable = function()
		{
			return this.canHarvest;
		}
	
		/**
		 * Returns the mobility information of the material, 0 = free, 1 = can't push but can move over, 2 = total
		 * immobility and stop pistons
		 */
		this.getMaterialMobility = function()
		{
			return this.mobilityFlag;
		}
	
		/**
		 * This type of material can't be pushed, but pistons can move over it.
		 */
		this.setNoPushMobility = function()
		{
			mobilityFlag = 1;
			return this;
		}
	
		/**
		 * This type of material can't be pushed, and pistons are blocked to move.
		 */
		this.setImmovableMobility = function()
		{
			mobilityFlag = 2;
			return this;
		}
	
		this.construct(par1MapColor);
	}
})();
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialLiquid";
	
	namespace[funcName] = function(par1MapColor) {this.construct(par1MapColor);};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto._construct = proto.construct;
	proto.construct = function(par1MapColor)
	{
		this._construct(par1MapColor);
		this.setGroundCover();
		this.setNoPushMobility();
	}

	/**
	 * Returns if blocks of these materials are liquids.
	 */
	proto.isLiquid = function()
	{
		return true;
	}

	/**
	 * Returns if this material is considered solid or not
	 */
	proto.blocksMovement = function()
	{
		return false;
	}

	proto.isSolid = function()
	{
		return false;
	}

}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialLogic";
	
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
; 
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
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialTransparent";
	
	namespace[funcName] = function(par1MapColor) {this.construct(par1MapColor);};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto._construct = proto.construct;
	proto.construct = function(par1MapColor)
	{
		this._construct(par1MapColor);
		this.setGroundCover();
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
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "Material_";
	var funcName = "MaterialWeb";
	
	namespace[funcName] = function(par1MapColor) {this.construct(par1MapColor);};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto._construct = proto.construct;
	proto.construct = function(par1MapColor)
	{
		this._construct(par1MapColor);
	}

	/**
	 * Returns if this material is considered solid or not
	 */
	proto.blocksMovement = function()
	{
		return false;
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var MapColor = namespace.MapColor;
	
	namespace.Material = {
		air: new namespace.MaterialTransparent(MapColor.airColor),
		grass: new namespace.Material_(MapColor.grassColor),
		ground: new namespace.Material_(MapColor.dirtColor),
		wood: (new namespace.Material_(MapColor.woodColor)).setBurning(),
		rock: (new namespace.Material_(MapColor.stoneColor)).setNoHarvest(),
		iron: (new namespace.Material_(MapColor.ironColor)).setNoHarvest(),
		water: (new namespace.MaterialLiquid(MapColor.waterColor)).setNoPushMobility(),
		lava: (new namespace.MaterialLiquid(MapColor.tntColor)).setNoPushMobility(),
		leaves: (new namespace.Material_(MapColor.foliageColor)).setBurning().setTranslucent().setNoPushMobility(),
		plants: (new namespace.MaterialLogic(MapColor.foliageColor)).setNoPushMobility(),
		vine: (new namespace.MaterialLogic(MapColor.foliageColor)).setBurning().setNoPushMobility().setGroundCover(),
		sponge: new namespace.Material_(MapColor.clothColor),
		cloth: (new namespace.Material_(MapColor.clothColor)).setBurning(),
		fire: (new namespace.MaterialTransparent(MapColor.airColor)).setNoPushMobility(),
		sand: new namespace.Material_(MapColor.sandColor),
		circuits: (new namespace.MaterialLogic(MapColor.airColor)).setNoPushMobility(),
		glass: (new namespace.Material_(MapColor.airColor)).setTranslucent(),
		redstoneLight: new namespace.Material_(MapColor.airColor),
		tnt: (new namespace.Material_(MapColor.tntColor)).setBurning().setTranslucent(),
		unused: (new namespace.Material_(MapColor.foliageColor)).setNoPushMobility(),
		ice: (new namespace.Material_(MapColor.iceColor)).setTranslucent(),
		snow: (new namespace.MaterialLogic(MapColor.snowColor)).setGroundCover().setTranslucent().setNoHarvest().setNoPushMobility(),
		craftedSnow: (new namespace.Material_(MapColor.snowColor)).setNoHarvest(),
		cactus: (new namespace.Material_(MapColor.foliageColor)).setTranslucent().setNoPushMobility(),
		clay: new namespace.Material_(MapColor.clayColor),
		pumpkin: (new namespace.Material_(MapColor.foliageColor)).setNoPushMobility(),
		dragonEgg: (new namespace.Material_(MapColor.foliageColor)).setNoPushMobility(),
		portal: (new namespace.MaterialPortal(MapColor.airColor)).setImmovableMobility(),
		cake: (new namespace.Material_(MapColor.airColor)).setNoPushMobility(),
		web: (new namespace.MaterialWeb(MapColor.clothColor)).setNoHarvest().setNoPushMobility(),
		piston: (new namespace.Material_(MapColor.stoneColor)).setImmovableMobility()
	}
})();
; 
com.mordritch.mcSim.MinecraftSimulator = function() {
	this.worldIsLoaded = false;
	this.modelViews = [];
	
	this.init = function() {
		this.Block = new com.mordritch.mcSim.Block(); //consistent with MCP name
		this.World = null //consistent with MCP name, will be populated with world data
		this.updateTicker = new com.mordritch.mcSim.ticker(this);
	}
	
	/**
	 * In the source code, resides in the renderer
	 * 
	 * This is called by blocks as they need their look updated.
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.modelViews) {
			//TODO: Consider passing this.World along to the draw routine
			
			//The game also always re-renders all neighboring blocks:
			this.modelViews[i].markBlockNeedsUpdate(posX, posY, posZ);
		}
	}
	
	/**
	 * In the source code, resides in the renderer
	 * 
	 * This is called by ranges of blocks as they need their look updated.
	 */
	this.markBlockRangeNeedsUpdate = function(posX1, posY1, posZ1, posX2, posY2, posZ2) {
		for (var i in this.modelViews) {
			//TODO: Make this mark all the blocks in the range.
			//TODO: Consider passing this.World along to the draw routine
			this.modelViews[i].markBlockNeedsUpdate(posX1, posY1, posZ1);
		}
	}
	
	/**
	 * Called anytime we start or load a schematic, to ensure we don't have things like entities or tickData lying around;
	 */
	this.preLoad = function() {
		this.worldIsLoaded = false;
		this.updateTicker.stopRunning();
	}
	
	/**
	 * Loads world into the simulator
	 * 
	 * If no world was asked to be loaded, it makes a new blank world.
	 */
	this.loadWorld = function (worldToLoad, startTickingWorldOnLoad) {
		this.preLoad();
		if (typeof worldToLoad["Schematic"] != "undefined") {
			//If we were passed a schematic
			var worldData = new com.mordritch.mcSim.World_Schematic(worldToLoad);
		} 
		else if (typeof worldToLoad["Level"] != "undefined") {
			//If we were passed the chunk of a level
			var worldData = new com.mordritch.mcSim.World_Level(worldToLoad);
		}
		else {
			console.log(worldToLoad);
			throw new Error("com.mordritch.mcSim.MinecraftSimulator.loadWorld(): Unrecognized world type.");
		}
		this.postLoad(worldData, startTickingWorldOnLoad);
	}
	
	this.postLoad = function(worldData, startTickingWorldOnLoad) {
		for (var i in this.modelViews) {
			this.modelViews[i].setDimensions({
				columns: worldData.getSizeX(),
				rows: worldData.getSizeZ()
			});
			this.modelViews[i].drawAllBlocks();
		}
		
		this.worldData = worldData;
		this.World = new com.mordritch.mcSim.World(this.Block, worldData);
		this.World.loadAll();
		
		this.World.addWorldAccess(this);
		this.worldIsLoaded = true;
		if (startTickingWorldOnLoad) this.updateTicker.startRunning();

		for (var i in this.modelViews) {
			//TODO: Consider passing this.World along to the draw routine
			this.modelViews[i].setLoading(false);
		}
	}
	
	/**
	 * saveWorld 
	 */
	this.saveWorld = function() {
		this.World.commitAll();
		return this.World.worldData.getNbtData();
	}
	
	/**
	 * Called to start a new schematic
	 */
	this.makeNew = function(xDefaultSize, yDefaultSize, zDefaultSize, startTickingOnLoad) {
		this.preLoad();
		var worldData = new com.mordritch.mcSim.World_Schematic(null, xDefaultSize, yDefaultSize, zDefaultSize);
		this.postLoad(worldData, startTickingOnLoad);
	}
	
	/**
	 * Idea is that we can use a global flag to decide whether or not to show console output.
	 * 
	 * Not yet in use though.
	 */
	this.consoleOut = function(text) {
		console.log(text);
	}
	
	/**
	 * Add a model view to modelViews array:
	 * 
	 * 
	 * @param {Object} modelView
	 */
	this.bindModelView = function(modelView) {
		this.modelViews.push(modelView);
	}
	
	/**
	 * Searches the modelViews array for a model view and removes it.
	 * 
	 * @param {Object} modelView to search for and then remove
	 */
	this.unbindModelView = function(modelView) {
		for (var i in this.modelViews) {
			if (this.modelViews[i] = modelView) {
				this.modelViews.splice(i,1);
				break;
			}
		}
	}
	
	/**
	 * Returns the block object at specified coordinates.
	 * 
	 * Not implemented in the game, only in mcSim
	 * 
	 * @param {Integer} posX	Coordinate of the block which needs to be drawn
	 * @param {Integer} posY	Coordinate of the block which needs to be drawn
	 * @param {Integer} posZ	Coordinate of the block which needs to be drawn
	 * 
	 * @return {Object}	The initialized block object at the specifed coordinates 
	 */
	this.getBlockObject = function(posX, posY, posZ) {
		var Block = this.Block;
		
		var blockID = this.World.getBlockId(posX, posY, posZ);
		
		if (typeof Block.blocksList[blockID] != "undefined") {
			return Block.blocksList[blockID];
		}
		else {
			return Block.unknown;
		}
	}
	
	/**
	 * Returns the name of a type of block at a particular coordinate
	 * 
	 * Not implemented in the game, only in mcSim
	 * 
	 * @param {Integer} posX	Coordinate of the block which needs to be drawn
	 * @param {Integer} posY	Coordinate of the block which needs to be drawn
	 * @param {Integer} posZ	Coordinate of the block which needs to be drawn
	 * 
	 * @return {String}			Name of the block type, returns a default value of unknown if not defined
	 */
	this.getBlockType = function(posX, posY, posZ) {
		var Block = this.Block;
		
		var blockID = this.World.getBlockId(posX, posY, posZ);
		
		if (typeof Block.blocksList[blockID] != "undefined") {
			return Block.blocksList[blockID].blockType;
		}
		else {
			return Block.unknown.blockType;
		}
	}
	
	/**
	 * Unique to MC Sim. Calls toggleBlock method for block at particular coords
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.toggleBlock = function (posX, posY, posZ) {
		var block = this.getBlockObject(posX, posY, posZ);
		block.toggleBlock(this.World, posX, posY, posZ);
		//console.log("Toggle block called: " + this.World.getWorldTime());
		//console.log("Toggle block called: "+posX+" "+posY+" "+posZ);
	}
	
	/**
	 * Unique to MC Sim. Calls rotateBlock method for block at particular coords
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.rotateBlock = function (posX, posY, posZ) {
		var block = this.getBlockObject(posX, posY, posZ);
		block.rotateBlock(this.World, posX, posY, posZ);
	}
	
	this.init();
}
; 
com.mordritch.mcSim.World = function(BlockObj, worldDataObj) {
	var namespace = com.mordritch.mcSim;
	
	this.Block = BlockObj;
	this.worldData = worldDataObj;
	
	
	
	this.construct = function() {
		this.loadedTileEntityList = {}; //A list of all loaded entities
		this.addedTileEntityList = {}; //If we are in the middle of scanning the loadedTileEntityList, then we put new entities in here until the scanning is done
		this.scanningTileEntities = false; //When true, tile entities are queued to be loaded, rather than added then and there
		this.scheduledUpdates = new Array();
		this.isRemote = false; //some functions use this to determine if it's a multiplayer world.

		
		//Effectively a callback list. On the game, this is used by World to tell the renderer that things have changed,
		//each object in the element should implement methods as per the IWorldAccess interface in the MCP source code.
		this.worldAccesses = new Array();  

		this.worldTime = 0; //TODO: Migrate into a worldinfo class, like in the games source code.
		this.editingBlocks = false;
	}

	/**
	 * In the source code, this is inside a "worldInfo" object
	 */
	this.getWorldTime = function() {
		//TODO: Migrate into the WorldInfo class, like in the games source code
		return this.worldTime;
	}
	
	this.getBlockMaterial = function(par1, par2, par3)
	{
		var i = this.getBlockId(par1, par2, par3);

		if (i == 0)
		{
			return namespace.Material.air;
		}
		else
		{
			return this.Block.blocksList[i].blockMaterial;
		}
	}

	/**
	 * Adds an object to the this.worldAccesses array.
	 * 
	 * In the game, each object in this array is called during certain events, like if a block needs to be redrawn.
	 * In the MCP source code, each object is required to have implemented the IWorldAccess interface. 
	 */
	this.addWorldAccess = function(worldAccess) {
		this.worldAccesses.push(worldAccess);
	}
	
	/**
	 * Inverse of this.addWorldAccess();
	 */
	this.removeWorldAccess = function(worldAccess) {
		for (var i in this.worldAccesses) {
			if (this.worldAccesses[i] == worldAccess) {
				this.worldAccesses.splice(i,1);
				return;
			}
		}
	}
	
	/**
     * Checks if the block is a solid, normal cube. If the chunk does not exist, or is not loaded, it returns the
     * boolean parameter.
	 */
	this.isBlockNormalCubeDefault = function(xPos, yPos, zPos, defaultResponse) {
        /*
        //NA in context of simulator which at this time does not use chunks
        if (xPos < 0xfe363c80 || zPos < 0xfe363c80 || xPos >= 0x1c9c380 || zPos >= 0x1c9c380)
        {
            return defaultResponse;
        }

        Chunk chunk = chunkProvider.provideChunk(xPos >> 4, zPos >> 4);

        if (chunk == null || chunk.isEmpty())
        {
            return defaultResponse;
        }
		*/
		
        var block = this.Block.blocksList[this.getBlockId(xPos, yPos, zPos)];

        if (block == null)
        {
            return false;
        }
        else
        {
            return block.blockMaterial.isOpaque() && block.renderAsNormalBlock();
        }
	}
	
	/**
	 * This seems to notify the renderer to update the blocks.
	 * 
	 * Seems to be called when tileEntities have changed or when blockFlowing changes.
	 * 
	 * Also called, each time a blockId is set.
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockNeedsUpdate(posX, posY, posZ);
		}
	}
	
	/**
	 * Also, seems to notify the renderer to update the blocks.
	 * 
	 * Seems only called by BlockCake.eatCakeSlice();
	 */
	this.markBlockAsNeedsUpdate = function(posX, posY, posZ) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockRangeNeedsUpdate(posX, posY, posZ, posX, posY, posZ);
		}
	}
	
	/**
	 * Also, seems to notify the renderer to update the blocks.
	 * 
	 * Seems used by most blocktypes if they change
	 */
	this.markBlocksDirty = function(posX1, posY1, posZ1, posX2, posY2, posZ2) {
		for (var i in this.worldAccesses) {
			this.worldAccesses[i].markBlockRangeNeedsUpdate(posX1, posY1, posZ1, posX2, posY2, posZ2);
		}
	}
	
	/**
	 * Removes refference to a tile entity at a particular coordinate
	 * 
	 * This will allow the garbage collector to eventually free the memory
	 * 
	 * @param	{Int}	posX	Coordinate of tile entity
	 * @param	{Int}	posY	Coordinate of tile entity
	 * @param	{Int}	posZ	Coordinate of tile entity
	 * 
	 */
	this.removeBlockTileEntity = function(posX, posY, posZ) {
		var tileEntity = this.getBlockTileEntity(posX, posY, posZ);
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		
		if (
			tileEntity != null &&
			this.scanningTileEntities
		) {
			tileEntity.invalidate();
			delete this.addedTileEntityList[id];
		}
		else {
			if (tileEntity != null) {
				delete this.addedTileEntityList[id];
				delete this.loadedTileEntityList[id];
			}

			//Not ported from source code:
			/*
			Chunk chunk = getChunkFromChunkCoords(posX >> 4, posZ >> 4);
			if (chunk != null)
			{
				chunk.removeChunkBlockTileEntity(posX & 0xf, posY, posZ & 0xf);
			}
			*/
		}
	}
	
	/**
	 * Loads tick data from a saved world
	 */
	this.loadTickData = function() {
		var nbtTickData = this.worldData.getTickData();
		
		this.scheduledUpdates = [];
		for (var i = 0; i<nbtTickData.length; i++) {
			this.scheduleBlockUpdate(
				nbtTickData[i].x.payload,
				nbtTickData[i].y.payload,
				nbtTickData[i].z.payload,
				nbtTickData[i].i.payload, //block ID
				nbtTickData[i].t.payload
			);
		}
	}
	
	/**
	 * Simulator specific. Commits tick data to the schematic file, sends it over in NBT format
	 */
	this.commitTickData = function() {
		var tickData = [];
		var scheduledUpdates = this.scheduledUpdates;
		var worldTime = this.getWorldTime();
		var TAG_Int = 3;
		/*
		this.scheduledUpdates.push(
			{
				posX: posX,
				posY: posY,
				posZ: posZ,
				blockID: blockID,
				worldTime: this.getWorldTime() + ticksFromNow
			}
		);
		*/
		
		for (var i = 0; i<scheduledUpdates.length; i++) {
			tickData.push({
				x: {
					payload: scheduledUpdates[i].posX,
					type: TAG_Int
				},
				y: {
					payload: scheduledUpdates[i].posY,
					type: TAG_Int
				},
				z: {
					payload: scheduledUpdates[i].posZ,
					type: TAG_Int
				},
				i: {
					payload: scheduledUpdates[i].blockID,
					type: TAG_Int
				},
				t: {
					payload: scheduledUpdates[i].worldTime - worldTime,
					type: TAG_Int
				}
			});
		}
		
		this.worldData.setTickData(tickData);
	}
	
	/**
	 * Simulator specific.  
	 */
	this.commitEntities = function() {
		var nbtData = [];
		
		for (var i=0; i<this.loadedEntityList.length; i++) {
			nbtData.push(this.loadedEntityList[i].writeToNBT());
		}
		
		this.worldData.setEntities(nbtData);
	}
	
	/**
	 * Simulator specific.  
	 */
	this.commitTileEntities = function() {
		var nbtData = [];
		
		for (var i in this.loadedTileEntityList) {
			nbtData.push(this.loadedTileEntityList[i].writeToNBT());
		}
		
		this.worldData.setTileEntities(nbtData);
	}
	
	this.loadAll = function() {
		this.loadEntities();
		this.loadTickData();
		this.loadTileEntities();
	}
	
	this.commitAll = function() {
		this.commitEntities();
		this.commitTickData();
		this.commitTileEntities();
	}
	
	/**
	 * Get's a tile entity at a particular coordinate
	 * 
	 * @param	{Int}	posX	Coordinate of tile entity
	 * @param	{Int}	posY	Coordinate of tile entity
	 * @param	{Int}	posZ	Coordinate of tile entity
	 * 
	 * @return	{Object}	TileEntity or null if not present
	 */
	this.getBlockTileEntity = function(posX, posY, posZ) {
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		
		if (
			typeof this.loadedTileEntityList[id] != 'undefined' &&
			!this.loadedTileEntityList[id].isInvalid()
		) {
			return this.loadedTileEntityList[id]
		}
		
		///asdasd;
		
		if (
			typeof this.addedTileEntityList[id] != 'undefined' &&
			!this.addedTileEntityList[id].isInvalid()
		) {
			return this.addedTileEntityList[id]
		}
		return null;
		
		
		//Implementation from game below, for our purposes we will just loop through an array
		/*
	this.getBlockTileEntity = function(i, j, k) {
		label0:
		{
				var tileentity;
				label1:
				{
					var chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
					if (chunk == null)
					{
						break label0;
					}
					tileentity = chunk.getChunkBlockTileEntity(i & 0xf, j, k & 0xf);
					if (tileentity != null)
					{
						break label1;
					}
					var iterator = addedTileEntityList.iterator();
					var tileentity1;
					do
					{
						if (!iterator.hasNext())
						{
								break label1;
						}
						tileentity1 = iterator.next();
					}
					while (tileentity1.isInvalid() || tileentity1.xCoord != i || tileentity1.yCoord != j || tileentity1.zCoord != k);
					tileentity = tileentity1;
				}
				return tileentity;
		}
		return null;
			 */
	}
	
	/**
	 * Sets a blocks tile entity
	 */
	this.setBlockTileEntity = function(posX, posY, posZ, tileentity) {
		var id = 'entity_' + posX + '_' + posY + '_' + posZ;
		if (
			tileentity != null &&
			!tileentity.isInvalid()
		) {
			tileentity.xCoord = posX;
			tileentity.yCoord = posY;
			tileentity.zCoord = posZ;

			if (this.scanningTileEntities) {
				this.addedTileEntityList[id] = tileentity; 
			}
			else {
				this.loadedTileEntityList[id] = tileentity; 
			}
		}
		
		this.markBlockNeedsUpdate(posX, posY, posZ); //Simulator only
	}
	
	/**
	 * If a block is getting powered, for example by a torch underneath it, or wire running into it.
	 */
	this.isBlockGettingPowered = function (posX, posY, posZ)
	{
		if(this.isBlockProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(this.isBlockProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		return this.isBlockProvidingPowerTo(posX + 1, posY, posZ, 5);
	}

	/**
	 * 
	 */
	this.isBlockIndirectlyGettingPowered = function (posX, posY, posZ)
	{
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(this.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		
		return this.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5);
	}
	
	/**
	 * 
	 */
	this.isBlockIndirectlyProvidingPowerTo = function(posX, posY, posZ, direction)
	{
		if(this.isBlockNormalCube(posX, posY, posZ))
		{
			return this.isBlockGettingPowered(posX, posY, posZ);
		}
		var blockID = this.getBlockId(posX, posY, posZ);
		if(blockID == 0)
		{
			return false;
		} else
		{
			return this.Block.blocksList[blockID].isPoweringTo(this, posX, posY, posZ, direction);
		}
	}
	
	/**
	 * 
	 */
	this.isBlockProvidingPowerTo = function(posX, posY, posZ, direction)
	{
		var blockID = this.getBlockId(posX, posY, posZ);
		if(blockID == 0)
		{
			return false;
		} else
		{
			return this.Block.blocksList[blockID].isIndirectlyPoweringTo(this, posX, posY, posZ, direction);
		}
	}
	
	/**
	 * 
	 */
	this.getBlockId = function(posX, posY, posZ) {
		if (posY < 0) {
			return 1; //TODO: make this customizable, for now it's returning the stone blockId, make it choose from user definable option
		}
		return this.worldData.getBlockId(posX, posY, posZ);
	}
	
	/**
	 * 
	 */
	this.getBlockMetadata = function(posX, posY, posZ) {
		return this.worldData.getBlockMetadata(posX, posY, posZ);
	}

	/**
	 * Calls the "powerBlock" method for a block at particular coordinates.
	 * 
	 * MCP has called this "playNoteAt" as before pistons, this is all it did, however, it
	 * may (or should) really be named something more appropriate now, perhaps: "powerBlockAt"
	 * 
	 * @param	{Integer}	posX	x coordinate of block to toggle
	 * @param	{Integer}	posY	y coordinate of block to toggle
	 * @param	{Integer}	posZ	z coordinate of block to toggle
	 */
	this.playNoteAt = function(posX, posY, posZ, uknownParam1, uknownParam2) {
		var blockID = this.getBlockId(posX, posY, posZ);
		if (blockID > 0) {
			this.Block.blocksList[blockID].powerBlock(this, posX, posY, posZ, uknownParam1, uknownParam2);
		}
		
	}
	
	/**
	 * Checks if the specified block has "isNormalCube" set true
	 */
	this.isBlockNormalCube = function(posX, posY, posZ) {
		var block = this.Block.blocksList[this.getBlockId(posX, posY, posZ)];
		//Old of above, which is wrong: var block = this.Block.blocksList[this.getBlockId(posX, posY, posZ)].isBlockNormalCube(posX, posY, posZ);
		if (typeof block == "undefined" || typeof block.blockType == "undefined") {
			return false;
		}
		else {
			return (block.blockMaterial.isOpaque() && block.renderAsNormalBlock());
		}
		
		//IsOpaque checks if blockMaterial has the "isTranslucent" property
		//renderAsNormalBlock is just a property of the blocktype
	}
	
	/**
	 * 
	 */
	this.setBlockAndMetadata = function(posX, posY, posZ, blockID, blockMetadata)
	{
		if (
			posX < 0 ||
			posY < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posY >= this.worldData.getSizeY() ||
			posZ >= this.worldData.getSizeZ()
		) {
			return false;
		}
		
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//var returnValue = chunk.setBlockIDWithMetadata(i & 0xf, j, k & 0xf, l, i1);
		//updateAllLightTypes(i, j, k);
		//return returnValue;
		
		//Functionality from chunk.setBlockIDWithMetadata implemented below: 
		
		var oldBlockId = this.worldData.getBlockId(posX, posY, posZ);
		var oldBlockMetadata = this.worldData.getBlockMetadata(posX, posY, posZ);
		
		if (blockID == oldBlockId && oldBlockMetadata == blockMetadata) {
			return false;
		}
		
		this.worldData.setBlockID(posX, posY, posZ, blockID);
		if (oldBlockId != 0) {
			this.Block.blocksList[oldBlockId].onBlockRemoval(this, posX, posY, posZ);
		}
		this.worldData.setBlockMetadata(posX, posY, posZ, blockMetadata);
		this.Block.blocksList[blockID].onBlockAdded(this, posX, posY, posZ);

		this.markBlockNeedsUpdate(posX, posY, posZ); //Normally this happens via updateAllLightTypes(i, j, k) and a whole lot of other calls, we are ignoring lighting data for now.
		return true;
	}
	
	/**
	 * Blocks being moved by pistons, chests, furnaces 
	 */
	this.loadTileEntities = function(tileEntities) {
		var tileEntities = this.worldData.getTileEntities();
		this.loadedTileEntityList = {}; //Clear it
		
		for (var i = 0; i<tileEntities.length; i++) {
			var id = 'entity_' + tileEntities[i].x.payload + '_' + tileEntities[i].y.payload + '_' + tileEntities[i].z.payload;
			switch (tileEntities[i].id.payload) {
				case "Piston":
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity_Piston();
					break;
				case "Sign":
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity_Sign();
					break;
				default:
					this.loadedTileEntityList[id] = new com.mordritch.mcSim.TileEntity__Unknown();
					break;
			}
			this.loadedTileEntityList[id].readFromNBT(tileEntities[i], this);
		}
	}
	
	
	/**
	 * Mobs, fires
	 * 
	 * For now, no entities are implemented 
	 */
	this.loadEntities = function() {
		var id;
		var entity;
		var entities = this.worldData.getEntities();
		this.loadedEntityList = [];
		
		for (var i = 0; i<entities.length; i++) {
			switch (entities[i].id.payload) {
				default:
					entity = new com.mordritch.mcSim.Entity__Unknown();
					entity.readFromNBT(entities[i], this);
					this.loadedEntityList.push(entity);
					break;
			}
			
		}
	}
	
	/**
	 * Called at the same regularity of tick()
	 * 
	 * Mobs are entities, special blocks like pistons, furnaces, chests are tileEntities. This calls the "updateEnity" routine of all loaded one
	 * 
	 * At this time, entities updates are not yet supported
	 */
	this.updateEntities = function() {
		this.scanningTileEntities = true;
		for (var i in this.loadedTileEntityList) {
			var tileEntity = this.loadedTileEntityList[i];
			if (!tileEntity.isInvalid() && tileEntity.worldObj != null) {
				tileEntity.updateEntity();
			}
			
			if (tileEntity.isInvalid()) {
				delete this.loadedTileEntityList[i];
			}
		}
		this.scanningTileEntities = false;
		
        /*
        TODO: See if we need to do this too, below is from the source code
        if (!entityRemoval.isEmpty())
        {
            loadedTileEntityList.removeAll(entityRemoval);
            entityRemoval.clear();
        }
        */
       
		//While scanningTileEntities was set, all new tileEntities were added to addedTileEntityList, code below migrates 
		for (var i in this.addedTileEntityList) {
			var tileentity1 = this.addedTileEntityList[i];
			if (!tileentity1.isInvalid()) {
				var presentInLoadedTileEntityList = false;
				for (var j in this.loadedTileEntityList) {
					if (this.loadedTileEntityList[j] == tileentity1) {
						presentInLoadedTileEntityList = true;
						break;
					} 
				}
				
				if (!presentInLoadedTileEntityList)
				{
					this.loadedTileEntityList[i] = tileentity1;
				}
				
				/*
				Commented out code below is from the original source, we will manyally implement the setChunkBlockTileEntity:
				
				if (chunkExists(tileentity1.xCoord >> 4, tileentity1.zCoord >> 4))
				{
					var chunk1 = getChunkFromChunkCoords(tileentity1.xCoord >> 4, tileentity1.zCoord >> 4);
					if (chunk1 != null)
					{
						chunk1.setChunkBlockTileEntity(tileentity1.xCoord & 0xf, tileentity1.yCoord, tileentity1.zCoord & 0xf, tileentity1);
					}
				}
				*/
				tileentity1.worldObj = this;

				if (this.getBlockId(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord) == 0 || !(this.Block.blocksList[this.getBlockId(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord)] instanceof com.mordritch.mcSim.BlockType_Container)) {
					
				}
				else {
					tileentity1.validate();
					//chunkTileEntityMap.put(chunkposition, tileentity);
					
				}
					
				this.markBlockNeedsUpdate(tileentity1.xCoord, tileentity1.yCoord, tileentity1.zCoord);
			}
		}
		this.addedTileEntityList = {};
	}
	
	/**
	 * Called by a block to schedule an update for x ticks from now. For example a torch would call itself to be updated
	 * 2 ticks from now on a neighbor change, and would then see it's changed to on / off then.
	 */
	this.scheduleBlockUpdate = function(posX, posY, posZ, blockID, ticksFromNow) {
		var foundExisting = false;
		var scheduledUpdate;
		
		for (var i = 0; i<this.scheduledUpdates.length; i++) {
			scheduledUpdate = this.scheduledUpdates[i];
			
			if (
				scheduledUpdate.posX == posX &&
				scheduledUpdate.posY == posY &&
				scheduledUpdate.posZ == posZ &&
				scheduledUpdate.blockID == blockID
			) {
				foundExisting = true;
				break;
			}
		}
		
		if (!foundExisting) {
			this.scheduledUpdates.push(
				{
					posX: posX,
					posY: posY,
					posZ: posZ,
					blockID: blockID,
					worldTime: this.getWorldTime() + ticksFromNow
				}
			);
		}
	}
	
	/**
	 * 
	 */
	this.setBlockAndMetadataWithNotify = function (posX, posY, posZ, blockID, blockMetadata)
	{
		if(this.setBlockAndMetadata(posX, posY, posZ, blockID, blockMetadata)) {
				this.notifyBlockChange(posX, posY, posZ, blockID);
				return true;
		}
		else {
				return false;
		}
	}

	/**
	 * 
	 */
	this.setBlockWithNotify = function(posX, posY, posZ, blockID) {
		if (this.setBlock(posX, posY, posZ, blockID)) {
			this.notifyBlockChange(posX, posY, posZ, blockID);
			return true;
		}
		else {
			return false;
		}
	}

	/**
	 * 
	 */
	this.notifyBlocksOfNeighborChange = function(posX, posY, posZ, blockID) {
	
		this.notifyBlockOfNeighborChange(posX - 1, posY, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX + 1, posY, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY - 1, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY + 1, posZ, blockID);
		this.notifyBlockOfNeighborChange(posX, posY, posZ - 1, blockID);
		this.notifyBlockOfNeighborChange(posX, posY, posZ + 1, blockID);
	}
	
	/**
	 * 
	 */
	this.notifyBlockOfNeighborChange = function(posX, posY, posZ, blockID) {
		if (this.editingBlocks) {
			return;
		}
		var block = this.Block.blocksList[this.getBlockId(posX, posY ,posZ)];
		//Block block = Block.blocksList[getBlockId(i, j, k)];
		
		if(typeof block != "undefined")
		{
				block.onNeighborBlockChange(this, posX, posY, posZ, blockID);
		}
	}
	
	/**
	 * 
	 */
	this.notifyBlockChange = function(posX, posY, posZ, blockID) {
		this.markBlockNeedsUpdate(posX, posY, posZ);
		this.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
	}
	
	/**
	 * 
	 */
	this.setBlockMetadataWithNotify = function(posX, posY, posZ, blockMetadata) {
		if (this.setBlockMetadata(posX, posY, posZ, blockMetadata))
		{
				var blockID = this.getBlockId(posX, posY, posZ);
				if(this.Block.blocksList[blockID & 0xff].requiresSelfNotify)
				{
					this.notifyBlockChange(posX, posY, posZ, blockID);
				}
				else {
					this.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
				}
		}
	}
	
	/**
	 * 
	 */
	this.setBlockMetadata = function(posX, posY, posZ, blockMetadata)
	{
		if (
			posX < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posZ >= this.worldData.getSizeZ()
		) {
				return false;
		}
		
		if (posY < 0) {
				return false;
		}
		
		if (posY >= this.worldData.getSizeY()) {
				return false;
		}
	
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//i &= 0xf;
		//k &= 0xf;
		//return chunk.setBlockMetadata(i, j, k, l);
		
		this.worldData.setBlockMetadata(posX, posY, posZ, blockMetadata);
		return true;
	}
	
	/**
	 * Checks all ticks in the queue and will update blocks scheduled for an update based on the world time. 
	 */
	this.tickUpdates = function() {
		var scheduledUpdate;
		var scheduledUpdates = this.scheduledUpdates;
		this.scheduledUpdates = new Array();
		
		for (var i in scheduledUpdates) {
			scheduledUpdate = scheduledUpdates[i];
			if (this.getWorldTime() >= scheduledUpdate.worldTime) {
				if (this.getBlockId(scheduledUpdate.posX, scheduledUpdate.posY, scheduledUpdate.posZ) == scheduledUpdate.blockID) {
					this.Block.blocksList[scheduledUpdate.blockID].updateTick(
						this,
						scheduledUpdate.posX,
						scheduledUpdate.posY,
						scheduledUpdate.posZ
					);
				}
			}
			else {
				this.scheduledUpdates.push(scheduledUpdate);
			}
		}
	}
	
	/**
	 * In MCP, this does a variety of functions like spawn mobs and eventually call tickupdates.
	 */
	this.tick = function() {
		//Randomly performs tick on blocks with tickonload set:
		
		var randX;
		var randY;
		var randZ;
		var block;
		
		/**
		 * The game normally does 20 random ticks per chunk:
		 */
		var x16 = this.worldData.getSizeX()/16;
		if (x16 < 1) x16 = 1;
		
		var z16 = this.worldData.getSizeZ()/16;
		if (z16 < 1) z16 = 1;
		
		for (var i=0; i < Math.floor(20*x16*z16); i++) {
			randX = Math.floor(Math.random()*this.worldData.getSizeX());
			randY = Math.floor(Math.random()*this.worldData.getSizeY());
			randZ = Math.floor(Math.random()*this.worldData.getSizeZ());
			block = this.Block.blocksList[this.getBlockId(randX, randY, randZ)];
			
			if (block.tickOnLoad) {
				block.updateTick(this, randX, randY, randZ);
				//console.log("Yep: "+randX+" "+randY+" "+randZ);
			}
			else {
				//console.log("Nope: "+randX+" "+randY+" "+randZ);
			}
		}
		this.worldTime++;
		this.tickUpdates();
	}
	
	/**
	 * 
	 */
	this.setBlock = function(posX, posY, posZ, blockID)
	{
		if (
			posX < 0 ||
			posZ < 0 ||
			posX >= this.worldData.getSizeX() ||
			posZ >= this.worldData.getSizeZ()
		) {
				return false;
		}
		
		if (posY < 0) {
				return false;
		}
		
		if (posY >= this.worldData.getSizeY()) {
				return false;
		}
		
		//Chunk chunk = getChunkFromChunkCoords(i >> 4, k >> 4);
		//boolean flag = chunk.setBlockID(i & 0xf, j, k & 0xf, l);
		//updateAllLightTypes(i, j, k);
		//return flag;
		
		//Following 4 lines achieve what is relevant to the simulator from the function calls in the commented 4 lines above. 
		this.worldData.setBlockID(posX, posY, posZ, blockID);
		this.Block.blocksList[blockID].onBlockAdded(this, posX, posY, posZ);
		this.markBlockNeedsUpdate(posX, posZ, posY); //Normally this happens via updateAllLightTypes(i, j, k) and a whole lot of other calls, we are ignoring lighting data for now.
		return true;
	}

	/**
	 * Simulator only, not in the game.
	 * 
	 * Check if an air block has any neightbor which is a piston moving block and if it's retracting, and was facing into this
	 * block, then we know this block will eventually need a portion of the retracting block drawn. 
	 */
	this.getRetractingBlockEntity = function(posX, posY, posZ) {
		if (
			this.getBlockId(posX-1, posY, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX-1, posY, posZ).extending &&
			this.getBlockTileEntity(posX-1, posY, posZ).storedOrientation == 5
		) {
			return this.getBlockTileEntity(posX-1, posY, posZ);
		}
		
		if (
			this.getBlockId(posX+1, posY, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX+1, posY, posZ).extending &&
			this.getBlockTileEntity(posX+1, posY, posZ).storedOrientation == 4
		) {
			return this.getBlockTileEntity(posX+1, posY, posZ);
		}
		
		if (
			this.getBlockId(posX, posY-1, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY-1, posZ).extending &&
			this.getBlockTileEntity(posX, posY-1, posZ).storedOrientation == 1
		) {
			return this.getBlockTileEntity(posX, posY-1, posZ);
		}
		
		if (
			this.getBlockId(posX, posY+1, posZ) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY+1, posZ).extending &&
			this.getBlockTileEntity(posX, posY+1, posZ).storedOrientation == 0
		) {
			return this.getBlockTileEntity(posX, posY+1, posZ);
		}
		
		if (
			this.getBlockId(posX, posY, posZ-1) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY, posZ-1).extending &&
			this.getBlockTileEntity(posX, posY, posZ-1).storedOrientation == 3
		) {
			return this.getBlockTileEntity(posX, posY, posZ-1);
		}
		
		if (
			this.getBlockId(posX, posY, posZ+1) == this.Block.pistonMoving.blockID &&
			!this.getBlockTileEntity(posX, posY, posZ+1).extending &&
			this.getBlockTileEntity(posX, posY, posZ+1).storedOrientation == 2
		) {
			return this.getBlockTileEntity(posX, posY, posZ+1);
		}
		
		return null;
	}
	
	
	this.construct();
}
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed lacinia mattis faucibus. Vivamus nisi lorem, varius vel aliquet non, venenatis eu magna. Nulla eget sapien diam, a posuere purus. Aenean suscipit ultrices odio, vitae aliquet est tempor quis. Donec tincidunt magna eget turpis ultrices cursus. Phasellus vel erat sed dolor luctus convallis eget a ante. Suspendisse diam magna, euismod sed tincidunt sed, dapibus ut neque. Nulla vulputate dictum leo eget lacinia. Aenean in urna augue, eu mollis diam. Donec aliquet feugiat elit, sit amet convallis mi luctus sit amet."; //http://www.lipsum.com/
	var Gui_FullApp = function(mcSim) {
		this.defaultSettings = window.defaultOptions;
		this.userSettings = JSON.parse(JSON.stringify(this.defaultSettings));
		this.userSettings_onLoadCallbacks = [];
		this.schematicMetadata = {};
		this.tickerDomIds = {};
		
		this.init = function() {
			this.L10n = this.localization = new namespace.localization(window['localizationStrings']); //needs to be done as the very first, pretty much everything needs to make use of localization
			this.input = new namespace.guiFullInput(this); //needs to be called before any components which want to use bindings
			this.options = new namespace.options(this); //needs to be called before any components which want to register options
	
			this.loaderModal = new namespace.guiFullModal(this);
			this.loaderModal.setDomClass("prompt");
			this.loaderModal.bind('hide', function() {
				t.loaderMessaging.cancel = true;
			});
	
			$('#header').append(
				'<span class="documentToolBarLeft"></span>' +
				'<span class="documentToolBarRight"></span>'
			);

			this.initGuiOptions();
			this.initTopRightButtons();
			this.initTopLeftButtons();
			
			this.userManager = new namespace.guiFull_userManager(this);
			 
			this.toolHandler = new namespace.toolHandler(this);
			this.mcSim = new namespace.MinecraftSimulator(this);
	
			this.ticker = new namespace.guiFull_ticker(this); //not the actual ticker, just the gui's way of talking to it, depends on ticker inside mcSim having already been created
			this.tooltip = new namespace.tooltip(this);
			
			this.initPlaceableBlockList(); //needs to be run before the toolbar
			this.initBlockHelpers();
	
			this.modelviews = new namespace.guiFull_multiViewHandler(this);
			this.toolbars = new namespace.guiFullToolbar(this);
			this.sidebar = new namespace.sidebar(this);
			this.viewPorts = new namespace.viewPorts(this);
			
			this.documentOpen = new namespace.documentOpen(this);
			this.documentNew = new namespace.documentNew(this);
			this.documentSave = new namespace.documentSave(this);
			this.documentSaveLocally = new namespace.documentSaveLocally(this);
			this.documentInfo = new namespace.documentInfo(this);
			this.documentDownloadSavedVersion = new namespace.documentDownloadSavedVersion(this);

			this.documentResize = new namespace.documentResize(this);
			this.documentRotate = new namespace.documentRotate(this);
			
			this.submitFeedback = new namespace.submitFeedback(this);
			
			this.urlHistory = new namespace.urlHistory(this);
			this.googleAnalytics = new namespace.googleAnalytics(this); 
			
			var t = this;
			$('.addDocumentToolbarButton0fileOpen').bind('mouseenter.moveto', function() {
				t.documentOpen.initOverButton(); //Makes a file upload element ontop of the button, run now after the DOM positioning has settled down
				$('.addDocumentToolbarButton0fileOpen').unbind('mouseenter.moveto');
			});
			
			
			this.loaderMessaging = {cancel: false};
	
			var schematicIdToOpen = window['schematicIdToOpen'];
			this.schematicMetadata = window['schematicMetadata'];
	
			if (this.schematicMetadata.error) {
				var xDefaultSize = this.userSettings.options.simulator.xDefaultSize;
				var yDefaultSize = this.userSettings.options.simulator.yDefaultSize;
				var zDefaultSize = this.userSettings.options.simulator.zDefaultSize;
	
				this.mcSim.makeNew(xDefaultSize, yDefaultSize, zDefaultSize, this.userSettings.options.simulator.startTickingWorldOnLoad);
			}
			
			this.sideBarSchematicDescriptionElement = this.sidebar.addSection('','');
			this.setSchematicMetadata(this.schematicMetadata, isNew = true);
		}
		
		this.initBlockHelpers = function() {
			this.blockHelper_Sign = new  namespace.blockHelper_Sign(this);
		}
		
		this.setSchematicMetadata = function(parameters, isNew) {
			isNew = (typeof isNew == "undefined") ? false : isNew;
			
			if (isNew) {
				this.schematicMetadata = {
					created: "",
					lastModified: "",
					fileName: "",
					fileSize: "",
					description: "",
					title: "",
					schematicId: "",
					userDisplayName: "",
					userId: ""
				}
			}
			
			for (var parameter in parameters) {
				this.schematicMetadata[parameter] = parameters[parameter];
			}
			
			var title =
				(this.schematicMetadata.title != "") ?
				this.schematicMetadata.title :
				this.L10n.getString("document.metadata.default.title");
			var lastModified =
				(this.schematicMetadata.lastModified != "") ?
				this.schematicMetadata.lastModified :
				this.L10n.getString("document.metadata.default.lastModified");
			var fileName =
				(this.schematicMetadata.fileName != "") ?
				this.schematicMetadata.fileSize :
				this.L10n.getString("document.metadata.default.fileName");
			var fileSize =
				(this.schematicMetadata.fileSize != "") ?
				this.schematicMetadata.title :
				this.L10n.getString("document.metadata.default.fileSize");
			var description =
				(this.schematicMetadata.description != "") ?
				this.schematicMetadata.description :
				this.L10n.getString("document.metadata.default.description");
			var schematicId =
				(this.schematicMetadata.schematicId != "") ?
				this.schematicMetadata.schematicId :
				this.L10n.getString("document.metadata.default.schematicId");
			var userDisplayName =
				(this.schematicMetadata.userDisplayName != "") ?
				this.schematicMetadata.userDisplayName :
				this.L10n.getString("document.metadata.default.userDisplayName");
			var userId =
				(this.schematicMetadata.userId != "") ? 
				this.schematicMetadata.userId :
				this.L10n.getString("document.metadata.default.userId");
			
			var downloadNowString = this.L10n.getString("application.downloadnow");
			
			$('#headerDocumentTitle').text(" - " + escapeHtml(title));
			if (this.schematicMetadata.title != "") {
				$('#headerDocumentTitle').append(' (<a href="./download/?downloadId='+schematicId+'">' + downloadNowString + '</a>)');
			}

			var sideBarBodyText =
				this.L10n.getString("sidebar.schematic.info.title") +
				'<br/>' +
				'<b>' +
				escapeHtml(title) +
				'</b>' +
				'<br/>' +
				'<br/>' +
				this.L10n.getString("sidebar.schematic.info.uploadedby") +
				'<br/>' +
				'<b>' +
				escapeHtml(userDisplayName) +
				'</b>' +
				'<br/>' +
				'<br/>' +
				this.L10n.getString("sidebar.schematic.info.description") +
				' ' +
				escapeHtml(description).replace("\\n", "<br/>");

			this.sidebar.addSection(
				this.L10n.getString("sidebar.schematic.info.header"),
				sideBarBodyText,
				hideByDefault = false,
				this.sideBarSchematicDescriptionElement
			);
		}
		
		this.initGuiOptions = function() {
			this.options.registerOption({
				type: 'number',
				name: 'xDefaultSize',
				category: 'simulator',
				defaultValue: 32,
				minValue: 1,
				maxValue: 2048
			});
	
			this.options.registerOption({
				type: 'number',
				name: 'yDefaultSize',
				category: 'simulator',
				defaultValue: 8,
				minValue: 1,
				maxValue: 256
			});
	
			this.options.registerOption({
				type: 'number',
				name: 'zDefaultSize',
				category: 'simulator',
				defaultValue: 32,
				minValue: 1,
				maxValue: 2048
			});
	
			this.options.registerOption({
				type: 'boolean',
				name: 'startTickingWorldOnLoad',
				category: 'simulator',
				defaultValue: true
			});
			
		}
		
		this.initTopRightButtons = function() {
			var container = '.documentToolBarRight';
			var t = this;
			
			this.addDocumentToolbarButton(
				'options',
				'options',
				'images/icons/configure-4.png',
				container,
				function() {
					t.options.showOptionsScreen();
				}
			);
			
			this.addDocumentToolbarButton(
				'input',
				'input',
				'images/icons/configure-shortcuts.png',
				container,
				function() {
					t.input.modal.show();
				}
			);
	
			this.addDocumentToolbarButton(
				'toolbars',
				'toolbars',
				'images/icons/configure-toolbars.png',
				container,
				function() {
					t.toolbars.modal.show();
				}
			);
	
			/*
			this.addDocumentToolbarButton(
				'help',
				'help',
				'images/icons/help-3.png',
				container,
				function() {
					//t.toolbars.modal.show();
				}
			);
			*/

			this.addDocumentToolbarButton(
				'sidebar',
				'sidebar',
				'images/icons/view-right-close.png',
				container,
				function() {
					t.sidebar.toggle();
				}
			);
		}
		
		this.initTopLeftButtons = function() {
			var container = '.documentToolBarLeft';
			var t = this;
			
			this.addDocumentToolbarButton(
				'fileNew',
				'fileNew',
				'images/icons/document-new-5.png',
				container,
				function() {
					t.documentNew.prompt();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileOpen',
				'fileOpen',
				'images/icons/document-open-5.png',
				container,
				function() {
					t.documentOpen.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileSave',
				'fileSave',
				'images/icons/document-save-5.png',
				container,
				function() {
					t.documentSave.save();
				}
			);
			
			this.addDocumentToolbarButton(
				'fileSaveAs',
				'fileSaveAs',
				'images/icons/document-save-as-5.png',
				container,
				function() {
					t.documentSave.saveAs();
				}
			);
			
			this.addDocumentToolbarSeperator(container);
	
			this.addDocumentToolbarButton(
				'documentSaveLocally',
				'documentSaveLocally',
				'images/icons/download.png',
				container,
				function() {
					t.documentSaveLocally.save();
				}
			);
			
			this.addDocumentToolbarButton(
				'schematicDownload',
				'schematicDownload',
				'images/icons/download-3.png',
				container,
				function() {
					t.documentDownloadSavedVersion.download();
				}
			);
			
			this.addDocumentToolbarSeperator(container);
	
			this.addDocumentToolbarButton(
				'documentResize',
				'documentResize',
				'images/icons/transform-scale-2.png',
				container,
				function() {
					t.documentResize.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'documentRotate',
				'documentRotate',
				'images/icons/object-rotate-right.png',
				container,
				function() {
					t.documentRotate.show();
				}
			);
			
			this.addDocumentToolbarButton(
				'documentInformation',
				'documentInformation',
				'images/icons/document-properties.png',
				container,
				function() {
					t.documentInfo.show();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			this.addDocumentToolbarButton(
				'editSelect',
				'editSelect',
				'images/icons/edit/edit-select.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editCopy',
				'editCopy',
				'images/icons/edit/edit-copy-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editPaste',
				'editPaste',
				'images/icons/edit/edit-paste-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarButton(
				'editDelete',
				'editDelete',
				'images/icons/edit/edit-delete-4.png',
				container,
				function() {
					//t.notYetImplemented();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			this.addDocumentToolbarButton(
				'viewPortsSplitHorizontally',
				'viewPortsSplitHorizontally',
				'images/icons/view-split-left-right-2.png',
				container,
				function() {
					t.viewPorts.ToggleSplitHorizontally();
				}
			);
			
			this.addDocumentToolbarButton(
				'viewPortsSplitVertically',
				'viewPortsSplitVertically',
				'images/icons/view-split-top-bottom-2.png',
				container,
				function() {
					t.viewPorts.ToggleSplitVertically();
				}
			);
			
			this.addDocumentToolbarSeperator(container);

			var tickerStop = this.addDocumentToolbarButton(
				'tickerStop',
				'tickerStop',
				'images/icons/media-playback-pause-7.png',
				container,
				function() {
					t.ticker.stop();
				}
			);
	
			var tickerRun = this.addDocumentToolbarButton(
				'tickerRun',
				'tickerRun',
				'images/icons/media-playback-start-7.png',
				container,
				function() {
					t.ticker.start();
				}
			);
	
			var tickerStep = this.addDocumentToolbarButton(
				'tickerStep',
				'tickerStep',
				'images/icons/media-playback-step-7.png',
				container,
				function() {
					t.ticker.step();
				}
			);
			
			var tickerTickFor = this.addDocumentToolbarButton(
				'tickerTickFor',
				'tickerTickFor',
				'images/icons/media-skip-forward-7.png',
				container,
				function() {
					t.ticker.tickFor();
				}
			);
			
			var tickUntilStopTextBoxId = "tickUntilStopTextBox";
			$(container).append(
				'<input type="text" id="'+ tickUntilStopTextBoxId +'" value="">'
			);
			
			$("#" + tickUntilStopTextBoxId).bind("keyup", function(e){
				if (e.which == 13) {
					t.ticker.tickFor();
				}
			});

			this.addDocumentToolbarSeperator(container);

			$(container).append(
				'<span class="topToolbarText">' + this.L10n.getString("ticker.tickcounter") + '</span>'
			);
			
			this.addDocumentToolbarButton(
				'resetTickCounter',
				'resetTickCounter',
				'images/icons/view-refresh-4.png',
				container,
				function() {
					t.ticker.resetTickCounter();
				}
			);
			
			$(container).append(
				' <span class="topToolbarText" id="tickCounter">0</span>'
			);
			
			this.addDocumentToolbarSeperator(container);

			this.tickerDomIds.tickCounterId = "tickCounter";
			this.tickerDomIds.stopButtonClass = tickerStop;
			this.tickerDomIds.runButtonClass = tickerRun;
			this.tickerDomIds.stepButtonClass = tickerStep;
			this.tickerDomIds.tickForButtonClass = tickerTickFor;
			this.tickerDomIds.tickForTextboxId = tickUntilStopTextBoxId;
		}
		
		this.addDocumentToolbarButton = function(name, description, imageUrl, container, onClickCallback) {
			var className = 'addDocumentToolbarButton_'+name;
			var t = this;
			
			$(container).append(
				'<span class="'+className+' topToolbarUnselected"><img src="'+imageUrl+'" /></span> '
			);
			
			this.input.bindInputEvent({
				savedKeyName: name,
				category: 'toolbar.top',
				description: 'shortcuts.toolbar.top.'+name,
				callbackFunction: onClickCallback
			});

			$('.'+className).on('mouseenter', function() {
				t.tooltip.show(
					$domElement = $('.addDocumentToolbarButton_'+name),
					position = "below",
					headerText = t.L10n.getString('toolbar.top.tooltips.'+description+'.title'),
					bodyText = t.L10n.getString('toolbar.top.tooltips.'+description+'.description'),
					shortcutKeyScope = 'main',
					shortcutKeyEventName = name
				);
			});
			
			$('.'+className).on('mouseleave', function() {
				t.tooltip.hide()
			});

			$(container+' .'+className).bind('click', onClickCallback);
			return className;
		}
		
		/**
		 * Adds a toolbar seperator 
		 */
		this.addDocumentToolbarSeperator = function(container) {
			$(container).append(
				'<span class="toolbarSeperator"></span>'
			);
		}
		
		/**
		 * Classes can register to be notified if usersettings are loaded
		 */
		this.userSettings_registerForOnLoadCallback = function(callback) {
			this.userSettings_onLoadCallbacks.push(callback);
		}
		
		/**
		 * Tells all clases which are registered for usersetting change notifcation through callbacks
		 */
		this.userSettingsLoaded = function(options) {
			for (var i=0; i<this.userSettings_onLoadCallbacks.length; i++) {
				this.userSettings_onLoadCallbacks[i]();
			}
		}
		
		this.loadSchematicId = function(schematicId) {
			if (typeof schematicId == "undefined" || schematicId == null) throw new Error("loadSchematicId() Schematic ID cannot be undefined.");
			
			this.loaderModal.setContent("Downloading from server..."); //TODO: Use a localized string
			this.loaderModal.show();

			if (typeof this.schematicMetadata.schematicId != "undefined" && this.schematicMetadata.schematicId == schematicId) {
				this.ajaxGetSchematicData (schematicId);
			}
			else {
				var t = this;
				$.ajax({
					url: 'php/getSchematicMetadata.php?id=' + schematicId,
					dataType: 'json',
					success: function(data) {
						t.setSchematicMetadata(data, isNew = true);
						t.ajaxGetSchematicData(data.schematicId);
					}
				});
			}
		}
		
		this.ajaxGetSchematicData = function(schematicIdToOpen) {
			var t = this;
			
			var url = 'php/openBinaryById.php?id=' + schematicIdToOpen;
	
			$.ajax({
				url: url,
				progress: function(xhrObject) {
					console.log("ajaxGetSchematicData: ", xhrObject);
				},
				success: function(data) {
					
					base64_decode_async({
						data: data,
						success: function(b64DecodedData) {
							t.loaderModal.setContent("Reading NBT data...");
							setTimeout(function() {
								t.loadSchematic(b64DecodedData);
							},0);
						},
						progress: function(task, amount) {
							var percentDone = "" + Math.floor((amount/data.length)*100) + "%";
							t.loaderModal.setContent("Task: Base 64 decoding<br/>Progress: "+percentDone);
						}
					});
				}
			});
		}
		
		
		/**
		 * Takes input as a binary .schematic file contents   
		 */
		this.loadSchematic = function(data) {
			var isError = false;
			
			try {
			} 
			catch (e) {
				console.log(e);
				isError = true;
			}
			
			if (!isError) {
				/*
				When testing encoding / decoding, uncomment below, and comment above
				
				var nbtData1 = new namespace.NbtParser().encode(nbtData, false, true);
				var nbtData2 = new namespace.NbtParser().decode(nbtData1);
				t.mcSim.loadWorldData(nbtData2, t.userSettings.simulator.startTickingWorldOnLoad);
				*/
				
				//$('#schem').val(JSON.stringify(data)); //Uncomment to export a loaded schematic to a text blob
			}
				
			this.loaderModal.setContent("Reading NBT data..."); //TODO: Localize
			this.loaderModal.show();
			
			var t = this;
			this.loaderMessaging.cancel = false;
			new namespace.NbtParser().decode({
				data: data,
				updateInterval: 1000,
				progress: function(category, progress, messaging) {
					if (t.loaderMessaging.cancel) {
						messaging.cancel = true;
					}
					//console.log("progress: %s", progress);
					t.loaderModal.setContent("Task: "+category+"<br/>Progress: "+progress);
					t.documentOpen.createForm();
					//t.mcSim.loadProgress(category, progress);
				},
				cancel: function() {
					//console.log("cancelled.");
					//t.loaderModal.setContent("Task: "+category+"<br/>Progress: "+progress);
				},
				success: function(nbtData) {
					var startTickingWorldOnLoad = t.userSettings.options.simulator.startTickingWorldOnLoad;
					t.sidebar.show(noAnimate = true);
					t.ticker.resetTickCounter();
					t.mcSim.loadWorld(nbtData, startTickingWorldOnLoad);
					t.loaderModal.hide();
					//t.tempToParticularView();
				}
			});
		}
		
		this.tempToParticularView = function() {
			var 
				NORTH = 0,
				EAST = 1,
				SOUTH = 2,
				WEST = 3;
			
			this.viewPorts.ToggleSplitHorizontally();
			var sideView = this.modelviews.getModelViewByCssClass('modelViewTopRight');

			sideView.changeFacingTo(WEST);
			sideView.layerTo(1);
		}
		
		
		this.saveSchematic = function(options) {
			var nbtData = this.mcSim.saveWorld();
			var nbtParser = new namespace.NbtParser();
			nbtParser.encode({
				data: nbtData,
				encloseInUnnamedCompoundTag: false,
				gzipDeflate: true,
				success: function() {
					console.log("saveSchematic(): success callback.");
				},
				progress: function() {
					console.log("saveSchematic(): progress callback.");
				}
			});
		}
		
		/**
		 * Queries all blocks to get a list of blocktypes the user can place
		 */
		this.initPlaceableBlockList = function() {
			var blocksList = this.mcSim.Block.blocksList;
			var placeableBlocks = {};
			var zoomLevel = 5;
			
			$('body').append('<canvas id="tempForIconGeneration" width="'+zoomLevel*8+'" height="'+zoomLevel*8+'" style="display:none"></canvas>');
			var canvasDomObject = document.getElementById("tempForIconGeneration");
			//var context = new namespace.CanvasInterface();
			context = canvasDomObject.getContext("2d");
			
			//context.getContext(canvasDomObject);
			
			for (block in blocksList) {
				var placeableBlockResults = blocksList[block].enumeratePlaceableBlocks();
				for (placeableBlockType in placeableBlockResults) {
					var blockType = placeableBlockResults[placeableBlockType];
					
					//Fenerate an icon:
					context.setTransform(1, 0, 0, 1, 0, 0); //resets the translate coords
					context.scale(zoomLevel, zoomLevel);
					context.clearRect(0,0,8,8);
					blocksList[block].drawIcon(this.mcSim.Block, context, blockType.blockMetadata);
					blockType.iconImageData = canvasDomObject.toDataURL();
	
					placeableBlocks[blockType.blockType+'_'+blockType.blockID+'_'+blockType.blockMetadata] = (blockType);
				}
			}
			this.placeableBlocks = placeableBlocks;
			//console.log(placeableBlocks);
			$('canvas#tempForIconGeneration').remove();
		}
		
		/**
		 * Pauses all keybinding events
		 * 
		 * For example, a modal calls this as it is shown, so that it overrides key events for itself
		 */
		this.pauseBindings = function() {
			this.input.suspend();
		}
		
		/**
		 * Resumes all keybinding events
		 * 
		 * For example, a modal calls this as it hides itself to make key and mouse events work again 
		 */
		this.resumeBindings = function() {
			this.input.resume();
		}
		
		/**
		 * Get an option's  current value
		 */
		this.getOption = function(category, name) {
			return this.options.getOption(category, name);
		}
		
		this.refreshModelViews = function() {
			this.modelviews.drawAllBlocks();
		}
		
		this.init();
	}
	
	namespace.Gui_FullApp = Gui_FullApp;
}());
; 
com.mordritch.mcSim.googleAnalytics = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	var self = this;
	
	var construct = function() {
		setInterval(function() {
			self.doUpdate();
		},1000*25*60); //25 * 60 seconds
	}
	
	this.doUpdate = function() {
		if (typeof window._gaq != 'undefined') {
			//console.log("pushed %s", window.location.href);
			window._gaq.push(['_trackPageview', window.location.pathname + window.location.search]);
		}
	}
	
	construct();
}
; 
/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * Date: 2011-12-30
 * 
 */

	/*
	http://www.minecraftwiki.net/wiki/Alpha_Level_Format/Chunk_File_Format#Block_Format
	
	Blocks are laid out in sets of vertical columns, with the rows going east-west through chunk, 
	and columns going north-south. Blocks in each chunk are accessed via the following method:
	unsigned char BlockID = Blocks[ y + z * ChunkSizeY(=128) + x * ChunkSizeY(=128) * ChunkSizeZ(=16) ];
	
	The coordinate system is as follows:
	X increases East, decreases West
	Y increases upwards, decreases downwards
	Z increases South, decreases North
	
	The Data, BlockLight, and SkyLight arrays have four bits for each byte of the Blocks array. 
	The least significant bits of the first byte of the Data, BlockLight, or SkyLight arrays correspond 
	to the first byte of the Blocks array.	
	*/
	
	/*
	Plan is to have it be able to dynamically load and unload chunks, including the canvas for them.
	Offset will be so we know which chunk we are displaying.
	ViewportId is for situation when we have multiple topviews, so we don't land up with conflicting
	dom IDs. 
	*/


(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "ModelView_Canvas_Default";
	
	namespace[funcName] = function() {};
	var proto = namespace[funcName].prototype;
	
	proto.defaultSettings = {
		offSetX: 0,
		offSetY: 0,
		borderColour: "128,128,128",
		noContextMenu: true
	}

	proto._construct = function() {
		var options = this.options;
		//Applies default options 
		for (var i in this.defaultSettings) {
			this[i] = this.defaultSettings[i];
		}
		
		//Applies all other options passed
		for (var i in options) {
			if (i == "simulator") {
				this.mcSim = options[i];
				continue;
			}
			this[i] = options[i];
		}
		
		this.constructed = false; //used by readOptions(), gets changed to true when "construct()" gets called.

		this.readOptions(); //Saved user settings
		
		this.zoomLevel = this.defaultZoomLevel;

		this.drawAllBlocks_timer = "";
		this.drawAllBlocks_inProgress = false;
		this.drawAllBlocks_lastposition = 0;
		
		this.currentShownCoords = {x:0,y:0,z:0}; //Used to track what coordinates we currently have displayed on the DOM, so we can compare before updating and thus minimize required slow DOM updates
		this.blocksMarkedForUpdate = {};
		this.latestMouseCoords = {x:0, y:0};
		
		this.columns = 0;
		this.rows = 0;
	
		this.uniqueId = nameSpace.domIdCounter++;
		
		this.eventBindings_coordUpdate = new Array();
		this.eventBindings_onMousedown = new Array();
		
		//this.onMouseEnterOrLeave = options.onMouseEnterOrLeave; should be done in the above loop which went through options
		this.exportImageModal = new com.mordritch.mcSim.guiFullModal(this.gui);

		
		//Generate an ID for the DOM object:
		var id_offSetY;
		var id_offSetX;
		
		if (this.offSetX >= 0) {
			id_offSetX = "p" + this.offSetX;
		}
		else {
			id_offSetX = "n" + this.offSetX;
		}
		
		if (this.offSetY >= 0) {
			id_offSetY = "p" + this.offSetY;
		}
		else {
			id_offSetY = "n" + this.offSetY;
		}
		
		
		this.elementId = "modelView_"+this.uniqueId+"_chunk_"+id_offSetX+"_"+id_offSetY;
		this.elementId_overlay = "modelView_"+this.uniqueId+"_overlay";
		this.containerDomId = 'modelView_'+this.uniqueId; 
		var html = 
			'<div class="canvas" id="'+this.containerDomId+'">' +
				'<div class="scrollable">' +
					'<span class="controls"></span>' +
					
					'<div class="mouseDownCatcher innerDiv">' +
						'<span class="pendingWorldLoad"><br/><br/><br/>'+this.gui.localization.getString("modelview.pendingworldload")+'...</span>' +
						'<canvas class="modelView" id="'+this.elementId+'"></canvas>' +
						'<canvas class="overlay" id="'+this.elementId_overlay+'"></canvas>' +
					'</div>' +
				'</div>' +
			'</div>' +
		''
		$('#workarea').append(html);
		this.setCssClass(this.cssClass);
		

		this.$controls = $('#'+this.containerDomId+' .controls');
		this.$controls.hide();
		this.$controls.html(this.getControlsHtml());

		this.$domObject = $('#'+this.elementId);
		this.$domObject_overlay = $('#'+this.elementId_overlay);

		this.domObject = document.getElementById(this.elementId);
		this.domObject_overlay = document.getElementById(this.elementId_overlay);
		
		this.ctx = this.domObject.getContext("2d");
		
		this.context_overlay = this.domObject_overlay.getContext("2d");

		this.bindControlEvents();
		this.bindMouseEvents();
		
		if (this.noContextMenu == true) this.disableContextMenu();
		
		$(window).bind('resize', {t: this}, function(e){e.data.t.windowResize()});
		this.$controls.parent().bind('mouseenter', {t: this}, function(e) {
			e.data.t.$controls.show();
		});
		
		this.$controls.parent().bind('mouseleave', {t: this}, function(e) {
			e.data.t.$controls.hide();
		});


		this.construct();
		this.constructed = true;
		this.drawAllBlocks();
	}
	
	/**
	 * Used to change the container DIVs CSS class which is responsible for the placement of each modelview
	 */
	proto.setCssClass = function(cssClass) {
		$('#'+this.containerDomId).removeClass(this.cssClass);
		$('#'+this.containerDomId).addClass(cssClass);
		this.cssClass = cssClass;
	}


	proto.onOptionsChange = function() {
		this.readOptions();
	}
	
	/**
	 * Called if the options screen is applied or the user settings are loaded due to a reason like the user logging on 
	 */
	proto.readOptions = function() {
		var options = this.gui.userSettings.options.modelview;
		
		this.borderWidth = options.borderWidth;
		this.layerDownOpacity = options.layerDownOpacity;
		this.lowerLayersToDraw = options.lowerLayersToDraw;
		this.defaultZoomLevel = options.defaultZoomLevel;
		this.workTime = options.workTime;
		
		if (typeof this.mcSim != 'undefined' && this.constructed) this.drawAllBlocks();
	}
	
	proto.windowResize = function() {
		var top = this.$controls.parent().offset().top;
		var left = this.$controls.parent().offset().left;
		
		this.$controls.css('top', top+'px');
		this.$controls.css('left', left+'px');
	}
	
	proto.setLoading = function(state) {
		if (state) {
			$('#'+this.containerDomId+' .pendingWorldLoad').show();
			$('#'+this.containerDomId+' canvas').hide();
		}
		else {
			$('#'+this.containerDomId+' .pendingWorldLoad').hide();
			$('#'+this.containerDomId+' canvas').show();
			this.setDimensions();
		}
	}
	
	/**
	 * Prevents context menu from showing, making it possible to bind our right mousebutton
	 */
	proto.disableContextMenu = function() {
		this.$domObject_overlay.bind("contextmenu",function(e){return false;});
	}
	
	/**
	 * A public method for changing the worktime, perhaps it's a little superfluous 
	 * 
	 * In fact, i don't think it's used.
	proto.setWorkTime = function(workTime) {
		this.workTime = workTime;
	}
	 */
	
	/**
	 * Returns a URL encoded PNG of whatever is presently on the canvas. 
	 * 
	 * @return {String}	URL encoded PNG data 
	 */
	proto.getDataUrl = function() {
		return this.domObject.toDataURL();
	}
	
	proto.zoomLevelIncrease = function() {
		if (this.zoomLevel < 6 && this.zoomLevel >= 1) {
			this.zoomLevel++;
			this.setDimensions();
			return;
		}

		if (this.zoomLevel < 1){
			this.zoomLevel = this.zoomLevel*2;
			this.setDimensions();
		}
	}
	
	proto.zoomLevelDecrease = function() {
		if (this.zoomLevel > 1) {
			this.zoomLevel--;
			this.setDimensions();
			return;
		}
		
		if (this.zoomLevel <= 1 && this.zoomLevel >= 0.250) {
			this.zoomLevel = this.zoomLevel/2;
			this.setDimensions();
		}
	}
	
	proto.bindToEvent_onMousedown = function(callbackFunction) {
		this.eventBindings_onMousedown.push(callbackFunction);
	}
	
	/**
	 * Called when the mouse moves on the canvas
	 * 
	 * @param {Integer}	x	The x coordinate on the canvas
	 * @param {Integer}	y	The y coordinate on the canvas
	 */
	proto.onMouseMove = function(pageX, pageY) {
		this.latestMouseCoords = this.getMousePositionOnCanvas(pageX, pageY);
		this.updateCoords();
	}
	
	proto.updateCoords = function() {
		var schematicCoords = this.getSchematicCoords(this.latestMouseCoords.x, this.latestMouseCoords.y, forAboveLayer = false);
		
		if (
			schematicCoords.x != this.currentShownCoords.x ||
			schematicCoords.y != this.currentShownCoords.y ||
			schematicCoords.z != this.currentShownCoords.z
		) {
			$('#'+this.containerDomId+' span.coords.x').html(schematicCoords.x);
			$('#'+this.containerDomId+' span.coords.y').html(schematicCoords.y);
			$('#'+this.containerDomId+' span.coords.z').html(schematicCoords.z);

			this.currentShownCoords.x = schematicCoords.x;
			this.currentShownCoords.y = schematicCoords.y;
			this.currentShownCoords.z = schematicCoords.z;
		}
	}
	
	proto.exportImage = function() {
		//TODO: can hang on big images, perhaps have some feedback on whether or not it's working
		
		var imageData = document.getElementById(this.elementId).toDataURL();
		
		this.exportImageModal.setContent('<img src="'+imageData+'" />');
		this.exportImageModal.show();
	}
	
	/**
	 * Bind events to the mouse
	 */
	proto.bindMouseEvents = function() {
		//containerDomId
		
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mousemove', {t:this}, function(e) {
			e.data.t.onMouseMove(e.pageX, e.pageY);
		});
		
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mousedown', {t:this}, function(e) {
			e.data.t.gui.input.onKeyDown(e);
		});
		
		/*
		 * Following two bindings are used by bound mouse events to see if we are on top of a canvas
		 * and if so, which one. Then, if we are, we can pass on the event appropriately. 
		 */
		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mouseenter', {t:this}, function(e) {
			var self = e.data.t; 
			self.onMouseEnterOrLeave('enter', self);
		});

		$('#'+this.containerDomId+' .mouseDownCatcher').bind('mouseleave', {t:this}, function(e) {
			var self = e.data.t; 
			self.onMouseEnterOrLeave('leave', self);
		});
		

	}

	proto.pan_onMouseMove = function(e) {
		var $div = $('#' + this.containerDomId + ' .scrollable');

		var positionNow = this.getMousePositionOnCanvas(e.pageX, e.pageY);
		var panStart = this.panStart;

		var currentScrollLeft = $div.scrollLeft();
		var currentScrollTop = $div.scrollTop();
		
		if (typeof panStart != "undefined") {
			$div.scrollLeft(currentScrollLeft + (panStart.x - positionNow.x)); 
			$div.scrollTop(currentScrollTop + (panStart.y - positionNow.y)); 
		}
	}
	
	proto.pan_start = function(e) {
		this.panStart = {
			x: this.latestMouseCoords.x,
			y: this.latestMouseCoords.y
		};
		
		/* This was buggy compared to above approach
		if (e.type == 'mousedown') {
			this.panStart = this.getMousePositionOnCanvas(e.pageX, e.pageY);
		}
		*/
	}
	
	proto.scroll = function(direction) {
		var $div = $('#' + this.containerDomId);
		var scrollAmount = this.zoomLevel * 8 + this.borderWidth;
		var currentScrollLeft = $div.scrollLeft();
		var currentScrollTop = $div.scrollTop();
		
		switch (direction) {
			case "left":
				$div.scrollLeft(currentScrollLeft - scrollAmount);
				break;
			case "right":
				$div.scrollLeft(currentScrollLeft + scrollAmount);
				break;
			case "up":
				$div.scrollTop(currentScrollTop - scrollAmount);
				break;
			case "down":
				$div.scrollTop(currentScrollTop + scrollAmount);
				break;
		}
	}
	
	/**
	 * Returns the x and y position of the mouse on the canvas from the page position
	 * 
	 * @param {Integer}	pageX	the x coordinates of the mouse on the web page
	 * @param {Integer}	pageY	the y coordinates of the mouse on the web page
	 * 
	 * @return	{Object}	Of format: {x: {Integer}, y: {Integer}}
	 */

	proto.getMousePositionOnCanvas = function(pageX, pageY) {
		//Where is the grid DOM element relative to the the top of the document:
		
		/*
		//TODO: caching the result does not take the scroll amount into account:
		if (typeof this.offset == 'undefined') {
			this.offset = {
				x: this.$domObject.offset().left,
				y: this.$domObject.offset().top,
			}
		}
		var mouseOnCanvasX = pageX - this.offset.x;
		var mouseOnCanvasY = pageY - this.offset.y;
		
		return {x: mouseOnCanvasX, y: mouseOnCanvasY};
		*/
		
		//original method below:
		var elementOffsetX = this.$domObject.offset().left;
		var elementOffsetY = this.$domObject.offset().top;
		
		var mouseOnCanvasX = pageX - elementOffsetX;
		var mouseOnCanvasY = pageY - elementOffsetY;

		return {x: mouseOnCanvasX, y: mouseOnCanvasY};
	}

	/**
	 * Called by the simulator any time a block needs to be drawn
	 */
	proto.drawBlock = function(xGrid, yGrid) {
		this.checkSizeForDimensionReset();
		
		var World = this.mcSim.World;
		var mcSim = this.mcSim;
		var worldIsLoaded = this.mcSim.worldIsLoaded;
		var drawMethod = this.drawMethod;
		var currentFacing = this.currentFacing;

		var lowerLayersToDraw = this.getLayersToDrawCount();
		
		var aboveLayerCoords = this.getWorldCoordsFromGridCoords(xGrid, yGrid, -1);
		var lowerLayerCoords = [];
		for (var i = 0; i <= lowerLayersToDraw; i++) {
			lowerLayerCoords[i] = this.getWorldCoordsFromGridCoords(xGrid, yGrid, i);
		}
		
		var ctx = this.ctx;
		var layerDownOpacity = this.layerDownOpacity;
		var aboveLayer = mcSim.getBlockObject(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);

		var offsetX = xGrid*(this.zoomLevel*8+this.borderWidth)+this.borderWidth;
		var offsetY = yGrid*(this.zoomLevel*8+this.borderWidth)+this.borderWidth;

		ctx.setTransform(1, 0, 0, 1, 0, 0); //resets transformations (zoom and translate)
		ctx.translate(offsetX, offsetY);
		ctx.scale(this.zoomLevel, this.zoomLevel);
        
		//If we are rendering a normal block in the current, it will take up the whole square, so we can just draw it now and not worry at all about any layers below
		if (mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z).renderAsNormalBlock()) {
			if (aboveLayer.renderAsNormalBlock()) {
				mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z).drawNormalCube_currentLayer(World, lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z, ctx, true);
				this.blockDrawCount++;
			}
			else {
				mcSim.getBlockObject(lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z)[drawMethod + "_currentLayer"](World, lowerLayerCoords[0].x, lowerLayerCoords[0].y, lowerLayerCoords[0].z, ctx); this.blockDrawCount++;
				var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
				if (aboveLayer.blockID != 0) {
					aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing);
					this.blockDrawCount++;
				}
				else if (aboveEntity != null) {
					var forAboveLayer = true;
					World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing);
					this.blockDrawCount++;
				}

			}
			return;
 		}
		
		//Next we want to know if we will need to draw a white base, to do so we check if any of the layers below are a normal block, which would overwrite the white
		//Also, at the same time we will check if any non-air is found too. 
		var partialBlockFound = false; //for example, a torch, where we can see stuff behind it
		var normalBlockFound = false;
		var deepestNonAirBlock = 0; 
		for (var i = 0; i <= lowerLayersToDraw; i++) {
			if (mcSim.getBlockObject(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z).renderAsNormalBlock()) {
				normalBlockFound = true;
				deepestNonAirBlock = i;
				lowerLayersToDraw = i; 
				break; //As you can't see behind this kind of block, no point in checking about rendering blocks which are below
			}
			else if (
				mcSim.World.getBlockId(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != 0 ||
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != null //if we have a piston retracting, although the block is set to hold air, it will show half the block that is being retracted 
			) {
				partialBlockFound = true;
				deepestNonAirBlock = i;
			}
		}
		if (deepestNonAirBlock < lowerLayersToDraw) lowerLayersToDraw = deepestNonAirBlock; //No need to start drawing before we can see anything
		
		
		//If it's all air, draw for above layer as appropriate and then exit
		if (!normalBlockFound && !partialBlockFound) {
			if (aboveLayer.renderAsNormalBlock()) {
				ctx.fillStyle = "rgb(192,192,192)";
				ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
			}
			else {
				ctx.fillStyle = "rgb(255,255,255)";
				ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
				var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
				if (aboveLayer.blockID != 0) {
					aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing); this.blockDrawCount++;
				}
				else if (aboveEntity != null) {
					var forAboveLayer = true;
					World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing); this.blockDrawCount++;
				}
			}
			return;
		}
		
		//Draw a white base:
		if (!normalBlockFound) {
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
		}
		
		//And now to draw from the bottom up:
		var fogLayerCount = 0;
		var startsWithNormalBlock = false;
		for (var i = lowerLayersToDraw; i>=0; i--) {
			var blockObject = mcSim.getBlockObject(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z);
			//var blockAbove = mcSim.getBlockObject(posX, currentLayer-i+1, posZ); //old line
			if (i != 0) {
				var blockAbove = mcSim.getBlockObject(lowerLayerCoords[i-1].x, lowerLayerCoords[i-1].y, lowerLayerCoords[i-1].z);
			}
			
			/*
			 * If we ever have a solid block, it will always be the first one, so if we do, we want to use a single
			 * draw command to calculate it and it's opacity
			 */
			if (
				i == lowerLayersToDraw &&
				blockObject.renderAsNormalBlock()
			) {
				startsWithNormalBlock = true;
				fogLayerCount++;
				continue;
			}
			
			/*
			 * If statement checks for a series of stacked air blocks and once it reaches the end,
			 * it calculates the opacity all at once, rather than using seperate expensive
			 * draw operations for each layer
			 */
			if (
				i != 0 &&
				blockAbove.blockID == 0 &&
				blockObject.blockID == 0 &&
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) == null &&
				//World.getRetractingBlockEntity(posX, currentLayer-i+1, posZ) == null //old line
				World.getRetractingBlockEntity(lowerLayerCoords[i-1].x, lowerLayerCoords[i-1].y, lowerLayerCoords[i-1].z) == null
			) {
				fogLayerCount++;
				continue;
			}
			
			if (
				fogLayerCount > 0
			) {
				//console.log(fogLayerCount);
				if (startsWithNormalBlock) {
					var alpha = 1-Math.pow(layerDownOpacity, fogLayerCount);
					
					mcSim.getBlockObject(
						lowerLayerCoords[lowerLayersToDraw].x,
						lowerLayerCoords[lowerLayersToDraw].y,
						lowerLayerCoords[lowerLayersToDraw].z
					).drawNormalCube_withOpacity(
						World,
						lowerLayerCoords[lowerLayersToDraw].x,
						lowerLayerCoords[lowerLayersToDraw].y,
						lowerLayerCoords[lowerLayersToDraw].z,
						ctx,
						alpha
					);
					
					startsWithNormalBlock = false;
				}
				else {
					ctx.fillStyle = "rgba(255,255,255,"+(1-Math.pow(layerDownOpacity, fogLayerCount))+")";
					ctx.fillRect(0, 0, 8, 8); this.blockDrawCount++;
				}
				fogLayerCount = 0;
			}
			
			/*
			 * Finally, do a normal draw operation, provided that it's not air, and it's not a solid block in the bottom most layer
			 * of our lower layers to draw. The solid block in lowest layer is excluded because we have already handled that above.
			 */
			if (
				blockObject.blockID != 0 &&
				!(
					i == lowerLayersToDraw &&
					blockObject.renderAsNormalBlock()
				)
			) {
				blockObject[drawMethod + "_currentLayer"](World, lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z, ctx, currentFacing); this.blockDrawCount++;
				fogLayerCount++;
				continue;
			}
			
			/*
			 * If it's an air block and if a piston is retracting a block from it, draw it
			 */
			if (
				blockObject.blockID == 0 &&
				World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z) != null
			) {
				var entity = World.getRetractingBlockEntity(lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z);
				var forAboveLayer = false;
				World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, lowerLayerCoords[i].x, lowerLayerCoords[i].y, lowerLayerCoords[i].z, ctx, entity, forAboveLayer, currentFacing); this.blockDrawCount++;
				fogLayerCount++;
				continue;
			}
			
			
		}

		if (aboveLayer.blockID != 0) {
			aboveLayer[drawMethod + "_aboveLayer"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, currentFacing); this.blockDrawCount++;
		}
		
		var aboveEntity = World.getRetractingBlockEntity(aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z);
		if (aboveEntity != null) {
			var forAboveLayer = true;
			World.Block.pistonMoving[drawMethod + "_moving_fromAir"](World, aboveLayerCoords.x, aboveLayerCoords.y, aboveLayerCoords.z, ctx, aboveEntity, forAboveLayer, currentFacing); this.blockDrawCount++;
		}
	}
	
	/**
	 * Redraws all the blocks we can see on the canvas
	 * 
	 * Usually called when zoomlevel or dimensions of the canvas are changed. 
	 */
	proto.drawAllBlocks = function(drawingMore, resumeFrom, startedAt) {
		if (!this.mcSim.worldIsLoaded) {
			this.setLoading(true);
			return;
		}
		
		this.checkSizeForDimensionReset();
		
		this.ctx.setTransform(1, 0, 0, 1, 0, 0); //resets the translate coords
		if (typeof drawingMore != "boolean") drawingMore = false;
		var workTime = this.workTime; //in millisenconds 
		/*
		 * How long we spend in our loop to draw blocks before we use a setTimeout to give the browser a chance to 
		 * update changes to the page, canvas and process any user input.
		 * 
		 * Be aware different browsers / platforms take different amounts of time to "draw" page changes, so the smaller
		 * the value, the longer overall the process takes.
		 * 
		 * For example:
		 * Chrome: about 4ms
		 * Firefox: 8 - 11ms
		 * Safari Mobile (iPad 2 / iPhone 4S): around 220ms (more if you are dragging as it loads)
		 * 
		 * So, using a shorter time on safari mobile greatly increases overall load time, whereas on chrome, makes
		 * very little difference.
		 * 
		 * TODO: Measure the time betwen set timeout and this function being called and then adjust the work time dynamically
		 */
		
		
		//Doesn't always work when put inside the if (!drawingMore) block, it seems that if this function is
		//called twice in quick succession, then it doesn't see a populated this.drawAllBlocks_timer
		//I worked out why this happens, it's because it's only midloop we set the variable
		window.clearTimeout(this.drawAllBlocks_timer);
		
		var resumeFrom;
		if (!drawingMore) {
			resumeFrom = 0;
			this.blockDrawCount = 0;
			//console.profile("Redraw");
			startedAt = new Date().getTime();

			var canvasWidth = this.columns * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
			var canvasHeight = this.rows * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
	
			this.ctx.fillStyle = "rgba("+this.borderColour+",0.5)";

			if (this.drawAllBlocks_lastposition > 0) {
				//Only darken what had already been drawn:
				
				var rowsDrawn = Math.floor(this.drawAllBlocks_lastposition/this.columns);
				var remainingBlocksInLastRow = this.drawAllBlocks_lastposition%this.columns;
				
				//Rows up until partially completed row:
				this.ctx.fillRect(0,0, canvasWidth, rowsDrawn * (this.zoomLevel*8 + this.borderWidth));
				
				//Blocks in the partially completed row:
				this.ctx.fillRect(0, rowsDrawn * (this.zoomLevel*8 + this.borderWidth), remainingBlocksInLastRow * (this.zoomLevel*8 + this.borderWidth), this.zoomLevel*8 + this.borderWidth);
			}
			else {
				//Darken everything:
				this.ctx.fillRect(0,0, canvasWidth, canvasHeight);
			}
			
			
			
		}

		var startTime = new Date().getTime();
		
		var position = 0;

		for (var r = 0; r < this.rows; r++) {
			for (var c = 0; c < this.columns; c++) {
				if (position >= resumeFrom) {
					if ((new Date().getTime()) - startTime > workTime) {
						//var percentDone = Math.floor(position/(this.rows*this.columns)*100);
						//$("#percentDone").html(" "+percentDone+"%");
						var t = this;
						this.drawAllBlocks_lastposition = position;
						this.drawAllBlocks_timer = window.setTimeout(function(){
							t.drawAllBlocks(true, position, startedAt);
						});
						return;
					}
					this.drawBlock(c, r);
				}
				position++;
			}
		}
		this.drawAllBlocks_lastposition = 0;
		
		var timeDiff = new Date().getTime() - startedAt;
		console.log("Redrew %s blocks in %sms. zoomLevel: %s", (this.rows*this.columns), timeDiff, this.zoomLevel);
		//console.profileEnd("Redraw");
		//$("#percentDone").html("Redrew "+(this.rows*this.columns)+" blocks in " + timeDiff + "ms. Total of "+this.blockDrawCount+" drawBlock and fillRect for background and alpha.");
		
		//TODO: Convert to mcSim implementation
		
		/*
		this.paintSelectionBox();
		for (var x in this.redstoneSim.modelData.dataArray) {
			for (var y in this.redstoneSim.modelData.dataArray[x]) {
				//The dataArray has blocks off the grid so that blocks on the edge have
				//neighbor blocks they can check, do not bother rendering them
				if (
					x < this.redstoneSim.modelData.sizeX &&
					x >= 0 && 
					y < this.redstoneSim.modelData.sizeY &&
					y >= 0
				) this.paintBlock(this.redstoneSim.modelData.dataArray[x][y][this.activeLayer]);
			}
		}
		*/
	}
	
	/**
	 * Returns the schematic coordinates from an and x and y position on the canvas
	 * 
	 * @param	{Integer}	canvasX	The x coordinate on the canvas
	 * @param	{Integer}	canvasY	The y coordinate on the canvas
	 * 
	 * @return	{Integer}	Of format: {x: {Integer}, y: {Integer}, z: {Integer}}
	 */
	proto.getSchematicCoords = function(canvasX, canvasY, forAboveLayer) {
		if (this.gui.mcSim.World == null) return {x: '-', y: '-', z: '-'}; //if the world is still loading while we are hovering over, an error happens

		//Offset the position by half the width of the border, so that the border can count for blocks. 
		var offsetCanvasX = canvasX - this.borderWidth/2; 
		var offsetCanvasY = canvasY - this.borderWidth/2;

		//Math.floor rounds a number down:
		var currentX = Math.floor(offsetCanvasX / (this.zoomLevel * 8 + this.borderWidth));
		var currentY = Math.floor(offsetCanvasY / (this.zoomLevel * 8 + this.borderWidth));
		
		var translatedCoords = (forAboveLayer) ? this.getWorldCoordsFromGridCoords(currentX, currentY, -1) : this.getWorldCoordsFromGridCoords(currentX, currentY, 0);
		
		var xReturn = translatedCoords.x;
		var yReturn = translatedCoords.y;
		var zReturn = translatedCoords.z;

		var xMax = this.gui.mcSim.World.worldData.getSizeX();
		var yMax = this.gui.mcSim.World.worldData.getSizeY();
		var zMax = this.gui.mcSim.World.worldData.getSizeZ();
		
		//The mouse move event is captured for the entire screen area alocated for the canvas, even it's smaller. As such, don't show coordinates which are off the grid:
		if (xReturn < 0 || xReturn >= xMax) {
			xReturn = '-';
		}
		if (yReturn < 0 || yReturn >= yMax) {
			yReturn = '-';
		}
		if (zReturn < 0 || zReturn >= zMax) {
			zReturn = '-';
		}

		return {
			x: xReturn,
			y: yReturn,
			z: zReturn
		};
	}
	
	proto.markBlockNeedsUpdate = function(posX, posY, posZ) {
		var gridCoords = this.getGridCoordsFromWorldCoords(posX, posY, posZ);
		
		if (
			this.worldCoordsAreInRenderRange(posX, posY, posZ) &&
			typeof this.blocksMarkedForUpdate[gridCoords.x+"_"+gridCoords.y] == 'undefined'
		) {
			this.blocksMarkedForUpdate[gridCoords.x+"_"+gridCoords.y] = {x: gridCoords.x, y: gridCoords.y};
		}
	}
	
	proto.flushMarkedBlocks = function() {
		for (var i in this.blocksMarkedForUpdate) {
			var x = this.blocksMarkedForUpdate[i].x;
			var y = this.blocksMarkedForUpdate[i].y;
			this.drawBlock(x, y);
		}
		this.blocksMarkedForUpdate = {};
	}

	
	/**
	 * Resizes the canvas element on the page appropriately
	 * 
	 * @param {Object}	options in object notation, can include rows, columns, zoomLevel,
	 * 					and borderWidth 
	 */
	proto.setDimensions = function(options) {
		if (typeof options != "undefined") {
			for (var i in options) {
				if (
					i == "rows" ||
					i == "columns" ||
					i == "zoomLevel" ||
					i == "borderWidth"
				) {
					this[i] = options[i];
				}
			}
		}
		
		var canvasWidth = this.columns * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
		var canvasHeight = this.rows * (this.zoomLevel*8 + this.borderWidth) + this.borderWidth;
		
		this.$domObject.attr('width', canvasWidth);
		this.$domObject.attr('height', canvasHeight);
		
		this.ctx = this.domObject.getContext("2d");
		
		this.ctx.fillStyle = "rgb("+this.borderColour+")";
		this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		this.$domObject_overlay.attr('width', canvasWidth);
		this.$domObject_overlay.attr('height', canvasHeight);
		this.context_overlay = this.domObject_overlay.getContext("2d");
		this.context_overlay.fillStyle = "rgba(0,0,0,0)";
		this.context_overlay.fillRect(0, 0, canvasWidth, canvasHeight);

		this.drawAllBlocks();
	}
}());
; 
/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * Date: 2011-12-30
 * 
 */

(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "ModelView_CanvasTop";
	var parentFunc = "ModelView_Canvas_Default";
	
	namespace[funcName] = function(options) {
		this.options = options;
		this._construct();
	};
	
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	 
	proto.construct = function() {
		this.currentLayer = 0;
		this.currentFacing = 0; //At this time only used by sideview, but our draw methods use this to determine based on the direction of the viewport, how we should draw blocks
		this.drawMethod = "drawTopView";
	}
	
	/**
	 * Generates the HTML for the controls of the model view, called in the parent class' _construct method 
	 */
	proto.getControlsHtml = function() {
		 var returnString = 
		 	'<span class="status">' +
				'N: <span class="direction">&#8593;</span>' +
				'X: <span class="coords x">0</span>' +
				'Y: <span class="coords y">0</span>' +
				'Z: <span class="coords z">0</span>' +
			'</span>' +
			'<img class="arrowUp" src="images/icons/modelviewControls/arrow-up.png" />' +
			'<img class="arrowDown" src="images/icons/modelviewControls/arrow-down.png" />' +
			'<img class="zoomIn" src="images/icons/modelviewControls/zoom-in.png" />' +
			'<img class="zoomOut" src="images/icons/modelviewControls/zoom-out.png" />' +
			'<img class="exportImage" src="images/icons/modelviewControls/export-image.png" />';
		return returnString;
	}
	
	/**
	 * Binds events to the controls of the modelView 
	 */
	proto.bindControlEvents = function() {
		$('#'+this.containerDomId+' .arrowUp').bind('click', {t: this}, function(e) {e.data.t.layerUp()});
		$('#'+this.containerDomId+' .arrowDown').bind('click', {t: this}, function(e) {e.data.t.layerDown()});
		$('#'+this.containerDomId+' .zoomIn').bind('click', {t: this}, function(e) {e.data.t.zoomLevelIncrease()});
		$('#'+this.containerDomId+' .zoomOut').bind('click', {t: this}, function(e) {e.data.t.zoomLevelDecrease()});
		$('#'+this.containerDomId+' .exportImage').bind('click', {t: this}, function(e) {e.data.t.exportImage()});
	}
		
	
	/**
	 * Tries moving up one layer up
	 */
	proto.layerUp = function() {
		if (this.currentLayer + 1 < this.mcSim.worldData.getSizeY()) {
			this.currentLayer++;
			this.drawAllBlocks();
		}
	}
	
	/**
	 * Tries moving down one layer down
	 */
	proto.layerDown = function() {
		if (this.currentLayer > 0) {
			this.currentLayer--;
			this.drawAllBlocks();
		}
	}
	
	/**
	 * Tries moving to the specified layer
	 */
	proto.layerTo = function(layerNumber) {
		if (
			layerNumber < this.mcSim.worldData.getSizeY() &&
			layerNumber >= 0 &&
			layerNumber != this.currentLayer
		) {
			this.currentLayer = layerNumber;
			this.drawAllBlocks();
			return true;
		}
		return false;
	}

	/**
	 * Check and see if the dimensions of a "world" have changed and if we maybe need to change our canvas size.
	 */
	proto.checkSizeForDimensionReset = function() {
		var xSize = this.mcSim.worldData.getSizeX();
		var ySize = this.mcSim.worldData.getSizeZ();
		
		if (
			this.columns != xSize ||
			this.rows != ySize
		) {
			this.setDimensions({
				columns: xSize,
				rows: ySize
			});
		}
	}
	
	/**
	 * Translates world coordinates into grid coordinates based on current direction
	 */
	proto.getGridCoordsFromWorldCoords = function(xWorld, yWorld, zWorld) {
		return {
			x: xWorld,
			y: zWorld
		};
	}
	
	/**
	 * Based on our direction we are facing and our current layer, ensure that our number of lower layers to
	 * draw doesn't extend outside of our world size; 
	 */
	proto.getLayersToDrawCount = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var currentLayer = this.currentLayer;
		var drawDepth = this.lowerLayersToDraw;
		
		return (currentLayer - drawDepth >= 0) ? drawDepth : currentLayer;  
	}

	proto.getWorldCoordsFromGridCoords = function(xGrid, yGrid, depth) {
		if (this.gui.mcSim.World == null) return {x: 0, y: 0, z: 0}; //if the world is still loading while we are hovering over, an error happens
		var currentLayer = this.currentLayer;
		
		return {
			x: xGrid,
			y: currentLayer - depth,
			z: yGrid
		};
	}

	/**
	 * See if world coords are in the currentLayer + renderdepth
	 *  
	 * Returns true or false
	 */
	proto.worldCoordsAreInRenderRange = function(xCoord, yCoord, zCoord) {
		var lowerLayersToDraw = this.lowerLayersToDraw;
		var currentLayer = this.currentLayer;
		var returnValue;
		
		if (zCoord < 0 || yCoord < 0 || zCoord < 0) {
			returnValue = false;
		}
		
		returnValue = (currentLayer - lowerLayersToDraw <= yCoord && yCoord <= currentLayer || yCoord == currentLayer + 1);
		
		var debugReturn = false;
		if (debugReturn) {
			console.log(
				"worldCoordsAreInRenderRange(): returnValue=%s, currentLayer=%s, lowerLayersToDraw=%s, coords=x:%s, y:%s, z:%s",
				returnValue,
				currentLayer,
				lowerLayersToDraw,
				xCoord,
				yCoord,
				zCoord
			);
		}

		return returnValue;
	}
}());; 
/*
 * Author: Jonathan Lydall
 * Website: http://www.mordritch.com/ 
 * Date: 2011-12-30
 * 
 */

(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "ModelView_Canvas_Default";
	var funcName = "ModelView_CanvasSide";
	
	namespace[funcName] = function(options) {
		this.options = options;
		this._construct();
	};
	
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	/**
	 * "Constants" 
	 */
	var 
		NORTH = 0,
		EAST = 1,
		SOUTH = 2,
		WEST = 3;
		
	proto.construct = function() {
		this.currentSlice = 0;
		this.currentFacing = NORTH;
		this.drawMethod = "drawSideView";
		$('#'+this.containerDomId+' .direction').html(new Array('N','E','S','W')[this.currentFacing]);
	}
	
	/**
	 * Generates the HTML for the controls of the model view, called in the parent class' _construct method 
	 */
	proto.getControlsHtml = function() {
		 var returnString = 
		 	'<span class="status">' +
				'&#8593;: <span class="direction">-</span>' +
				'X: <span class="coords x">-</span>' +
				'Y: <span class="coords y">-</span>' +
				'Z: <span class="coords z">-</span>' +
			'</span>' +
			'<img class="arrowUp" src="images/icons/modelviewControls/arrow-up.png" />' +
			'<img class="arrowDown" src="images/icons/modelviewControls/arrow-down.png" />' +
			'<img class="rotateClockwise" src="images/icons/modelviewControls/rotate-right.png" />' +
			'<img class="rotateAntiClockwise" src="images/icons/modelviewControls/rotate-left.png" />' +
			'<img class="zoomIn" src="images/icons/modelviewControls/zoom-in.png" />' +
			'<img class="zoomOut" src="images/icons/modelviewControls/zoom-out.png" />' +
			'<img class="exportImage" src="images/icons/modelviewControls/export-image.png" />';
		return returnString;
	}
	

	proto.bindControlEvents = function() {
		$('#'+this.containerDomId+' .arrowUp').bind('click', {t: this}, function(e) {e.data.t.layerUp()});
		$('#'+this.containerDomId+' .arrowDown').bind('click', {t: this}, function(e) {e.data.t.layerDown()});
		$('#'+this.containerDomId+' .rotateClockwise').bind('click', {t: this}, function(e) {e.data.t.rotateClockwise()});
		$('#'+this.containerDomId+' .rotateAntiClockwise').bind('click', {t: this}, function(e) {e.data.t.rotateAntiClockwise()});
		$('#'+this.containerDomId+' .zoomIn').bind('click', {t: this}, function(e) {e.data.t.zoomLevelIncrease()});
		$('#'+this.containerDomId+' .zoomOut').bind('click', {t: this}, function(e) {e.data.t.zoomLevelDecrease()});
		$('#'+this.containerDomId+' .exportImage').bind('click', {t: this}, function(e) {e.data.t.exportImage()});
	}
	
	/**
	 * Translates out current grid coordinate into a world coordinate, based on current direction being faced 
	 * usefull for knowing where in the world our block is based on where our mouse is
	 * 
	 * Depth is how many layers down we are checking from our currentSlice, set to 0 for currentSlice
	 */
	proto.getWorldCoordsFromGridCoords = function(xGrid, yGrid, depth) {
		if (this.gui.mcSim.World == null) return {x: 0, y: 0, z: 0}; //if the world is still loading while we are hovering over, an error happens
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		
		var xWorldSize = worldData.getSizeX();  
		var yWorldSize = worldData.getSizeY();  
		var zWorldSize = worldData.getSizeZ();  

		switch (this.currentFacing) {
			case NORTH:
				return {
					x: xGrid,
					y: yWorldSize - yGrid - 1,
					z: currentSlice - depth
				};
				break;
			case EAST:
				return {
					x: currentSlice + depth,
					y: yWorldSize - yGrid - 1,
					z: xGrid
				};
				break;
			case SOUTH:
				return {
					x: xWorldSize - xGrid - 1,
					y: yWorldSize - yGrid - 1,
					z: currentSlice + depth
				};
				break;
			case WEST:
				return {
					x: currentSlice - depth,
					y: yWorldSize - yGrid - 1,
					z: zWorldSize - xGrid - 1
				};
				break;
		}
	}
	
	/**
	 * Translates world coordinates into grid coordinates based on current direction
	 */
	proto.getGridCoordsFromWorldCoords = function(xWorld, yWorld, zWorld) {
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		
		var xWorldSize = worldData.getSizeX();
		var yWorldSize = worldData.getSizeY();
		var zWorldSize = worldData.getSizeZ();
				
		switch (this.currentFacing) {
			case NORTH:
				return {
					x: xWorld,
					y: yWorldSize - yWorld - 1
				};
				break;
			case EAST:
				return {
					x: zWorld,
					y: yWorldSize - yWorld - 1
				};
				break;
			case SOUTH:
				return {
					x: xWorldSize - xWorld - 1,
					y: yWorldSize - yWorld - 1
				};
				break;
			case WEST:
				return {
					x: zWorldSize - zWorld - 1,
					y: yWorldSize - yWorld - 1
				};
				break;
		}
	}
	
	/**
	 * See if world coords are in the current slice + offset based on the current direction
	 *  
	 * Returns true or false
	 */
	proto.worldCoordsAreInRenderRange = function(xCoord, yCoord, zCoord) {
		var lowerLayersToDraw = this.lowerLayersToDraw;
		var currentSlice = this.currentSlice;
		var returnValue;
		
		if (zCoord < 0 || yCoord < 0 || zCoord < 0) {
			returnValue = false;
		}
		
		switch (this.currentFacing) {
			case NORTH:
				returnValue = (currentSlice - lowerLayersToDraw <= zCoord && zCoord <= currentSlice || zCoord == currentSlice + 1);
				break;
			case SOUTH:
				returnValue = (currentSlice + lowerLayersToDraw >= zCoord && zCoord >= currentSlice || zCoord == currentSlice - 1);
				break;
			case WEST:
				returnValue = (currentSlice - lowerLayersToDraw <= xCoord && xCoord <= currentSlice || xCoord == currentSlice + 1);
				break;
			case EAST:
				returnValue = (currentSlice + lowerLayersToDraw >= xCoord && xCoord >= currentSlice || xCoord == currentSlice - 1);
				break;
			default: throw new Error("Unexpected case");
		}
		
		var debugReturn = false;
		if (returnValue && debugReturn) {
			console.log(
				"worldCoordsAreInRenderRange(): returnValue=%s, currentFacing=%s, currentSlice=%s, lowerLayersToDraw=%s, coords=x:%s, y:%s, z:%s",
				returnValue,
				this.currentFacing,
				currentSlice,
				lowerLayersToDraw,
				xCoord,
				yCoord,
				zCoord
			);
		}

		return returnValue;
	}
	
	/**
	 * Based on our direction we are facing and our current layer, ensure that our number of lower layers to
	 * draw doesn't extend outside of our world size; 
	 */
	proto.getLayersToDrawCount = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var currentSlice = this.currentSlice;
		var drawDepth = this.lowerLayersToDraw;
		var currentFacing = this.currentFacing;
		
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		
		switch (currentFacing) {
			case NORTH:
				return (currentSlice - drawDepth >= 0) ? drawDepth : currentSlice;  
				break;
			case EAST:
				return (currentSlice + drawDepth <= xWorldSize) ? drawDepth : xWorldSize - currentSlice;  
				break;
			case SOUTH:
				return (currentSlice + drawDepth <= zWorldSize) ? drawDepth : zWorldSize - currentSlice;  
				break;
			case WEST:
				return (currentSlice - drawDepth >= 0) ? drawDepth : currentSlice;  
				break;
			
		}
	}
		
	proto.rotateClockwise = function() {
		this.changeFacingTo(new Array(1, 2, 3, 0)[this.currentFacing]);
	}
	
	proto.rotateAntiClockwise = function() {
		this.changeFacingTo(new Array(3, 0, 1, 2)[this.currentFacing]);
	}
	
	proto.changeFacingTo = function(facing) {
		this.currentFacing = facing;
		var maxSlice = this.getMaxSlice();
		if (this.currentSlice >= maxSlice) {
			this.currentSlice = maxSlice;
		}
		$('#'+this.containerDomId+' .direction').html(new Array('N','E','S','W')[this.currentFacing]);
		this.drawAllBlocks();
	}
	
	/**
	 * Tries moving up one layer up
	 */
	proto.layerUp = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		var currentSlice = this.currentSlice;
		var currentFacing = this.currentFacing;
		
		switch (currentFacing) {
			case NORTH:
				if (currentSlice + 1 < zWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case EAST:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case SOUTH:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case WEST:
				if (currentSlice + 1 < xWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
		}
	}
	
	/**
	 * Tries moving down one layer down
	 */
	proto.layerDown = function() {
		var worldData = this.gui.mcSim.World.worldData;
		var xWorldSize = worldData.getSizeX();
		var zWorldSize = worldData.getSizeZ();
		var currentSlice = this.currentSlice;
		var currentFacing = this.currentFacing;
		
		switch (currentFacing) {
			case NORTH:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
			case EAST:
				if (currentSlice + 1 < xWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case SOUTH:
				if (currentSlice + 1 < zWorldSize) {
					this.currentSlice++;
					this.drawAllBlocks();
				}
				break;
			case WEST:
				if (currentSlice > 0) {
					this.currentSlice--;
					this.drawAllBlocks();
				}
				break;
		}
	}
	
	/**
	 * Based on the current direction it's facing, returns the max slice that is possible 
	 */
	proto.getMaxSlice = function() {
		var xWorldSize = this.gui.mcSim.World.worldData.getSizeX();
		var zWorldSize = this.gui.mcSim.World.worldData.getSizeZ();
		var currentFacing = this.currentFacing;

		if (currentFacing == NORTH || currentFacing == SOUTH) {
			return zWorldSize;
		}
		else {
			return xWorldSize;
		}
	}
	
	/**
	 * Tries moving to the specified layer
	 */
	proto.layerTo = function(layerNumber) {
		var currentSlice = this.currentSlice;
		var maxSlice = this.getMaxSlice();

		if (
			layerNumber < maxSlice &&
			layerNumber >= 0 &&
			layerNumber != currentSlice
		) {
			this.currentSlice = layerNumber;
			this.drawAllBlocks();
			return true;
		}
		return false;
	}

	/**
	 * Check and see if the dimensions of a "world" have changed and if we maybe need to change our canvas size.
	 */
	proto.checkSizeForDimensionReset = function() {
		var currentRows = this.rows;
		var worldRows = this.mcSim.worldData.getSizeY();
		
		var currentColumns = this.columns;
		switch (this.currentFacing) {
			case NORTH:
				var worldColumns = this.mcSim.worldData.getSizeX();
				break;
			case EAST:
				var worldColumns = this.mcSim.worldData.getSizeZ();
				break;
			case SOUTH:
				var worldColumns = this.mcSim.worldData.getSizeX();
				break;
			case WEST:
				var worldColumns = this.mcSim.worldData.getSizeZ();
				break;
		}
		
		
		if (
			currentColumns != worldColumns ||
			currentRows != worldRows
		) {
			this.setDimensions({
				columns: worldColumns,
				rows: worldRows
			});
		}
	}
	
	
}());
; 
com.mordritch.mcSim.ticker = function(simulator) {
	this.simulator = simulator;
	this.targetTps = 20; //TODO: Make readable from a config section
	this.tickOnceIncrement = 1; //TODO: Make readable from a config section
	this.isRunning = false;
	this.eventBindings = [];
	this.nextTickAt = 1;
	this.previousTickRunAt = 0;
	
	this.run = function() {
		var thisReferrence = this;
		var timeBetween = 1000/this.targetTps;
		
		setTimeout(
			function() {
				var timeNow = new Date().getTime();
				if (timeNow  >= thisReferrence.nextTickAt) {
					var incrementCount = 0;
					while (thisReferrence.nextTickAt <= timeNow) {
						thisReferrence.nextTickAt += timeBetween;
						incrementCount++;
					}
					if (incrementCount > 1) {
						//Can have feedback option here, EG: ('Dropped ' + (incrementCount-1) + ' ticks');
					}
					thisReferrence.trackTps();
					thisReferrence.nextTickAt = timeNow + timeBetween;

					thisReferrence.tick();
				}
				
				if (thisReferrence.isRunning) thisReferrence.run(); //recursive call
			}
		);
	}
	
	this.trackTps = function() {
		var timeNow = new Date().getTime();
		//$("#tps").text(Math.round(1000/(timeNow-this.previousTickRunAt))); //TODO: have this bindable to a callback or something?
		this.previousTickRunAt = timeNow;
	}
	
	this.tick = function() {
		if (
			//!this.isRunning ||
			!this.simulator.worldIsLoaded
		) {
			this.stopRunning();
			return;
		}
		
		//The order is important, tile entities need to be updated before ticks, to ensure the order matches that of the game 
		this.simulator.World.updateEntities();
		this.simulator.World.tick();
		this.triggerEvent("onTickFinished");
	}
	
	this.toggleRunning = function() {
		if (!this.isRunning) {
			this.startRunning();
		}
		else {
			this.stopRunning();
		}
	}
	
	this.tickOnce = function() {
		this.stopRunning();
		for (var count = 1; count <= this.tickOnceIncrement; count++) {
			this.tick();
		}
		
	}
	
	this.startRunning = function() {
		this.nextTickAt = new Date().getTime();
		this.previousTickRunAt = this.nextTickAt; 
		
		if (
			!this.isRunning &&
			this.simulator.worldIsLoaded			
		) {
			this.isRunning = true;
			this.triggerEvent("startRunning");
			this.run();
		}
		
	}

	this.stopRunning = function() {
		if (this.isRunning) {
			this.triggerEvent("stopRunning");
			this.isRunning = false;
		}
	}
	
	/**
	 * Register a callback event called each time the simulator starts or stops running
	 * 
	 * For example, the gui can register a callback for anytime the simulator is paused or starts running,
	 * it can then react on the call back to change the "is running" UI element.
	 * 
	 */
	this.bind = function(eventName, callBackFunction) {
		this.eventBindings.push([eventName, callBackFunction]);
	}
	
	/**
	 * Calls all callbacks bound to an eventName
	 */
	this.triggerEvent = function(eventName) {
		for (var i=0; i<this.eventBindings.length; i++) {
			if (this.eventBindings[i][0] == eventName) {
				this.eventBindings[i][1]();
			}
		}
	}
}
; 
/**
 * Acts as a proxy to all convas 2d context calls
 * 
 * Originally I was unaware of .translate to set up an offset, so was manually using an offset in my forward
 * calls. However, I also discovered that certain setting calls are expensive, for example setting the font.
 * 
 * With the above in mind, it is being kept as it does improve performance considerably.
 * 
 * @param {Object} modelView	The modelview which has this canvas  
 */

com.mordritch.mcSim.CanvasInterface = function() {
	this.contextValues = {};

	this.settings = [
		'fillStyle',
		'font',
		'globalAlpha',
		'globalCompositeOperation',
		'lineCap',
		'lineJoin',
		'lineWidth',
		'miterLimit',
		'shadowBlur',
		'shadowColor',
		'shadowOffsetX',
		'shadowOffsetY',
		'strokeStyle',
		'textAlign',
		'textBaseline'
	];
	
	this.setContext = function(context) {
		this.context = context;
		
		for (var i=0; i<this.settings.length; i++) {
			var settingName = this.settings[i];
			this.contextValues[settingName] = this.context[settingName];
			this[settingName] = this.contextValues[settingName];
		}
	}
	
	/**
	 * Called by every method to ensure the canvas' properties are in sync with this interface
	 * 
	 * This also caches our setting calls to the context object, avoiding setting the values
	 * unless they have actually changed. Certain setting changes are quite "slow", for example
	 * setting the context's font. However, all the settings seem to have a certain amount of overhead
	 * and this improves our performance.
	 */
	this.setProperties = function() {
		for (var i=0; i<this.settings.length; i++) {
			var settingName = this.settings[i];
			if (this[settingName] != this.contextValues[settingName]) {
				this.context[settingName] = this[settingName];
				this.contextValues[settingName] = this[settingName];
			}
		} 
	}
	
	//Standard 2D context functions follow:
	
	this.bezierCurveTo = function(cp1x, cp1y, cp2x, cp2y, x, y) {
		this.setProperties();
		return this.context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
	}
	
	this.arc = function(x, y, radius, startAngle, endAngle, anticlockwise) {
		this.setProperties();
		return this.context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
	}
	
	this.arcTo = function(x1, y1, x2, y2, radius) {
		this.setProperties();
		return this.context.arcTo(x1, y1, x2, y2, radius);
	}
	
	this.beginPath = function() {
		this.setProperties();
		return this.context.beginPath();
	}
	
	this.clearRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.clearRect(x, y, w, h);
	}
	
	this.clip = function() {
		this.setProperties();
		return this.context.clip();
	}
	
	this.closePath = function() {
		this.setProperties();
		return this.context.closePath();
	}
	
	this.createImageData = function(a1, a2) {
		this.setProperties();
		return this.context.createImageData(a1, a2);
	}
	
	this.createLinearGradient = function(x0, y0, x1, y1) {
		this.setProperties();
		return this.context.createLinearGradient(x0, y0, x1, y1);
	}
	
	this.createPattern = function(image, repetition) {
		this.setProperties();
		return this.context.createPattern(image, repetition);
	}
	
	this.createRadialGradient = function(x0, y0, r0, x1, y1, r1) {
		this.setProperties();
		return this.context.createRadialGradient(x0, y0, r0, x1, y1, r1);
	}
	
	this.drawImage = function(pSrc, sx, sy, sw, sh, dx, dy, dw, dh) {
		this.setProperties();
		return this.context.drawImage(pSrc, sx, sy, sw, sh, dx, dy, dw, dh);
	}
	
	this.fill = function() {
		this.setProperties();
		return this.context.fill();
	}
	
	this.fillRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.fillRect(x, y, w, h);
	}
	
	this.fillText = function(text, x, y, maxWidth) {
		this.setProperties();
		return this.context.fillText(text, x, y, maxWidth);
	}
	
	this.getImageData = function(sx, sy, sw, sh) {
		this.setProperties();
		return this.context.getImageData(sx, sy, sw, sh);
	}
	
	this.isPointInPath = function(x, y) {
		this.setProperties();
		return this.context.isPointInPath(x, y);
	}
	
	this.lineTo = function(x, y) {
		this.setProperties();
		return this.context.lineTo(x, y);
	}
	
	this.measureText = function(text) {
		this.setProperties();
		return this.context.measureText(text);
	}
	
	this.moveTo = function(x, y) {
		this.setProperties();
		return this.context.moveTo(x, y);
	}
	
	this.putImageData = function(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
		this.setProperties();
		return this.context.putImageData(imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
	}
	
	this.quadraticCurveTo = function(cp1x, cp1y, x, y) {
		this.setProperties();
		return this.context.quadraticCurveTo(cp1x, cp1y, x, y);
	}
	
	this.rect = function(x, y, w, h) {
		this.setProperties();
		return this.context.rect(x, y, w, h);
	}
	
	this.restore = function() {
		this.setProperties();
		return this.context.restore();
	}
	
	this.rotate = function(angle) {
		this.setProperties();
		return this.context.rotate(angle);
	}
	
	this.save = function() {
		this.setProperties();
		return this.context.save();
	}
	
	this.scale = function(x, y) {
		this.setProperties();
		return this.context.scale(x, y);
	}
	
	this.setTransform = function(m11, m12, m21, m22, dx, dy) {
		this.setProperties();
		return this.context.setTransform(m11, m12, m21, m22, dx, dy);
	}
	
	this.stroke = function() {
		this.setProperties();
		return this.context.stroke();
	}
	
	this.strokeRect = function(x, y, w, h) {
		this.setProperties();
		return this.context.strokeRect(x, y, w, h);
	}
	
	this.strokeText = function(text, x, y, maxWidth) {
		this.setProperties();
		return this.context.strokeText(text, x, y, maxWidth);
	}
	
	this.transform = function(m11, m12, m21, m22, dx, dy) {
		this.setProperties();
		return this.context.transform(m11, m12, m21, m22, dx, dy);
	}
	
	this.translate = function(x, y) {
		this.setProperties();
		return this.context.translate(x, y);
	}
}
; 
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
}; 
/**
 * Requires a javascript implementation of sprintf, for example:
 * http://www.diveintojavascript.com/projects/javascript-sprintf
 */

com.mordritch.mcSim.localization = function(rawStrings) {
	this.rawStrings = rawStrings;
	this.registeredLocalizationChangeCallbacks = new Array();
	
	this.construct = function() {
		this.strings = {};
		for (var section in this.rawStrings)
		{
			for (var string in this.rawStrings[section])
			{
				this.strings[string] = this.rawStrings[section][string];
			}
		}
	}
	
	/**
	 * Returns the translated string
	 */
	this.getString = function(stringName) {
		if (typeof this.strings[stringName] != "undefined") {
			var string = this.strings[stringName];
			var args = [];
			var args1 = []; //something about vsprintf adds an extra element to args, so this is for the data-arguments section
			for (var i=1; i<arguments.length; i++) {
				args.push(arguments[i]);
				args1.push(arguments[i]);
			}
			var returnString = vsprintf(string, args);
		}
		else {
			var returnString = "[UNTRANSLATED]"+stringName+"[/UNTRANSLATED]";
			console.log("Untranslated string: %s", stringName);
		}
		
		//return '<span class="localizedString" data-string-name="'+stringName+'" data-arguments=\''+JSON.stringify(args1)+'\'>'+returnString+'</span>';
		//return '<span>'+returnString+'</span>';
		return returnString;
	}
	
	/**
	 * UI elements can use this to register callbacks to themselves to update their strings
	 * if the user changes the localization.
	 */
	this.registerLocalizationChangeCallback = function(callbackFunction) {
		this.registeredLocalizationChangeCallbacks.push(callbackFunction);
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.documentNew = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	
	this.construct = function() {
		var t = this;
		this.modalConfirmNew = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modalConfirmNew.setDomClass("prompt");
		this.modalConfirmNew.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.showNewPanel();
			},
			true
		);
		this.modalConfirmNew.setContent(
			'<b>' + this.L10n.getString("document.new.prompt.title") + '</b><br/><br/>' +
			this.L10n.getString("document.new.prompt.content")
		);

		this.modalPanelNew = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modalPanelNew.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.processNewPanel();
			}
		);
	}
	
	/**
	 * Once they have clicked the confirmation that they will lose any unsaved work 
	 */
	this.showNewPanel = function() {
		var t = this;
		this.modalConfirmNew.hide();
		this.modalPanelNew.setContent(
			'<div class="documentNew">' +
				'<b>' + this.L10n.getString("document.new.prompt.title") + '</b><br/><br/>' +
				
				'<p>'+this.L10n.getString('document.title') +'<br/>' +
				'<input type="text" class="text" id="documentNew_title" value="'+ this.L10n.getString('document.default.title') +'"> <span class="errorText" id="documentNew_title_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.width') +'<br/>' +
				'<input type="text" class="number" id="documentNew_width" value="'+this.gui.userSettings.options.simulator.xDefaultSize+'"> <span class="errorText" id="documentNew_width_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.height') +'<br/>' +
				'<input type="text" class="number" id="documentNew_height" value="'+this.gui.userSettings.options.simulator.zDefaultSize+'"> <span class="errorText" id="documentNew_height_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.layers') +'<br/>' +
				'<input type="text" class="number" id="documentNew_layers" value="'+this.gui.userSettings.options.simulator.yDefaultSize+'"> <span class="errorText" id="documentNew_layers_error"></span></p>' +
				
				'<p>'+this.L10n.getString('document.description') +'<br/>' +
				'<textarea id="documentNew_description"></textarea></p>' +
			'</div>'
		);
		
		$('.documentNew input').bind('keyup', function(e) {
			if (e.which == 13) t.processNewPanel();
		});

		this.modalPanelNew.show();
		$('#documentNew_title').focus();
		
	}
	
	this.prompt = function() {
		this.modalConfirmNew.show();
	}
	
	this.processNewPanel = function() {
		var inputError = false;
		var maxWidth = 10000;
		var maxHeight = 10000;
		var maxLayers = 256;
		var maxTitleLength = 65535;
		
		var xSize = $("#documentNew_width").val();
		var zSize = $("#documentNew_height").val();
		var ySize = $("#documentNew_layers").val();
		
		var title = $("#documentNew_title").val();
		var description = $("#documentNew_description").val();
		
		if (title.length > maxTitleLength || title.length < 1) {
			inputError = true;
			$("#documentNew_title_error").text(this.L10n.getString("error.value.string.length", 1, maxTitleLength));
		}
		else {
			$("#documentNew_title_error").text('');
		}
		
		if (xSize == "" || isNaN(xSize) || xSize > maxWidth || xSize < 1) {
			inputError = true;
			$("#documentNew_width_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxWidth));
		}
		else
			$("#documentNew_width_error").text('');

		if (zSize == "" || isNaN(zSize) || zSize > maxHeight || zSize < 1) {
			inputError = true;
			$("#documentNew_height_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxHeight));
		}
		else
			$("#documentNew_height_error").text('');

		if (ySize == "" || isNaN(ySize) || ySize > maxLayers || ySize < 1) {
			inputError = true;
			$("#documentNew_layers_error").text(this.L10n.getString("error.valuemustbenumber", 1, maxLayers));
		}
		else
			$("#documentNew_layers_error").text('');
		
		if (!inputError) {
			this.modalPanelNew.hide();
			this.gui.mcSim.makeNew(xSize, ySize, zSize, this.gui.userSettings.options.simulator.startTickingWorldOnLoad);
			
			this.gui.setSchematicMetadata({
				fileName: title,
				title: title,
				description: description
			}, isNew = true);
		}
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.documentInfo = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton({
			label: L10n.getString("button.text.ok"),
			onActivateFunction: function() {
				validateForm();
			}
		});
		
	}
	
	this.show = function() {
		populateForm();
		modal.show();
		$('#documentInfo_title').focus();
	}
	
	var populateForm = function() {
		var title = gui.schematicMetadata.title;
		var fileName = gui.schematicMetadata.fileName;
		var fileSize = gui.schematicMetadata.fileSize;
		var description = gui.schematicMetadata.description;
		var xSize = gui.mcSim.World.worldData.getSizeX();
		var ySize = gui.mcSim.World.worldData.getSizeY();
		var zSize = gui.mcSim.World.worldData.getSizeZ();
		
		modal.setContent(
			'<div class="documentInfo standardForm">' +
				'<form>' +
					'<p><b>'+L10n.getString("document.info.prompt.title")+'</b></p>' +
	
					'<p>'+L10n.getString('document.title') +'<br/>' +
					'<input type="text" class="text" id="documentInfo_title" value=""> <span class="errorText" id="documentInfo_title_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filename') +'<br/>' +
					'<input type="text" class="text" id="documentInfo_filename" value=""> <span class="errorText" id="documentInfo_filename_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filesize') +'<br/>' +
					'<span class="readonly">' + fileSize + ' bytes</span></p>' +

					'<p>' +
						L10n.getString('document.width')  + ' <span class="readonly_short">' + zSize + '</span> ' +
						L10n.getString('document.height') + ' <span class="readonly_short">' + xSize + '</span> ' +
						L10n.getString('document.layers') +	' <span class="readonly_short">' + ySize + '</span> ' +
					'</p>' +

					'<p>'+L10n.getString('document.description') +'<br/>' +
					'<textarea id="documentInfo_description"></textarea> <span class="errorText" id="documentInfo_description_error"></span></p>' +
				'</form>' +
			'</div>'
		);
		
		$('#documentInfo_title').val(title);
		$('#documentInfo_filename').val(fileName);
		$('#documentInfo_description').val(description);

		$('.documentInfo input').bind('keyup', function(e) {
			if (e.which == 13) validateForm();
		});
	}
	
	var validateForm = function() {
		var inputError = false;
		var dataToCheck = [
			{
				id: '#documentInfo_title',
				max: 65535,
				min: 1
			},
			{
				id: '#documentInfo_filename',
				max: 64,
				min: 1
			},
			{
				id: '#documentInfo_description',
				max: 65535,
				min: 0
			}
		];
		
		for (var i=0; i<dataToCheck.length; i++) {
			if (
				$(dataToCheck[i].id).val().length > dataToCheck[i].max ||
				$(dataToCheck[i].id).val().length < dataToCheck[i].min
			) {
				inputError = true;
				$(dataToCheck[i].id + '_error').text(L10n.getString("error.value.string.length", dataToCheck[i].min, dataToCheck[i].max));
				$(dataToCheck[i].id + '_error').prepend('<br/>');
			}
			else {
				$(dataToCheck[i].id + '_error').text('');
			}
		}
		
		if (!inputError) {
			gui.setSchematicMetadata({
				title: $('#documentInfo_title').val(),
				fileName: $('#documentInfo_filename').val(),
				description: $('#documentInfo_description').val()
			});
			
			
			modal.hide();
		}
	}
	
	construct();
}
; 
com.mordritch.mcSim.documentOpen = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	
	this.construct = function() {
		var t = this;

		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		
		
		this.modal.addButton(
			this.L10n.getString("button.text.ok"),
			"",
			function() {
				t.loadUsingBounceBack();
			}
		);
		
		this.initOverButton();
		
		return;
	}
	
	this.supportsFileAPI = function() {
		if (
			window.File &&
			window.FileReader &&
			window.FileList &&
			window.Blob
		) {
			return true;
		}
		else {
			return false;
		}
	}
	
	this.show = function() {};
	
	this.initOverButton = function() {
		var t = this;
		/*
		this.modal.setContent(
			'<div class="documentOpen">' +
				'<form action="php/readFile_bounceBack.php?task=put" enctype="multipart/form-data" id="form_documentOpen" method="POST" encoding="multipart/form-data">' +
					'<b>' + this.L10n.getString("document.open.title") + '</b><br/><br/>' +
					'<p>'+this.L10n.getString('file.open') +'<br/>' +
					'<input type="file"name="schematicFile" id="input_fileOpen" style="opacity: 0; height: 300px; width: 30px; cursor: pointer;"></p>' +
					'<span id="fileOpen_progress"></span>' +
				'</form>' +
			'</div>'
		);
		*/
		
		var hiddenDiv = 
			'<div class="documentOpen" style="' +
				//'border: 1px solid red;' +
				'z-index: 50;' +
				'position: absolute;' +
				//'top: 50px;' +
				//'left: 500px;' +
				//'width: 32px;' +
				//'height: 32px;' +
				//'width: 500px;' +
				//'height: 500px;' +
				'overflow: hidden;' +
			'"></div>';
			
		$('body').append(hiddenDiv);
		this.createForm();
		
		$('.addDocumentToolbarButton_fileOpen').bind("mouseenter", function() {
			t.move();
		});
		this.move();
	}
	
	this.bind = function() {
		//because we have a hidden input element hovering over, we need to update the styles manually of the "button under"File Open" icon beneath it
		var fileOpenClass =  ".addDocumentToolbarButton_fileOpen";
		var triggerElement = "#input_fileOpen";
		
		$(triggerElement).on("mouseenter", function() {
			$(fileOpenClass).addClass("topToolbarUnselected_hover");
		});
		
		$(triggerElement).on("mousedown", function() {
			$(fileOpenClass).removeClass("topToolbarUnselected_hover");
			$(fileOpenClass).removeClass("topToolbarUnselected");
			$(fileOpenClass).addClass("topToolbarUnselected_active");
		});
		
		$(triggerElement).on("mouseleave", function() {
			$(fileOpenClass).removeClass("topToolbarUnselected_active");
			$(fileOpenClass).removeClass("topToolbarUnselected_hover");
			$(fileOpenClass).addClass("topToolbarUnselected");
		});
	}
	
	this.move = function() {
		$('.documentOpen').width($('.addDocumentToolbarButton_fileOpen img').outerWidth());
		$('.documentOpen').height($('.addDocumentToolbarButton_fileOpen img').outerHeight());
		$('.documentOpen').offset({
			top: $('.addDocumentToolbarButton_fileOpen img').offset().top,
			left: $('.addDocumentToolbarButton_fileOpen img').offset().left
		});
	}
	
	this.createForm = function() {
		var html =
			'<form action="php/readFile_bounceBack.php?task=put" enctype="multipart/form-data" id="form_documentOpen" method="POST" encoding="multipart/form-data">' +
				'<input type="file" name="schematicFile" id="input_fileOpen" style="' +
					'position: absolute;' +
					'right: 0;' +
					'top: 0;' +
					'height: 64px;' +
					'opacity: 0;' +
					
				'"></p>' +
			'</form>';
			
		$('.documentOpen').html('<span></span>');
		$('.documentOpen').html(html);
		this.bind();
		
		$('#input_fileOpen').bind('change', {t: this}, function(e) {
			var t = e.data.t;
			$("#input_fileOpen").trigger("mouseleave");
			
			var fileName = $('#input_fileOpen').val().replace(/\\/g, '/');
			fileName = fileName.substr(fileName.lastIndexOf("/")+1);
			
			t.fileName = fileName;
			
			if (t.supportsFileAPI()) {
				t.loadUsingFileApi(e);
			}
			else {
				t.loadUsingBounceBack(e);
			}
		});
	}
	
	this.loadUsingFileApi = function(e) {
		console.log("Loading using File API.");
		var t = this;
		var file = e.target.files[0];
		var fileReader = new FileReader();
		
		fileReader.onload = function(e) {
			t.openFile(e.target.result);
		}
		fileReader.readAsBinaryString(file);
		t.createForm();
	}
	
	this.loadUsingBounceBack = function(e) {
		console.log("Loading using server bounceback.");
		var t = this;
		$('#form_documentOpen').ajaxSubmit({
			dataType: 'json',
			/*
			uploadProgress: function(event, position, total, percentComplete) {
				//On a 200kb file, even running slowly, this only gets triggered twice. Considering typical file sizes for schematics, not implementing for now
				console.log("uploadProgress:", percentComplete + '%');
			},*/
			success: function(data) {
				console.log("Put complete, getting...")
				$.ajax({
					url: "php/readFile_bounceBack.php?task=get&id=" + data.id,
					success: function(data) {
						//console.log("Base64 decoding...", new Date());
						var b64 = base64_decode(data);
						//console.log("Opening...", new Date());
						t.openFile(b64);
						t.createForm();
					}
				});
			}
		});
	}
	
	this.openFile = function(data) {
		//console.log("Open file for length:", data.length);
		
		//console.log(hexDump(data));
		//this.modal.hide();
		
		var title = this.fileName.substr(0, this.fileName.lastIndexOf("."));
		
		
		this.gui.loadSchematic(data);
		this.gui.setSchematicMetadata({
			title: title,
			fileName: this.fileName,
			description: ""
		}, isNew = true);
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.documentSave = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	var progressModal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton(
			L10n.getString("button.text.ok"),
			"",
			function() {
				validateForm();
			}
		);
		
		gui.options.registerOption({
			type: 'boolean',
			name: 'doNotShowSavedUrl',
			category: 'simulator',
			defaultValue: false
		});
		
	}
	
	
	var showModal = function() {
		modal.show();
		$('#documentSave_title').focus();
	}
	
	var populateForm = function() {
		var title = gui.schematicMetadata.title;
		var fileName = gui.schematicMetadata.fileName;
		var description = gui.schematicMetadata.description;
		var schematicId = gui.schematicMetadata.schematicId
		
		modal.setContent(
			'<div class="documentSave standardForm">' +
				'<form>' +
					'<p><b>'+L10n.getString("document.save.prompt.title")+'</b></p>' +
	
					'<p>'+L10n.getString('document.title') +'<br/>' +
					'<input type="text" class="text" id="documentSave_title" value=""> <span class="errorText" id="documentSave_title_error"></span></p>' +
	
					'<p>'+L10n.getString('document.filename') +'<br/>' +
					'<input type="text" class="text" id="documentSave_filename" value=""> <span class="errorText" id="documentSave_filename_error"></span></p>' +
	
					'<p>'+L10n.getString('document.description') +'<br/>' +
					'<textarea id="documentSave_description"></textarea> <span class="errorText" id="documentSave_description_error"></span></p>' +
					'<input type="hidden" id="documentSave_data" value="">' +
					'<input type="hidden" id="documentSave_schematicId" value="">' +
				'</form>' +
			'</div>'
		);
		
		$('#documentSave_title').val(title);
		$('#documentSave_filename').val(fileName);
		$('#documentSave_description').val(description);
		$('#documentSave_schematicId').val(schematicId);
		$('#documentSave_data').val('');

		$('.documentSave input').bind('keyup', function(e) {
			if (e.which == 13) validateForm();
		});
	}
	
	/**
	 * When the "save" button or shortcut is triggered
	 */
	this.save = function() {
		var userManager = gui.userManager;
		var schematicMetadata = gui.schematicMetadata;
		
		if (!userManager.authenticated) {
			userManager.show_signInFirst(
				'document.save.signinrequired',
				function() {
					self.save();
				}
			);
			return;
		}
		
		if (userManager.userData.userId != schematicMetadata.userId) {
			//This schematic was made by a different user, use "Save As" instead
			self.saveAs();
			return;
		}
		
		populateForm();
		populateDataField();
	}
	
	/**
	 * When the "save as" button or shortcut is triggered
	 */
	this.saveAs = function() {
		var userManager = gui.userManager;

		if (!userManager.authenticated) {
			userManager.show_signInFirst(
				'document.save.signinrequired',
				function() {
					self.saveAs();
				}
			);
			return;
		}
		populateForm();
		$('#documentSave_schematicId').val(-1);
		showModal();
	}
	
	var validateForm = function() {
		var inputError = false;
		var dataToCheck = [
			{
				id: '#documentSave_title',
				max: 65535,
				min: 1
			},
			{
				id: '#documentSave_filename',
				max: 64,
				min: 1
			},
			{
				id: '#documentSave_description',
				max: 65535,
				min: 0
			}
		];
		
		for (var i=0; i<dataToCheck.length; i++) {
			if (
				$(dataToCheck[i].id).val().length > dataToCheck[i].max ||
				$(dataToCheck[i].id).val().length < dataToCheck[i].min
			) {
				inputError = true;
				$(dataToCheck[i].id + '_error').text(L10n.getString("error.value.string.length", dataToCheck[i].min, dataToCheck[i].max));
				$(dataToCheck[i].id + '_error').prepend('<br/>');
			}
			else {
				$(dataToCheck[i].id + '_error').text('');
			}
		}
		
		if (!inputError) {
			gui.schematicMetadata.title = $('#documentSave_title').val();
			gui.schematicMetadata.fileName = $('#documentSave_filename').val()
			gui.schematicMetadata.description = $('#documentSave_description').val()
			
			modal.hide();
			populateDataField();
		}
	}
	
	var populateDataField = function() {
		progressModal.setContent(
			'<b>'+L10n.getString('document.save.progress.title')+'</b>' +
			'<p id="documentSave_saving"></p>'
		);
		progressModal.setDomClass('prompt');
		progressModal.show();
		$('#documentSave_saving').text(L10n.getString('document.save.progress.savingworld'));
		
		var nbtData = gui.mcSim.saveWorld();
		var nbtParser = new com.mordritch.mcSim.NbtParser();
		
		
		nbtParser.encode({
			data: nbtData,
			encloseInUnnamedCompoundTag: false,
			gzipDeflate: false,
			success: function(data) {
				//if (data.length > 300000) {
				if (data.length > 0) {
					deflate(data);
				}
				else {
					submitForm(data);
				}
			},
			progress: function() {
				console.log("submitForm: progress callback.");
			},
			cancel: function() {
				console.log("submitForm: cancel callback.");
			}
		});
	}
	
	var deflate = function(data) {
		$('#documentSave_saving').text(L10n.getString('document.save.progress.compressing', '0%'));
		
		com.mordritch.mcSim.gzip.deflateAsync({
			data: data,
			success: function(returnData) {
				//$('#documentSave_saving').text("Finished.");
				//returnData = com.mordritch.mcSim.gzip.inflate(returnData);
				//console.log(hexDump(returnData));
				submitForm(returnData);
			},
			progress: function(type, amount) {
				var percentDone = Math.floor((amount/data.length)*100);
				$('#documentSave_saving').text(L10n.getString('document.save.progress.compressing', percentDone+'%'));
			},
			cancel: function() {
				
			}
		});
	}
	
	var submitForm = function(data) {
		//console.log("Submitting...")
		//console.log(hexDump($('#documentSave_data').val()));
		//console.log(hexDump(data));
		
		/*
		new com.mordritch.mcSim.NbtParser().decode({
			//data: $('#documentSave_data').val(),
			data: data,
			updateInterval: 1000,
			success: function(nbtData) {
				console.log("test open successfull")
			},
			progress: function(category, progress, messaging) {
				console.log("test progress...")
			},
			cancel: function() {

			}
		});
		*/
		//return;

		$('#documentSave_saving').text(L10n.getString('document.save.progress.uploading'));

		$.ajax({
			type: 'POST',
			url: 'php/saveOnServer.php',
			dataType: 'json',
			data: {
				schematicData: base64_encode(data), //It seems that suhosin or something like it, is stripping binary data from posts, so it has to be b64 encoded
				title: $('#documentSave_title').val(),
				filename: $('#documentSave_filename').val(),
				description: $('#documentSave_description').val(),
				id: $('#documentSave_schematicId').val()
			},
			success: function(data) {
				uploadComplete(data);
				gui.urlHistory.setSchematicId(data.metaData.id, useReplaceState = false, noChange = true);
				
			}
		});
	}
	
	var uploadComplete = function(data) {
		progressModal.hide();

		var hintString = L10n.getString('document.save.urlhint');
		while (hintString.indexOf('\\n') >= 0) {
			hintString = hintString.replace("\\n", "\n")
		}

		if (!gui.options.getOption('simulator', 'doNotShowSavedUrl')) {
			prompt(hintString, window.location.href);
		}
	}
	
	construct();
}
; 
com.mordritch.mcSim.documentSaveLocally = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var progressModal = new com.mordritch.mcSim.guiFullModal(gui);
	var saveProgressDomId = "documentSaveLocally_saving";
	var saveProgressSelector = "#" + saveProgressDomId;
	var cancellationRequested = false;
	
	var construct = function() {
		$('body').append(
			'<div style="display:none">' +
				'<form id="documentSaveLocally">' +
				'</form>' +
			'</div>'
			);

		progressModal.setContent(
			'<b>'+L10n.getString('document.save.locally.progress.title')+'</b>' +
			'<p id="' + saveProgressDomId + '"></p>'
			);
		
		progressModal.setDomClass('prompt');
		
		progressModal.bind('hide', function() {
			hide();
		});
	}
	
	var hide = function() {
		cancellationRequested = true;
	}
	
	/**
	 * When the "save" button or shortcut is triggered
	 */
	this.save = function() {
		cancellationRequested = false;
		progressModal.show();
		$(saveProgressSelector).text(L10n.getString('document.save.progress.savingworld'));
		setTimeout(function() {
			nbtEncode();
		},5);
	}
	
	var nbtEncode = function() {
		var nbtData = gui.mcSim.saveWorld();
		var nbtParser = new com.mordritch.mcSim.NbtParser();
		
		nbtParser.encode({
			data: nbtData,
			encloseInUnnamedCompoundTag: false,
			gzipDeflate: false,
			progress: function(type, amount, messaging) {
				if (cancellationRequested) {
					messaging.requestCancel = true;
				}
				console.log("nbtEncode: progress callback.");
			},
			cancel: function() {
			},
			success: function(data) {
				deflate(data);
			}
		});
	}
	
	var deflate = function(data) {
		$(saveProgressSelector).text(L10n.getString('document.save.progress.compressing', '0%'));
		
		com.mordritch.mcSim.gzip.deflateAsync({
			data: data,
			progress: function(type, amount, messaging) {
				var percentDone = Math.floor((amount/data.length)*100);
				$(saveProgressSelector).text(L10n.getString('document.save.progress.compressing', percentDone+'%'));
				if (cancellationRequested) {
					messaging.requestCancel = true;
				}
			},
			cancel: function() {
			},
			success: function(returnData) {
				setTimeout(function() {
					$(saveProgressDomId).text(L10n.getString('document.save.locally.progress.uploading'));
					postData(returnData);
				},5);
			}
		});
	}
	
	var postData = function(data) {
		var fileName = (gui.schematicMetadata.fileName == null || gui.schematicMetadata.fileName == "") ? L10n.getString("document.metadata.default.fileName") : gui.schematicMetadata.fileName;
		console.log("Wanting to save %s bytes...", data.length);

		$.ajax({
			type: 'POST',
			dataType: 'json',
			url: 'php/schematicSaveLocally.php?task=put',
			data: {
				schematicData: base64_encode(data),
				fileName: fileName
			},
			error: function() {
				console.log("documentSaveLocally.postData(): error");
			},
			success: function(data) {
				console.log("documentSaveLocally.postData(): complete");
				uploadComplete(data);
			}
		});
	}
	
	var uploadComplete = function(data) {
		progressModal.hide();
		if (data.error) {
			throw new Error("documentSaveLocally.uploadComplete() - Server responded with error: %s", data.errorDescription);
		}
		else {
			$('#documentSaveLocally').ajaxForm({
				type: 'POST',
				iframe: true,
				url: 'php/schematicSaveLocally.php?task=get',
				data: {
					id: data.id
				},
				error: function() {
					console.log("documentSaveLocally.uploadComplete(): error");
				},
				success: function(data) {
					console.log("documentSaveLocally.uploadComplete(): complete");
				}
			}).submit();
		}
	}
	
	construct();
}
; 
(function(){
var namespace = com.mordritch.mcSim;
var funcName = "documentResize";

namespace[funcName] = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	this.inverseProperty = {
			zTopMore: "zTopLess",
			zTopLess: "zTopMore",
			zBottomMore: "zBottomLess",
			zBottomLess: "zBottomMore",
			xLeftMore: "xLeftLess",
			xLeftLess: "xLeftMore",
			xRightMore: "xRightLess",
			xRightLess: "xRightMore",
			yTopMore: "yTopLess",
			yTopLess: "yTopMore",
			yBottomMore: "yBottomLess",
			yBottomLess: "yBottomMore"
	}
	this.selectedBlockId = "1"; //expects a string
	
	this.construct = function() {
		var t = this;
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modal.addButton({
			label: this.L10n.getString("button.text.apply"),
			onActivateFunction: function() {
				t.setDimensions();
			},
			isDefault: true
		});
		
		this.setContent();
	}
	
	this.setContent = function() {
		var html =
			'<div class="documentResize">' +
				'<div>' +
					'<table>' +
						'<tr>' + 
							'<th></th>' + 
							'<th>'+this.L10n.getString('resize.x')+'</th>' + 
							'<th>'+this.L10n.getString('resize.y')+'</th>' + 
							'<th>'+this.L10n.getString('resize.z')+'</th>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.current')+':</td>' + 
							'<td><span class="readonly xCurrent"></span></td>' + 
							'<td><span class="readonly yCurrent"></span></td>' + 
							'<td><span class="readonly zCurrent"></span></td>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.difference')+':</td>' + 
							'<td><span class="readonly xDifference">0</span></td>' + 
							'<td><span class="readonly yDifference">0</span></td>' + 
							'<td><span class="readonly zDifference">0</span></td>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.new')+':</td>' + 
							'<td><span class="readonly xNew"></span></td>' + 
							'<td><span class="readonly yNew"></span></td>' + 
							'<td><span class="readonly zNew"></span></td>' + 
						'</tr>' +
					'</table>' +
					'<table style="margin-left: 34px;">' +
						'<tr>' +
							'<td style="text-align: left; width: 300px;">' +
								this.L10n.getString('resize.x.description') + '<br/><br/>' +
								this.L10n.getString('resize.y.description') + '<br/><br/>' +
								this.L10n.getString('resize.z.description') + '' +
							'</td>' +
						'</tr>' +
					'</table>' +
				'</div>';
				
		html += '<div><br/>'+this.L10n.getString('resize.populatelowerlayers')+'<br/><select class="restingBlockType">';

		var placeableBlocks = this.gui.placeableBlocks;
		for (var i in placeableBlocks) {
			block = this.gui.mcSim.Block.blocksList[placeableBlocks[i].blockID];
			if (placeableBlocks[i].blockMetadata == 0 || block.blockMaterial.isOpaque() && block.renderAsNormalBlock()) {
				var blockId = (placeableBlocks[i].blockMetadata == 0) ? placeableBlocks[i].blockID : placeableBlocks[i].blockID + ':' + placeableBlocks[i].blockMetadata;
				var blockName = this.gui.localization.getString(placeableBlocks[i].blockName);
				
				if (blockId == this.selectedBlockId) {
					html += '<option selected="selected" value="'+blockId+'">'+blockId+' - '+blockName+'</option>';
				}
				else {
					html += '<option value="'+blockId+'">'+blockId+' - '+blockName+'</option>';
				}
				 
			}
		}
		html += '</div>';
		
		html += '<select class="restingBlockType">';
			html +=
				'<div><br/>' +
					'<table style="border-collapse: seperate; border-spacing: 0;">' +
						'<colgroup>' +
							'<col style="width: 34px;">' + //1
							'<col style="width: 34px;">' + //2
							'<col>' + //3
							'<col style="width: 34px;">' + //4
							'<col style="width: 34px;">' + //5
						'</colgroup>' +
						'<tr>' +
							'<td colspan="5" style="text-align: left; padding-bottom: 10px;"><b>' + this.L10n.getString('resize.x.and.z') + '</td>' + 
						'</tr>' +
						'<tr>' + //1
							'<td class="bottomGray rightGray"><span style="font-weight: bold;">N: ↑</span></td>' + 
							'<td class="topDashedGray bottomBlack" colspan="3"><span class="plusButton button zTopMore">+</span></td>' + 
							'<td class="bottomGray leftGray"></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftDashedGray rightBlack" rowspan="3"><span class="minusButton button xLeftMore">+</span></td>' + 
							'<td class="bottomDashedGray rightDashedGray"></td>' + 
							'<td class="bottomDashedGray"><span class="minusButton button zTopLess">-</span></td>' + 
							'<td class="bottomDashedGray leftDashedGray"></td>' + 
							'<td class="rightDashedGray leftBlack" rowspan="3"><span class="minusButton button xRightMore">+</span></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="rightDashedGray"><span class="minusButton button xLeftLess">-</span></td>' + 
							'<td>'+
								'<table style="margin: 0;">'+
									'</tr>' +
										'<td></td>'+
										'<td><input class="zTop"></td>'+
										'<td></td>'+
									'<tr>' +
									'</tr>' +
										'<td><input class="xLeft"></td>'+
										'<td></td>'+
										'<td><input class="xRight"></td>'+
									'<tr>' +
									'</tr>' +
										'<td></td>'+
										'<td><input class="zBottom"></td>'+
										'<td></td>'+
									'<tr>' +
								'</table>'+
							'</td>' + 
							'<td class="leftDashedGray"><span class="minusButton button xRightLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //4
							'<td class="rightDashedGray topDashedGray"></td>' + 
							'<td class="topDashedGray"><span class="minusButton button zBottomLess">-</span></td>' + 
							'<td class="leftDashedGray topDashedGray"></td>' + 
						'</tr>' +
						'<tr>' + //5
							'<td class="topGray rightGray"></td>' + 
							'<td class="topBlack bottomDashedGray" colspan="3"><span class="plusButton button zBottomMore">+</span></td>' + 
							'<td class="topGray leftGray"></td>' + 
						'</tr>' +
					'</table>' + 

					'<table style="border-collapse: seperate; border-spacing: 0; margin-left: 34px;">' +
						'<colgroup>' +
							'<col style="width: 100px;">' +
						'</colgroup>' +
						'<tr>' +
							'<td style="text-align: left; padding-bottom: 10px;"><b>' + this.L10n.getString('resize.y.only') + '</b></td>' + 
						'</tr>' +
						'<tr>' + //1
							'<td class="topDashedGray rightGray leftGray bottomBlack" style="padding-right: 2px;"><span class="plusButton button yTopMore">+</span></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftBlack rightBlack bottomDashedGray"><span class="minusButton button yTopLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="leftBlack rightBlack"><input class="yTop"></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="leftBlack rightBlack" style="height: 46px"></td>' + 
						'</tr>' +
						'<tr>' + //4
							'<td class="leftBlack rightBlack"><input class="yBottom"></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftBlack rightBlack topDashedGray"><span class="minusButton button yBottomLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //5
							'<td class="rightGray leftGray bottomDashedGray topBlack"><span class="plusButton button yBottomMore">+</span></td>' + 
						'</tr>' +
					'</table>' + 
				'</div>' +
			'</div>';
			
		this.modal.setContent(html);
		
		var t = this;
		$('.documentResize input').on('change keyup', function(e) {
			if (e.type == "change" || (e.type == "keyup" && e.which == 13)) {
				t.onInputChange();
			}
		});
		
		$('.documentResize .restingBlockType').on('change keyup', function(e) {
			t.selectedBlockId = $('.documentResize .restingBlockType').val();
		});
		
		$('.documentResize .button.zTopMore').on('click', function() { t.onButtonClick("zTop", 1)});
		$('.documentResize .button.zTopLess').on('click', function() { t.onButtonClick("zTop", -1)});
		$('.documentResize .button.zBottomMore').on('click', function() { t.onButtonClick("zBottom", 1)});
		$('.documentResize .button.zBottomLess').on('click', function() { t.onButtonClick("zBottom", -1)});
		
		$('.documentResize .button.xLeftMore').on('click', function() { t.onButtonClick("xLeft", 1)});
		$('.documentResize .button.xLeftLess').on('click', function() { t.onButtonClick("xLeft", -1)});
		$('.documentResize .button.xRightMore').on('click', function() { t.onButtonClick("xRight", 1)});
		$('.documentResize .button.xRightLess').on('click', function() { t.onButtonClick("xRight", -1)});
		
		$('.documentResize .button.yTopMore').on('click', function() { t.onButtonClick("yTop", 1)});
		$('.documentResize .button.yTopLess').on('click', function() { t.onButtonClick("yTop", -1)});
		$('.documentResize .button.yBottomMore').on('click', function() { t.onButtonClick("yBottom", 1)});
		$('.documentResize .button.yBottomLess').on('click', function() { t.onButtonClick("yBottom", -1)});
	}
	
	this.getCurrentDimensions = function() {
		if (this.gui.mcSim.World == null) {
			return {x: 0, y: 0, z:0 };
		}
		else {
			return {
				x: this.gui.mcSim.World.worldData.getSizeX(),
				y: this.gui.mcSim.World.worldData.getSizeY(),
				z: this.gui.mcSim.World.worldData.getSizeZ()
			};
		}
	}
	
	this.setDimensions = function() {
		var xCurrent = this.getCurrentDimensions().x;
		var yCurrent = this.getCurrentDimensions().y;
		var zCurrent = this.getCurrentDimensions().z;

		var xDifference = this.model.xRight + this.model.xLeft;
		var yDifference = this.model.yTop + this.model.yBottom;
		var zDifference = this.model.zTop + this.model.zBottom;
		
		var xNew = xCurrent + xDifference;
		var yNew = yCurrent + yDifference;
		var zNew = zCurrent + zDifference;
		
		if (xNew < 1 || yNew < 1 || zNew < 1) {
			return;
		}
		
		var World = this.gui.mcSim.World;
		
		if (
			this.model.xRight != 0 ||
			this.model.xLeft != 0 ||
			this.model.zTop != 0 ||
			this.model.zBottom != 0 ||
			this.model.yTop != 0 ||
			this.model.yBottom != 0
		) {
			World.commitAll();
			World.worldData.setDimensions(
				sizeX = xNew,
				sizeY = yNew,
				sizeZ = zNew,
				offsetX = this.model.xLeft,
				offsetY = this.model.yBottom,
				offsetZ = this.model.zTop
			);
			
			if (this.selectedBlockId != 0) {
				if (this.selectedBlockId.indexOf(":") > 0) {
					var blockId = parseInt(this.selectedBlockId.split(":")[0], 10);
					var blockMetadata = parseInt(this.selectedBlockId.split(":")[1], 10);
				}
				else {
					var blockId = parseInt(this.selectedBlockId, 10);
					var blockMetadata = 0;
				}
			
				for (var x=0; x < xNew; x++) {
					for (var y=0; y < this.model.yBottom; y++) {
						for (var z=0; z < zNew; z++) {
							World.setBlockAndMetadata(x, y, z, blockId, blockMetadata);
						}
					}
				}
			}
			World.loadAll();
			
			this.gui.refreshModelViews();
		}
		
		this.modal.hide();
	}
	
	this.show = function() {
		this.model = {
			zTop: 0,
			zBottom: 0,
			xLeft: 0,
			xRight: 0,
			yTop: 0,
			yBottom: 0
		}

		this.updateModelView();
		this.modal.show();
	}
	
	this.onInputChange = function() {
		var val, inverseProperty;
		
		for (var property in this.model) {
			val = $('.documentResize .' + property).val();
			if (parseInt(val, 10) != val) {
				$('.documentResize .' + property).addClass("invalidBackgroundColor");
			}
			else {
				$('.documentResize .' + property).removeClass("invalidBackgroundColor");
			}
			
			if (parseInt(val, 10) == val && parseInt(val, 10) != this.model[property]) {
				this.model[property] = parseInt(val, 10);
				this.updateModelView();
			}
		}
	}
	
	this.onButtonClick = function(property, delta) {
		this.model[property] = this.model[property] + delta;
		
		this.updateModelView();
	}
	
	this.updateModelView = function() {
		var xCurrent = this.getCurrentDimensions().x;
		var yCurrent = this.getCurrentDimensions().y;
		var zCurrent = this.getCurrentDimensions().z;

		var xDifference = this.model.xRight + this.model.xLeft;
		var yDifference = this.model.yTop + this.model.yBottom;
		var zDifference = this.model.zTop + this.model.zBottom;
		
		var xNew = xCurrent + xDifference;
		var yNew = yCurrent + yDifference;
		var zNew = zCurrent + zDifference;
		 
		$('.documentResize .xCurrent').text(xCurrent);
		$('.documentResize .yCurrent').text(yCurrent);
		$('.documentResize .zCurrent').text(zCurrent);

		$('.documentResize .xDifference').text(xDifference);
		$('.documentResize .yDifference').text(yDifference);
		$('.documentResize .zDifference').text(zDifference);

		$('.documentResize .xNew').text(xNew);
		$('.documentResize .yNew').text(yNew);
		$('.documentResize .zNew').text(zNew);
		
		if (xNew > 0) {
			$('.documentResize .xNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .xNew').addClass("invalidBackgroundColor");
		}

		if (yNew > 0) {
			$('.documentResize .yNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .yNew').addClass("invalidBackgroundColor");
		}

		if (zNew > 0) {
			$('.documentResize .zNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .zNew').addClass("invalidBackgroundColor");
		}

		for (var property in this.model) {
			$('.documentResize .' + property).val(this.model[property]);
			$('.documentResize .' + property).removeClass("invalidBackgroundColor");
		}
	}
	
	this.construct();
}})();
; 
(function(){
var namespace = com.mordritch.mcSim;
var funcName = "documentRotate";

namespace[funcName] = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;

	this.construct = function() {
		var t = this;
		this.progressModal = new com.mordritch.mcSim.guiFullModal(this.gui);
		 
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modal.addButton({
			label: this.L10n.getString("button.text.apply"),
			onActivateFunction: function() {
				t.onOkClick();
			}
		});
		
		this.setContent();
	}
	
	this.setContent = function() {
		var clockwise = this.L10n.getString("document.rotate.clockwise");
		var html =
			'<div class="documentRotate">' +
				'<p><strong>' + this.L10n.getString("document.rotate.modalheading") + '</strong></p>' +
				'<p>' + this.L10n.getString("document.rotate.disclaimer") + '</p>' +
				'<p>' +
					'<input id="radioRotateBy90" type="radio" name="rotateAmount" value="90" checked="true"> <label for="radioRotateBy90">90&deg; '+ clockwise +'</label><br />' +  
					'<input id="radioRotateBy180" type="radio" name="rotateAmount" value="180"> <label for="radioRotateBy180">180&deg; '+ clockwise +'</label><br />' +  
					'<input id="radioRotateBy270" type="radio" name="rotateAmount" value="270"> <label for="radioRotateBy270">270&deg; '+ clockwise +'</label><br />' +  
				'</p>' +
			'</div>';
			
		this.modal.setContent(html);
	}
	
	this.onOkClick = function() {
		this.modal.hide();

		this.progressModal.setContent(
			'<strong>'+this.L10n.getString('document.rotate.progress.title')+'</strong>' +
			'<p>'+this.L10n.getString('document.rotate.progress.body')+'</p>'
		);
		this.progressModal.setDomClass('prompt');
		this.progressModal.disableControls();
		this.progressModal.show();
		
		//Give the DOM a chance to show the updated modal
		var t = this;
		setTimeout(function() {
			t.doRotate();
		},5);
	}
	
	this.doRotate = function() {
		var rotateAmountInDegrees = parseInt($('.documentRotate input["rotateAmount"]:checked').val());
		var rotateAmount = Math.floor(rotateAmountInDegrees/90);
		var block, blockMetadata;
		var startedAt = new Date().getTime();
		
		var World = this.gui.mcSim.World;
		var blocksList = World.Block.blocksList;
		World.commitAll();
		World.worldData.rotateSelection(rotateAmountInDegrees);
		World.loadAll();

		var sizeX = World.worldData.getSizeX();
		var sizeY = World.worldData.getSizeY();
		var sizeZ = World.worldData.getSizeZ();
		
		for (var x=0; x<sizeX; x++) { for (var y=0; y<sizeY; y++) { for (var z=0; z<sizeZ; z++) { 
			block = blocksList[World.getBlockId(x, y, z)];
			blockMetadata = World.getBlockMetadata(x, y, z);
			blockMetadata = block.rotateSelection(blockMetadata, rotateAmount);
			World.setBlockMetadata(x, y, z, blockMetadata);
		} } }
		
		var count = 0;
		var loadedTileEntityList = World.loadedTileEntityList;
		for (var tileEntity in loadedTileEntityList) {
			count++;
			loadedTileEntityList[tileEntity].rotateSelection(rotateAmount);
		}
		
		console.log("Rotated %s blocks and %s tile enties in %sms.", sizeX*sizeY*sizeZ, count, new Date().getTime() - startedAt)
		this.gui.refreshModelViews();
		this.progressModal.enableControls();
		this.progressModal.hide();
	}
	
	this.show = function() {
		this.modal.show();
	}
	
	
	this.construct();
}})();
; 
com.mordritch.mcSim.documentDownloadSavedVersion = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var feedbackModal = new com.mordritch.mcSim.guiFullModal(gui, makeClosedButtonDefault = true);
	
	/**
	 * When the "download" button or shortcut is triggered
	 */
	this.download = function() {
		var schematicId = gui.schematicMetadata.schematicId;
		if (schematicId == "" || schematicId == null) {
			feedbackModal.show();
		}
		else {
			sendDownloadRequest(schematicId);
		}
	}
	
	var construct = function() {
		$('body').append(
			'<div style="display:none">' +
				'<form id="documentDownloadSavedVersion">' +
				'</form>' +
			'</div>'
			);

		feedbackModal.setContent(
			'<b>'+L10n.getString('document.download.server.error.header')+'</b>' +
			'<p>'+L10n.getString('document.download.server.error.body')+'</p>'
			);
			
		feedbackModal.setCloseButtonText(L10n.getString('button.text.ok'));
		
		feedbackModal.setDomClass('prompt');
	}
	
	var sendDownloadRequest = function(schematicId) {
		$('#documentDownloadSavedVersion').ajaxForm({
			type: 'POST',
			iframe: true,
			url: 'php/schematicDownload.php?id=' + schematicId,
			error: function() {
				console.log("documentDownloadSavedVersion.sendDownloadRequest(): error");
			},
			success: function(data) {
				console.log("documentDownloadSavedVersion.sendDownloadRequest(): complete");
			}
		}).submit();
	}
	
	construct();
}
; 
(function(){
	var namespace = com.mordritch.mcSim;
	
	var urlHistory = function(_gui) {
		var _historyApiSupport = !!(window.history && history.pushState);
		var _schematicId = null;
		//var _confirmationModal = new nameSpace.modal(gui);
		
		var isIntVal = function(val) {
			return !!(parseInt(val, 10) == val && parseInt(val, 10));
		}

		var construct = function() {
			if (!_historyApiSupport) {
				initHashChange();
			}
			else {
				initHistoryApi();
			}
			
			if (isIntVal(_schematicId) && _schematicId > 0) {
				onSchematicIdChange_accepted(_schematicId);
			}
		}
		
		var getTitle = function() {
			return $('title').text(); //Can be customized to have something appended to the end.
		}
		
		var initHashChange = function() {
			$(window).hashchange(function() {
				var hash = location.hash.replace( /^#/, '' );
				if (isIntVal(hash)) {
					onSchematicIdChange(hash);
				}
			});
			
			var hash = location.hash.replace( /^#/, '' );
			if (isIntVal(hash)) {
			 	_schematicId = hash;
			}
		}
		
		var initHistoryApi = function() {
			var hash = location.hash.replace( /^#/, '' );
			if (isIntVal(hash)) {
				_schematicId = hash;
				self.setSchematicId(hash);
			}
			else {
				_schematicId = window.schematicIdToOpen;
			}
			
			self.setSchematicId(_schematicId, useReplaceState = true);

			window.addEventListener('popstate', function(event) {
				if (event.state == null) {
					return false;
				}
				
				if (typeof event.state != 'undefined' && event.state != null) {
					onSchematicIdChange(event.state.id);
				}
			});
		}
		
		this.onUrlClick = function(event) {
			if (_historyApiSupport) {
				event.preventDefault();
				var schematicId = $(event.target).data('id');
				self.setSchematicId(schematicId);
			}
		}
		
		this.generateUrl = function(schematicId) {
			return (_historyApiSupport) ? "./"  + schematicId : "./#" + schematicId;
		}
		
		this.getIdToOpen = function() {
			return _schematicId;
		}
		
		this.setSchematicId = function(schematicId, useReplaceState, noChange) {
			useReplaceState = (typeof useReplaceState != 'undefined') ? useReplaceState : false;
			if (schematicId == null) schematicId = "";
			
			if (_historyApiSupport) {
				if (useReplaceState) {
					history.replaceState({id: schematicId}, getTitle(), "./"+schematicId);
				}
				else {
					history.pushState({id: schematicId}, getTitle(), "./"+schematicId);
					if (!noChange) {
						onSchematicIdChange(schematicId);
					}
				}
			}
			else {
				window.location.hash = schematicId;
			}
		}
		
		
		var onSchematicIdChange = function(schematicId) {
			onSchematicIdChange_accepted(schematicId); //TODO: Perhaps have a confirmation modal show first.
		}
		
		var onSchematicIdChange_accepted = function(schematicId) {
			var pathname = window.location.pathname;
			var url = (window.location.hash == "" || window.location.hash == "#") ? pathname : pathname + schematicId;
			
			if (typeof window._gac != "undefined") {
				window._gac.push(['_trackPageview', url]);
			}
			
			if (typeof schematicId != "undefined" && schematicId != null && schematicId != "") {
				_gui.loadSchematicId(schematicId);
			}
		}
		
		var onSchematicIdChange_declined = function(schematicId) {
			
		}
		
		var self = this;
		construct();
	}

	namespace.urlHistory = urlHistory;
}());
; 
com.mordritch.mcSim.guiFull_multiViewHandler = function(gui) {
	this.gui = gui;
	//this.currentActiveView = 0;
	this.modelViews = [];
	this.mouseOverModelView = null;
	
	this.construct = function() {
		$('body').append('<div id="workarea"></div');

		var t = this;
		this.gui.mcSim.bindModelView(this);

		this.registerOptions();

		this.bindInputs();
		this.setDimensions();
		
		if (this.gui.mcSim.worldIsLoaded) {
			this.setLoading(false);
		}
		else {
			this.setLoading(true);
		}
		
	}
	
	this.addModelView = function(cssClass, viewType) {
		var t = this;
		var view = {
			top: 'ModelView_CanvasTop',
			side: 'ModelView_CanvasSide'
		}[viewType];
		
		this.modelViews.push(
			new com.mordritch.mcSim[view]({
				cssClass: cssClass,
				simulator: this.gui.mcSim,
				gui: this.gui,
				onMouseEnterOrLeave: function(action, modelView) {t.onMouseEnterOrLeave(action, modelView);},
				offSetX: 0,
				offSetY: 0
			})
		);
	}
	
	this.removeModelView = function(cssClass) {
		var oldModelViewsArray = this.modelViews;
		this.modelViews = [];
		for (var i=0; i< oldModelViewsArray.length; i++) {
			if (oldModelViewsArray[i].cssClass != cssClass) {
				this.modelViews.push(oldModelViewsArray[i]);
			} 
		}
		$('.' + cssClass).remove();
	}
	
	this.getModelViewByCssClass = function(cssClass) {
		for (var i=0; i< this.modelViews.length; i++) {
			if (this.modelViews[i].cssClass == cssClass) {
				return this.modelViews[i];
			} 
		}
	}
	
	this.onMouseEnterOrLeave = function(action, modelView) {
		if (action == 'enter') {
			for (var i=0; i<this.modelViews.length; i++) {
				if (this.modelViews[i] == modelView) {
					this.mouseOverModelView = i;
					break;
				}
			}
		}
		else {
			this.mouseOverModelView = null;
		}
	}
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options

		options.registerOption({
			type: 'number',
			name: 'defaultZoomLevel',
			category: 'modelview',
			defaultValue: 2,
			minValue: 0.25,
			maxValue: 5,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'layerDownOpacity',
			category: 'modelview',
			defaultValue: 0.4,
			changeIncrement: 0.1, 
			minValue: 0,
			maxValue: 1,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'workTime',
			category: 'modelview',
			defaultValue: 40,
			changeIncrement: 10, 
			minValue: 12,
			maxValue: 5000,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});

		options.registerOption({
			type: 'number',
			name: 'lowerLayersToDraw',
			category: 'modelview',
			defaultValue: 0,
			minValue: 0,
			maxValue: 10,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'borderWidth',
			category: 'modelview',
			defaultValue: 1,
			minValue: 0,
			maxValue: 10,
			callbackScope: 'modelview_appearance',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		this.onOptionsChange();
	}
	
	this.onOptionsChange = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].onOptionsChange();
		}
	}
	
	this.bindInputs = function() {
		var t = this;
		/*
		this.gui.input.bindInputEvent({
			savedKeyName: 'null',
			category: 'modelview',
			description: 'null',
			data: null,
			mouseMoveEvent: true,
			callbackFunction: null,
			callbackFunction_mouseMove: null,
		});
		*/
		
		
		//Scrolling
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_left',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.left',
			callbackFunction: function(e) {t.scroll('left');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_right',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.right',
			callbackFunction: function(e) {t.scroll('right');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_up',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.up',
			callbackFunction: function(e) {t.scroll('up');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_scroll_down',
			category: 'modelview',
			description: 'shortcuts.modelview.scroll.down',
			callbackFunction: function(e) {t.scroll('down');}
		});
		
		//Layer up/down
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_layer_up',
			category: 'modelview',
			description: 'shortcuts.modelview.layer.up',
			callbackFunction: function(e) {t.layerChange('up');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_layer_down',
			category: 'modelview',
			description: 'shortcuts.modelview.layer.down',
			callbackFunction: function(e) {t.layerChange('down');}
		});

		//Zooming:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_zoom_increase',
			category: 'modelview',
			description: 'shortcuts.modelview.zoom.increase',
			callbackFunction: function(e) {t.zoom('increase');}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_zoom_decrease',
			category: 'modelview',
			description: 'shortcuts.modelview.zoom.decrease',
			callbackFunction: function(e) {t.zoom('decrease');}
		});
		
		//Panning:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_pan',
			category: 'modelview',
			description: 'shortcuts.modelview.pan',
			callbackFunction: function(e) {t.pan_start(e);},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.pan_onMouseMove(e);}
		});
		
		//Jump to layer:
		this.gui.input.bindInputEvent({
			savedKeyName: 'modelView_goto_layer',
			category: 'modelview',
			description: 'shortcuts.modelview.gotolayer',
			callbackFunction: function(e) {t.gotoLayer();},
			keyUpModifierKeysOnTrigger: true
		});
	}
	
	/**
	 * Called as the mouse as the shortcut keycombo is first pushed
	 */
	this.pan_start = function(e) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].pan_start(e);
		}
		
	}
	
	/**
	 * Called as the mouse moves while the keycombo is still active
	 */
	this.pan_onMouseMove = function(e) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].pan_onMouseMove(e);
		}
	}
	
	/**
	 * Forwards the keybound event to scroll the modelview
	 */
	this.scroll = function(direction) {
		if (this.mouseOverModelView != null) {
			this.modelViews[this.mouseOverModelView].scroll(direction);
		}
	}
	
	/**
	 * Mark a block as needing a redraw:
	 */
	this.markBlockNeedsUpdate = function(posX, posY, posZ) {
		for (var i=0; i<this.modelViews.length; i++) {
			for (var z=posZ-1; z<=posZ+1; z++) {
			for (var y=posY-1; y<=posY+1; y++) {
			for (var x=posX-1; x<=posX+1; x++) {
				this.modelViews[i].markBlockNeedsUpdate(x, y, z);
			}}}
		}
	}
	
	/**
	 * Draw everything now that needs an update
	 */
	this.flushMarkedBlocks = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].flushMarkedBlocks();
		}
	} 

	/**
	 * Called by simulator when a block needs to be redrawn
	 */
	this.drawBlock = function(posX, posY, posZ) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].drawBlock(posX, posY, posZ);
		}
	}
	
	/**
	 * Called by simulator any time the size of the schematic changes
	 */
	this.setDimensions = function(parameters) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].setDimensions(parameters);
		}
	}
	
	/**
	 * Called any time all blocks need to be redrawn
	 * 
	 * Can be called by the simulator
	 */
	this.drawAllBlocks = function() {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].drawAllBlocks();
		}
	}
	
	/**
	 * Tells all canvases whether or not world data is in the process of
	 */
	this.setLoading = function(state) {
		for (var i=0; i<this.modelViews.length; i++) {
			this.modelViews[i].setLoading(state);
		}
	}

	/**
	 * Jumps the current selected modelview to the specified layer:
	 */
	this.gotoLayer = function(isFromTimeout) {
		this.gui.pauseBindings();
		var layer = prompt(this.gui.localization.getString("modelview.prompt.gotolayer"));
		this.gui.resumeBindings();
		if (
			layer != null &&
			!isNaN(parseFloat(layer)) &&
			isFinite(layer) &&
			layer % 1 == 0 &&
			this.modelViews[this.mouseOverModelView].layerTo(layer)
		) {
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
		else {
			console.log("Could not change layer to "+layer);
		}
	}
	
	/**
	 * Forwards keybound event to try change active modelview's layer
	 */
	this.layerChange = function(direction) {
		if (this.mouseOverModelView != null) {
			if (direction == 'up') {
				this.modelViews[this.mouseOverModelView].layerUp();
			}
			else {
				this.modelViews[this.mouseOverModelView].layerDown();
			}
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
	}
	
	/**
	 * Forwards keybound event to try change active modelview's zoomlevel
	 */
	this.zoom = function(type) {
		if (this.mouseOverModelView != null) {
			if (type == 'decrease') {
				this.modelViews[this.mouseOverModelView].zoomLevelDecrease();
			}
			else if (type == 'increase') {
				this.modelViews[this.mouseOverModelView].zoomLevelIncrease();
			}
			this.modelViews[this.mouseOverModelView].updateCoords();
		}
	}
	
	/**
	 * If the mouse is currently over the grid, this returns the coords, otherwise it returns false.
	 */
	this.getCurrentMouseCoords = function(e) {
		if (this.mouseOverModelView == null) return false;
		
		var mouseOnCanvas = this.modelViews[this.mouseOverModelView].getMousePositionOnCanvas(e.pageX, e.pageY);
		var schematicCoordsCurrentLayer = this.modelViews[this.mouseOverModelView].getSchematicCoords(mouseOnCanvas.x, mouseOnCanvas.y, forAboveLayer = false);
		var schematicCoordsAboveLayer = this.modelViews[this.mouseOverModelView].getSchematicCoords(mouseOnCanvas.x, mouseOnCanvas.y, forAboveLayer = true);

		//Check if numeric: http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.x)) && isFinite(schematicCoordsCurrentLayer.x))) {
			return false;
		}
		
		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.y)) && isFinite(schematicCoordsCurrentLayer.y))) {
			return false;
		}

		if (!(!isNaN(parseFloat(schematicCoordsCurrentLayer.z)) && isFinite(schematicCoordsCurrentLayer.z))) {
			return false;
		}

		return {
			x: schematicCoordsCurrentLayer.x,
			y: schematicCoordsCurrentLayer.y,
			z: schematicCoordsCurrentLayer.z,
			x1: schematicCoordsAboveLayer.x,
			y1: schematicCoordsAboveLayer.y,
			z1: schematicCoordsAboveLayer.z
		};
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.guiFull_ticker = function(gui) {
	this.gui = gui;
	this.L10n = gui.L10n;
	var wasRunning;
	
	this.construct = function() {
		for (var domId in this.gui.tickerDomIds) {
			this[domId] = this.gui.tickerDomIds[domId];
		}

		this.registerOptions();
		this.registerEventBindings();
		this.registerInputBindings();
		this.tickCounter = 0;
		this.tickForRemaining = 0;
		this.tickingForInProgress = false;
	}
	
	this.updateButtonStatus = function() {
		var ticker = this.gui.mcSim.updateTicker;
		this.onEventStopOrStart(ticker.isRunning);
	}
	
	/**
	 * Records whether or not the ticker was running and stops it 
	 */
	this.pause = function() {
		var ticker = this.gui.mcSim.updateTicker;
		wasRunning = ticker.isRunning;
		this.stop();
	}
	
	/**
	 * Based on the state recorded by this.pause(), will start it running again if it was running before 
	 */
	this.resume = function() {
		if (wasRunning) {
			this.start();
		}
	}
	
	this.registerInputBindings = function() {
		var t = this;
		var input = this.gui.input;
		var ticker = this.gui.mcSim.updateTicker;


		input.bindInputEvent({
			savedKeyName: 'ticker_toggleRunning',
			category: 'ticker',
			description: 'shortcuts.ticker.togglerunning',
			callbackFunction: function(e) {ticker.toggleRunning();}
		});

		input.bindInputEvent({
			savedKeyName: 'ticker_tickOnce',
			category: 'ticker',
			description: 'shortcuts.ticker.tickonce',
			callbackFunction: function(e) {ticker.tickOnce();}
		});

		input.bindInputEvent({
			savedKeyName: 'ticker_tickFor',
			category: 'ticker',
			description: 'shortcuts.ticker.tickfor',
			callbackFunction: function(e) {t.tickFor();}
		});
	}
	
	this.registerEventBindings = function() {
		var t = this;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.bind("stopRunning", function() {
			t.onEventStopOrStart(false);
		});
		
		ticker.bind("startRunning", function() {
			t.onEventStopOrStart(true);
		});

		ticker.bind("onTickFinished", function() {
			t.onEventTickFinished();
		});
	}
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options;
		options.registerOption({
			type: 'number',
			name: 'targetTps',
			category: 'simulator',
			defaultValue: 20,
			changeIncrement: 1, 
			minValue: 0,
			maxValue: 100,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'tickOnceIncrement',
			category: 'simulator',
			defaultValue: 1,
			changeIncrement: 1, 
			minValue: 1,
			maxValue: 20,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		options.registerOption({
			type: 'number',
			name: 'tickFor',
			category: 'simulator',
			defaultValue: 100,
			changeIncrement: 10, 
			minValue: 1,
			maxValue: 10000,
			callbackScope: 'ticker',
			callbackForOnChange: function() {t.onOptionsChange()}
		});
		
		this.onOptionsChange();
	}
	
	this.onOptionsChange = function() {
		var options = this.gui.userSettings.options.simulator;
		var ticker = this.gui.mcSim.updateTicker;
		
		ticker.targetTps = this.gui.getOption("simulator", "targetTps");
		ticker.tickOnceIncrement = this.gui.getOption("simulator", "tickOnceIncrement");
		$("#" + this.tickForTextboxId).val(this.gui.getOption("simulator", "tickFor"));
	}
	
	this.start = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.startRunning();
		this.setActiveButton(this.runButtonClass);
	}
	
	this.stop = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		ticker.stopRunning();
		this.setActiveButton(this.stopButtonClass);
	}
	
	this.step = function() {
		this.tickingForInProgress = false;
		var ticker = this.gui.mcSim.updateTicker;
		this.setActiveButton(this.stepButtonClass);
		ticker.tickOnce();
		this.setActiveButton(this.stopButtonClass);
	}
	
	this.tickFor = function() {
		$tickFor = $("#" + this.tickForTextboxId);
		tickForValue = $tickFor.val();
		
		if (
			parseInt(tickForValue, 10) == tickForValue && //isInt
			tickForValue > 0
		) {
			$tickFor.removeClass("invalidBackgroundColor");
			this.setActiveButton(this.tickForButtonClass);
			this.tickingForInProgress = true;
			this.tickForRemaining = tickForValue;
			var ticker = this.gui.mcSim.updateTicker;
			ticker.startRunning();
		}
		else {
			$tickFor.addClass("invalidBackgroundColor");
		}
	}
	
	this.resetTickCounter = function() {
		this.tickCounter = 0;
		this.updateTickCounter();
	}
	
	this.onEventStopOrStart = function(isNowRunning) {
		//console.log("com.mordritch.mcSim.guiFull_ticker.onEventStopOrStart(): isNowRunning = %s", isNowRunning);
		if (isNowRunning) {
			if (this.tickingForInProgress) {
				this.setActiveButton(this.tickForButtonClass);
			}
			else {
				this.setActiveButton(this.runButtonClass);
			}
		}
		else {
			this.setActiveButton(this.stopButtonClass);
		}
	}
	
	this.setActiveButton = function(buttonClassName) {
		$("." + this.runButtonClass).removeClass("topToolbarSelected");
		$("." + this.runButtonClass).addClass("topToolbarUnselected");

		$("." + this.stopButtonClass).removeClass("topToolbarSelected");
		$("." + this.stopButtonClass).addClass("topToolbarUnselected");

		$("." + this.stepButtonClass).removeClass("topToolbarSelected");
		$("." + this.stepButtonClass).addClass("topToolbarUnselected");
		
		$("." + this.tickForButtonClass).removeClass("topToolbarSelected");
		$("." + this.tickForButtonClass).addClass("topToolbarUnselected");
		
		$("." + buttonClassName).removeClass("topToolbarUnselected");
		$("." + buttonClassName).addClass("topToolbarSelected");
	}
	
	this.onEventTickFinished = function() {
		this.tickCounter++;
		this.gui.modelviews.flushMarkedBlocks(); //TODO: Probably better to move it into the modelviews area
		if (this.tickingForInProgress) {
			this.tickForRemaining--;
			if (this.tickForRemaining == 0) {
				this.tickForInProgress = false;
				this.stop();
			this.setActiveButton(this.stopButtonClass);
			}
		}
		this.updateTickCounter();
	}
	
	this.updateTickCounter = function() {
		var easterEggText = (this.tickCounter > 9000) ? " (IT'S OVER 9000!)" : "";
		
		if (this.tickingForInProgress) {
			$("#" + this.tickCounterId).text(this.tickCounter + ' (' + this.tickForRemaining + ' ' + this.L10n.getString("ticker.tickForRemaining") + ')'+ easterEggText);
		}
		else {
			$("#" + this.tickCounterId).text(this.tickCounter + easterEggText);
		}
	}
	
	this.setTickerStepButtonClass = function(value) {
		this.step_domClass = value;
	}
	
	this.setTickerStopButtonClass = function(value) {
		this.stop_domClass = value;
	}
	
	this.setTickerRunButtonClass = function(value) {
		this.run_domClass = value;
	}
	
	this.setTickerTickForButtonClass = function(value) {
		this.tickFor_domClass = value;
	}
	
	this.setTickForTextboxId = function(value) {
		this.tickForTextbox_domId = value;
	}
	
	this.setTickCounterId = function(value) {
		this.tickCounter_domId = value;
	}
	
	this.construct();
}
; 
(function(){
var namespace = com.mordritch.mcSim;
var funcName = "guiFullToolbar";

var proto = function(gui) {
	var t = this;
	var toolbarContainerDomSelector = "#toolbars";
	var modelViewContainerDomSelector = "#workarea";
	var toolbarDomSelector = ".toolbar";
	var maxToolbars = 4;
	
	this.gui = gui;
	this.toolbarCount = 4;
	this.slotCount = 10;
	this.currentToolbar = 0;
	this.currentSlot = 0;
	this.showing = false;
	this.iconSize = 40;
	this.L10n = this.gui.localization;
	
	//TODO: Break out tools and have them be able register themselves
	this.extraTools = [
		{
			name: "pan",
			description: "tools.description.pan",
			icon: 'images/icons/tools/transform-move.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.pan.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.pan.body")
		},
		{
			name: "toggle",
			description: "tools.description.toggle",
			icon: 'images/icons/tools/click.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.toggle.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.toggle.body")
		},
		{
			name: "rotateBlock",
			description: "tools.description.rotateblock",
			icon: 'images/icons/tools/transform-rotate-2.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.rotateBlock.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.rotateBlock.body")
		},
		{
			name: "deleteBlock",
			description: "tools.description.deleteblock",
			icon: 'images/icons/tools/edit-delete-6.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.deleteBlock.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.deleteBlock.body")
		},
		{
			name: "blockInfo",
			description: "tools.description.blockinfo",
			icon: 'images/icons/tools/system-help-3.png',
			tooltipHeader: this.L10n.getString("tool.tooltip.blockInfo.header"),
			tooltipBody: this.L10n.getString("tool.tooltip.blockInfo.body")
		},
	];

	this.construct = function() {
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		this.registerInputBindings();
		this.registerOptions();
		this.initializeSelectionModal();
		this.initializeToolbarLayout();
		this.renderToolbars();
		
		$('.toolbarSlot').bind('click', function(e) {
			t.toolbarSlot_onClick(e);
		});

		this.onUserSettingsLoad(); //Populates the toolbars with user set icons, also called if the user logs in later

		//Bind the drggable event to icons, but disable until we have the toolbar editing modal showing:
		this.bindDraggable('.icon');
		$('.icon').draggable('disable');
	}
	
	/**
	 * Draws the unpopulated toolbars onto the screen
	 */
	this.initializeToolbarLayout = function() {
		$('body').append('<div id="toolbars"></div>');
		
		var toolbarCount = this.gui.getOption("toolbars", "count");
		var html;
		toolbarCount = 1;
		
		for (var i=0; i<maxToolbars; i++) {
			html = '<span class="toolbar" id="guiFullToolbar_'+i+'">';
			for (var j=0; j<this.slotCount; j++) {
				html += '<span class="toolbarSlot unselected" id="guiFullToolbarIcon_'+i+'_'+j+'" data-toolbar="'+i+'" data-slot="'+j+'"></span>';
			}
			html += '</span>';
			$(toolbarContainerDomSelector).append(html);
		}
		
		$('.toolbarSlot').html('<span class="emptySlot"></span>');

		$('.emptySlot').css({
			width: this.iconSize + "px",
			height: this.iconSize + "px"
		});

		//Make the toolbar slots valid dropable points for our drag and drop for icons
		$('.toolbarSlot').droppable({
			accept: '.icon',
			activeClass: 'toolbarSlot-droppable-active',
			hoverClass: 'toolbarSlot-droppable-hover',
			drop: function() {
				t.iconDropped(
					$(this).data('toolbar'),
					$(this).data('slot')
				);
			}
		});
		
		var t = this;
		
		$('.toolbarSlot')
			.on('mouseenter', function() {
				t.showTooltip($(this).data('toolbar'), $(this).data('slot'));
			})
			.on('mouseleave', function() {
				t.gui.tooltip.hide();
			});
	}
	
	this.showTooltip = function(toolbar, slot) {
		var $domElement = $('#guiFullToolbarIcon_'+toolbar+'_'+slot);
		var shortcutKeyScope = 'main';
		var shortcutKeyEventName = 'toolbarSlotShortcutKey_'+toolbar+'_'+slot; 
		var headerText = "", bodyText = "";

		var slotData = this.getSlotData(toolbar, slot);
		if (slotData != null) {
			switch (slotData[0]) {
				case "block":
					var blockData = this.gui.placeableBlocks[slotData[1]];
					var blockId = (blockData.blockMetadata == 0) ? blockData.blockID : blockData.blockID + ':' + blockData.blockMetadata;
					var blockName = this.gui.localization.getString(blockData.blockName);
			
					headerText = blockName + ' ('+blockId+')';
					break;
				case "tool":
					headerText = this.extraTools[slotData[1]].tooltipHeader;
					bodyText = this.extraTools[slotData[1]].tooltipBody;
					break;
				default: throw new Error("Unexpected case")
			}
			this.gui.tooltip.show($domElement, "right", headerText, bodyText, shortcutKeyScope, shortcutKeyEventName);
		}
	}
	
	/**
	 * Used to render the toolbars, also called back if the toolbar count is changed in options
	 */
	this.renderToolbars = function() {
		var toolbarCount = this.gui.getOption("toolbars", "count");

		for (var i=0; i<maxToolbars; i++) {
			if (i < toolbarCount) {
				$('#guiFullToolbar_'+i).show();
			}
			else {
				$('#guiFullToolbar_'+i).hide();
			}
		}
		
		$(toolbarContainerDomSelector).width($(toolbarDomSelector).width()*toolbarCount);
		$(modelViewContainerDomSelector).css("left", $(toolbarContainerDomSelector).width() + $(toolbarContainerDomSelector).position().left);

		this.setSelectedSlot(0,0);
	}

	/**
	 * When a toolbar slot is clicked
	 */
	this.toolbarSlot_onClick = function(e) {
		var targetData = $(e.target).data();
		if (
			typeof targetData.toolbar != 'undefined' &&
			this.getSlotData(targetData.toolbar, targetData.slot) != null
		) {
			this.setSelectedSlot(targetData.toolbar, targetData.slot);
		}
	}
	
	/**
	 * A modal from which we can drag icons onto our toolbars
	 */
	this.initializeSelectionModal = function() {
		var selectionModalHtml =
			'<span class="liveSearchWrapper"><input type="text" id="liveSearch"/></span>' +
			'<div class="iconSelectionBox">' +
				'<table>';
				
		//extra tools:
		for (var i=0; i<this.extraTools.length; i++) {
			var toolDescription = this.gui.localization.getString(this.extraTools[i].description);
			selectionModalHtml += 
				'<tr>' + 
					'<td><img class="icon" data-tool-type="tool" data-array-link="'+i+'" style="width: '+this.iconSize+'px; height: '+this.iconSize+'px;" src="' + this.extraTools[i].icon + '"/></td>' + 
					'<td class="blockId"></td>' + 
					'<td class="blockName">' + toolDescription + '</td>' + 
				'</tr>';
		}
		
		//Materials which can be placed:
		var placeableBlocks = this.gui.placeableBlocks;
		for (var i in placeableBlocks) {
			var blockId = (placeableBlocks[i].blockMetadata == 0) ? placeableBlocks[i].blockID : placeableBlocks[i].blockID + ':' + placeableBlocks[i].blockMetadata;
			var blockName = this.gui.localization.getString(placeableBlocks[i].blockName);
			
			selectionModalHtml += 
				'<tr>' + 
					'<td><img class="icon" data-tool-type="block" data-array-link="'+i+'" src="' + placeableBlocks[i].iconImageData + '"/></td>' + 
					'<td class="blockId"><pre> '+blockId+' </pre></td>' + 
					'<td class="blockName">' + blockName + '</td>' + 
				'</tr>';
		}

		selectionModalHtml +=
				'</table>'+
			'</div>';

		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setContent(selectionModalHtml);
		this.modal.setCloseButtonText(this.L10n.getString("guiFull.button.close"));
		this.modal.bind('show', function() {
			t.show();
		});
		
		this.modal.bind('hide', function() {
			t.hide();
		});
		
		$('#liveSearch').keyup(
			function() {

			var searchTerm = $('#liveSearch').val();
			
				$('tr').each(function() {
					if($(this).text().search(new RegExp(searchTerm, "i")) < 0) {
						$(this).hide();
					}
					else {
						$(this).show();
					}
					
				});
			}
		);
		
		$('.inner .icon').bind('mousedown', function() {
			t.scrollTop = $('.inner').scrollTop(); //fix for firefox jumping the inner div scrolling to the top any time you try drag
		});
	}
	
	this.registerInputBindings = function() {
		var t = this;
		
		this.gui.input.bindInputEvent({
			category: 'toolbars.general',
			savedKeyName: 'nextToolbarSlot',
			description: 'toolbars.changetool.next',
			callbackFunction: function(e, data) {t.toolbarSlotChange(1);}
		});

		this.gui.input.bindInputEvent({
			category: 'toolbars.general',
			savedKeyName: 'previousToolbarSlot',
			description: 'toolbars.changetool.previous', 
			callbackFunction: function(e, data) {t.toolbarSlotChange(-1);}
		});
		
		for (var i=0; i<maxToolbars; i++) {
			for (var j=0; j<this.slotCount; j++) {
				this.gui.input.bindInputEvent({
					category: 'toolbar'+i,
					savedKeyName: 'toolbarSlotShortcutKey_'+i+'_'+j,
					description: 'toolbars.shortcut.slot'+j,
					data: {toolbar: i, slot: j},
					callbackFunction: function(e, data) {t.slotShortcutKey(data);}
				});
			}
		}
	}
	
	this.registerOptions = function() {
		var t = this;
		var options = this.gui.options

		options.registerOption({
			type: 'number',
			name: 'count',
			category: 'toolbars',
			defaultValue: 2,
			minValue: 1,
			maxValue: 4,
			callbackScope: 'toolbars',
			callbackForOnChange: function() {t.renderToolbars()}
		});
	}
	
	/**
	 * Sets a slot as selected
	 * 
	 * @param	{Integer}	toolbar	The toolbar
	 * @param	{Integer}	slot	The slot
	 */
	this.setSelectedSlot = function(toolbar, slot) {
		var toolbarCount = this.gui.getOption("toolbars", "count");
		if (toolbar >= toolbarCount) {
			return; //Can happen if they use a shortcut key to select it
		}
		
		this.currentToolbar = toolbar;
		this.currentSlot = slot;
		$('.selected').addClass('unselected');
		$('.selected').removeClass('selected');
		$('#guiFullToolbarIcon_'+toolbar+'_'+slot).addClass('selected');
		$('#guiFullToolbarIcon_'+toolbar+'_'+slot).removeClass('unselected');
		
		var slotInfo = this.getSlotData(toolbar, slot);
		if (slotInfo != null) {
			var toolType = slotInfo[0];
			var toolId = slotInfo[1];
			switch (toolType) {
				case "block":
					this.gui.toolHandler.activeTool = "material";
					break; 
				case "tool":
					this.gui.toolHandler.activeTool = this.extraTools[toolId].name;
					break;
			}
		}
	}
	
	this.toolbarSlotChange = function(delta) {
		var currentSlot = this.currentSlot;
		var currentToolbar = this.currentToolbar;
		var toolbarCount = this.gui.getOption("toolbars", "count");
		
		do {
			if (delta > 0) {
				currentSlot++;
				if (currentSlot >= this.slotCount) {
					currentSlot = 0;
					currentToolbar++;
					if (currentToolbar >= toolbarCount) currentToolbar = 0;
				}
			}
			else if (delta < 0) {
				currentSlot--;
				if (currentSlot < 0) {
					currentSlot = this.slotCount-1;
					currentToolbar--;
					if (currentToolbar < 0) currentToolbar = toolbarCount-1;
				}
			}
			else {
				throw new Error("Unexpected delta");
			}
			
			if (
				currentSlot == this.currentSlot &&
				currentToolbar == this.currentToolbar
			) {
				//we're back where we started, there is no more than one slot with a tool in it, so, break
				break;
			}

			//We break if we encounter a slot which is populated
			if (this.getSlotData(currentToolbar, currentSlot) != null) break;
		} while (true);
		
		this.setSelectedSlot(currentToolbar, currentSlot);
	}
	
	this.slotShortcutKey = function(data) {
		if (this.getSlotData(data.toolbar, data.slot) != null) this.setSelectedSlot(data.toolbar, data.slot);
	}
	
	/**
	 * Returns whatever is currently in the slot
	 */
	this.getSlotData = function(toolbar, slot) {
		if(
			typeof this.gui.userSettings.toolbars == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined' ||
			this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == ''
		) {
			//Empty slot
			return null;
		}
		return this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot];
	}
	

	/**
	 * Used to retrive the blockId and metadata for the currently selected material
	 */
	this.getMaterialData = function() {
		var link = this.getSlotData(this.currentToolbar, this.currentSlot)[1];
		return {
			blockId: this.gui.placeableBlocks[link].blockID,
			blockMetadata: this.gui.placeableBlocks[link].blockMetadata
		}
		
	}

	/**
	 * Callback for when user settings are loaded, populates the toolbars with the saved settings.
	 */
	this.onUserSettingsLoad = function() {
		//Draw icons:
		for(var i=0; i<4; i++) {
			for(var j=0; j<10; j++) {
				this.renderIcon(i,j);
			}
		}

		if (this.getSlotData(0,0) != null) {
			this.setSelectedSlot(0,0);
		}
		else {
			this.toolbarSlotChange(1); //Otherwise, pretend we used the mousewheel, which only selects a valid tool
		}
	}
	
	this.show = function() {
		this.showing = true;
		$('.icon').draggable('enable');
		$('#toolbars').addClass('onIconChange');
	}
	
	this.hide = function() {
		this.showing = false;
		
		$('#liveSearch').val('');
		$('#liveSearch').trigger('keyup');
		
		$('.icon').draggable('disable');
		this.gui.userManager.saveUserSettings();

		$('#toolbars').removeClass('onIconChange');
	}
	
	/**
	 * Calls draggable binding on an element
	 * 
	 * @param	{String}	selector 	The CSS selector rule of which DOM elements to apply the draggable binding
	 */
	this.bindDraggable = function(selector) {
		var t = this;
		$(selector).draggable({
			helper: 'clone',
			appendTo: 'body',
			scroll: false,
			zIndex: 200,
			//cursorAt: {top: 1, right: 1},
			start: function(event, ui) {
				t.pickedUpItem = $(this).data('arrayLink');
				t.pickedUpItemType = $(this).data('toolType');
				
				$('.inner').scrollTop(t.scrollTop); //fix as firefox jumps the inner div scrolling to the top

				if (typeof $(this).data('toolbar') != 'undefined') {
					delete t.gui.userSettings.toolbars.slots[$(this).data('toolbar')]['slot'+$(this).data('slot')];
					t.renderIcon($(this).data('toolbar'), $(this).data('slot'));
				}

			}
		});
		
	}
	
	/**
	 * Event called when a tool icon is dropped onto a toolbar slot. 
	 */
	this.iconDropped = function(toolbar, slot) {
		var toolId = this.pickedUpItem;
		var toolType = this.pickedUpItemType;
		
		if (typeof this.gui.userSettings.toolbars == 'undefined') this.gui.userSettings.toolbars = {};
		if (typeof this.gui.userSettings.toolbars.slots == 'undefined') this.gui.userSettings.toolbars.slots = [{},{},{},{}];
		if (typeof this.gui.userSettings.toolbars.slots[toolbar].length != 'undefined') this.gui.userSettings.toolbars.slots[toolbar] = {}; //Sometimes we can get arrays in here instead of objects, as only arrays have lengths, this is any easy way to check
		if (typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined') this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] = ['',''];
		
		this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] = [toolType, toolId];
		this.renderIcon(toolbar, slot);
	}
	
	/**
	 * Updates the icon for a toolbar slot
	 */
	this.renderIcon = function(toolbar, slot) {
		var t = this;
		var domId = '#guiFullToolbarIcon_' + toolbar + '_' + slot;
		
		if(
			typeof this.gui.userSettings.toolbars == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined' ||
			this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == ''
		) {
			//Empty slot
			$(domId).html('<span class="emptySlot"></span>');
			$(domId+' .emptySlot').css({
				width: this.iconSize + "px",
				height: this.iconSize + "px"
			});
			return;
		}
		
		var toolType = this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot][0];
		var toolId = this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot][1];
		switch (toolType) {
			case 'block': //Type of tool is a block/material placement
				var blockData = this.gui.placeableBlocks[toolId];
				if (typeof blockData == 'undefined') throw new Error('toolbar.renderIcon(): Invalid blocktype "'+toolId+'"');
				$(domId).html('<img class="icon" data-slot="'+slot+'" data-toolbar="'+toolbar+'" data-tool-type="block" data-array-link="'+ toolId +'" src="' + blockData.iconImageData+ '"/>');
				break;
			case 'tool':
				var tool = this.extraTools[toolId];
				$(domId).html('<img class="icon" data-slot="'+slot+'" data-toolbar="'+toolbar+'" data-tool-type="tool" data-array-link="'+ toolId +'" style="width: '+this.iconSize+'px; height: '+this.iconSize+'px;" src="' + tool.icon+ '"/>');
				break; 
		}
		this.bindDraggable(domId + ' img');
	}
	
	this.renderIcon1 = function(toolbar, slot) {
		var t = this;
		var domId = '#guiFullToolbarIcon_' + toolbar + '_' + slot;

		if(
			typeof this.gui.userSettings.toolbars == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots == 'undefined' ||
			typeof this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == 'undefined' ||
			this.gui.userSettings.toolbars.slots[toolbar]['slot'+slot] == ''
		) {
			//Empty slot
			//$(domId).html('<span class="emptySlot"></span>');
			$(domId+' .emptySlot').css({
				width: this.iconSize + "px",
				height: this.iconSize + "px"
			});
			return;
		}
		
	}
	
	this.construct();
}
namespace[funcName] = proto;
})();
; 
(function(){
var namespace = com.mordritch.mcSim;
var funcName = "tooltip";

namespace[funcName] = function(gui) {
	var delay = 500;
	var timeoutId = -1;
	var domId = "tooltip";
	var $tooltip;
	var L10n = gui.localization;
	
	this.construct = function() {
		$('body').append('<div id="'+domId+'"></div>');
		$tooltip = $('#'+domId);
		$tooltip.hide();
	}
	
	this.show = function($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName) {
		clearTimeout(timeoutId);
		var t = this;
		timeoutId = setTimeout(function(){
			t.showNow($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName);
		}, delay);
	}
	
	this.showNow = function($domElement, position, headerText, bodyText, shortcutKeyScope, shortcutKeyEventName) {
		var posX, posY, html = '';
		if (headerText.length > 0) {
			html += '<b>' + headerText + '</b>';
		}
		if (
			shortcutKeyScope.length > 0 &&
			shortcutKeyEventName.length > 0 &&
			gui.input.getBindingKeyNames(shortcutKeyScope, shortcutKeyEventName).length > 0
		) {
			html += '<br/>' + L10n.getString('tooltip.shortcutKeyText', gui.input.getBindingKeyNames(shortcutKeyScope, shortcutKeyEventName));
		}
		if (bodyText.length > 0) {
			while (bodyText.indexOf('\\n') >= 0) {
				bodyText = bodyText.replace("\\n", "<br/>")
			}
			
			html += '<br/><br/>' + bodyText;
		}
		$tooltip.html(html);
		
		switch (position) {
			case "below":
				posX = $domElement.offset().left; 
				posY = $domElement.offset().top + $domElement.outerHeight() + 2;
				var outerWidth = this.getOuterWidth();
				if (posX + outerWidth > $(window).width()) {
					posX = $domElement.offset().left + $domElement.outerWidth() - outerWidth;
				}
				break;
			case "right":
				posX = $domElement.offset().left + $domElement.outerWidth() + 2;
				posY = $domElement.offset().top;
				var outerHeight = this.getOuterHeight();
				if (posY + outerHeight > $(window).height()) {
					posY = $domElement.offset().top + $domElement.outerHeight() - outerHeight - 2;
				}
				break;
			default: throw new Error("Unexpected case");
		}
		
		$tooltip.css({
			left: posX + "px",
			top: posY + "px"
		});
		$tooltip.fadeIn("fast");
	}
	
	this.getOuterHeight = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerHeight();
		$tooltip.hide();
		return returnValue;
	}
	
	this.getOuterWidth = function() {
		$tooltip.show();
		var returnValue = $tooltip.outerWidth();
		$tooltip.hide();
		return returnValue;
	}
	
	this.hide = function() {
		clearTimeout(timeoutId);
		$tooltip.hide();
	}
	
	
	this.construct();
}})();
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "sidebar";
	
	var proto = function(gui) {
		var isShowing = false;
		var buttonDomSelector = '.addDocumentToolbarButton_sidebar';
		var sidebarDomSelector = '#sidebar';
		var contentDomSelector = '#sidebarContent';
		var workareaDomSelector = '#workarea'; 
		var width = 300;
		
		this.construct = function() {
			$('body').append(
				'<div id="sidebar">' +
					'<div id="sidebarInner">' +
						'<div id="sidebarContent">' +
						'' +
						'' +
						'' +
						'' +
						'</div>' +
					'</div>' +
				'</div>');
		}
		
		this.show = function(noAnimate) {
			if (isShowing) {return;}
			
			if (typeof noAnimate == "undefined") {
				noAnimate = false;
			}
			
			isShowing = true;
			$(buttonDomSelector)
				.removeClass('topToolbarUnselected')
				.addClass('topToolbarSelected');
				
			$(sidebarDomSelector).css({width: width, right: -width});
			$(sidebarDomSelector).show();
			
			if (noAnimate) {
				$(sidebarDomSelector).css({right: 0});
				$(workareaDomSelector).css({right: width});
			}
			else {
				$(sidebarDomSelector).animate({right: 0}, 'fast');
				$(workareaDomSelector).animate({right: width}, 'fast');
			}
		}
		
		this.hide = function() {
			if (!isShowing) {return;}
			isShowing = false;
			$(buttonDomSelector)
				.removeClass('topToolbarSelected')
				.addClass('topToolbarUnselected');

			$(sidebarDomSelector).animate({right: -width}, 'fast', function() {
				$(sidebarDomSelector).hide();
			});
			$(workareaDomSelector).animate({right: 0}, 'fast');
		}
		
		this.resize = function(resizeToPixels) {
			$(sidebarDomSelector).css('width', resizeToPixels + 'px');
			$(workareaDomSelector).css('right', resizeToPixels + 'px');
		}
		
		this.toggle = function() {
			if (isShowing) {
				this.hide();
			}
			else {
				this.show();
			}
		}
		
		this.addSection = function(header, body, collapsedByDefault, existingDomId) {
			collapsedByDefault = (typeof collapsedByDefault != "undefined") ? collapsedByDefault : false;

			var domId = (typeof existingDomId != "undefined") ? existingDomId : 'domId_'+com.mordritch.mcSim.domIdCounter++;
			
			if (typeof existingDomId == "undefined") {
				$(contentDomSelector).append('<div id="'+domId+'"></div>');
			}
			
			$('#' + domId).html(
				'<div class="heading">' +
					'<span class="arrow"></span> ' +
					'<b>' +
						header +
					'</b>' +
				'</div>' +
				'<div class="body">' +
					'<br/>' +
					body.replace(/\n/g, '<br/>') +
					'<br/>' +
					'<br/>' +
				'</div>'
			);
			
			if (collapsedByDefault) {
				$('#' + domId + ' .body').hide();
			}
			$('#' + domId + ' .arrow').html((collapsedByDefault) ? "\u25ba" : "\u25bc");
			
			
			$('#' + domId + ' .heading').on('click', function() {
				var selector = '#' + domId + ' .';
					var hidden = ($(selector + 'arrow').html() == "\u25ba"); 
					$(selector + 'arrow').html((hidden) ? "\u25bc" : "\u25ba");
				$(selector + 'body').slideToggle('fast', function() {
				});
			});
			
			return domId;
		}
		
		this.construct();
	}
	namespace[funcName] = proto;
})();
; 
com.mordritch.mcSim.guiFullModal = function(gui, makeClosedButtonDefault) {
	makeClosedButtonDefault = (typeof makeClosedButtonDefault != "undefined") ? makeClosedButtonDefault : false;

	if ($("#modalBackground").length == 0) {
		$('body').append('<div id="modalBackground"></div>');
		$("#modalBackground").hide().disableSelection();
	}

	this.gui = gui;
	this.domId = 'domId_'+com.mordritch.mcSim.domIdCounter++;
	this.jqDomId = '#' + this.domId;
	this.localizer = gui.localization;
	this.eventBindings = {};
	this.isShowing = false;
	this.modalDomIdCounter = 0;
	this.domClass = "panel";
	this.defaultButton = "";
	this.loadingIcon = '<img src="images/loading1.gif" alt="">';
	
	this.construct = function() {

		var t = this;
		var html =
			'<div class="guiFullModal ' + this.domClass + '" id="'+this.domId+'" style="display: none;">' +
				'<div class="guiModal_innerContent"></div>' +
				'<span class="guiModal_Feedback"></span>' +
				'<span class="guiModal_Buttons"></span>' +
			'</div>' +
			'';
		$('body').append(html);
		
		
		this.addButton(this.localizer.getString('button.text.cancel'), 'guiModal_closeButton', function() {t.hide(); }, makeClosedButtonDefault);
	}
	
	/**
	 * Change the CSS class that is applied to the modal, for example, one style would make it a large modal, another could make it a much smaller modal.
	 * 'prompt' makes a small prompt box
	 * 'panel' makes it the general "options" type of modal, this is the default
	 *  
	 */
	this.setDomClass = function(domClass) {
		$(this.jqDomId).removeClass(this.domClass);
		this.domClass = domClass;
		$(this.jqDomId).addClass(this.domClass);
	}
	
	this.setContent = function(html) {
		$(this.jqDomId+' .guiModal_innerContent').html(html);
	}
	
	this.setFeedbackText = function(html) {
		$(this.jqDomId+' .guiModal_Feedback').html(html);
	}
	
	this.setCloseButtonText = function(html) {
		$(this.jqDomId+' .guiModal_closeButton').html(html);
	}
	
	/**
	 * Adds an extra button to the bottom area of the modal, to the left of the cancel button
	 * 
	 * @param	{String}	label				The display label for the button
	 * @param	{String}	classAttribute		Optional additional class attribute for the button
	 * @param	{Function}	onActivateFunction	A function bound to when it's clicked on or has enter/space hit while focussed
	 * @param	{Function}	isDefault			Automatically recieves focus when shown
	 */
	this.addButton = function(options, classAttribute, onActivateFunction, isDefault) {
		//New method uses a jquery like method to recieve paramaters via objects, however, this is backwards compatiable too
		if (typeof options == "object") {
			var label = options.label;
			var classAttribute = options.classAttribute;
			var onActivateFunction = options.onActivateFunction;
			var isDefault = options.isDefault;
		}
		else {
			label = options;
		}
		
		var domId = 'modal_button_' + this.domId +'_'+ this.modalDomIdCounter++;
		var html = '<span id="' + domId + '" role="button" tabindex="0" class="button '+classAttribute+'">'+label+'</span>';
		if (isDefault) this.defaultButton = domId;
		$(this.jqDomId+' .guiModal_Buttons').prepend(html);
		$('#'+domId).bind('click keyup', function(e) {
			if ($(e.delegateTarget).hasClass('disabled')) return;
			
			if (
				(e.type == "keyup" && (e.which == 13 || e.which == 32)) ||
				(e.type == "click" && e.which == 1)
			) onActivateFunction();
		});
	}
	
	this.toggleShown = function() {
		if (this.isShowing) {
			this.hide();
		}
		else {
			this.show();
		}
	}
	
	this.show = function() {
		$('#modalBackground').show();
		if (this.isShowing) return; //already showing, return
		this.isShowing = true;
		$(this.jqDomId).css('display','block');
		$(document).bind('keyup.' + this.domId, {t: this}, function(e) {
			if (e.which == 27) { //27 "Escape" key on keyboard. 
				e.data.t.hide();
			}
		});
		
		if (this.defaultButton != "") $('#'+this.defaultButton).focus();
		
		this.gui.pauseBindings();
		this.triggerEvent('show');

		this.gui.ticker.pause();
	}
	
	this.hide = function() {
		$('#modalBackground').hide();
		if (!this.isShowing) return; //already hidden, return
		this.isShowing = false;
		$(this.jqDomId).css('display','none');
		$(document).unbind('keyup.' + this.domId);
		this.gui.resumeBindings();
		this.triggerEvent('hide');
		this.gui.ticker.resume();
	}
	
	/**
	 * Allows callback bindings
	 * 
	 * For example, a callback could be called when the modal is shown or hidden.
	 */
	this.bind = function(eventName, callbackFunction) {
		if (typeof this.eventBindings[eventName] == "undefined") {
			this.eventBindings[eventName] = [];
		}
		this.eventBindings[eventName].push(callbackFunction);
	}
	
	/**
	 * Used within the modal to trigger events so any bound callbacks are called.
	 */
	this.triggerEvent = function(eventName) {
		if (typeof this.eventBindings[eventName] != "undefined") {
			for (var i in this.eventBindings[eventName]) {
				this.eventBindings[eventName][i]();
			}
		}
	}
	
	this.disableControls = function() {
		$(this.jqDomId + ' .button').addClass("disabled");
		$(this.jqDomId + ' input').attr("disabled", "disabled");
		
	}
	
	this.startWaitingForServer = function(message) {
		this.disableControls();
		this.setFeedbackText('<img src="images/loading1.gif" alt=""> ' + message);
	}
	
	this.enableControls = function() {
		$(this.jqDomId + ' .button').removeClass("disabled");
		$(this.jqDomId + ' input').removeAttr("disabled", "disabled");
	}
	
	this.stopWaitingForServer = function() {
		this.enableControls();
		this.setFeedbackText('');
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.guiFullInput = function(gui) {
	this.gui = gui;

	this.inputEventBindings = {};
	this.keyBindingsMap = {};
	this.modKeysDown = []; //Used for live tracking of which modkeys are presently pressed

	this.suspended = false;
	this.scope = "main";

	this.capturingInputCombination = false; //Used for selecting shortcut keys, catches all and reports the result
	this.capturingInputCombination_modKeys = [];
	
	this.construct = function() {
		var t = this;

		$(window).bind('keydown', {t:this}, function(e) {e.data.t.onKeyDown(e);});
		//$(window).bind('mousedown', {t:this}, function(e) {e.data.t.onKeyDown(e);}); //Thanks to browser bugs, browsers will fire mousedown if user clicks on a scrollbar, but never mouseup! we are just going to have to bind click event's the modelviews instead

		$(window).bind('keyup', {t:this}, function(e) {e.data.t.onKeyUp(e);});
		$(window).bind('mouseup', {t:this}, function(e) {e.data.t.onKeyUp(e);});
		
		$(window).bind('focus', {t:this}, function(e) {e.data.t.onFocus(e);});
		$(window).bind('blur', {t:this}, function(e) {e.data.t.onBlur(e);});

		$(window).bind('mousemove', {t:this}, function(e) {e.data.t.onMouseMove(e)});
		$(window).bind('mousewheel', {t: this}, function(e, delta) {e.data.t.onMouseWheel(e, delta);}); //Requires the mousewheel JQuery extension: http://plugins.jquery.com/project/mousewheel
		
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setCloseButtonText('Cancel');
		this.modal.bind('show', function() {t.onModalShow()});
		this.modal.addButton('Apply', 'applyButton', function() {t.applyButton()});
		
		$('body').append('<div id="inputSelectOverlay"></div>');
		$('#inputSelectOverlay').hide();
		$('#inputSelectOverlay').bind('mousedown', {t:this}, function(e) {e.data.t.onKeyDown(e);}) //Since it's not bound above
				
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		
	}
	
	/**
	 * Returns a string showing the friendly keybinding key combo, used in places like tooltips  
	 */
	this.getBindingKeyNames = function(scope, eventName) {
		returnArray = [];
		if (this.inputEventBindings[scope][eventName].binding1 != null) {
			returnArray.push(this.getKeyNames(this.inputEventBindings[scope][eventName].binding1, "+"));
		}
		if (this.inputEventBindings[scope][eventName].binding2 != null) {
			returnArray.push(this.getKeyNames(this.inputEventBindings[scope][eventName].binding2, "+"));
		}
		
		return returnArray.join(", ");
	}
	
	/**
	 * Called as the modal is shown
	 */
	this.onModalShow = function() {
		//Below two lines are used to track the "desired" updates to keybindings, since changes aren't applied immediately and can be cancelled.
		this.keyBindingsMap_new = JSON.parse(JSON.stringify(this.keyBindingsMap));
		this.inputEventBindings_toUpdate = {};
		
		this.modal.setFeedbackText('');

		var categories = [];
		var keyBindings = {};
		for (var scope in this.inputEventBindings) {
			for (var eventName in this.inputEventBindings[scope]) {
				var obj = this.inputEventBindings[scope][eventName];
				if (typeof keyBindings[obj.category] == 'undefined') {
					keyBindings[obj.category] = [];
					
					categories.push({
						category: obj.category,
						translatedName: this.gui.localization.getString('shortcuts.category.'+obj.category)
					});
				}
				
				keyBindings[obj.category].push(
					{
						scope: scope,
						eventName: eventName,
						description: this.gui.localization.getString(obj.description)
					}
				);
			}
		}
		
		categories.sort(function(a,b){
			if (a.translatedName < b.translatedName)
				return -1;
			if (a.translatedName > b.translatedName)
				return 1;
			return 0;
		});
		
		for (var i in keyBindings) {
			keyBindings[i].sort(function(a,b){
				if (a.description < b.description)
					return -1;
				if (a.description > b.description)
					return 1;
				return 0;
			});
		}
		
		
		var selectionModalHtml = 
			'<table class="keyBindings">' +
				'<colgroup>' +
				'<col class="col1" />' +
				'<col class="col2" />' +
				'<col class="col3" />' +
			'</colgroup>' +
		'';
		
		for (var i in categories) {
			selectionModalHtml += '<tr><td colspan="3"><b>'+categories[i].translatedName+'</b></td></tr>';
			var keyBindingCategory = keyBindings[categories[i].category]; 
			
			for(var j in keyBindingCategory) {
				var keyBinding = keyBindingCategory[j];
				var binding1 = this.getKeyNames(this.inputEventBindings[keyBinding.scope][keyBinding.eventName].binding1, "+");
				var binding2 = this.getKeyNames(this.inputEventBindings[keyBinding.scope][keyBinding.eventName].binding2, "+");
				
				var domId = this.modal.domId+'_'+keyBinding.scope+'_'+keyBinding.eventName+'_binding';
				
				selectionModalHtml += 
				'<tr>' +
					'<td>'+ keyBinding.description +'</td>'+
					'<td><span data-binding="binding1" data-scope="' + keyBinding.scope + '" data-keyevent="' + keyBinding.eventName + '" id="' + domId + '1" class="button shortcut1 choosekeybinding">' + binding1 + '</span></td>' +
					'<td><span data-binding="binding2" data-scope="' + keyBinding.scope + '" data-keyevent="' + keyBinding.eventName + '" id="' + domId + '2" class="button shortcut2 choosekeybinding">' + binding2 + '</span></td>' +
				'</tr>';
			}
		}
		
		//temp, just to make it bigg enough to scroll while testing visual look
		for (var i=0; i<0; i++) {
				selectionModalHtml += 
				'<tr>' +
					'<td>'+ keyBinding.description +'</td>'+
					'<td><span class="button shortcut1">'+binding1+'</span></td>' +
					'<td><span class="button shortcut2">'+binding2+'</span></td>' +
				'</tr>';
		}
		selectionModalHtml += '</table>';
		this.modal.setContent(selectionModalHtml);
		$('.choosekeybinding').bind('click',{t:this},function(e) {
			e.data.t.chooseInputCombo(e.target.id);
		});
	}
	
	this.toggleConfigVisible = function() {
		this.modal.toggleShown();
	}
	
	/**
	 * Called whenever the browser window/tab becomes active
	 */
	this.onFocus = function() {
		
	}
	
	/**
	 * Called whenever the browser window/tab becomes the inactive/background window/tab
	 */
	this.onBlur = function() {
		this.modKeysDown = [];
		
		for (var i in this.modKeysDown) {
			//TODO: Trigger keyupevent for each modkey which was down (perhaps). 
		}
	}
	
	this.ignoreKey = function(keyCode) {
		return (
			keyCode == 93 || //Windows Context Menu Key 
			keyCode == 92 || //Windows Key
		false);
	}
	
	this.isModKey = function(keyCode) {
		return (
			keyCode == 1 || //mouse1 
			keyCode == 2 || //mouse2
			keyCode == 3 || //mouse3
			keyCode == 16 || //shift
			keyCode == 17 || //ctrl
			keyCode == 18 || //alt
			keyCode == 32 || //space
		false);
	}
	
	this.onKeyUp = function(e) {
		if(this.isModKey(e.which)) {
			for (var i in this.modKeysDown) {
				if (this.modKeysDown[i] == e.which) {
					this.modKeysDown.splice(i,1);
					break;
				}
			}

			if (this.capturingInputCombination && this.modKeysDown.length == 0) {
				this.capturingInputCombination_modKeys.sort();
				this.captureDone(this.capturingInputCombination_modKeys.join('-'));
			}
		}
	}
	
	this.onMouseMove = function(e) {
		var keysDown = [];
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}
		keysDown.sort();
		this.inputEvent(keysDown.join('-'), e);
	}
	
	this.onKeyDown = function(e) {
		if (this.ignoreKey(e.which)) return;
		if (e.target.nodeName == 'INPUT' || e.target.nodeName == 'TEXTAREA') return; //Prevent capturing input sent to input fields. //TODO: Add other node types here perhaps? or maybe it's fine, we can leave it covered by suspending input
		
		var keysDown = [];
		if(this.isModKey(e.which)) {
			var keyFound = false;
			for (var i in this.modKeysDown) {
				if (this.modKeysDown[i] == e.which) {
					keyFound = true;
				}
			}
			if (!keyFound) {
				this.modKeysDown.push(e.which);
			}
		}
		else {
			keysDown.push(e.which);
		}
		
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}
		keysDown.sort();

		this.inputEvent(keysDown.join('-'), e);
	}
	
	this.inputEvent = function(keys, e) {
		//Always prevent default for certain keys:
		if (
			e.which == 32 //Spacebar, shortcut key in some browsers for page down
		) {
			e.preventDefault();
		}
		
		if (
			!this.capturingInputCombination &&
			!this.suspended &&
			(
				typeof this.keyBindingsMap[this.scope][keys] != 'undefined' ||
				typeof this.keyBindingsMap["main"][keys] != 'undefined'
			)
		) {
			e.preventDefault();
			this.doCallbackForKeyCombo(keys, e);
		}
		else if (this.capturingInputCombination && e.type != 'mousemove') {
			e.preventDefault();
			
			if (
				this.isModKey(e.which) &&
				this.capturingInputCombination_modKeys.indexOf(e.which) < 0
			) {
				this.capturingInputCombination_modKeys.push(e.which);
				return;
			}
			
			if (!this.isModKey(e.which)) {
				this.captureDone(keys);
			}
		}
	}
	
	this.chooseInputCombo = function(domId) {
		$('#inputSelectOverlay').show();
		$(window).bind('contextmenu.inputSelection', function(e) {e.preventDefault()});

		this.choosingEventFor = {
			domId: domId,
			scope: $('#'+domId).data('scope'),
			keyEvent: $('#'+domId).data('keyevent'),
			binding: $('#'+domId).data('binding')
		};
		
		this.modal.setFeedbackText(this.gui.localization.getString("guiFull.input.choose"));
		this.capturingInputCombination_modKeys = [];
		this.capturingInputCombination = true;
	}
	
	this.captureDone = function(keys) {
		if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope] == 'undefined')
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope] = {};
		if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent] == 'undefined')
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent] = {
				binding1: this.inputEventBindings[this.choosingEventFor.scope][this.choosingEventFor.keyEvent].binding1,
				binding2: this.inputEventBindings[this.choosingEventFor.scope][this.choosingEventFor.keyEvent].binding2
			}

		this.capturingInputCombination = false;
		$('#inputSelectOverlay').hide();
		
		window.setTimeout(
			function() {
				//If we unbind it immediately, then it still fires.
				$(window).unbind('contextmenu.inputSelection');
			},
			200
		);
		
		//did we just set it for the same key?
		if (
			this.keyBindingsMap_new[this.choosingEventFor.scope][keys] == this.choosingEventFor.keyEvent &&
			this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding] == keys
		) {
			this.modal.setFeedbackText("");
			return;
		}
		
		//See if there was already another key bound:
		if (
			typeof this.keyBindingsMap_new[this.choosingEventFor.scope][keys] != 'undefined'
		) {
			var conflictingKeyEvent = this.keyBindingsMap_new[this.choosingEventFor.scope][keys];
			if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope] == 'undefined')
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope] = {};
			if (typeof this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent] == 'undefined')
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent] = {
					binding1: this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].binding1,
					binding2: this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].binding2
				};
			
			var overRiddenEventDescription = this.inputEventBindings[this.choosingEventFor.scope][conflictingKeyEvent].description;
			var overRiddenKeyName = this.gui.localization.getString(overRiddenEventDescription);
			
			//which of the two bindings got hit?
			if (this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding1 == keys) {
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding1 = null;
				$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.keyBindingsMap_new[this.choosingEventFor.scope][keys]+'_binding1').html(this.getKeyNames(null));
				var bindingNumber = 1;
			}
			else {
				this.inputEventBindings_toUpdate[this.choosingEventFor.scope][conflictingKeyEvent].binding2 = null;
				$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.keyBindingsMap_new[this.choosingEventFor.scope][keys]+'_binding2').html(this.getKeyNames(null));
				var bindingNumber = 2;
			}

			this.modal.setFeedbackText('<span class="errorText">'+this.gui.localization.getString("guiFull.input.nowunbound", overRiddenKeyName, bindingNumber)+'</span>');
			
		}
		else {
			this.modal.setFeedbackText("");
		}
		
		//delete the old keybinding referrence:
		var currentKey = this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding];
		delete this.keyBindingsMap_new[this.choosingEventFor.scope][currentKey];
		
		//Set the new referrence
		$('#'+this.modal.domId+'_'+this.choosingEventFor.scope+'_'+this.choosingEventFor.keyEvent+'_'+this.choosingEventFor.binding).html(this.getKeyNames(keys, "+"));
		this.inputEventBindings_toUpdate[this.choosingEventFor.scope][this.choosingEventFor.keyEvent][this.choosingEventFor.binding] = keys;
		this.keyBindingsMap_new[this.choosingEventFor.scope][keys] = this.choosingEventFor.keyEvent;
	}

	/**
	 * Called when the modal's apply button is clicked
	 */
	this.applyButton = function() {
		this.keyBindingsMap = this.keyBindingsMap_new;
		for (var scope in this.inputEventBindings_toUpdate) {
			for (var keyEvent in this.inputEventBindings_toUpdate[scope]) {
				this.inputEventBindings[scope][keyEvent].binding1 = this.inputEventBindings_toUpdate[scope][keyEvent].binding1; 
				this.inputEventBindings[scope][keyEvent].binding2 = this.inputEventBindings_toUpdate[scope][keyEvent].binding2; 
			}
		}
		
		this.gui.userSettings.bindings = this.getSaveableBindings();
		this.gui.userManager.saveUserSettings();
		this.modal.hide();
	}
	
	/**
	 * When there is a matching keybinding, this calls back the bound function
	 */
	this.doCallbackForKeyCombo = function(keys, e) {
		if (
			typeof this.keyBindingsMap[this.scope][keys] != 'undefined'
		) {
			var scope = this.scope;
		}
		
		if (
			typeof this.keyBindingsMap[this.scope][keys] == 'undefined' &&
			typeof this.keyBindingsMap["main"][keys] != 'undefined'
		) {
			var scope = "main";
		}

		var inputEventName = this.keyBindingsMap[scope][keys];
		var inputEventBinding = this.inputEventBindings[scope][inputEventName];
		var callBackData = inputEventBinding.data;
		
		if (
			e.type == 'mousemove' &&
			inputEventBinding.bindToMouseMove
		) {
			inputEventBinding.callbackFunction_mouseMove(e, callBackData);
		}
		else {
			inputEventBinding.callbackFunction(e, callBackData);
			if (inputEventBinding.keyUpModifierKeysOnTrigger)
				this.modKeysDown = [];
		}
	}
	
	this.onKeyPress = function(e, type) {

	}
	
	this.getKeyNames = function(keys, seperator) {
		if (keys == null) return this.gui.localization.getString('keynames.unbound');
		
		var keyNames = [];
		for (var i in keys.split('-')) {
			keyNames.push(this.getKeyName(keys.split('-')[i]));
		}
		
		return keyNames.join(seperator);
	}
	
	this.getKeyName = function(keyCode) {
		var keyCodeNames = {
			8: "keynames.8",
			9: "keynames.9",
			12: 'keynames.12',
			13: "keynames.13",
			16: "keynames.16",
			17: "keynames.17",
			18: "keynames.18",
			20: 'keynames.20',
			19: 'keynames.19',
			32: "keynames.32",
			33: 'keynames.33',
			34: 'keynames.34',
			35: 'keynames.35',
			36: 'keynames.36',
			37: 'keynames.37',
			38: 'keynames.38',
			39: 'keynames.39',
			40: 'keynames.40',
			45: 'keynames.45',
			46: 'keynames.46',
			96: 'keynames.96',
			97: 'keynames.97',
			98: 'keynames.98',
			99: 'keynames.99',
			100: 'keynames.100',
			101: 'keynames.101',
			102: 'keynames.102',
			103: 'keynames.103',
			104: 'keynames.104',
			105: 'keynames.105',
			106: 'keynames.106',
			107: 'keynames.107',
			109: 'keynames.109',
			110: 'keynames.110',
			111: 'keynames.111',
			112: 'keynames.112',
			113: 'keynames.113',
			114: 'keynames.114',
			115: 'keynames.115',
			116: 'keynames.116',
			117: 'keynames.117',
			118: 'keynames.118',
			119: 'keynames.119',
			120: 'keynames.120',
			121: 'keynames.121',
			122: 'keynames.122',
			123: 'keynames.123',
			144: 'keynames.144',
			145: 'keynames.145',
			186: 'keynames.186',
			187: 'keynames.187',
			188: 'keynames.188',
			189: 'keynames.189',
			190: 'keynames.190',
			191: 'keynames.191',
			192: 'keynames.192',
			220: 'keynames.220',
			219: "keynames.219",
			222: 'keynames.222',
			221: "keynames.221",
			1: "keynames.1",
			2: "keynames.2",
			3: "keynames.3",
			mousewheelup: "keynames.mousewheelup",
			mousewheeldown: "keynames.mousewheeldown",
			mousemove: "keynames.mousemove"
		};


		if (typeof keyCodeNames[keyCode] != 'undefined') {
			return this.gui.localization.getString(keyCodeNames[keyCode]);
		}
		else if (keyCode == 0) {
			return keyCode;
		}
		else {
			return String.fromCharCode(keyCode);
		}
	}

	this.onMouseWheel = function(e, delta) {
		var keysDown = [];
		for (var i in this.modKeysDown) {
			keysDown.push(this.modKeysDown[i]);
		}

		if (delta > 0) {
			keysDown.push("mousewheelup");
		}
		else {
			keysDown.push("mousewheeldown");
		}

		keysDown.sort();

		this.inputEvent(keysDown.join('-'), e);
	}
	
	/**
	 * Tools use this register their events which can be bound to input
	 * 
	 * @param	{String}	scope						Scope can cause precedence to input events, allowing default key behaviour to be overridden
	 * @param	{String}	category					Give the keybinding a category, making the keyselection page easier to break up
	 * @param	{String}	savedKeyName				This is the mapping used to find the saved keymapping from user options
	 * @param	{String}	description					String name of the translation for a description of what the keybinding is for
	 * @param	{Object}	data						Extra data which can be included arbitrarily and passed to the callback
	 * @param	{Boolean}	bindToMouseMove				Also bind this event to fire if the mouse is moved along with the keycombo
	 * @param	{Function}	callbackFunction_mouseMove	Callback function to execute when the mouse is moved along with the keycombo
	 * @param	{Function}	callbackFunction			The function called when an input event match is found 
	 * @param	{Function}	keyUpModifierKeysOnTrigger	If true, will automatically set all modifier keys as unpressed. This is
	 * 								 					useful for bindings which show prompts as the "keyUp" event could land up
	 * 													not being fired.
	 */
	this.bindInputEvent = function(parameters) {
		var defaultParamaters = {
			scope: 'main',
			data: {},
			mouseMoveEvent: false,
			keyUpModifierKeysOnTrigger: false
		}
		
		for (var i in defaultParamaters) {
			if (typeof parameters[i] == 'undefined') parameters[i] = defaultParamaters[i];
		}
		
		var scope 						= parameters.scope;
		var category 					= parameters.category;
		var savedKeyName 				= parameters.savedKeyName;
		var description 				= parameters.description;
		var data 						= parameters.data;
		var callbackFunction 			= parameters.callbackFunction;
		var bindToMouseMove 			= parameters.bindToMouseMove;
		var callbackFunction_mouseMove 	= parameters.callbackFunction_mouseMove;
		var keyUpModifierKeysOnTrigger 	= parameters.keyUpModifierKeysOnTrigger;
		
		
		
		if (typeof this.inputEventBindings[scope] == 'undefined') this.inputEventBindings[scope] = {};
		if (typeof this.keyBindingsMap[scope] == 'undefined') this.keyBindingsMap[scope] = {};
		
		if (typeof this.inputEventBindings[scope][savedKeyName] != 'undefined') {
			throw new Error('input.bindInputEvent: Attempted binding of duplicate savedKeyName and scope combination.');
		}
		this.inputEventBindings[scope][savedKeyName] = {
			'callbackFunction': callbackFunction,
			'description': description,
			'category': category,
			'data': data,
			'binding1': null,
			'binding2': null,
			'userLoaded': false,
			'bindToMouseMove': bindToMouseMove,
			'callbackFunction_mouseMove': callbackFunction_mouseMove,
			'keyUpModifierKeysOnTrigger': keyUpModifierKeysOnTrigger
		};
		
		var bindings_userLoaded = this.gui.userSettings.bindings;
		if (typeof bindings_userLoaded == 'undefined') bindings_userLoaded = {};	
		var bindings_default = this.gui.defaultSettings.bindings;
		if (typeof bindings_default == 'undefined') bindings_default = {};
		var binding1 = null;
		var binding2 = null;
		var userLoaded = false;

		if (typeof bindings_userLoaded[savedKeyName] != 'undefined') {
			//If it's conflicting with an existing keybinding which was user set, then ignore.
			if (
				bindings_userLoaded[savedKeyName].binding1 != null && (
					typeof this.keyBindingsMap[scope][binding1] == 'undefined' ||
					!this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].userLoaded
				)
			) binding1 = bindings_userLoaded[savedKeyName].binding1;
			
			if (
				bindings_userLoaded[savedKeyName].binding2 != null && (
					typeof this.keyBindingsMap[scope][binding2] == 'undefined' ||
					!this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].userLoaded
				)
			) binding2 = bindings_userLoaded[savedKeyName].binding2;

			
			userLoaded = true;
		}
		else if (typeof bindings_default[savedKeyName] != 'undefined') {
			//As this is a default (fallback) binding, only apply if not already conflicting.
			if (typeof this.keyBindingsMap[scope][binding1] == 'undefined') binding1 = bindings_default[savedKeyName].binding1;
			if (typeof this.keyBindingsMap[scope][binding2] == 'undefined') binding2 = bindings_default[savedKeyName].binding2; 
		}
		this.inputEventBindings[scope][savedKeyName].userLoaded = userLoaded;

		if (binding1 != null) {
			if (typeof this.keyBindingsMap[scope][binding1] != 'undefined') {
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding1 == binding1) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding1 = null;
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding2 == binding1) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding1]].binding2 = null;
			}

			this.keyBindingsMap[scope][binding1] = savedKeyName;
			this.inputEventBindings[scope][savedKeyName].binding1 = binding1;
		}
		
		if (binding2 != null) {
			if (typeof this.keyBindingsMap[scope][binding2] != 'undefined') {
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding1 == binding2) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding1 = null;
				if (this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding2 == binding2) this.inputEventBindings[scope][this.keyBindingsMap[scope][binding2]].binding2 = null;
			}

			this.keyBindingsMap[scope][binding2] = savedKeyName;
			this.inputEventBindings[scope][savedKeyName].binding2 = binding2;
		}
	}
	
	/**
	 * Used to apply user's saved keybindings, destroys any current custom keybindings
	 */
	this.onUserSettingsLoad = function() {
		var bindings_userLoaded = this.gui.userSettings.bindings;
		if (typeof bindings_userLoaded == 'undefined') bindings_userLoaded = {};
		var bindings_default = this.gui.defaultSettings.bindings;
		if (typeof bindings_default == 'undefined') bindings_default = {};

		this.keyBindingsMap = {};
		
		for (var scope in this.inputEventBindings) {
			if (typeof this.keyBindingsMap[scope] == 'undefined') this.keyBindingsMap[scope] = {};
			for (var savedKeyName in this.inputEventBindings[scope]) {
				this.inputEventBindings[scope][savedKeyName].userLoaded = false;
				this.inputEventBindings[scope][savedKeyName].binding1 = null;
				this.inputEventBindings[scope][savedKeyName].binding2 = null;
				
				if (
					typeof bindings_userLoaded[savedKeyName] != 'undefined' &&
					bindings_userLoaded[savedKeyName].binding1 != null &&
					typeof this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding1] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding1 = bindings_userLoaded[savedKeyName].binding1;
					this.inputEventBindings[scope][savedKeyName].userLoaded = true;
					this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding1] = savedKeyName;
				}

				if (
					typeof bindings_userLoaded[savedKeyName] != 'undefined' &&
					bindings_userLoaded[savedKeyName].binding2 != null &&
					typeof this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding2] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding2 = bindings_userLoaded[savedKeyName].binding2;
					this.inputEventBindings[scope][savedKeyName].userLoaded = true;
					this.keyBindingsMap[scope][bindings_userLoaded[savedKeyName].binding2] = savedKeyName;
				}
			}
		}
		
		//Second time round is filling in any bindings with default, provided the defaults don't conflict
		for (var scope in this.inputEventBindings) {
			for (var savedKeyName in this.inputEventBindings[scope]) {
				if (
					typeof bindings_userLoaded[savedKeyName] == 'undefined' &&
					typeof bindings_default[savedKeyName] != 'undefined' &&
					bindings_default[savedKeyName].binding1 != null &&
					typeof this.keyBindingsMap[scope][bindings_default[savedKeyName].binding1] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding1 = bindings_default[savedKeyName].binding1;
					this.keyBindingsMap[scope][bindings_default[savedKeyName].binding1] = savedKeyName;
				}

				if (
					typeof bindings_userLoaded[savedKeyName] == 'undefined' &&
					typeof bindings_default[savedKeyName] != 'undefined' &&
					bindings_default[savedKeyName].binding2 != null &&
					typeof this.keyBindingsMap[scope][bindings_default[savedKeyName].binding2] == 'undefined'
				) {
					this.inputEventBindings[scope][savedKeyName].binding2 = bindings_default[savedKeyName].binding1;
					this.keyBindingsMap[scope][bindings_default[savedKeyName].binding2] = savedKeyName;
				}
			}
		}
	}
	
	/**
	 * Returns an object which can be placed in the database of the server with a snapshot of the users keybindings.
	 * 
	 * @return	{Object}
	 */
	this.getSaveableBindings = function() {
		var returnObject = {};
		for (var scope in this.inputEventBindings) {
			for (var savedKeyName in this.inputEventBindings[scope]) {
				returnObject[savedKeyName] = {
					binding1: this.inputEventBindings[scope][savedKeyName].binding1,
					binding2: this.inputEventBindings[scope][savedKeyName].binding2
				}
			}
		}
		return returnObject;
	}
	
	
	/**
	 * Used to "choose" input combinations by the user, so they can assign shortcut keys
	 * 
	 * @param callbackFunction	{function}	function which is called when the user has selected a keystroke
	 */
	this.captureInputCombo = function(callbackFunction) {
		this.capturingInputCombination = true;
		this.inputCaptureCallbackFunction = callbackFunction;
	}

	/**
	 * Pauses shortcut key processing
	 * 
	 * For example, modal dialogues pause key strokes.
	 */
	this.suspend = function() {
		this.suspended = true;
	}
	
	/**
	 * Resumes shortcut key processing
	 */
	this.resume = function() {
		this.suspended = false;
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.options = function(gui) {
	this.gui = gui;
	this.registeredOptions = {};
	
	this.construct = function() {
		var t = this;
		this.gui.userSettings_registerForOnLoadCallback(function() {t.onUserSettingsLoad();});
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal.setCloseButtonText('Cancel');
		this.modal.addButton('Apply', 'applyButton', function() {t.applyButton()}); //TODO: localize "Apply" word here 
		
		
		this.gui.input.bindInputEvent({
			savedKeyName: 'showOptions',
			category: 'options',
			description: 'shortcuts.options.show',
			callbackFunction: function(e) {t.showOptionsScreen();}
		});
	}
	
	/**
	 * A convenient way to get an option's current value  
	 */
	this.getOption = function(category, name) {
		return currentValue = this.gui.userSettings.options[category][name];
	}

	/**
	 * When the apply button is pushed
	 */
	this.applyButton = function() {
		var callbacksNeeded = {};
		var isInputError = false;
		var updatedOptions = JSON.parse(JSON.stringify(this.gui.userSettings.options));
		for (var category in this.registeredOptions) {
			for (var name in this.registeredOptions[category]) {
				var currentValue = this.gui.userSettings.options[category][name];
				var newValue = this.getValue(category, name);
				var option = this.registeredOptions[category][name];
				if (this.checkForError(category, name)) {
					isInputError = true;
				}
				
				if (
					newValue != currentValue &&
					typeof option.callbackForOnChange != 'undefined'
				) {
					//value has changed, let's put it on the list to do callbacks which gets called if no error occurs
					callbacksNeeded[category+'_'+name+'_'+option.callbackScope] = option;
				}
				updatedOptions[category][name] = this.getValue(category, name);
			}
		}
		
		if (isInputError) {
			this.modal.setFeedbackText('<span class="errorText">'+this.gui.localization.getString('options.error.errorexists')+'</span>');
		}
		else {
			this.modal.setFeedbackText("");
			this.gui.userSettings.options = updatedOptions;
			for (var i in callbacksNeeded) {
				callbacksNeeded[i].callbackForOnChange();
				//console.log("Calling back for: %s", i);
			}
			this.gui.userManager.saveUserSettings();
			this.modal.hide();
		}
	}
	
	/**
	 * Reads the current value set by the user on the form based on the option name and category
	 * 
	 * Automatically handles for different data types
	 */
	this.getValue = function(category, name) {
		var id = '#options_'+category+'_'+name;
		var $targetElement = $(id);
		var option = this.registeredOptions[category][name];
		switch (option.type) {
			case "number":
				return parseFloat($targetElement.val());
			case "boolean":
				if ($targetElement.is(':checked'))
					return true;
				else
					return false;
		}		
	}
	
	/**
	 * Checks automically reads the DOM value and returns whether or not the current input is valid
	 * 
	 * Will also add an optionError class to text input's if they have invalid input, CSS can be used to make those boxes red or something
	 */
	this.checkForError = function(category, name) {
		var id = '#options_'+category+'_'+name;
		var $targetElement = $(id);
		var option = this.registeredOptions[category][name];
		switch (option.type) {
			case "number":
				var currentValue = parseFloat($targetElement.val());
				if (
					isNaN($targetElement.val()) ||
					currentValue > option.maxValue ||
					currentValue < option.minValue
				) {
					$targetElement.addClass("optionError");
					$targetElement.parent().parent().attr('data-errorText', this.gui.localization.getString("options.error.number", option.minValue, option.maxValue));
					return true;
				}
				else {
					$targetElement.removeClass("optionError");
					$targetElement.parent().parent().attr('data-errorText', "");
				}
				break;
		}
		return false;
	}
	
	/**
	 * Called anytime a table row is moused over, if there is an error it shows it
	 */
	this.showErrorDetails = function(e) {
		var target = $(e.delegateTarget).attr('data-errorText');
		
		if (
			typeof target  != 'undefined' &&
			target != ""
		) {
			//TODO: Implement a div which can pop up with the error details
			//console.log(target);
		}
	}
	
	/**
	 * 
	 * @param	name				A name which is unique within the category
	 * @param	type				So we know what kind of option change widget to draw, for example for a number or tickbox
	 * @param	callbackForOnChange	If the value of the option changes, either due to onload or just through the options screen,
	 * 								this callback can be called
	 * @param	callbackScope		If multiple options being changed would result in the same callback function, this scope is
	 * 								a way of grouping those together, unique within category only
	 * @param	category			A way to group kinds of options together, for example everythign which applies to modelviews or the ticker
	 * @param	defaultValue		If the value is unset, this will be its default
	 * @param	maxValue			If the value is a number or text, this is the maximum length or value
	 * @param	minValue			If the value is a number or text, this is the minimum length or value
	 */
	this.registerOption = function(parameters) {
		if (typeof this.gui.userSettings.options == 'undefined')
			this.gui.userSettings.options = {};
		if (typeof this.gui.userSettings.options[parameters.category] == 'undefined')
			this.gui.userSettings.options[parameters.category] = {};

		if (typeof this.registeredOptions[parameters.category] == 'undefined')
			this.registeredOptions[parameters.category] = {};
		if (typeof this.registeredOptions[parameters.category][parameters.name] != 'undefined')
			throw new Error("com.mordritch.mcSim.options.registerOption(): Tried to register conflicting option " + parameters.category + "." + parameters.category);
		
		this.registeredOptions[parameters.category][parameters.name] = parameters;
		if (typeof this.gui.userSettings.options[parameters.category][parameters.name] == 'undefined') {
			this.gui.userSettings.options[parameters.category][parameters.name] = parameters.defaultValue;
		}
	}
	
	/**
	 * Populates and shows the options modal
	 */
	this.showOptionsScreen = function() {
		var content = 
			'<table class="optionsTable">' +
				'<colgroup>' +
					'<col class="col1">' +
					'<col class="col2">' +
					'<col class="col3">' +
				'</colgroup>' +
		'';
		
		for (var category in this.registeredOptions) {
			content +=
			'<tr>' +
				'<td colspan="3"><b>' +
					this.gui.localization.getString("options.category."+category) +
				'</b></td>' +
			'</tr>';

			for (var name in this.registeredOptions[category]) {
				var currentValue = this.gui.userSettings.options[category][name];
				var option = this.registeredOptions[category][name];
				var id = 'options_'+category+'_'+name;
				var label = this.gui.localization.getString("options."+category+"."+name);
				var defaultButton =
					'<span' +
						' class="setDefault button"' +
						' data-for-id="'+id+'"' +
						' data-name="'+name+'"' +
						' data-category="'+category+'"' +
					'>'
						+this.gui.localization.getString("options.settodefault") +
					'</span>';
				

				switch (option.type) {
					case "boolean":
						if (currentValue) {
							var checked = ' checked="checked"';
						}
						else {
							var checked= '';
						}
						content +=
						'<tr>' +
							'<td colspan="2">' +
								'<label><input type="checkbox" id="'+id+'"'+checked+'/>'+label+'</label>' +
							'</td>' +
							'<td>' +
								defaultButton +
							'</td>' +
						'</tr>';
						break;
					case "text":
						break;
					case "number":
						content +=
						'<tr>' +
							'<td>' +
								label +
							'</td>' +
							'<td>' +
								'<input class="numberInput" type="text" id="'+id+'" value="'+currentValue+'" />' +
								'<span class="minusButton button" data-name="'+name+'" data-category="'+category+'" data-for-id="'+id+'">-</span>' +
								'<span class="plusButton button" data-name="'+name+'" data-category="'+category+'" data-for-id="'+id+'">+</span>' +
							'</td>' +
							'<td>' +
								defaultButton +
							'</td>' +
						'</tr>';
						break;
				}
			}
		}

		content +=
			'</table>';

		this.modal.setContent(content);
		this.modal.show();
		
		var t = this;
		$('.optionsTable .plusButton').bind('click', function(e) {t.plusMinusButtonsClick(e, "plus");});
		$('.optionsTable .minusButton').bind('click', function(e) {t.plusMinusButtonsClick(e, "minus");});
		$('.optionsTable .setDefault').bind('click', function(e) {t.defaultButton(e);});

		$('.optionsTable .button').disableSelection();
		$('.optionsTable tr').bind('mouseover', function(e) {t.showErrorDetails(e)});
		$('.optionsTable .numberInput').bind('change', function(e) {t.onChangeEvent(e)});
	}
	
	/**
	 * Called any time an input box is changed, can check the input live
	 * 
	 * Note that browsers don't call this event as you type, but only as you lose focus
	 */
	this.onChangeEvent = function(e) {
		var arr = e.delegateTarget.id.split('_');
		this.checkForError(arr[1], arr[2]);
	}
	
	/**
	 * Number inputs have +/- buttons, this is called each time they are pushed
	 */
	this.plusMinusButtonsClick = function(e, buttonPushed) {
		var data = $(e.target).data();
		var $targetElement = $('#'+data.forId);
		var currentValue = parseFloat($targetElement.val());
		var option = this.registeredOptions[data.category][data.name];
		
		if (typeof option.changeIncrement == 'undefined') option.changeIncrement = 1;

		if (buttonPushed == "plus") {
			var newValue = Math.round((currentValue + option.changeIncrement)*10)/10
		}
		else {
			var newValue = Math.round((currentValue - option.changeIncrement)*10)/10
		}
		
		if (
			newValue <= option.maxValue &&
			newValue >= option.minValue
		) {
			$targetElement.val(newValue);
		}
		this.checkForError(data.category, data.name);
	}
	
	/**
	 * Each row has a "Default" button, this is called when that's pushed and sets the option to its default value
	 */
	this.defaultButton = function(e) {
		var data = $(e.target).data();
		var $targetElement = $('#'+data.forId);
		var option = this.registeredOptions[data.category][data.name];
		
		switch(option.type) {
			case "number":
				$targetElement.val(option.defaultValue);
				this.checkForError(data.category, data.name);
				break;
			case "boolean":
				$targetElement.attr('checked', true);
				break;
		}
	}
	
	/**
	 * The callback function which is called if say the user logs in.
	 */
	this.onUserSettingsLoad = function() {
		var callbacks = {};
		for (var category in this.registeredOptions) {
			for (var name in this.registeredOptions[category]) {
				if (typeof this.registeredOptions[category][name].callbackForOnChange != 'undefined') {
					if (typeof callbacks[category] == 'undefined') callbacks[category] = {}; 
					callbacks[category][callbackScope] = this.registeredOptions[category][name].callbackForOnChange; 
				}
			}
		}
		
		for (var category in callbacks) {
			for (var callbackScope in callbacks[category]) {
				callbacks[category][callbackScope]();
			}
		}
	}
	
	this.construct();
}
; 
com.mordritch.mcSim.guiFull_userManager = function(gui) {
	this.gui = gui;
	this.L10n = gui.L10n;
	this.schematicListingLoaded = false;
	this.authenticated = false;
	this.signInFirst = false; //Called by any feature which requires the user to be signed, for example saving a schematic on the server
	
	/**
	 * Shortcut function call to this.gui.localization.getString();
	 */
	this.l = function(string) {
		return this.gui.localization.getString(string);
	}
	
	this.construct = function() {
		var t = this;
		$('body').append(
			'<div id="userManager_dropDown">' +
				'<div id="userManager_dropDown_loggedIn_true" class="userManagerDropdown"></div>' +
				//'<div id="userManager_dropDown_loggedIn_false" class="userManagerDropdown"><form action="" method="post"></div>' +
			'</div>'
		);

		$('#userManagerHolder').append(
			'<span id="userManagerDropdownButton" class="userManager hand">Log in / Create Account &#9660;</span>'
		);
		
		$('#userManager_dropDown_loggedIn_true, #userManager_dropDown').hide();
		
		//Below bindings handle showing/hiding of our dropdown:
		$('#userManagerDropdownButton').bind('click', {t: this}, function(e) {e.data.t.clickDropdown();});
		$('#userManager_dropDown').bind('mouseenter', {t: this}, function(e) {e.data.t.mouseEntered = true;});
		$('#userManager_dropDown').bind('mouseleave', {t: this}, function(e) {e.data.t.mouseEntered = false;});
		$(window).bind('click', {t: this}, function(e) {
			if (e.data.t.mouseEntered == false && e.target.id != 'userManagerDropdownButton') {
				$('#userManager_dropDown').hide();
			}
		});
		
		/*
		this.modal_newAccount = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_newAccount.bind('show', function() {t.onModalShow_newAccount()});
		this.modal_newAccount.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_newAccount.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_newAccount.jqDomId + ' form').submit();
		});
		*/
		
		this.modal_signIn = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_signIn.bind('show', function() {t.onModalShow_signIn()});
		this.modal_signIn.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_signIn.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_signIn.jqDomId + ' form').submit();
		});
		

		this.modal_forgotPassword = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_forgotPassword.bind('show', function() {t.onModalShow_forgotPassword()});
		this.modal_forgotPassword.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_forgotPassword.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_forgotPassword.jqDomId + ' form').submit();
		});

		this.modal_changePassword = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_changePassword.bind('show', function() {t.onModalShow_changePassword()});
		this.modal_changePassword.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_changePassword.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_changePassword.jqDomId + ' form').submit();
		});

		this.modal_editProfile = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_editProfile.bind('show', function() {t.onModalShow_editProfile()});
		this.modal_editProfile.setCloseButtonText(this.l('button.text.cancel'));
		this.modal_editProfile.addButton(this.l('button.text.apply'), 'applyButton', function() {
			$(t.modal_editProfile.jqDomId + ' form').submit();
		});
		
		this.modal_schematicListing = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.modal_schematicListing.bind('show', function() {t.onModalShow_schematicListing()});
		this.modal_schematicListing.addButton({
			label: this.L10n.getString('usermanager.form.refresh'),
			onActivateFunction: function() {t.onModalShow_schematicListing()}
		});
		
		if (
			!userManager_cookieCheckResponse.error &&
			userManager_cookieCheckResponse.authenticated
		) {
			this.loggedIn(userManager_cookieCheckResponse.userData);
		}
	}

		/*
	
		this.ownSchematicListing = new com.mordritch.mcSim.guiFullModal(this.gui);
		this.ownSchematicListing.html(
			'<div><button class="loadButton">Refresh List</button></div>' +
			'<div class="loading"><img src="images/loading1.gif" alt="Loading..."/><span> Loading...</span></div>' +
			'<div class="schematicList"></div>' +
			''
		);
		
		var t = this;
		$('#' + t.domId + '_dropdown .listOwnSchematics').bind('click', {'t': this}, function(e) {
			e.data.t.ownSchematicListing.show();
			if (!t.ownSchematicListing_loaded) {
				t.ownSchematicListing_loaded = true;
				$('#' + t.ownSchematicListing.domId + ' .loadButton').click();
			}
		});

		$('#' + t.ownSchematicListing.domId + ' .loadButton').bind('click', {'t': this}, function(e) {
			$('#' + t.ownSchematicListing.domId + ' .loadButton').hide();
			$('#' + t.ownSchematicListing.domId + ' .loading').show();
			$('#' + t.ownSchematicListing.domId + ' .schematicList').hide();

			$.getJSON('php/userManager.php?task=get_schematicListForLoggedInUser', function(data) {
				t.schematicLoadingComplete(data);
			});
		});
		*/

	this.bindForm = function(modal, task) {
		var t = this;
		$(modal.jqDomId + ' form').ajaxForm({
			url: 'php/userManager.php?task='+task,
			type: 'post',
			dataType: 'json',
			beforeSubmit: function() {
				t.formBeforeSubmit(modal);
			},
			success: function(data) {
				t.formSuccess(modal, data);
			}
		});

		$(modal.jqDomId + ' input').keyup(function(e) {
			if(e.keyCode == 13) $(modal.jqDomId + ' form').submit();
		});
	}
	
	this.formBeforeSubmit = function(modal) {
		modal.startWaitingForServer(this.l("usermanager.form.contactingserver"));
		$(modal.jqDomId + ' .formError').html('<br/>');
		$(modal.jqDomId + ' .applyButton').addClass('disabled');
	}

	this.formSuccess = function(modal, data) {
		modal.stopWaitingForServer();
		if (!data.error) {
			modal.hide();
			this.loggedIn(data.userData);
			if (this.signInFirst) {
				this.signInFirst = false;
				this.signInFirst_callback();
			}
		}
		else {
			var jqDomId = modal.jqDomId  + ' .'; 
			modal.setFeedbackText('<span class="errorText">' + this.l("usermanager.form.inputerror") + '</span>');
			for (var i in data.errorMessages) {
				//console.log("error: %s (%s)", i, data.errorMessages[i]);
				$(jqDomId + i).html('<br/>'+data.errorMessages[i]);
			}
		}
	}
	
	/**
	 *A single form which prompts for user to log on with an existing account or make a new account 
	 */
	this.onModalShow_signIn = function() {
		var t = this;
		var content = 
			'<form>' +
				'<span id="signInFirst"></span>' +
				'<input type="hidden" id="signIn_task" name="task" value="existing">' +
				'<div id="signIn_existing" class="signIn signIn_selected">' +
					'<b>' + this.l("usermanager.title.existinguser") + '</b>' +
	
					'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
					'<input type="text" name="existing_emailAddress" /></p>' +
					//'<input type="text" name="existing_emailAddress" value="jonathan.lydall@gmail.com" /></p>' + //TODO: temp, to make on login test easy
		
					'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="existing_password" />' +
					//'<input type="password" name="existing_password" value="password"/>' + //TODO: Temp, to make on login test easy
					'<br/><a href="#" id="iForgotMyPassword">'+this.l('usermanager.passwordforgottenlink')+'</a></p>' + 
					'<span class="formError existing_general"></span>' +
				'</div>' +
				'<div id="signIn_new" class="signIn signIn_unselected">' +
						'<b>' + this.l("usermanager.title.newuser") + '</b>' +

					'<p>'+this.l('usermanager.profile.email')+'<br/>' +
						'<input type="text" name="new_emailAddress" />' +
						'<span class="formError new_emailAddress"><br/></span></p>' +
					
					'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
						'<input type="text" name="new_displayName"/>' +
						'<span class="formError new_displayName"></span></p>' +
					
					'<p>'+this.l('usermanager.profile.password')+'<br/>' +
						'<input type="password" name="new_password" />' +
						'<span class="formError new_password"><br/></span></p>' +
					
					'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
						'<input type="password" name="new_confirmPassword" />' +
						'<span class="formError new_confirmPassword"></span></p>' +
					
					'<p>'+this.l('usermanager.newaccount.privacynotice')+'</p>' +
				'</div>' +
				'<div id="signIn_forgottenPassword" class="signIn signIn_unselected">' +
					'<b>' + this.l("usermanager.title.forgottenpassword") + '</b>' +
					'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
						'<input type="text" name="forgottenPassword_emailAddress" id="forgottenPassword_emailAddress_input" />' +
						'<span class="formError forgottenPassword_emailAddress"><br/></span></p>' +
					'<span class="formError forgottenPassword_general"></span>' +
				'</div>' +
			'</form>';
		this.modal_signIn.setContent(content);
		this.modal_signIn.setFeedbackText('');

		
		$('#signIn_new').bind('click', function () {t.signIn_select("new");});
		$('#signIn_new input').bind('focus', function () {t.signIn_select("new");});
		
		$('#signIn_existing').bind('click', function () {t.signIn_select("existing");});
		$('#signIn_existing input').bind('focus', function () {t.signIn_select("existing");});

		$('#signIn_forgottenPassword').bind('click', function () {t.signIn_select("forgottenPassword");});
		//$('#signIn_forgottenPassword input').bind('focus', function () {t.signIn_select("forgottenPassword");});
		$('#iForgotMyPassword').bind('click', function() {
			setTimeout(function() {
				t.signIn_select('forgottenPassword');
			},0);
			
		});
		$('#signIn_forgottenPassword').hide();

		this.bindForm(this.modal_signIn, 'process_signIn');
	}
	
	this.signIn_select = function(type) {
		$('#signIn_new').removeClass('signIn_selected');
		$('#signIn_new').addClass('signIn_unselected');
		$('#signIn_existing').removeClass('signIn_selected');
		$('#signIn_existing').addClass('signIn_unselected');
		$('#signIn_forgottenPassword').removeClass('signIn_selected');
		$('#signIn_forgottenPassword').addClass('signIn_unselected');
		$('#signIn_forgottenPassword').hide();
		

		$('#signIn_' + type).removeClass('signIn_unselected');
		$('#signIn_' + type).addClass('signIn_selected');
		//console.log('#signIn_' + type);
		
		if (type == "forgottenPassword") {
			$('#signIn_forgottenPassword').show();
			$('#forgottenPassword_emailAddress_input').focus();
		}
		
		$('#signIn_task').val(type);
		return false;
	}
	
	/**
	 * Called by any feature which requires the user to sign in first, for example if they want to save their schematic on the server
	 * @param	{String}	Text which appears at the top of the window explaining to the user that they need to sign in first.
	 * @param	{Function}	Callback function for if the sign in / sign up is successfull. Not called if the window is cancelled / closed.
	 *  
	 */
	this.show_signInFirst = function(text, callback) {
		this.signInFirst = true;
		this.signInFirst_callback = callback;
		this.modal_signIn.show();
		$('#signInFirst').html(this.l(text) + '</br>');
	}
	
	/*
	this.onModalShow_newAccount = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.profile.email')+'<br/>' +
					'<input type="text" name="emailAddress" />' +
					'<span class="formError emailAddress"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="password" />' +
					'<span class="formError password"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
					'<input type="password" name="confirmPassword" />' +
					'<span class="formError confirmPassword"></span></p>' +
				'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
					'<input type="text" name="displayName"/>' +
					'<span class="formError displayName"></span></p>' +
			'</form>';
		this.modal_newAccount.setContent(content);
		this.bindForm(this.modal_newAccount, 'process_newAccount');
	}
	*/
	
	this.onModalShow_forgotPassword = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.passwordreset.email')+'<br/>' +
					'<input type="text" name="emailAddress" />' +
					'<span class="formError emailAddress"></span>' +
				'</p>' +
			'</form>';
		this.modal_forgotPassword.setContent(content);
		this.bindForm(this.modal_forgotPassword, 'process_resetPassword');
	}

	this.onModalShow_editProfile = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.profile.email')+'<br/>' +
					'<input type="text" name="emailAddress" value="'+this.userData.emailAddress+'"/>' +
					'<span class="formError emailAddress"></span>' +
				'</p>' +
				'<p>'+this.l('usermanager.profile.displayname')+'</br>' +
					'<input type="text" name="displayName" value="'+this.userData.displayName+'"/>' +
					'<span class="formError displayName"></span>' +
				'</p>' +
				'<div class="formError general"></div>' +
			'</form>';
		this.modal_editProfile.setContent(content);
		this.bindForm(this.modal_editProfile, 'process_editProfile');
	}

	this.onModalShow_changePassword = function() {
		var content =
			'<form>' +
				'<p>'+this.l('usermanager.editpassword.currentpassword')+'<br/>' +
					'<input type="password" name="oldPassword" />' +
					'<span class="formError oldPassword"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.password')+'<br/>' +
					'<input type="password" name="password" />' +
					'<span class="formError password"><br/></span></p>' +
				'<p>'+this.l('usermanager.profile.confirmpassword')+'</br>' +
					'<input type="password" name="confirmPassword" />' +
					'<span class="formError confirmPassword"></span></p>' +
			'</form>';
		this.modal_changePassword.setContent(content);
		this.bindForm(this.modal_changePassword, 'process_editPassword');
	}
	
	this.showDropDown = function() {
		var t = this;
		if (typeof this.userData == 'undefined') {
			var email = '';
		}
		else {
			var email = this.userData.emailAddress;
		}
		
		$('#userManager_dropDown_loggedIn_true').html( 
			'<span class="userMail hand" style="font-weight: bold;">'+email+'</span></br>' +
			'<span class="listOwnSchematics hand">'+this.l('usermanager.dropdown.listownschematics')+'</span></br>' +
			'<span class="editProfile hand">'+this.l('usermanager.dropdown.editprofile')+'</span></br>' +
			'<span class="editPassword hand">'+this.l('usermanager.dropdown.changepassword')+'</span></br>' +
			'<span class="logOut hand">'+this.l('usermanager.dropdown.logout')+'</span></br>' +
		'');
		
		$('#userManager_dropDown_loggedIn_true .editProfile').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_editProfile.show();
		});
		$('#userManager_dropDown_loggedIn_true .editPassword').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_changePassword.show();
		});
		$('#userManager_dropDown_loggedIn_true .listOwnSchematics').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_schematicListing.show();
		});
		$('#userManager_dropDown_loggedIn_true .logOut').bind('click', {'t': this}, function(e) {
			e.data.t.logOut();
		});
		
		/*
		$('#userManager_dropDown_loggedIn_false form').html(
			'<span>'+this.l('usermanager.passwordreset.email')+'</span><br/>' +
			//'<input type="text" name="emailAddress" /><br/>' +
			'<input type="text" name="emailAddress" value="jonathan.lydall@gmail.com" /><br/>' + //TODO: temp, to make on login test easy

			'<span>'+this.l('usermanager.profile.password')+'</span><br/>' +
			//'<input type="password" name="password" /><br/>' +
			'<input type="password" name="password" value="password"/><br/>' + //TODO: Temp, to make on login test easy
			
			'<div class="formError logInError"></div>' +
			'<span class="newAccount hand">'+this.l('usermanager.dropdown.createaccount')+'</span><br/>' +
			'<span class="resetPassword hand">'+this.l('usermanager.dropdown.resetpassword')+'</span><br/>' +
			'<button class="logIn">'+this.l('usermanager.dropdown.login')+'</button><!--img class="loadingIcon" src="images/loading1.gif" alt="Loading..."/--><br/>'
		);
		
		$('#userManager_dropDown_loggedIn_false form').ajaxForm({
			url: 'php/userManager.php?task=process_logIn',
			iframe: true,
			type: 'post',
			dataType: 'json',
			beforeSubmit: function() {
				//$('#' + t.domId + '_dropdown .loadingIcon').show();
				$('#userManager_dropDown_loggedIn_false form .logIn').attr('disabled', true); //TODO: Uncomment for LIVE
				$('#userManager_dropDown_loggedIn_false form .logInError').hide();
			},
			success: function(data) {t.processLogin(data);}
		});
		
		
		$('#userManager_dropDown_loggedIn_false .newAccount').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_newAccount.show();
		});
		$('#userManager_dropDown_loggedIn_false .resetPassword').bind('click', {'t': this}, function(e) {
			$('#userManager_dropDown').hide();
			e.data.t.modal_forgotPassword.show();
		});
		*/
		
		$('#userManager_dropDown').show();
	}
	
	this.clickDropdown = function() {
		if ($('#userManager_dropDown').css('display') == 'none') {
			this.mouseEntered = false;
			if (this.authenticated == false) {
				this.modal_signIn.show();
			}
			else {
				this.showDropDown();
			}
		}
		else {
			$('#userManager_dropDown').hide();
		}
	}

	this.onModalShow_schematicListing = function() {
		this.modal_schematicListing.setContent("");
		this.modal_schematicListing.startWaitingForServer(this.L10n.getString('usermanager.form.waitingforserver'));
		
		var t = this;
		if (!this.schematicListingLoaded) {
			$.ajax({
				type: 'GET',
				url: 'php/userManager.php?task=get_schematicListForLoggedInUser',
				dataType: 'json',
				success: function(data) {
					t.modal_schematicListing.stopWaitingForServer();
					t.schematicLoadingComplete(data);
				}
			});
		}
	}
	
	this.schematicLoadingComplete = function(data) {
		if (data.error) {
			console.error('Server responded with an error: %s', data.errorMessage);
		}
		else {
			var html = 
				'<table class="schematicListing">' +
					'<tr>' +
						'<th>ID:</th>' +
						//'<th>File Name:</th>' +
						'<th>Title:</th>' +
						//'<th style="width: 10px;">Description:</th>' +
						//'<th>File Size:</th>' +
						//'<th>Created:</th>' +
						'<th>Last Modified:</th>' +
					'</tr>' +
				'';
			
			for (var row in data.schematicList) {
				var id = data.schematicList[row].id;
				var href = this.gui.urlHistory.generateUrl(id);

				html +=
					'<tr>' +
						'<td><a data-id="' + id + '" href="' + href + '">' + id + '</a></td>' +
						//'<td>' + data.schematicList[row].filename + '</td>' +
						'<td>' + data.schematicList[row].title + '</td>' +
						//'<td>' + data.schematicList[row].description + '</td>' +
						//'<td>' + data.schematicList[row].fileSize + '</td>' +
						//'<td>' + data.schematicList[row].firstCreated + '</td>' +
						'<td>' + data.schematicList[row].lastModified + '</td>' +
					'</tr>' +
				'';
			}
			
			html += '</table>';
			this.modal_schematicListing.setContent(html);
		}

		$('.schematicListing a').on('click', {t: this}, function(event) {
			if (event.which == 1) {
				var t = event.data.t;
				t.modal_schematicListing.hide();
				t.gui.urlHistory.onUrlClick(event);
			}
		});
	}
	
	this.logOut = function() {
		$('#userManager_dropDown').hide();
		$('#userManager_dropDown_loggedIn_true').hide();
		$('#userManagerDropdownButton').html('<img src="images/loading1.gif" alt=""> ' + this.l('usermanager.loggingout'));

		var t = this;
		$.getJSON('php/userManager.php?task=process_logOut', function(data) {
			if (data.error) {
				console.error("Server responded with error: " + data.errorMessage);
				return;
			}

			t.loggedOut();
		});
	}
	
	this.loggedOut = function() {
		this.authenticated = false;
		$('#userManagerDropdownButton').html(this.l('usermanager.notloggedin')+'&#9660;');
	}
	
	this.loggedIn = function(userData) {
		this.authenticated = true;
		
		this.userData = {
			userId: userData.userId,
			displayName: userData.displayName,
			emailAddress: userData.emailAddress
		}
		
		if (
			userData.userSettings != null &&
			typeof userData.userSettings.guiFull != 'undefined'
		) {
			this.gui.userSettings = userData.userSettings.guiFull;
			this.gui.userSettingsLoaded();
		}
		
		$('#userManagerDropdownButton').html(this.gui.localization.getString('usermanager.loggedin', this.userData.displayName) + ' &#9660;');

		$('#userManager_dropDown').hide();
		$('#userManager_dropDown_loggedIn_true').show();
	}
	
	/**
	 * Saves all settings to the user's profile on the webserver, if they are logged in. 
	 */
	this.saveUserSettings = function() {
		if (this.authenticated) {
			var JSON_data = JSON.stringify(this.gui.userSettings);
			
			$.ajax({
				type: 'POST',
				url: 'php/userManager.php?task=process_commitUserSettings&type=guiFull',
				data: {'data': JSON_data},
				success: function(data) {
					//TODO: Give feedback to the user
					if (data.error) {
						console.log('Saving options to server failed, server responded with: ' + data.errorMessage);	
					}
					else {
						console.log('Succesfully saved options.');
					}
				},
				dataType: 'json'
			});
		}
	}
	

	/*
	this.processLogin = function(data) {
		//$('#userManager_dropDown_loggedIn_false .loadingIcon').hide();
		$('#userManager_dropDown_loggedIn_false .logIn').attr('disabled', false);
		if (data.error) {
			$('#userManager_dropDown_loggedIn_false .logInError').text(data.errorMessages.general);
			$('#userManager_dropDown_loggedIn_false .logInError').show();
		}
		else {
			this.loggedIn(data.userData);
		}
	}
	
	this.processResult = function(data) {
		$('#' + this.userManagerModal.domId + ' .loadingIcon').hide();
		$('#' + this.userManagerModal.domId + ' .submitButton').attr('disabled', false);
		
		if (!data.error) {
			alert(data.successMessage);
			this.userManagerModal.hide();
			if (typeof data.userData != 'undefined') {
				this.loggedIn(data.userData);
			}
		}
		else {
			$('#' + this.userManagerModal.domId + ' .formError').hide(); //Hide all
			for (var field in data.errorMessages) {
				//unhide one by one as needed
				$('#' + this.userManagerModal.domId + ' .' + field).html('<br/>' + data.errorMessages[field]);
				$('#' + this.userManagerModal.domId + ' .' + field).show();
			}
		}
	}
	*/
	
	this.construct();
}
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var animationSpeed = 'fast';
	var horizontalButtonSelector = '.addDocumentToolbarButton_viewPortsSplitHorizontally';
	var verticalButtonSelector = '.addDocumentToolbarButton_viewPortsSplitVertically';
	var buttonSelectedClass = 'topToolbarSelected';
	var buttonUnselectedClass = 'topToolbarUnselected';
	
	viewPorts = function(gui) {
		var multiViewHandler = gui.modelviews;
		var isSplitHorizontally = false;
		var isSplitVertically = false;
		var isResizing = false;
		var self = this;
		
		var construct = function() {
			multiViewHandler.addModelView('modelViewTopLeft', 'top');
			$('.modelViewTopLeft').css({width: '100%', height: '100%'});
		}
		
		this.ToggleSplitHorizontally = function() {
			if (isResizing) return;
			isResizing = true;
			
			if (isSplitHorizontally) {
				isSplitHorizontally = false;
				mergeHorizontally();
			}
			else {
				isSplitHorizontally = true;
				splitHorizontally();
			}
		}
		
		this.ToggleSplitVertically = function() {
			if (isResizing) return;
			isResizing = true;
			
			if (isSplitVertically) {
				isSplitVertically = false;
				mergeVertically();
			}
			else {
				isSplitVertically = true;
				splitVertically();
			}
		}
		
		var mergeHorizontally = function() {
			if (isSplitVertically) {
				$('.modelViewTopLeft,.modelViewBottomLeft').animate(
					{width: '100%'},
					animationSpeed
				);

				$('.modelViewTopRight,.modelViewBottomRight').animate(
					{width: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewTopRight');
						multiViewHandler.removeModelView('modelViewBottomRight');
						$(horizontalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
			else {
				$('.modelViewTopLeft').animate(
					{width: '100%'},
					animationSpeed
				);

				$('.modelViewTopRight').animate(
					{width: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewTopRight');
						$(horizontalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
		}
		
		var splitHorizontally = function() {
			$(horizontalButtonSelector)
				.removeClass(buttonUnselectedClass)
				.addClass(buttonSelectedClass);

			if (isSplitVertically) {
				multiViewHandler.addModelView('modelViewTopRight', 'side');
				multiViewHandler.addModelView('modelViewBottomRight', 'side');
				$('.modelViewTopRight,.modelViewBottomRight').css({width: '0', height: '50%'});
				
				$('.modelViewTopLeft,.modelViewTopRight,.modelViewBottomLeft,.modelViewBottomRight').animate(
					{width: '50%', height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
			else {
				multiViewHandler.addModelView('modelViewTopRight', 'side');
				$('.modelViewTopRight').css({width: '0', height: '100%'});
				
				$('.modelViewTopRight,.modelViewTopLeft').animate(
					{width: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
		}
		
		var mergeVertically = function() {
			if (isSplitHorizontally) {
				$('.modelViewTopLeft,.modelViewTopRight').animate(
					{height: '100%'},
					animationSpeed
				);

				$('.modelViewBottomLeft,.modelViewBottomRight').animate(
					{height: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewBottomLeft');
						multiViewHandler.removeModelView('modelViewBottomRight');
						$(verticalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
			else {
				$('.modelViewTopLeft').animate(
					{height: '100%'},
					animationSpeed
				);

				$('.modelViewBottomLeft').animate(
					{height: 0},
					animationSpeed,
					function() {
						multiViewHandler.removeModelView('modelViewBottomLeft');
						$(verticalButtonSelector)
							.removeClass(buttonSelectedClass)
							.addClass(buttonUnselectedClass);
						isResizing = false;
					}
				);
			}
		}
		
		var splitVertically = function() {
			$(verticalButtonSelector)
				.removeClass(buttonUnselectedClass)
				.addClass(buttonSelectedClass);
			
			if (isSplitHorizontally) {
				multiViewHandler.addModelView('modelViewBottomLeft', 'top');
				multiViewHandler.addModelView('modelViewBottomRight', 'side');
				$('.modelViewBottomLeft,.modelViewBottomRight').css({width: '50%', height: '0'});
				
				$('.modelViewTopLeft,.modelViewTopRight,.modelViewBottomLeft,.modelViewBottomRight').animate(
					{height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
			else {
				multiViewHandler.addModelView('modelViewBottomLeft', 'top');
				$('.modelViewBottomLeft').css({width: '100%', height: '0'});
				
				$('.modelViewTopLeft,.modelViewBottomLeft').animate(
					{height: '50%'},
					animationSpeed,
					function() { isResizing = false; }
				);
			}
		}
		
		construct();
	}
	
	namespace.viewPorts = viewPorts;
}());
; 
com.mordritch.mcSim.submitFeedback = function(gui) {
	var self = this; 
	var L10n = gui.localization;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		modal.addButton({
			label: L10n.getString("button.text.ok"),
			onActivateFunction: function() {
				submitForm();
			}
		});
		$('#feedbackAndComments').text(L10n.getString("submitfeedback.buttontext"));
		$('#feedbackAndComments').on('click', function() {
			self.show();
		});
	}
	
	var submitForm = function() {
		$.ajax({
			type: 'POST',
			url: 'php/submitFeedback.php',
			dataType: 'json',
			data: {
				email: $('#submitFeedback_email').val(),
				message: $('#submitFeedback_message').val(),
				magic: true
			},
			success: function(data) {
				alert(L10n.getString("submitfeedback.success"));
				modal.hide();
			}
		});
	}
	
	var populateForm = function() {
		modal.setContent(
			'<div class="submitFeedback standardForm">' +
				'<p><b>'+L10n.getString("submitfeedback.title")+'</b></p>' +
				
				'<p>'+L10n.getString('submitfeedback.body') +'</p>' +

				'<p>'+L10n.getString('submitfeedback.email') +'<br/>' +
				'<input type="text" class="text" id="submitFeedback_email" value=""></p>' +
				
				'<p>'+L10n.getString('submitfeedback.message') +'<br/>' +
				'<textarea id="submitFeedback_message"></textarea></p>' +
			'</div>');
			
		if (gui.userManager.authenticated) {
			$('#submitFeedback_email').val(gui.userManager.userData.emailAddress);
		}
	}	
	
	this.show = function() {
		populateForm();
		modal.show();
		$('#submitFeedback_email').focus();
	}
	
	construct();
	
}
	
; 
(function(){
var namespace = com.mordritch.mcSim;
var funcName = "blockHelper_Sign";

namespace[funcName] = function(gui) {
	var L10n = gui.localization;
	var latestEventDetails = null;
	var currentBlock = null;
	var modal = new com.mordritch.mcSim.guiFullModal(gui);
	
	var construct = function() {
		bindToEvents();

		modal.addButton({
			label: L10n.getString("button.text.ok"),
			onActivateFunction: function() {
				applyChanges();
			}
		});
	}
	
	var bindToEvents = function() {
		
		gui.mcSim.Block.signPost.on("toggleBlock", function(e) {
			toggle(e);
		});
		
		gui.mcSim.Block.signWall.on("toggleBlock", function(e) {
			toggle(e);
		});
	}
	
	var toggle = function(eventDetails) {
		latestEventDetails = eventDetails;
		showEditor();
	}
	
	var applyChanges = function() {
		var entity = latestEventDetails.entity;
		var world = latestEventDetails.world;
		var posX = entity.xCoord;
		var posY = entity.yCoord;
		var posZ = entity.zCoord;
		
		entity.text[0] = $('#signHelper_text1').val();
		entity.text[1] = $('#signHelper_text2').val();
		entity.text[2] = $('#signHelper_text3').val();
		entity.text[3] = $('#signHelper_text4').val();
		
		modal.hide();
		console.log("doing");
		
		world.markBlockNeedsUpdate(posX, posY, posZ);
		gui.modelviews.flushMarkedBlocks();
	}
	
	var showEditor = function() {
		var entity = latestEventDetails.entity;
		
		modal.setContent(
			'<b>'+L10n.getString('blockhelper.sign.heading')+'</b></br></br></br>' +
			'<div id="signHelper">' +
				'<input type="text" id="signHelper_text1" maxlength="15"></br>' + 
				'<input type="text" id="signHelper_text2" maxlength="15"></br>' + 
				'<input type="text" id="signHelper_text3" maxlength="15"></br>' + 
				'<input type="text" id="signHelper_text4" maxlength="15"></br>' +
				'</br></br>' +
				 L10n.getString('blockhelper.sign.hint')+
			'</div>'
		);
		
		$('#signHelper_text1').val(entity.text[0]);
		$('#signHelper_text2').val(entity.text[1]);
		$('#signHelper_text3').val(entity.text[2]);
		$('#signHelper_text4').val(entity.text[3]);
		
		modal.show();
	} 
	
	construct();
}})();
; 
com.mordritch.mcSim.toolHandler = function(gui) {
	this.gui = gui;
	this.lastMaterialPlacedCoords = {x: "-", y: "-", z: "-"};
	this.infoModal = new com.mordritch.mcSim.guiFullModal(gui);
	this.lastMaterialPlacedAt = {x: null, y: null, z: null};
	
	this.activeTool = "toggle";
	
	this.construct = function() {
		var t = this;
		this.gui.input.bindInputEvent({
			savedKeyName: 'tool_primary',
			category: 'tools',
			description: 'shortcuts.tools.primary',
			callbackFunction: function(e) {t.onPrimaryInput(e);},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.onPrimaryInput_mouseMove(e);}
		});
		this.gui.input.bindInputEvent({
			savedKeyName: 'tool_secondary',
			category: 'tools',
			description: 'shortcuts.tools.secondary', 
			callbackFunction: function(e) {t.onSecondaryInput(e);},
			bindToMouseMove: true,
			callbackFunction_mouseMove: function(e) {t.onSecondaryInput_mouseMove(e);}
		});
	}
	
	this.onPrimaryInput = function(e) {
		switch (this.activeTool) {
			case "material":
				var materialData = this.gui.toolbars.getMaterialData();
				this.placeMaterial(e, false, materialData.blockId, materialData.blockMetadata);
				break;
			case "pan":
				this.pan(e, false);
				break;
			case "toggle":
				this.toggleBlock(e, false);
				break;
			case "rotateBlock":
				this.rotateBlock(e, false);
				break;
			case "deleteBlock":
				this.placeMaterial(e, false, 0, 0);
				break;
			case "blockInfo":
				this.blockInfo(e);
				break;
		}
	}
	
	this.onPrimaryInput_mouseMove = function(e) {
		switch (this.activeTool) {
			case "material":
				var materialData = this.gui.toolbars.getMaterialData();
				this.placeMaterial(e, true, materialData.blockId, materialData.blockMetadata);
				break;
			case "pan":
				this.pan(e, true);
				break;
			case "deleteBlock":
				this.placeMaterial(e, true, 0, 0);
				break;
		}
	}

	this.onSecondaryInput = function(e) {
		switch (this.activeTool) {
			case "material":
				this.placeMaterial(e, false, 0, 0); //Right click deletes the block
				break;
			case "pan":
				this.pan(e, false);
				break;
			case "toggle":
				this.blockInfo(e);
				//this.toggleBlock(e, false);
				break;
			case "rotateBlock":
				this.rotateBlock(e, false);
				break;
			case "deleteBlock":
				this.placeMaterial(e, false, 0, 0);
				break;
		}
	}
	
	this.onSecondaryInput_mouseMove = function(e) {
		switch (this.activeTool) {
			case "material":
				this.placeMaterial(e, true, 0, 0); //Right click deletes the block
				break;
			case "pan":
				this.pan(e, true);
				break;
			case "deleteBlock":
				this.placeMaterial(e, true, 0, 0);
				break;
		}
	}
	
	this.setBlockData = function(x, y, z, blockId, blockMetadata) {
		var block = this.gui.mcSim.Block.blocksList[blockId];
		var world = this.gui.mcSim.World;
		if (block.canPlaceBlockAt(world, x, y, z)) {
			world.setBlockAndMetadataWithNotify(x, y, z, blockId, blockMetadata);
			block.onBlockPlaced(world, x, y, z);
		}
		else {
			console.log(
				"setBlockData(): canPlaceBlockAt failed at x:%s, y:%s, z:%s, blockId: %s, blockMetadata: %s",
				x,
				y,
				z,
				blockId,
				blockMetadata
			)
		}
	}
	
	this.pan = function(e, onMousemove) {
		if (!onMousemove) {
			this.gui.modelviews.pan_start(e);
		}
		else {
			this.gui.modelviews.pan_onMouseMove(e);
		}
	}
	
	this.placeMaterial = function(e, triggeredByMouseMove, blockId, blockMetadata) {
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (
			coords != false &&
			(
				!triggeredByMouseMove || 
				!(
					this.lastMaterialPlacedAt.x == coords.x &&
					this.lastMaterialPlacedAt.y == coords.y &&
					this.lastMaterialPlacedAt.z == coords.z
				)
			)
		) {
			this.lastMaterialPlacedAt = coords;
			
			//TODO: Make multilayer editing optional
			//For multilayer editing, if the current level is a solid block, we action the layer above
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x1, coords.y1, coords.z1);

			//Try place block in above layer, then current layer
			if (blockCurrentLayer.renderAsNormalBlock() && blockAboveLayer.blockID == 0 && blockId != 0) {
				this.setBlockData(coords.x1, coords.y1, coords.z1, blockId, blockMetadata);
			}
			else if (blockCurrentLayer.blockID == 0 && blockId != 0) {
				this.setBlockData(coords.x, coords.y, coords.z, blockId, blockMetadata);
			}

			//Try place air in above layer, then current layer
			else if (blockId == 0 && blockAboveLayer.blockID != 0) {
				this.setBlockData(coords.x1, coords.y1, coords.z1, blockId, blockMetadata);
			}
			else if (blockId == 0 && blockCurrentLayer.blockID != 0) {
				this.setBlockData(coords.x, coords.y, coords.z, blockId, blockMetadata);
			}
			
			//Try rotate block in above layer, then current layer
			else if (blockCurrentLayer.renderAsNormalBlock() &&
				(
					(blockAboveLayer.blockID == blockId && blockId != 0) ||
					(blockAboveLayer.sameBlockTypeAs(blockId))
				)
			) {
				blockAboveLayer.rotateBlock(world, coords.x1, coords.y1, coords.z1);
			}
			else if (
				blockId != 0 && (
					blockCurrentLayer.blockID == blockId ||
					blockCurrentLayer.sameBlockTypeAs(blockId)
				)
			) {
				blockCurrentLayer.rotateBlock(world, coords.x, coords.y, coords.z);
			}
			
			else {
				console.log(
					"placeMaterial(): Could not place block %s, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					blockId,
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				)
			}
		}
		
		this.gui.modelviews.markBlockNeedsUpdate(coords.x, coords.y, coords.z);
		this.gui.modelviews.flushMarkedBlocks();
	}

	this.toggleBlock = function(e, triggeredByMouseMove) {
		if (triggeredByMouseMove) return;
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (coords != false) {
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x1, coords.y1, coords.z1);
			if (!blockCurrentLayer.renderAsNormalBlock() && blockCurrentLayer.blockID != 0) {
				blockCurrentLayer.toggleBlock(world, coords.x, coords.y, coords.z);
			}
			else if (blockAboveLayer.blockID != 0) {
				blockAboveLayer.toggleBlock(world, coords.x1, coords.y1, coords.z1);
			}
			else {
				console.log(
					"toggleBlock(): Could not toggle block, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				)
			}
		}
		this.gui.modelviews.flushMarkedBlocks();
	}
	
	this.rotateBlock = function(e, triggeredByMouseMove) {
		if (triggeredByMouseMove) return;
		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var world = this.gui.mcSim.World;
		
		if (coords != false) {
			var blockCurrentLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);
			var blockAboveLayer = this.gui.mcSim.getBlockObject(coords.x, coords.y+1, coords.z);
			if (!blockCurrentLayer.renderAsNormalBlock() && blockCurrentLayer.blockID != 0) {
				blockCurrentLayer.rotateBlock(world, coords.x, coords.y, coords.z);
			}
			else if (blockAboveLayer.blockID != 0) {
				blockAboveLayer.rotateBlock(world, coords.x1, coords.y1, coords.z1);
			}
			else {
				console.log(
					"rotateBlock(): Could not rotate block, currentLayer (x:%s, y:%s, z:%s) = %s, aboveLayer (x:%s, y:%s, z:%s) = %s",
					coords.x,
					coords.y,
					coords.z,
					blockCurrentLayer.blockID,
					coords.x1,
					coords.y1,
					coords.z1,
					blockAboveLayer.blockID
				)
			}
		}
		this.gui.modelviews.flushMarkedBlocks();
	}
	
	this.blockInfo = function(e) {

		var coords = this.gui.modelviews.getCurrentMouseCoords(e);
		var blockId = this.gui.mcSim.World.getBlockId(coords.x, coords.y, coords.z);
		var blockMetadata = this.gui.mcSim.World.getBlockMetadata(coords.x, coords.y, coords.z);
		var blockTileEntity = this.gui.mcSim.World.getBlockTileEntity(coords.x, coords.y, coords.z);
		var world = this.gui.mcSim.World;
		var block = this.gui.mcSim.getBlockObject(coords.x, coords.y, coords.z);

		if (coords != false) {
			var content =
				'<pre>' +
				'Block ID: ' + blockId + "\n" +
				'Metadata: ' + blockMetadata + "\n";
				
			if (blockTileEntity != null) {
				if (typeof blockTileEntity.loaded_NBT_Data != 'undefined') {
					content += 'Block Tile Entity Data: ' + JSON.stringify(blockTileEntity.loaded_NBT_Data, null, '  ') + "\n";;
				}
				else {
					content += 'Block Tile Entity Data: ' + "\n";
					for (var i in blockTileEntity) {
						if (
							typeof blockTileEntity[i] != "object" &&
							typeof blockTileEntity[i] != "function"
						) {
							content += "  " + i + ' ('+typeof blockTileEntity[i]+'): '+ blockTileEntity[i] + "\n";
						}
					}
				}
			}
			
			if (blockId == 0) {
				content += 'Air has retracting block: ' + (world.getRetractingBlockEntity(coords.x, coords.y, coords.z) != null) + "\n";
			}
			content += block.getBlockInfo(world, coords.x, coords.y, coords.z);
			
			
			
			content +=
				'</pre>';
			this.infoModal.setContent(content);
			this.infoModal.show();
		}
		
	}
	
	this.construct();
}


		/*
		 * Follows is initial attempt at drawing line between coordinates where mouse moved from and to, so you don't land with gaps as
		 * only a limited number of mousemove events can get fired.
		
		
		if (!triggeredByMouseMove) {
			this.lastMaterialPlacedAt = coords;
			this.placeMaterial(coords.x, coords.y, coords.z);
		}
		else {
			if (
				this.lastMaterialPlacedAt.x != coords.x ||
				this.lastMaterialPlacedAt.y != coords.y ||
				this.lastMaterialPlacedAt.z != coords.z
			) {
				//TODO: This won't work on side views, it's also not working on topviews, yet, hence why it's commented out for now :(
				var
					x1 = this.lastMaterialPlacedAt.x,
					x2 = coords.x,
					y1 = this.lastMaterialPlacedAt.z,
					y2 = coords.z;
				
				console.log("x1:"+x1+" x2:"+x2+" y1:"+y1+" y2:"+y2);
				if(x1-x2 == 0) return;
				
				var m = (y1-y2)/(x1-x2);
				var c = y1 - m*x1;
				
				if (x1 > x2) {
					var oldx1 = x1;
					x1 = x2;
					x2 = oldx1;
				}
				
				for (var x=x1; x<=x2; x++) {
					console.log("Trying y = "+m+" * "+x+" + "+c+" : "+(y = m*x + c));
					y = Math.round(m*x + c);
					if (
						this.lastMaterialPlacedAt.x != x ||
						this.lastMaterialPlacedAt.y != coords.y ||
						this.lastMaterialPlacedAt.z != y
					) {
						
						this.lastMaterialPlacedAt = {x: x, y: coords.y, z: y};
						this.placeMaterial(x, coords.y, y);
					}
				}
				
			}
		}
		this.gui.modelviews.flushMarkedBlocks();

		return;
		*/
	
; 
/**
 * Mostly replicates behaviour of the Block object from the game's source code.
 */
com.mordritch.mcSim.Block = function() {
	this.blocksList = new Array();
	
	this.blockDefinitions = {
		unknown: {
			blockID: -1,
			className: "BlockType__Unknown",
			blockName: "unknown",
			material: "rock"
		},
		air: {
			blockID: 0,
			className: "BlockType_Air",
			blockName: "air",
			material: "air"
		},
		stone: {
			blockID: 1,
			className: "BlockType_Stone",
			blockName: "stone",
			textureblockID: 1,
			hardness: 1.5,
			resistance: 10
		},
		grass: {
			blockID: 2,
			className: "BlockType_Grass",
			blockName: "grass",
			hardness: 0.6
		},
		dirt: {
			blockID: 3,
			className: "BlockType_Dirt",
			blockName: "dirt",
			textureblockID: 2,
			hardness: 0.5
		},
		cobblestone: {
			blockID: 4,
			className: "BlockType_Block",
			blockName: "stonebrick",
			textureblockID: 16,
			material: "rock",
			hardness: 2.0
		},
		planks: {
			blockID: 5,
			className: "BlockType_Block",
			blockName: "wood",
			hardness: 2.0,
			material: "wood",
			requiresSelfNotify: true
		},
		sapling: {
			blockID: 6,
			className: "BlockType_Sapling",
			blockName: "sapling",
			requiresSelfNotify: true
		},
		bedrock: {
			blockID: 7,
			className: "BlockType_Block",
			blockName: "bedrock",
			unbreakable: true,
			material: "rock"
		},
		waterMoving: {
			blockID: 8,
			className: "BlockType_Flowing",
			blockName: "water",
			material: "water",
			requiresSelfNotify: true
		},
		waterStill: {
			blockID: 9,
			className: "BlockType_Stationary",
			blockName: "water",
			material: "water",
			requiresSelfNotify: true
		},
		lavaMoving: {
			blockID: 10,
			className: "BlockType_Flowing",
			blockName: "lava",
			material: "lava",
			requiresSelfNotify: true
		},
		lavaStill: {
			blockID: 11,
			className: "BlockType_Stationary",
			blockName: "lava",
			material: "lava",
			requiresSelfNotify: true
		},
		sand: {
			blockID: 12,
			className: "BlockType_Sand",
			blockName: "sand"
		},
		gravel: {
			blockID: 13,
			className: "BlockType_Gravel",
			blockName: "gravel"
		},
		oreGold: {
			blockID: 14,
			className: "BlockType_Ore",
			blockName: "oreGold"
		},
		oreIron: {
			blockID: 15,
			className: "BlockType_Ore",
			blockName: "oreIron"
		},
		oreCoal: {
			blockID: 16,
			className: "BlockType_Ore",
			blockName: "oreCoal"
		},
		wood: {
			blockID: 17,
			className: "BlockType_Log",
			blockName: "log",
			requiresSelfNotify: true
		},
		leaves: {
			blockID: 18,
			className: "BlockType_Leaves",
			blockName: "leaves",
			requiresSelfNotify: true
		},
		sponge: {
			blockID: 19,
			className: "BlockType_Sponge",
			blockName: "sponge"
		},
		glass: {
			blockID: 20,
			className: "BlockType_Glass",
			blockName: "glass",
			material: "glass"
		},
		oreLapis: {
			blockID: 21,
			className: "BlockType_Ore",
			blockName: "oreLapis"
		},
		blockLapis: {
			blockID: 22,
			className: "BlockType_Block",
			blockName: "blockLapis",
			material: "rock"
		},
		dispenser: {
			blockID: 23,
			className: "BlockType_Dispenser",
			blockName: "dispenser",
			requiresSelfNotify: true
		},
		sandStone: {
			blockID: 24,
			className: "BlockType_SandStone",
			blockName: "sandStone"
		},
		music: {
			blockID: 25,
			className: "BlockType_Note",
			blockName: "musicBlock",
			hardness: 0.8
		},
		bed: {
			blockID: 26,
			className: "BlockType_Bed",
			blockName: "bed",
			hardness: 0.2
		},
		railPowered: {
			blockID: 27,
			className: "BlockType_Rail",
			blockName: "goldenRail",
			requiresSelfNotify: true
		},
		railDetector: {
			blockID: 28,
			className: "BlockType_DetectorRail",
			blockName: "detectorRail",
			requiresSelfNotify: true
		},
		pistonStickyBase: {
			blockID: 29,
			className: "BlockType_PistonBase",
			blockName: "pistonStickyBase",
			requiresSelfNotify: true
		},
		web: {
			blockID: 30,
			className: "BlockType_Web",
			blockName: "web",
			textureblockID: 11,
			hardness: 4
		},
		tallGrass: {
			blockID: 31,
			className: "BlockType_TallGrass",
			blockName: "tallgrass"
		},
		deadBush: {
			blockID: 32,
			className: "BlockType_DeadBush",
			blockName: "deadbush"
		},
		pistonBase: {
			blockID: 33,
			className: "BlockType_PistonBase",
			blockName: "pistonBase",
			requiresSelfNotify: true
		},
		pistonExtension: {
			blockID: 34,
			className: "BlockType_PistonExtension",
			textureblockID: 107,
			requiresSelfNotify: true
		},
		cloth: {
			blockID: 35,
			className: "BlockType_Cloth",
			blockName: "cloth"
		},
		pistonMoving: {
			blockID: 36,
			className: "BlockType_PistonMoving"
		},
		plantYellow: {
			blockID: 37,
			className: "BlockType_Flower",
			blockName: "flower"
		},
		plantRed: {
			blockID: 38,
			className: "BlockType_Flower",
			blockName: "rose"
		},
		mushroomBrown: {
			blockID: 39,
			className: "BlockType_Mushroom",
			blockName: "mushroom"
		},
		mushroomRed: {
			blockID: 40,
			className: "BlockType_Mushroom",
			blockName: "mushroom"
		},
		blockGold: {
			blockID: 41,
			className: "BlockType_OreStorage",
			blockName: "blockGold"
		},
		blockSteel: {
			blockID: 42,
			className: "BlockType_OreStorage",
			blockName: "blockIron"
		},
		stairDouble: {
			blockID: 43,
			className: "BlockType_Step",
			blockName: "stairDouble"
		},
		stairSingle: {
			blockID: 44,
			className: "BlockType_Step", //slabs
			blockName: "stairSingle"
		},
		brick: {
			blockID: 45,
			className: "BlockType_Block",
			blockName: "brick",
			material: "rock"
		},
		tnt: {
			blockID: 46,
			className: "BlockType_TNT",
			blockName: "tnt"
		},
		bookShelf: {
			blockID: 47,
			className: "BlockType_Bookshelf",
			blockName: "bookshelf"
		},
		cobblestoneMossy: {
			blockID: 48,
			className: "BlockType_Block",
			blockName: "stoneMoss",
			material: "rock"
		},
		obsidian: {
			blockID: 49,
			className: "BlockType_Obsidian",
			blockName: "obsidian"
		},
		torchWood: {
			blockID: 50,
			className: "BlockType_Torch",
			blockName: "torch",
			requiresSelfNotify: true
		},
		fire: {
			blockID: 51,
			className: "BlockType_Fire",
			blockName: "fire"
		},
		mobSpawner: {
			blockID: 52,
			className: "BlockType_MobSpawner",
			blockName: "mobSpawner"
		},/*
		stairCompactPlanks: {
			blockID: 53,
			className: "BlockType_Stairs",
			blockName: "stairsWood",
			modelBlock: "planks",
			requiresSelfNotify: true
		},*/
		chest: {
			blockID: 54,
			className: "BlockType_Chest",
			blockName: "chest",
			requiresSelfNotify: true
		},
		redstoneWire: {
			blockID: 55,
			className: "BlockType_RedstoneWire",
			blockName: "redstoneDust",
			requiresSelfNotify: true
		},
		oreDiamond: {
			blockID: 56,
			className: "BlockType_Ore",
			blockName: "oreDiamond"
		},
		blockDiamond: {
			blockID: 57,
			className: "BlockType_OreStorage",
			blockName: "blockDiamond"
		},
		workbench: {
			blockID: 58,
			className: "BlockType_Workbench",
			blockName: "workbench"
		},
		crops: {
			blockID: 59,
			className: "BlockType_Crops",
			blockName: "crops",
			requiresSelfNotify: true
		},
		tilledField: {
			blockID: 60,
			className: "BlockType_Farmland",
			blockName: "farmland",
			requiresSelfNotify: true
		},
		stoneOvenIdle: {
			blockID: 61,
			className: "BlockType_Furnace",
			blockName: "furnace",
			requiresSelfNotify: true
		},
		stoneOvenActive: {
			blockID: 62,
			className: "BlockType_Furnace",
			blockName: "furnace",
			requiresSelfNotify: true
		},
		signPost: {
			blockID: 63,
			className: "BlockType_Sign",
			blockName: "sign",
			material: "wood",
			requiresSelfNotify: true
		},
		doorWood: {
			blockID: 64,
			className: "BlockType_Door",
			blockName: "doorWood",
			material: "wood",
			requiresSelfNotify: true
		},
		ladder: {
			blockID: 65,
			className: "BlockType_Ladder",
			blockName: "ladder",
			requiresSelfNotify: true
		},
		rail: {
			blockID: 66,
			className: "BlockType_Rail",
			blockName: "rail",
			requiresSelfNotify: true
		},/*
		stairCompactCobblestone: {
			blockID: 67,
			className: "BlockType_Stairs",
			blockName: "stairsStone",
			modelBlock: "cobblestone",
			requiresSelfNotify: true
		},*/
		signWall: {
			blockID: 68,
			className: "BlockType_Sign",
			blockName: "sign",
			material: "wood",
			requiresSelfNotify: true
		},
		lever: {
			blockID: 69,
			className: "BlockType_Lever",
			blockName: "lever",
			requiresSelfNotify: true
		},
		pressurePlateStone: {
			blockID: 70,
			className: "BlockType_PressurePlate",
			blockName: "pressurePlate",
			material: "rock",
			requiresSelfNotify: true,
			renderAsNormalBlock: false
		},
		doorSteel: {
			blockID: 71,
			className: "BlockType_Door",
			blockName: "doorIron",
			material: "iron",
			requiresSelfNotify: true
		},
		pressurePlatePlanks: {
			blockID: 72,
			className: "BlockType_PressurePlate",
			blockName: "pressurePlate",
			material: "wood",
			requiresSelfNotify: true,
			renderAsNormalBlock: false
		},
		oreRedstone: {
			blockID: 73,
			className: "BlockType_RedstoneOre",
			blockName: "oreRedstone",
			requiresSelfNotify: true
		},
		oreRedstoneGlowing: {
			blockID: 74,
			className: "BlockType_RedstoneOre",
			blockName: "oreRedstone",
			requiresSelfNotify: true
		},
		torchRedstoneIdle: {
			blockID: 75,
			className: "BlockType_RedstoneTorch",
			blockName: "notGate",
			requiresSelfNotify: true
		},
		torchRedstoneActive: {
			blockID: 76,
			className: "BlockType_RedstoneTorch",
			blockName: "notGate",
			requiresSelfNotify: true
		},
		button: {
			blockID: 77,
			className: "BlockType_Button",
			blockName: "button",
			requiresSelfNotify: true
		},
		snow: {
			blockID: 78,
			className: "BlockType_Snow",
			blockName: "snow"
		},
		ice: {
			blockID: 79,
			className: "BlockType_Ice",
			blockName: "ice"
		},
		blockSnow: {
			blockID: 80,
			className: "BlockType_SnowBlock",
			blockName: "snow"
		},
		cactus: {
			blockID: 81,
			className: "BlockType_Cactus",
			blockName: "cactus"
		},
		blockClay: {
			blockID: 82,
			className: "BlockType_Clay",
			blockName: "clay"
		},
		reed: {
			blockID: 83,
			className: "BlockType_Reed",
			blockName: "reeds"
		},
		jukebox: {
			blockID: 84,
			className: "BlockType_JukeBox",
			blockName: "jukebox",
			requiresSelfNotify: true
		},
		fence: {
			blockID: 85,
			className: "BlockType_Fence",
			blockName: "fence"
		},
		pumpkin: {
			blockID: 86,
			className: "BlockType_Pumpkin",
			blockName: "pumpkin",
			requiresSelfNotify: true
		},
		netherrack: {
			blockID: 87,
			className: "BlockType_Netherrack",
			blockName: "hellrock"
		},
		slowSand: {
			blockID: 88,
			className: "BlockType_SoulSand",
			blockName: "hellsand"
		},
		glowStone: {
			blockID: 89,
			className: "BlockType_GlowStone",
			blockName: "lightgem",
			material: "glass"
		},
		portal: {
			blockID: 90,
			className: "BlockType_Portal",
			blockName: "portal"
		},
		pumpkinLantern: {
			blockID: 91,
			className: "BlockType_Pumpkin",
			blockName: "litpumpkin",
			requiresSelfNotify: true
		},
		cake: {
			blockID: 92,
			className: "BlockType_Cake",
			blockName: "cake",
			requiresSelfNotify: true
		},
		redstoneRepeaterIdle: {
			blockID: 93,
			className: "BlockType_RedstoneRepeater",
			blockName: "diode",
			requiresSelfNotify: true
		},
		redstoneRepeaterActive: {
			blockID: 94,
			className: "BlockType_RedstoneRepeater",
			blockName: "diode",
			requiresSelfNotify: true
		},
		lockedChest: {
			blockID: 95,
			className: "BlockType_LockedChest",
			blockName: "lockedchest",
			requiresSelfNotify: true
		},
		trapdoor: {
			blockID: 96,
			className: "BlockType_TrapDoor",
			blockName: "trapdoor",
			material: "wood",
			requiresSelfNotify: true
		},
		/*
		silverfish: {
			blockID: 97,
			className: "BlockType_Silverfish",
			blockName: "silverfish",
			hardness: 0.7
		},*/
		stoneBrick: {
			blockID: 98,
			className: "BlockType_StoneBrick",
			blockName: "stonebricksmooth"
		},/*
		stoneBrick: {
			blockID: 99,
			className: "BlockType_HugeBrownMushroom",
			blockName: "stoneBrick",
			material: "wood"
		},
		: {
			blockID: 100,
			material: "wood",
			className: BlockType_HugeRedMushroom
		},
		: {
			blockID: 101,
			material: "iron",
			className: BlockType_IronBars
		},
		: {
			blockID: 102,
			material: "glass",
			className: BlockType_GlassPane
		},
		: {
			blockID: 103,
			className: BlockType_Melon
		},
		: {
			blockID: 104,
			className: BlockType_StemPumpkin
		},
		: {
			blockID: 105,
			className: BlockType_StemMelon
		},
		: {
			blockID: 106,
			className: BlockType_Vines
		},
		*/
		fenceGate: {
			blockID: 107,
			className: "BlockType_FenceGate",
			blockName: "fenceGate",
			material: "rock",
			requiresSelfNotify: false
		},/*
		stairsBrick: {
			blockID: 108,
			className: "BlockType_Stairs",
			blockName: "stairsBrick",
			modelBlock: "brick"
		},
		stairsStoneBrickSmooth: {
			blockID: 109,
			className: "BlockType_Stairs",
			blockName: "stairsStoneBrickSmooth",
			modelBlock: "stoneBrick"
		},
		: {
			blockID: 110,
			className: BlockType_Mycelium
		},
		: {
			blockID: 111,
			className: BlockType_LilyPad
		},
		: {
			blockID: 112,
			material: "rock",
			className: BlockType_NetherBrick
		},*/
		netherFence: {
			blockID: 113,
			material: "rock",
			blockName: "netherFence",
			className: "BlockType_Fence"
		},/*
		stairsNetherBrick: {
			blockID: 114,
			className: "BlockType_Stairs",
			blockName: "stairsNetherBrick",
			modelBlock: "netherBrick"
		},
		: {
			blockID: 115,
			className: BlockType_NetherWart
		},
		: {
			blockID: 116,
			className: BlockType_EnchantmentTable
		},
		: {
			blockID: 117,
			className: BlockType_BrewingStand
		},
		: {
			blockID: 118,
			className: BlockType_Cauldron
		},
		: {
			blockID: 119,
			material: "portal",
			className: BlockType_EndPortal
		},
		: {
			blockID: 120,
			className: BlockType_EndPortalFrame
		},
		: {
			blockID: 121,
			material: "rock",
			className: BlockType_EndStone
		},
		: {
			blockID: 122,
			className: BlockType_DragonEgg
		},*/
		redstoneLampIdle: {
			blockID: 123,
			blockName: "redstoneLight",
			className: "BlockType_RedstoneLight"
		},
		redstoneLampActive: {
			blockID: 124,
			blockName: "redstoneLight",
			className: "BlockType_RedstoneLight"
		}
	}

	this.construct = function() {
		this.loadBlockTypes();
	}
	
	/**
	 * Iterates through the BlockList object and tries to load each block type
	 */
	this.loadBlockTypes = function() {
		var className;
		var loadedCount = 0;
		var blockDefinition;
		
		for (var blockType in this.blockDefinitions) {
			blockDefinition = this.blockDefinitions[blockType];
			className = blockDefinition.className;
			blockID = blockDefinition.blockID;
			
			
			//this.consoleOut(typeof window[className]+" "+className);
			if (!(typeof com.mordritch.mcSim[className] == "undefined")) {
				this[blockType] = new com.mordritch.mcSim[className]();
				this[blockType]._construct(blockType, blockID, blockDefinition, this);
				this.blocksList[blockID] = this[blockType];
				loadedCount++;
				//this.consoleOut("Loaded block ID "+BlocksList[blockType].blockID+" \""+ blockType +"\" of type \"" + className + "\".");
				//if (this[blockType].renderAsNormalBlock()) console.log(blockType);
			}
			else {
				this[blockType] = new com.mordritch.mcSim.BlockType__Unknown();
				this[blockType]._construct(blockType, blockID, blockDefinition, this);
				
				this.blocksList[blockID] = this[blockType];
				//this.consoleOut("Could not load block ID "+blockID+" \""+ blockType +"\" of type \"" + className + "\".");
			}
			
			
		}


		blockDefinition = this.blockDefinitions.unknown;
		for (var i = 0; i < 128; i++) {
			
			if (typeof this.blocksList[i] == 'undefined') {
				blockType = "unknown_" + i;
				blockID = i;
				this[blockType] = new com.mordritch.mcSim.BlockType__Unknown();
				this[blockType]._construct(blockType, blockID, blockDefinition);
				this.blocksList[blockID] = this[blockType];
			}
		}


		return "Loaded "+loadedCount+" block types.";
	}
	
	this.construct();
}
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var funcName = "BlockType__Default";
	
	namespace[funcName] = function() {};
	var proto = namespace[funcName].prototype;

	proto.material = "";
	
	/**
	 * Manually called just after "new" keyword is used to instantiate the object 
	 * 
	 * Because Javascript doesn't have true class inheritance, there is no "constructor" function,
	 * instead, this is called manually to complete initiation of the instantiated block type.
	 * 
	 * @param {Object}	blockType 
	 */
	proto._construct = function(blockType, blockID, blockDefinition, Block) {
		this.facing = new com.mordritch.mcSim.facing(); //A collection direction maps TODO: consider having this reside in the Block object, more relevant there
		this.drawIconBlockMetadataOveride = 0; //Used by the drawicon function, if we don't want block icons to be generated for Metadata 0, we can override it per block by setting up this value 
		
		this.blockType = blockType;
		this.blockID = blockID;
		this.blockName = blockDefinition.blockName;
		this.className = blockDefinition.blockName;
		
		this.tickOnLoad = false;
		this._renderAsNormalBlock = true;
		
		if (typeof blockDefinition.material != "undefined") {
			this.setBlockMaterial(blockDefinition.material);
		}
		else if (typeof this.material != "undefined") {
			this.setBlockMaterial(this.material);
		}
		
		this.construct(blockType, blockID, blockDefinition, Block);
	}
	
	proto.setBlockMaterial = function(material) {
		this.blockMaterial = namespace.Material[material];
	}
	
	proto.renderAsNormalBlock = function() {
		return this._renderAsNormalBlock;
	}
	
	/**
	 * When one is inspecting block info, blocks can choose to show extra data here. 
	 */
	proto.getBlockInfo = function(world, posX, posY, posZ) {
		return "No extra block info provided.";
	}
	
	/**
	 * Block specific constructor, can be implemented by inherited blocks, called automatically by
	 * this._construct();
	 */
	proto.construct = function() {
		
	}
	
	/**
	 * Used to rotate the entire world or a selection of blocks, torches for example can have their metadata updated appropriately
	 * 
	 * Accepts amount of times to rotate the block 90 degrees clockwise, so, to rotate it 180 degress clockwise, the amount would be 2, 270 would be 3
	 * 
	 * Returns updated block metadata for the new rotation
	 */
	proto.rotateSelection = function(blockMetadata, amount) {
		return blockMetadata;
	}
	
	/**
	 * Is the block solid?
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 * @return {Boolean}
	 */
	proto.getIsBlockSolid = function(world, posX, posY, posZ) {
		return this.isSolid;
	}
	
	/**
	 * Called when a block has been queued to update at a cetain tick
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.updateTick = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Called when the block is destroyed by a player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.onBlockDestroyedByPlayer = function(world, posX, posY, posZ) {
	
	}
	
	/**
	 * Called when the block is destroyed by a player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} blockID	The block ID which triggered the event 
	 * 
	 */
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, blockID) {
		
	}
	
	/**
	 * Called when "block is added to the world"?
	 * 
	 * I am assuming it's called when for example sand falls, pistons put down their moved blocks
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.onBlockAdded = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Checks to see if its valid to put this block at the specified coordinates
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
        var blocksList = world.Block.blocksList;
        
        var blockId = world.getBlockId(posX, posY, posZ);
        return blockId == 0 || blocksList[blockId].blockMaterial.isGroundCover();
	}
	
	/**
	 * Used by the place block tool as an additional way to compare if block types match for purposes of rotating
	 * the block. For example, signs use this to compare wall signs and sign posts as a match even though their IDs
	 * are different.  
	 */
	proto.sameBlockTypeAs = function(blockId) {
		return false;
	}
	
	/**
	 * Called when block is removed from the world, but not when destroyed by player
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} a		Unknown paramater from minecraft source
	 * 
	 */
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
	
	}
	
	/**
	 * I am guessing it's a check to see if we can place the block on the specified side of
	 * the specified block.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @param {Integer} side	Unknown paramater from minecraft source, guessing it's which side of the block
	 * 							we are going to test?
	 * 
	 * @return {Boolean}
	 */
	proto.canPlaceBlockOnSide = function(world, posX, posY, posZ, side) {
		return this.canPlaceBlockAt(world, posX, posY, posZ);
	}
	
	/**
	 * Can the block be placed at the following co-ordinates, certain blocks can't rest on nothing, so
	 * I guess this is a check for that.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 * @return {Boolean}
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return true;
	}
	
	/**
	 * Event called when a player right clicks the block.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.blockActivated = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * 
	 */
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.isPoweringTo = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Can provide power
	 * 
	 * Perhaps affects whether or not wires will connect with it?
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @return {Boolean}
	 */
	proto.canProvidePower = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Event called when a block is placed by a player into the world
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ) {
		return false;
	}
	
	/**
	 * Unknown functionality
	 * 
	 * Guessing it's for blocks like torch which need to fall to the ground if the block they are attached to is
	 * removed.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	a		unknown parameter, is it for which side of the block we are checking?
	 * 
	 * @return {Boolean}
	 */
	proto.canBlockStay = function(world, posX, posY, posZ) {
		return true;
	}
	
	/**
	 * Seems to be implemented by music blocks and pistons
	 * 
	 * Note sure what triggers it's call exactly though.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 * @param {Integer}	u1		unknown parameter from MCP generated sourcecode 
	 * @param {Integer}	u2		unknown parameter from MCP generated sourcecode
	 * 
	 */
	proto.playBlock = function(world, posX, posY, posZ) {
		
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			this.drawNormalCube_currentLayer(world, posX, posY, posZ, canvas);
			return;
		}

		var fillColour = "rgb(255,0,0)";
		var fontColour = "rgb(255,255,255)";
	
		canvas.fillStyle = fillColour;
		canvas.fillRect(0,0,8,8);
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText(this.blockID, 4, 4, 6);
	}
	
	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			canvas.fillRect(0, 0, 8, 8);
			return;
		}
		
		//TODO: Handle not implemented?
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			this.drawNormalCube_currentLayer(world, posX, posY, posZ, canvas);
			return;
		}
		
		//Draws a green circle with a question mark inside, signifies that the child block does not have
		//a drawTopView_currentLayer implemented.
		var circleColour = "rgb(0,255,0)";
		var fontColour = "rgb(0,0,0)";
		
		canvas.fillStyle = circleColour;
		canvas.beginPath();
		canvas.arc(4, 4, 4, 0, (Math.PI/180)*360, false);
		canvas.fill();
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText("?", 4, 4, 6);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		if (world.isBlockNormalCube(posX, posY, posZ)) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			canvas.fillRect(0, 0, 8, 8);
			return;
		}

		//TODO: Handle not implemented?
	}
	
	proto.getNormalCubeColour = function() {
		return [255,255,0];
	} 
	
	proto.getNormalCubeColourByMetadata = function() {
		return [255,255,0];
	}
	
	proto.drawNormalCube_currentLayer = function(world, posX, posY, posZ, canvas, shadowed) {
		var rgbColour = this.getNormalCubeColour(world, posX, posY, posZ);
		var rgbShadow = [128,128,128];
		var alpha = 0.5;
		if (shadowed) {
			for (var i=0; i<3; i++) {
				rgbColour[i] = (alpha * rgbShadow[i] + (1 - alpha) * rgbColour[i]) | 0; //http://stackoverflow.com/questions/746899/how-to-calculate-an-rgb-colour-by-specifying-an-alpha-blending-amount
			}
		}
		canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawNormalCube_withOpacity = function(world, posX, posY, posZ, canvas, alpha, shadowed) {
		var rgbColour = this.getNormalCubeColour(world, posX, posY, posZ);
		var rgbFog = [255,255,255];
		for (var i=0; i<3; i++) {
			rgbColour[i] = (alpha * rgbFog[i] + (1 - alpha) * rgbColour[i]) | 0; //http://stackoverflow.com/questions/746899/how-to-calculate-an-rgb-colour-by-specifying-an-alpha-blending-amount
		}
		canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer) {
		if (forAboveLayer) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
		}
		else {
			var rgbColour = this.getNormalCubeColourByMetadata(entity.storedMetadata);
			canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		}
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer) {
		if (forAboveLayer) {
			canvas.fillStyle = "rgba(128,128,128,0.5)";
		}
		else {
			var rgbColour = this.getNormalCubeColourByMetadata(entity.storedMetadata);
			canvas.fillStyle = "rgb("+rgbColour[0]+","+rgbColour[1]+","+rgbColour[2]+")";
		}
		canvas.fillRect(0, 0, 8, 8);
	}
	
	/**
	 * Called by "toggle" tool of the simulator, not implemented in the game.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 */
	proto.toggleBlock = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Used to called by "rotate" tool of the simulator, not implemented in the game.
	 * 
	 * @param {Object}	world	The "world" which has the block
	 * @param {Integer} posX	Coordinate of the block to check
	 * @param {Integer} posY	Coordinate of the block to check
	 * @param {Integer} posZ	Coordinate of the block to check
	 */
	proto.rotateBlock = function(world, posX, posY, posZ) {
		
	}
	
	/**
	 * Used by pistons to see whether or not a block can be moved:
	 */
	proto.getMobilityFlag = function() {
		return this.blockMaterial.mobilityFlag;
	}
	
	/**
	 * Retrieves a block name based on the kind of block.
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * If block's name varies based on their metadata, like with wool, then
	 * that block should override this method.
	 * 
	 * @param 	{Integer} 	blockMetadata	So that if the name changes based on metadata, then the method can take it into account 
	 * @return	{String}
	 */
	proto.getBlockName = function(blockMetadata) {
		return "tile." + this.blockName + ".name";
	}
	
	/**
	 * Used by the gui to get a list of what kind of placeable blocktypes are offered.
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * Certain blocks, like cloth, can offer multiple different kinds of coloured wool,
	 * so would need to override this method.

	 * @param	{Object}	localization	Localization object
	 * @return	{Object}
	 */
	proto.enumeratePlaceableBlocks = function() {
		return new Array(
			{
				blockID: this.blockID,
				blockMetadata: 0,
				blockType: this.blockType,
				blockName: this.getBlockName(0),
				material: this.material
			}
		);
	}

	/**
	 * Used to draw icons on a canvas. 
	 * 
	 * Simulator only, not in Minecraft.
	 * 
	 * Creates a world just big enough to hold enough blocks to draw an icon for the kind of block.
	 * If  the type of block, for example redstone wire, needs other blocks around it to generate
	 * the desired preview icon, then it should override this method.
	 * 
	 * @param	{Object}	blockObj		Containing all the block types
	 * @param	{Object}	canvas			The canvas element to draw to
	 * @param	{Object}	blockMetadata	Metadata of the block for generating the icon
	 */
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		if (blockMetadata == 0) {
			blockMetadata = this.drawIconBlockMetadataOveride;
		}
		
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 1, 1);
		worldData.setBlockAndMetadata(0, 0, 0, this.blockID, blockMetadata);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);
		this.drawTopView_currentLayer(world, 0, 0, 0, canvas);
	}
	
	/**
	 * A helper utility function for draw methods of blocks, used by simulator only, not the game
	 */
	proto.rotateContext = function(amount, context) {
		switch (amount) {
			case 0:
				return;
			case 90:
				context.translate(8, 0);
				context.rotate(Math.PI*0.5);
				return;
			case 180:
				context.translate(8, 8);
				context.rotate(Math.PI*1.0);
				return;
			case 270:
				context.translate(0, 8);
				context.rotate(Math.PI*1.5);
				return;
		}
	}
	
	proto.mirrorContext = function(context) {
		context.translate(8, 0);
		context.scale(-1, 1);
	}
	
	proto.flipContext = function(context) {
		context.translate(0, 8);
		context.scale(1, -1);
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType__Default";
	var funcName = "BlockType_Block";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
}());
; 
//Needed by BlockType_Glass
com.mordritch.mcSim.BlockType_BlockBreakable = function(){}
	com.mordritch.mcSim.BlockType_BlockBreakable.prototype = new com.mordritch.mcSim.BlockType_Block();
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Container";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.isBlockContainer = true;

	proto._onBlockAdded = proto.onBlockAdded;
	proto.onBlockAdded = function(par1World, par2, par3, par4)
	{
		this._onBlockAdded(par1World, par2, par3, par4);
		par1World.setBlockTileEntity(par2, par3, par4, this.getBlockEntity());
	}

	/**
	 * Called whenever the block is removed.
	 */
	proto._onBlockRemoval = proto.onBlockRemoval;
	proto.onBlockRemoval = function(par1World, par2, par3, par4)
	{
		this._onBlockRemoval(par1World, par2, par3, par4);
		par1World.removeBlockTileEntity(par2, par3, par4);
	}

	proto._powerBlock = proto.powerBlock;
	proto.powerBlock = function(par1World, par2, par3, par4, par5, par6)
	{
		this._powerBlock(par1World, par2, par3, par4, par5, par6);
		var tileentity = par1World.getBlockTileEntity(par2, par3, par4);

		if (tileentity != null)
		{
			tileentity.onTileEntityPowered(par5, par6);
		}
	}

}());
; 
com.mordritch.mcSim.BlockType_Sand = function(){}
	com.mordritch.mcSim.BlockType_Sand.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Sand.prototype.material = "sand";
	; 
com.mordritch.mcSim.BlockType_Stone = function(){}
	com.mordritch.mcSim.BlockType_Stone.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Stone.prototype.material = "rock";
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Torch";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	var
		POINTING_EAST = 1,
		POINTING_WEST = 2,
		POINTING_SOUTH = 3,
		POINTING_NORTH = 4,
		STANDING_ON_GROUND = 5;
	
	proto.material = "circuits";
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 4;
	}

	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			return true;
		}
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			return true;
		}

		return this.canPlaceTorchOn(world, posX, posY - 1, posZ);
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		if (this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
			world.setBlockWithNotify(posX, posY, posZ, world.Block.air.blockID);
		}
	}
	
	proto.checkIftorchPlacementInvalid = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var removeTorch = false;

		if (!world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true) && blockMetadata == 1)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true) && blockMetadata == 2)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true) && blockMetadata == 3)
		{
			removeTorch = true;
		}

		if (!world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true) && blockMetadata == 4)
		{
			removeTorch = true;
		}

		if (!this.canPlaceTorchOn(world, posX, posY - 1, posZ) && blockMetadata == 5)
		{
			removeTorch = true;
		}
		
		return removeTorch;
	}
	
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		/*
		//Original function as per source:
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (facing == 1 && canPlaceTorchOn(world, posX, posY - 1, posZ))
		{
			blockMetadata = 5;
		}

		if (facing == 2 && world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = 4;
		}

		if (facing == 3 && world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = 3;
		}

		if (facing == 4 && world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = 2;
		}

		if (facing == 5 && world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = 1;
		}

		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);

		*/
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (this.canPlaceTorchOn(world, posX, posY - 1, posZ))
		{
			blockMetadata = 5;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = 4;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = 3;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = 2;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = 1;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}
	}

	proto.canPlaceTorchOn = function(world, posX, posY, posZ) {
		var Block = world.Block;
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ, true))
		{
			return true;
		}

		var blockId = world.getBlockId(posX, posY, posZ);

		if (blockId == Block.fence.blockID || blockId == Block.netherFence.blockID || blockId == Block.glass.blockID)
		{
			return true;
		}

		if (Block.blocksList[blockId] != null && (Block.blocksList[blockId] instanceof namespace.BlockType_Stairs))
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);

			if ((4 & blockMetadata) != 0)
			{
				return true;
			}
		}

		return false;
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		for (var i=0; i<amount; i++) {
			blockMetadata = new Array(0, 3, 4, 2, 1, 5)[blockMetadata];
		}
		return blockMetadata;
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var originalMetadata = blockMetadata;
		do {
			blockMetadata = new Array(0, 3, 5, 2, 1, 4)[blockMetadata];
			world.setBlockMetadata(posX, posY, posZ, blockMetadata);
			if (!this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
				world.notifyBlockChange(posX, posY, posZ, world.getBlockId(posX, posY, posZ));
				break;
			}			
		} while (true);
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, false);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, true);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		layerView = (forAboveLayer) ? "shadow" : "side"; 

		var
			POINTING_EAST = 1,
			POINTING_WEST = 2,
			POINTING_SOUTH = 3,
			POINTING_NORTH = 4,
			POINTING_UP = 5;

		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		switch (blockMetadata) {
			case POINTING_EAST:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 90);
				break;
			case POINTING_WEST:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 270);
				break;
			case POINTING_SOUTH:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 180);
				break;
			case POINTING_NORTH:
				this.drawGeneric(world, posX, posY, posZ, canvas, layerView, 0);
				break;
			case POINTING_UP:
				this.drawGeneric(world, posX, posY, posZ, canvas, "towards");
				break;
			default: throw new Error("Unexpected case");
		}
		
	}
		
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, true);
	}
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards, forAboveLayer) {
		var rotatedBy, view;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			POINTING_EAST = 1,
			POINTING_WEST = 2,
			POINTING_SOUTH = 3,
			POINTING_NORTH = 4,
			POINTING_UP = 5;
			
		layerView = (forAboveLayer) ? "shadow" : "side"; 

		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_SOUTH:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_EAST:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_WEST:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_SOUTH:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_EAST:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_WEST:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_SOUTH:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_EAST:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_WEST:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (blockMetadata) {
					case POINTING_NORTH:
						rotatedBy = 270;
						view = layerView;
						break;
					case POINTING_SOUTH:
						rotatedBy = 90;
						view = layerView;
						break;
					case POINTING_EAST:
						rotatedBy = 0;
						view = "away";
						break;
					case POINTING_WEST:
						rotatedBy = 0;
						view = "towards";
						break;
					case POINTING_UP:
						rotatedBy = 0;
						view = layerView;
						break;
					default:
						//unknown
						break;
				}
				break;
		}
		
		this.drawGeneric(world, posX, posY, posZ, canvas, view, rotatedBy);
	}
	
	proto.drawGeneric = function(world, posX, posY, posZ, canvas, view, rotatedBy) {
		var torchColour = {
			torchRedstoneActive: "rgb(255,0,0)",
			torchRedstoneIdle: "rgb(128,0,0)",
			torchWood: "rgb(255,128,0)"
		}[this.blockType];

		var stickColour = "rgb(97,66,38)";
		
		if (view == "towards") {
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();
			return;
		}
		
		if (view == "away") {
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();

			canvas.beginPath();
			canvas.fillStyle = stickColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(
				4,	//x coord
				4,	//y coord
				1, 		//radius
				0,						//start point
				(Math.PI / 180) * 360,	//end point
				false					//clockwise
			);
			canvas.fill();
			return;
		}
		
		if (view == "side") {
			canvas.save();
			this.rotateContext(rotatedBy, canvas);
			
			canvas.fillStyle = stickColour;
			canvas.fillRect(3, 3, 2, 5);
	
			canvas.beginPath();
			canvas.fillStyle = torchColour;
			canvas.strokeStyle = 'rgba(0,0,0,0)';
			canvas.arc(4, 4, 2, 0, (Math.PI / 180) * 360, false);
			canvas.fill();
			canvas.restore();
			return;
		}
		
		if (view =="shadow") {
			canvas.save();
			this.rotateContext(rotatedBy, canvas);
			canvas.fillStyle = "rgba(128,128,128,0.5)";
			
			canvas.moveTo(3, 8);
			canvas.beginPath();
			canvas.lineTo(3, 4);
			canvas.arc(4, 4, 2, (Math.PI / 180) * 100, (Math.PI / 180) * 80, false);
			canvas.lineTo(3, 4);
			canvas.lineTo(5, 4);
			canvas.lineTo(5, 8);
			canvas.lineTo(3, 8);
			canvas.fill();
			canvas.restore();
			return;
		}
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType__Default";
	var funcName = "BlockType__Unknown";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.material = "air";
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
	}
	
	/**
	 * Draws a blue block with the block ID in it, signfiying the block is not yet implemented 
	 */
	proto.drawGeneric = function(world, posX, posY, posZ, canvas) {
		var fillColour = "rgb(0,0,255)";
		var fontColour = "rgb(255,255,255)";
	
		canvas.fillStyle = fillColour;
		/* Old method, drew a circle
		canvas.beginPath();
		canvas.arc(4, 4, 4, 0, (Math.PI/180)*360, false);
		canvas.fill();
		*/
		canvas.fillRect(0,0,8,8);
		
		canvas.fillStyle  = fontColour;
		canvas.textBaseline = "middle";
		canvas.textAlign = "center";
		canvas.font = "bold " + (8) + "px arial";
		canvas.fillText(this.blockID, 4, 4, 6);
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas);
	}
	
	proto.enumeratePlaceableBlocks = function() {
		return new Array();
	}
}());
; 
com.mordritch.mcSim.BlockType_Air = function(){}
	com.mordritch.mcSim.BlockType_Air.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Air.prototype.construct = function() {
		this._renderAsNormalBlock = false;
	}
	
	com.mordritch.mcSim.BlockType_Air.prototype.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		//It's air, it looks like nothing!
	}
	; 
com.mordritch.mcSim.BlockType_Bookshelf = function(){}
	com.mordritch.mcSim.BlockType_Bookshelf.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Bookshelf.prototype.material = "wood";
	
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Button";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "circuits";
	
	var
		FACING_EAST = 1,
		FACING_WEST = 2,
		FACING_SOUTH = 3,
		FACING_NORTH = 4;
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 3;
		this._renderAsNormalBlock = false;
		this.tickOnLoad = true;
	}
	
	proto.tickRate = function() {
		return 20;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ)
	{
		if (world.isBlockNormalCube(posX - 1, posY, posZ))
		{
			return true;
		}
		if (world.isBlockNormalCube(posX + 1, posY, posZ))
		{
			return true;
		}
		if (world.isBlockNormalCube(posX, posY, posZ - 1))
		{
			return true;
		}
		return world.isBlockNormalCube(posX, posY, posZ + 1);
	}
	
	proto.placementIsValid = function(world, posX, posY, posZ, direction) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 7;
		return !(
			(!world.isBlockNormalCube(posX - 1, posY, posZ) && facing == 1) ||
			(!world.isBlockNormalCube(posX + 1, posY, posZ) && facing == 2) ||
			(!world.isBlockNormalCube(posX, posY, posZ - 1) && facing == 3) ||
			(!world.isBlockNormalCube(posX, posY, posZ + 1) && facing == 4)
		);
	}

	proto.rotateSelection = function(blockMetadata, amount) {
		var isPressed = blockMetadata & 0x8
		var facing = blockMetadata & 0x7;
		for (var i=0; i<amount; i++) {
			facing = new Array(0, 3, 4, 2, 1)[facing];
		}
		return facing | isPressed;
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 7;
		console.log("rotatating.");
		do {
			facing = new Array(0, 3, 4, 2, 1)[facing];
			world.setBlockMetadataWithNotify(posX, posY, posZ, facing);
			if (this.placementIsValid(world, posX, posY, posZ)) {
				break;
			}			
		} while (true);
	}
	
	/**
	 * For buttons, we should need to see if the button needs to be destroyed if the block it was resting on is now gone. 
	 */
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, direction) {
		if (this.redundantCanPlaceBlockAt(world, posX, posY, posZ))
		{
			if (!this.placementIsValid(world, posX, posY, posZ, direction)) {
				//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	}
	
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		/*
		//Original function as per source:
        int i = par1World.getBlockMetadata(par2, par3, par4);
        int j = i & 8;
        i &= 7;

        if (par5 == 2 && par1World.isBlockNormalCube(par2, par3, par4 + 1))
        {
            i = 4;
        }
        else if (par5 == 3 && par1World.isBlockNormalCube(par2, par3, par4 - 1))
        {
            i = 3;
        }
        else if (par5 == 4 && par1World.isBlockNormalCube(par2 + 1, par3, par4))
        {
            i = 2;
        }
        else if (par5 == 5 && par1World.isBlockNormalCube(par2 - 1, par3, par4))
        {
            i = 1;
        }
        else
        {
            i = getOrientation(par1World, par2, par3, par4);
        }

        par1World.setBlockMetadataWithNotify(par2, par3, par4, i + j);
		*/
		var blockMetadata;
		
		if (world.isBlockNormalCubeDefault(posX, posY, posZ + 1, true))
		{
			blockMetadata = FACING_NORTH;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX + 1, posY, posZ, true))
		{
			blockMetadata = FACING_WEST;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX, posY, posZ - 1, true))
		{
			blockMetadata = FACING_SOUTH;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}

		if (world.isBlockNormalCubeDefault(posX - 1, posY, posZ, true))
		{
			blockMetadata = FACING_EAST;
			world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
			return;
		}
		
	}

	/**
	 * The MCP variable name
	 */
	proto.redundantCanPlaceBlockAt = function(world, posX, posY, posZ)
	{
		if (!this.canPlaceBlockAt(world, posX, posY, posZ))
		{
			//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
			world.setBlockWithNotify(posX, posY, posZ, 0);
			return false;
		}
		else
		{
			return true;
		}
	}

	proto.blockActivated = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 7;
		var isPressed = 8 - (blockMetadata & 8);
		if (isPressed == 0)
		{
			return true;
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation + isPressed);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "random.click", 0.3F, 0.6F);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
		if (orientation == 1)
		{
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		}
		else if (orientation == 2)
		{
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		}
		else if (orientation == 3)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		}
		else if (orientation == 4)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
		else
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		world.scheduleBlockUpdate(posX, posY, posZ, blockID, this.tickRate());
		return true;
	}
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated(world, posX, posY, posZ);
	}

	proto.isPoweringTo = function(world, posX, posY, posZ, direction)
	{
		return (world.getBlockMetadata(posX, posY, posZ) & 8) > 0;
	}
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction)
	{
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0)
		{
			return false;
		}
		var orientation = blockMetadata & 7;
		if (orientation == 5 && direction == 1)
		{
			return true;
		}
		if (orientation == 4 && direction == 2)
		{
			return true;
		}
		if (orientation == 3 && direction == 3)
		{
			return true;
		}
		if (orientation == 2 && direction == 4)
		{
			return true;
		}
		return orientation == 1 && direction == 5;
	}
	
	proto.canProvidePower = function() {
		return true;
	}
	
	proto.updateTick = function(world, posX, posY, posZ)
	{
		if (world.isRemote)
		{
			return;
		}
		
		var blockID = this.blockID;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0)
		{
			return;
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata & 7);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
		var orientation = blockMetadata & 7;
		if (orientation == 1)
		{
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		}
		else if (orientation == 2)
		{
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		}
		else if (orientation == 3)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		}
		else if (orientation == 4)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
		else
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "random.click", 0.3F, 0.5F);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, true);
	}

	/**
	 * @param forAboveLayer	It's faded when drawing for the above layer
	 */
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		/*
		0x1: Facing east
		0x2: Facing west
		0x3: Facing south
		0x4: Facing north
		*/
		
		switch (orientation) {
			case 1:
				this.draw(world, posX, posY, posZ, canvas, "right", forAboveLayer);
				break;
			case 2:
				this.draw(world, posX, posY, posZ, canvas, "left", forAboveLayer);
				break;
			case 3:
				this.draw(world, posX, posY, posZ, canvas, "down", forAboveLayer);
				break;
			case 4:
				this.draw(world, posX, posY, posZ, canvas, "up", forAboveLayer);
				break;
		}
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards, true);
	}
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards, forAboveLayer) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		/*
		0x1: Facing east
		0x2: Facing west
		0x3: Facing south
		0x4: Facing north
		*/
		
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			FACING_EAST = 1,
			FACING_WEST = 2,
			FACING_SOUTH = 3,
			FACING_NORTH = 4;
			
		var direction;
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "away";
						break;
					case FACING_NORTH:
						direction = "towards";
						break;
					case FACING_WEST:
						direction = "right";
						break;
					case FACING_EAST:
						direction = "left";
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "towards";
						break;
					case FACING_NORTH:
						direction = "away";
						break;
					case FACING_WEST:
						direction = "left";
						break;
					case FACING_EAST:
						direction = "right";
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "left";
						break;
					case FACING_NORTH:
						direction = "right";
						break;
					case FACING_WEST:
						direction = "away";
						break;
					case FACING_EAST:
						direction = "towards";
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (orientation) {
					case FACING_SOUTH:
						direction = "right";
						break;
					case FACING_NORTH:
						direction = "left";
						break;
					case FACING_WEST:
						direction = "towards";
						break;
					case FACING_EAST:
						direction = "away";
						break;
				}
				break;
		}
		
		this.draw(world, posX, posY, posZ, canvas, direction, forAboveLayer)
	}

	proto.draw = function(world, posX, posY, posZ, canvas, direction, forAboveLayer) {
		var isPressed = (world.getBlockMetadata(posX, posY, posZ) & 8) == 0x8;
		
		if (isPressed) {
			var poweredColour = "255,0,0";
			var thickness = 2;
		}
		else {
			var poweredColour = "128,0,0";
			var thickness = 4;
		}
		
		if (forAboveLayer) {
			poweredColour = "rgba(128,128,128,0.5)"; 
		}
		else {
			poweredColour = "rgb("+poweredColour+")"; 
		}

		canvas.fillStyle = poweredColour;

		switch (direction) {
			case "left":
				canvas.fillRect((8-thickness), 1, thickness, 6);
				break;
			case "right":
				canvas.fillRect(0, 1, thickness, 6);
				break;
			case "up":
				canvas.fillRect(1, (8-thickness), 6, thickness);
				break;
			case "down":
				canvas.fillRect(1, 0, 6, thickness);
				break;
			case "towards":
				canvas.fillRect(1, 2, 6, 4);
				break;
			case "away":
				canvas.fillRect(1, 2, 6, 4);
				canvas.fillStyle = "rgb(0,0,0)";
				canvas.fillRect(2, 2, 4, 4);
				break;
		}
	}
}());
; 
com.mordritch.mcSim.BlockType_Cake = function(){}
	com.mordritch.mcSim.BlockType_Cake.prototype = new com.mordritch.mcSim.BlockType_Block();
	com.mordritch.mcSim.BlockType_Cake.prototype._renderAsNormalBlock = false;
	
	com.mordritch.mcSim.BlockType_Cake.prototype.material = "cake";

; 
com.mordritch.mcSim.BlockType_Clay = function(){}
	com.mordritch.mcSim.BlockType_Clay.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Clay.prototype.material = "clay";
; 
/**
 * Wool
 */
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Cloth";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.material = "cloth";
	
	proto.clothColours = [
		[203,203,203], //0 white
		[233,119,42 ], //1 orange
		[185,57, 196], //2 magenta
		[83, 123,206], //3 light blue
		[176,164,23 ], //4 yellow
		[53, 174,43 ], //5 lime
		[211,112,139], //6 pink
		[61, 61, 61 ], //7 grey
		[144,153,153], //8 light grey
		[36, 107,137], //9 cyan
		[119,46, 183], //10 purple
		[36, 47, 141], //11 blue
		[86, 51, 27 ], //12 brown
		[51, 71, 22 ], //13 green
		[150,41, 37 ], //14 red
		[22, 18, 18 ]  //15 black
	];
	
	/* deprecated?
	proto.getClothColourAsRgb = function(world, posX, posY, posZ) {
		var index = world.getBlockMetadata(posX, posY, posZ);
		
		var red = this.clothColours[index][0];
		var green = this.clothColours[index][1]; 
		var blue = this.clothColours[index][2];
		
		return "rgb("+red+","+green+","+blue+")";
	}
	*/
	
	proto.getNormalCubeColour = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		return this.getNormalCubeColourByMetadata(blockMetadata);
	}
	
	proto.getNormalCubeColourByMetadata = function(blockMetadata) {
		//We don't want to pass back a reference or that could get edited later on by mistake.
		return [
			this.clothColours[blockMetadata][0],
			this.clothColours[blockMetadata][1],
			this.clothColours[blockMetadata][2]
		];
	}
	
	proto.getLocalizedBlockName = function(world, posX, posY, posZ, localization) {
		return localization.getString("tile.cloth." + this.getColorName(world.getBlockMetadata(posX, posY, posZ)) + ".name");
	}
	
	/**
	 * Gets the internal name of the wool's colour based on its metadata
	 * 
	 * @param	{Int}	Metadata Value of Wool Block, on which color is based
	 * @return	{String}
	 */
	proto.getColorName = function(blockMetadata) {
		
	}
	
	proto.getBlockName = function(blockMetadata) {
		var blockColor = new Array(
			"white",
			"orange",
			"magenta",
			"lightBlue",
			"yellow",
			"lime",
			"pink",
			"gray",
			"silver",
			"cyan",
			"purple",
			"blue",
			"brown",
			"green",
			"red",
			"black"
		);
		return "tile.cloth." + blockColor[blockMetadata] + ".name";
	}

	proto.enumeratePlaceableBlocks = function() {
		var returnArray = new Array();
		for (var i=0; i<=0xf; i++) {
			returnArray.push(
				{
					blockID: this.blockID,
					blockMetadata: i,
					blockType: this.blockType,
					blockName: this.getBlockName(i),
					material: this.material
				}
			);
		}
		
		return returnArray;
	}
}());
; 
com.mordritch.mcSim.BlockType_Dirt = function(){}
	com.mordritch.mcSim.BlockType_Dirt.prototype = new com.mordritch.mcSim.BlockType_Block();

	com.mordritch.mcSim.BlockType_Dirt.prototype.material = "ground";

; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Door";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
	}
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		//TODO: Implement, toggles, the blockID between iron/wood
	}
	
	proto.blockActivated = function(world, posX, posY, posZ, entityplayer)
	{
		var blockID = this.blockID;
		if (blockID == world.Block.doorSteel.BlockID)
		{
			return true;
		}
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) != 0)
		{
			if (world.getBlockId(posX, posY - 1, posZ) == blockID)
			{
				this.blockActivated(world, posX, posY - 1, posZ, entityplayer);
			}
			return true;
		}
		if (world.getBlockId(posX, posY + 1, posZ) == blockID)
		{
			world.setBlockMetadataWithNotify(posX, posY + 1, posZ, (blockMetadata ^ 4) + 8);
		}
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata ^ 4);
		world.markBlocksDirty(posX, posY - 1, posZ, posX, posY, posZ);
		//world.playAuxSFXAtEntity(entityplayer, 1003, posX, posY, posZ, 0);
		return true;
	}
	
	proto.getFullMetadata = function(world, posX, posY, posZ) {
        var thisMetadata = world.getBlockMetadata(posX, posY, posZ);
        var isTopHalf = (thisMetadata & 8) != 0;
        var bottomHalfMetadata;
        var topHalfMetadata;

        if (isTopHalf)
        {
            bottomHalfMetadata = world.getBlockMetadata(posX, posY - 1, posZ);
            topHalfMetadata = thisMetadata;
        }
        else
        {
            bottomHalfMetadata = thisMetadata;
            topHalfMetadata = world.getBlockMetadata(posX, posY + 1, posZ);
        }

        var hingeIsOnLeft = (topHalfMetadata & 1) != 0;
        var returnData = bottomHalfMetadata & 7 | (isTopHalf ? 8 : 0) | (hingeIsOnLeft ? 0x10 : 0);
        return returnData;
	}
	
	proto.onPoweredBlockChange = function(world, posX, posY, posZ, doorIsPowered)
	{
        var metadata = this.getFullMetadata(world, posX, posY, posZ);
        var isOpen = (metadata & 4) != 0;

        if (isOpen == doorIsPowered)
        {
            return;
        }

        var doorFacing = metadata & 7;
        doorFacing ^= 4;

        if ((metadata & 8) != 0)
        {
            world.setBlockMetadataWithNotify(posX, posY - 1, posZ, doorFacing);
            world.markBlocksDirty(posX, posY - 1, posZ, posX, posY, posZ);
        }
        else
        {
            world.setBlockMetadataWithNotify(posX, posY, posZ, doorFacing);
            world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
        }
        //world.playAuxSFXAtEntity(null, 1003, posX, posY, posZ, 0);
	}
	
	proto.onBlockPlaced = function(world, posX, posY, posZ) {
		var topByte = 0;
		var bottomByte = 0;
		
		topByte = topByte | 8; //IsTopHalf bit
		topByte = topByte | 1; //hingeIsOnLeft bit
		bottomByte = bottomByte | 1 //facing North
		
		world.editingBlocks = true;
		world.setBlockAndMetadataWithNotify(posX, posY, posZ, this.blockID, bottomByte);
		world.setBlockAndMetadataWithNotify(posX, posY + 1, posZ, this.blockID, topByte);
		world.editingBlocks = false;
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, this.blockID);
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, sourceBlockID)
	{
		var blockID = this.blockID;
		var Block = world.Block;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) != 0)
		{
			if (world.getBlockId(posX, posY - 1, posZ) != blockID)
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
			if (sourceBlockID > 0 && sourceBlockID != blockID)
			{
				this.onNeighborBlockChange(world, posX, posY - 1, posZ, sourceBlockID);
			}
		}
		else
		{
			var doorPlacementNoLongerValid = false;
			if (world.getBlockId(posX, posY + 1, posZ) != blockID)
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
				doorPlacementNoLongerValid = true;
			}
			if (posY != 0 && !world.isBlockNormalCube(posX, posY - 1, posZ))
			{
				world.setBlockWithNotify(posX, posY, posZ, 0);
				doorPlacementNoLongerValid = true;
				if (world.getBlockId(posX, posY + 1, posZ) == blockID)
				{
					world.setBlockWithNotify(posX, posY + 1, posZ, 0);
				}
			}
			if (doorPlacementNoLongerValid)
			{
				if (!world.isRemote)
				{
					//this.dropBlockAsItem(world, posX, posY, posZ, blockMetadata, 0);
				}
			}
			else
			{
				var isDoorPowered = world.isBlockIndirectlyGettingPowered(posX, posY, posZ) || world.isBlockIndirectlyGettingPowered(posX, posY + 1, posZ);
				if ((isDoorPowered || sourceBlockID > 0 && Block.blocksList[sourceBlockID].canProvidePower() || sourceBlockID == 0) && sourceBlockID != blockID)
				{
					this.onPoweredBlockChange(world, posX, posY, posZ, isDoorPowered);
				}
			}
		}
	}
	
	/* 
	 * http://www.minecraftwiki.net/wiki/Data_values#Doors :
	 * 
	 * Common to both door tiles, the top bit (0x8) is as follows:
	 * 		0: The bottom half of the door
	 * 		1: The top half of the door
	 * Top Sections
	 * 		The least-significant bit (0x1) is as follows, assuming you're facing the same direction the door faces while closed:
	 * 			0: Hinge is on the right (this is the default for single doors)
	 * 			1: Hinge is on the left (this will be used for the other half of a double-door combo)
	 * 		The other two bits (0x2 and 0x4) are always zero.
	 * 		The only valid values for a top section, therefore, are 8 (binary 1000) and 9 (binary 1001).
	 * Bottom Sections
	 * 		The second bit (0x4) determines the door's state:
	 * 			0: Closed
	 * 			1: Open
	 * 		The bottom two bits determine which direction the door faces (these directions given for which direction the door faces while closed)
	 * 			0: Facing west
	 * 			1: Facing north
	 * 			2: Facing east
	 * 			3: Facing south
	 */
	proto.isTopHalf = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		return ((blockMetadata & 0x8) == 0x8);
	}
	
	proto.isOpen = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY-1, posZ) : world.getBlockMetadata(posX, posY, posZ);
		return ((blockMetadata & 0x4) == 0x4);
	}
	
	proto.getFacing = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY-1, posZ) : world.getBlockMetadata(posX, posY, posZ);
		return blockMetadata & 0x3;
	}
	
	proto.setFacing = function(world, posX, posY, posZ, facing) {
		if (facing > 0x3) {
			throw new Error("Cannot be more than 2 bits");
		}
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var metadata = ((isOpen) ? 0x4 : 0x0) | facing;

		if (this.isTopHalf(world, posX, posY, posZ, metadata)) {
			world.setBlockMetadataWithNotify(posX, posY-1, posZ, metadata);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY, posZ, metadata);
		}
	}
	
	proto.hingeIsOnLeft = function(world, posX, posY, posZ) {
		var blockMetadata = (this.isTopHalf(world, posX, posY, posZ)) ? world.getBlockMetadata(posX, posY, posZ) : world.getBlockMetadata(posX, posY+1, posZ);
		return ((blockMetadata & 0x1) != 0x1);
	}
	
	proto.setHingeIsOnLeft = function(world, posX, posY, posZ, isOnLeft) {
		var metadata = (isOnLeft) ? 8 : 9;
		if (this.isTopHalf(world, posX, posY, posZ, metadata)) {
			world.setBlockMetadataWithNotify(posX, posY, posZ, metadata);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY+1, posZ, metadata);
		}
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isTopHalf = blockMetadata & 0x8;
		var isOpen = blockMetadata & 0x4;
		var facing =  blockMetadata & 0x3;
		
		if (isTopHalf == 0x8) {
			return blockMetadata; //only the 
		} 
		else {
			for (var i=0; i<amount; i++) {
				facing = new Array(1, 2, 3, 0)[facing];
			}
			return isTopHalf | isOpen | facing;
		}
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var facing = this.getFacing(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		if (hingeIsOnLeft) {
			this.setFacing(world, posX, posY, posZ, new Array(1, 2, 3, 0)[facing]);
		}
		this.setHingeIsOnLeft(world, posX, posY, posZ, !hingeIsOnLeft);
	}

	proto._canPlaceBlockAt = proto.canPlaceBlockAt;
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		if (posY >= 255) {
			return false;
		}
		else {
			return world.isBlockNormalCube(posX, posY - 1, posZ) && this._canPlaceBlockAt(world, posX, posY, posZ) && this._canPlaceBlockAt(world, posX, posY + 1, posZ);
		}
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, forAboveLayer = false);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, forAboveLayer = true);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var colourPowered = "rgb(255,0,0)";
		var colourUnpowered = "rgb(128,0,0)";
		var colourWood = "rgb(168,135,84)";
		var colourIron = "rgb(192,192,192)";
		var shadowColor = "rgba(128,128,128,0.5)";
		
		var orientation = this.getFacing(world, posX, posY, posZ);
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		
		var
			FACING_WEST = 0,
			FACING_NORTH = 1,
			FACING_EAST = 2,
			FACING_SOUTH = 3;
		
		canvas.save();
		
		if (hingeIsOnLeft) {
			switch(orientation) {
				case FACING_NORTH:
					if (isOpen) {
						this.rotateContext(90, canvas);
					}
					else {
						this.mirrorContext(canvas);
					}
					break;
				case FACING_EAST:
					if (isOpen) {
						this.rotateContext(180, canvas);
					}
					else {
						this.flipContext(canvas);
						this.rotateContext(90, canvas);
					}
					break;
				case FACING_SOUTH:
					if (isOpen) {
						this.rotateContext(270, canvas);
						this.rotateContext(canvas);
					}
					else {
						this.mirrorContext(canvas);
						this.rotateContext(180, canvas);
					}
					break;
				case FACING_WEST:
					if (isOpen) {
					}
					else {
						this.flipContext(canvas);
						this.rotateContext(270, canvas);
					}
					break;
			}
		}
		else {
			switch(orientation) {
				case FACING_NORTH:
					if (isOpen) {
						this.rotateContext(90, canvas);
						this.flipContext(canvas);
					}
					break;
				case FACING_EAST:
					if (isOpen) {
						this.mirrorContext(canvas);
					}
					else {
						this.rotateContext(90, canvas);
					}
					break;
				case FACING_SOUTH:
					if (isOpen) {
						this.flipContext(canvas);
						this.rotateContext(90, canvas);
					}
					else {
						this.rotateContext(180, canvas);
					}
					break;
				case FACING_WEST:
					if (isOpen) {
						this.flipContext(canvas);
					}
					else {
						this.rotateContext(270, canvas);
					}
					break;
			}
		}
		
		if (forAboveLayer && !this.isTopHalf(world, posX, posY, posZ)) {
			canvas.fillStyle = shadowColor;
			canvas.fillRect(0, 0, 8, 2);
		}
		else if (!forAboveLayer) {
			canvas.fillStyle = (this.blockID == world.Block.doorWood.blockID) ? colourWood : colourIron;
			canvas.fillRect(2, 0, 6, 2);
	
			canvas.fillStyle = (isOpen) ? colourPowered : colourUnpowered;
			canvas.fillRect(0, 0, 2, 2);
		}
		
		canvas.restore();
	}
	
	proto.getBlockInfo = function(world, posX, posY, posZ) {
		returnData =
			"facing: " + new Array("West(0)", "North(1)", "East(2)", "South(3)")[this.getFacing(world, posX, posY, posZ)] + "\n" +
			"isOpen: " + this.isOpen(world, posX, posY, posZ) + "\n" +
			"isTopHalf: " + this.isTopHalf(world, posX, posY, posZ) + "\n" +
			"hingeIsOnLeft: " + this.hingeIsOnLeft(world, posX, posY, posZ) + "\n" +
		"";
		return returnData;
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var facing = this.getFacing(world, posX, posY, posZ);
		var isOpen = this.isOpen(world, posX, posY, posZ);
		var isTopHalf = this.isTopHalf(world, posX, posY, posZ);
		var hingeIsOnLeft = this.hingeIsOnLeft(world, posX, posY, posZ);
		
		var
			FACING_WEST = 0,
			FACING_NORTH = 1,
			FACING_EAST = 2,
			FACING_SOUTH = 3;
			
		var
			LOOKING_NORTH = 0,
			LOOKING_EAST = 1,
			LOOKING_SOUTH = 2,
			LOOKING_WEST = 3;
			
		var drawDoor = false;
		var drawHinge = false;
		var drawHingeOnLeft = false;
		
		//By default, hinge is always on the right
		
		switch (lookingTowards) {
			case LOOKING_NORTH:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_EAST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_WEST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_SOUTH:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
				}
				break;
			case LOOKING_EAST:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_EAST:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_WEST:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_SOUTH:
						drawDoor = isOpen;
						drawHinge = !isOpen || (isOpen && hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
				}
				break;
			case LOOKING_SOUTH:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_EAST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_WEST:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
					case FACING_SOUTH:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
				}
				break;
			case LOOKING_WEST:
				switch (facing) {
					case FACING_NORTH:
						drawDoor = isOpen;
						drawHinge = isOpen || (!isOpen && hingeIsOnLeft);
						drawHingeOnLeft = false;
						break;
					case FACING_EAST:
						drawDoor = !isOpen;
						drawHinge = true;
						drawHingeOnLeft = hingeIsOnLeft;
						break;
					case FACING_WEST:
						drawDoor = !isOpen;
						drawHinge = !isOpen;
						drawHingeOnLeft = !hingeIsOnLeft;
						break;
					case FACING_SOUTH:
						drawDoor = isOpen;
						drawHinge = !isOpen || (isOpen && !hingeIsOnLeft);
						drawHingeOnLeft = true;
						break;
				}
				break;
		}
		
		this.drawSideView_generic(world, posX, posY, posZ, canvas, drawDoor, drawHinge, drawHingeOnLeft);
	}
	
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		canvas.scale(0.5, 0.5);
		canvas.translate(4,0);

		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 2, 1);
		worldData.setBlockAndMetadata(0, 0, 0, this.blockID, 3);
		worldData.setBlockAndMetadata(0, 1, 0, this.blockID, 8);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);

		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 1,
			posZ = 0,
			canvas,
			drawDoor = true,
			drawHinge = true,
			drawHingeOnLeft = true
		);
		canvas.translate(0,8);
		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 0,
			posZ = 0,
			canvas,
			drawDoor = true,
			drawHinge = true,
			drawHingeOnLeft = true
		);
	}

	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, drawDoor, drawHinge, drawHingeOnLeft) {
		var colourPowered = "rgb(255,0,0)";
		var colourUnpowered = "rgb(128,0,0)";
		var colourWood = "rgb(168,135,84)";
		var colourIron = "rgb(192,192,192)";
		var colourDoorKnob = "rgb(0,0,0)";
		
		var isPowered = this.isOpen(world, posX, posY, posZ);
		var isTopHalf = this.isTopHalf(world, posX, posY, posZ);
		
		var doorColour = (this.blockID == 64) ? colourWood : colourIron; 
		var colouredHingeColour = (isPowered) ? colourPowered : colourUnpowered;
		var sideColour = (drawHinge) ? colouredHingeColour : doorColour;
		
		if (!drawHingeOnLeft) {
			canvas.save();
			this.mirrorContext(canvas);
		}
		
		canvas.fillStyle = sideColour;
		canvas.fillRect(0, 0, 2, 8);
		
		if (drawDoor) {
			canvas.fillStyle = doorColour;
			if (isTopHalf) {
				canvas.fillRect(2, 0, 6, 2);
				canvas.fillRect(2, 4, 6, 1);
				canvas.fillRect(2, 7, 6, 1);
				
				canvas.fillRect(4, 0, 1, 8);
				canvas.fillRect(7, 0, 1, 8);
			}
			else {
				canvas.fillRect(2, 0, 6, 8);
	
				canvas.fillStyle = colourDoorKnob;
				canvas.fillRect(6, 1, 1, 1);
			}
		}

		if (!drawHingeOnLeft) {
			canvas.restore();
		}
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_BlockBreakable";
	var funcName = "BlockType_Glass";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(153,217,234)";
		canvas.fillRect(0, 0, 8, 8);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(153,217,234)";
		canvas.fillRect(0, 0, 8, 8);
	}

	proto.getNormalCubeColourByMetadata = function(blockMetadata) {
		return [153,217,234];
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_GlowStone";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, worldFacing) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = true);
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawGeneric(world, posX, posY, posZ, canvas, forAboveLayer = true);
	}

	proto.drawGeneric = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		canvas.fillStyle = (forAboveLayer) ? "rgba(128,128,128,0.5)" : "rgb(0,255,0)";
		canvas.fillRect(0, 0, 8, 8);
	}
}());
; 
com.mordritch.mcSim.BlockType_Grass = function(){}
	com.mordritch.mcSim.BlockType_Grass.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Grass.prototype.material = "grass";
; 
com.mordritch.mcSim.BlockType_Gravel = function(){}
	com.mordritch.mcSim.BlockType_Gravel.prototype = new com.mordritch.mcSim.BlockType_Sand();

; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Lever";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	var
		WALL_MOUNTED_FACING_EAST = 1,
		WALL_MOUNTED_FACING_WEST = 2,
		WALL_MOUNTED_FACING_SOUTH = 3,
		WALL_MOUNTED_FACING_NORTH = 4,
		GROUND_WHEN_OFF_POINTS_SOUTH = 5,
		GROUND_WHEN_OFF_POINTS_EAST = 6,
		CEILING_WHEN_OFF_POINTS_SOUTH = 7,
		CEILING_WHEN_OFF_POINTS_EAST = 0,
		LOOKING_TOWARDS_NORTH = 0,
		LOOKING_TOWARDS_EAST = 1,
		LOOKING_TOWARDS_SOUTH = 2,
		LOOKING_TOWARDS_WEST = 3;

	proto.material = "circuits";
	
	proto.construct = function() {
		this.drawIconBlockMetadataOveride = 5;
		this._renderAsNormalBlock = false;
	}

	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		return (world.getBlockMetadata(posX, posY, posZ) & 8) > 0;
	}
	
	proto.canPlaceBlockAt = function (world, posX, posY, posZ) {
        if ( 
	        world.isBlockNormalCube(posX - 1, posY, posZ) ||
	        world.isBlockNormalCube(posX + 1, posY, posZ) ||
	        world.isBlockNormalCube(posX, posY, posZ - 1) ||
	        world.isBlockNormalCube(posX, posY, posZ + 1) ||
	        world.isBlockNormalCube(posX, posY - 1, posZ) ||
	        world.isBlockNormalCube(posX, posY + 1, posZ)
        ) {
        	return true;
        }
    }

	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if ((blockMetadata & 8) == 0) {
			return false;
		}
		
		var leverOrientation = blockMetadata & 7;
		
		if (
			(leverOrientation == 0 && direction == 0) ||
			(leverOrientation == 7 && direction == 0) ||
			(leverOrientation == 6 && direction == 1) ||
			(leverOrientation == 5 && direction == 1) ||
			(leverOrientation == 4 && direction == 2) ||
			(leverOrientation == 3 && direction == 3) ||
			(leverOrientation == 2 && direction == 4) ||
			(leverOrientation == 1 && direction == 5)
		) {
			return true;
		}

	}

	proto.rotateSelection = function(blockMetadata, amount) {
		var isThrown = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 3, 4, 2, 1, 5, 6, 7)[orientation];
		}
		return orientation | isThrown;
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var orientation = world.getBlockMetadata(posX, posY, posZ) & 7;
		do {
			orientation = new Array(4, 3, 5, 2, 1, 6, 7, 0)[orientation];
			world.setBlockMetadataWithNotify(posX, posY, posZ, orientation);
			if (!this.placementInvalid(world, posX, posY, posZ)) {
				break;
			}			
		} while (true);
	}
	
	proto.checkIfAttachedToBlock = function(world, posX, posY, posZ) {
        if (!this.canPlaceBlockAt(world, posX, posY, posZ))
        {
            //dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
            world.setBlockWithNotify(posX, posY, posZ, 0);
            return false;
        }
        else
        {
            return true;
        }
	}
	
	proto.placementInvalid = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ) & 7;
		var placementInvalid = false;

		if (!world.isBlockNormalCube(posX - 1, posY, posZ) && blockMetadata == 1)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX + 1, posY, posZ) && blockMetadata == 2)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY, posZ - 1) && blockMetadata == 3)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY, posZ + 1) && blockMetadata == 4)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY - 1, posZ) && blockMetadata == 5)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY - 1, posZ) && blockMetadata == 6)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY + 1, posZ) && blockMetadata == 7)
		{
			placementInvalid = true;
		}

		if (!world.isBlockNormalCube(posX, posY + 1, posZ) && blockMetadata == 0)
		{
			placementInvalid = true;
		}

		return placementInvalid;		
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, neighborBlockId) {
		if (this.checkIfAttachedToBlock(world, posX, posY, posZ))
		{
			if (this.placementInvalid(world, posX, posY, posZ))
			{
				//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	}
	
	proto.onBlockPlaced = function(world, posX, posY, posZ) {
		for (var i=1; i<=6; i++) {
			if (
				(world.isBlockNormalCube(posX - 1, posY, posZ) && i == 1) ||
				(world.isBlockNormalCube(posX + 1, posY, posZ) && i == 2) ||
				(world.isBlockNormalCube(posX, posY, posZ - 1) && i == 3) ||
				(world.isBlockNormalCube(posX, posY, posZ + 1) && i == 4) ||
				(world.isBlockNormalCube(posX, posY - 1, posZ) && i == 5) ||
				(world.isBlockNormalCube(posX, posY - 1, posZ) && i == 6) ||
				(world.isBlockNormalCube(posX, posY + 1, posZ) && i == 7) ||
				(world.isBlockNormalCube(posX, posY + 1, posZ) && i == 0)
			) break;
		}
		world.setBlockMetadata(posX, posY, posZ, i);
	}
	
	proto.canProvidePower = function() {
		return true;
	}
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated (world, posX, posY, posZ);
	}
	
	proto.blockActivated = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 0x7;
		var isThrown = 8 - (blockMetadata & 0x8);
		var blockID = this.blockID;
		
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation + isThrown);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
		if (orientation == 1)
		{
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		}
		else if (orientation == 2)
		{
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		}
		else if (orientation == 3)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		}
		else if (orientation == 4)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
		else if (orientation == 5 || orientation == 6)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		else if (orientation == 7 || orientation == 0)
		{
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
		}
		return true;
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
		//TODO: Have this make a shadow if anything other than ground mounted
	}

	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var facing = world.getBlockMetadata(posX, posY, posZ) & 0x7;
		switch (facing) {
			case WALL_MOUNTED_FACING_EAST:
				this.draw(world, posX, posY, posZ, canvas, "top", 90);
				break;
			case WALL_MOUNTED_FACING_WEST:
				this.draw(world, posX, posY, posZ, canvas, "top", 270);
				break;
			case WALL_MOUNTED_FACING_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "top", 180);
				break;
			case WALL_MOUNTED_FACING_NORTH:
				this.draw(world, posX, posY, posZ, canvas, "top", 0);
				break;
			case GROUND_WHEN_OFF_POINTS_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "facingToward", 180);
				break;
			case GROUND_WHEN_OFF_POINTS_EAST:
				this.draw(world, posX, posY, posZ, canvas, "facingToward", 90);
				break;
			case CEILING_WHEN_OFF_POINTS_SOUTH:
				this.draw(world, posX, posY, posZ, canvas, "facingAway", 180);
				break;
			case CEILING_WHEN_OFF_POINTS_EAST:
				this.draw(world, posX, posY, posZ, canvas, "facingAway", 90);
				break;
			default:
		}
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, lookingTowards);
		//TODO: Have this make a shadow if anything other than ground mounted
	}
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var 
			view,
			rotated = 0,
			mirrored = false,
			facing = world.getBlockMetadata(posX, posY, posZ) & 0x7;			
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						mirrored = true;
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "leaningRight";
						rotated = 90;
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						mirrored = true;
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "leaningRight";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "top";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "facingAway";
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "facingToward";
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "top";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "top";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						rotated = 180;
						mirrored = true;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (facing) {
					case WALL_MOUNTED_FACING_SOUTH:
						view = "leaningRight";
						rotated = 90;
						break;
					case WALL_MOUNTED_FACING_NORTH:
						view = "leaningRight";
						rotated = 270;
						mirrored = true;
						break;
					case WALL_MOUNTED_FACING_WEST:
						view = "facingToward";
						break;
					case WALL_MOUNTED_FACING_EAST:
						view = "facingAway";
						break;
					case GROUND_WHEN_OFF_POINTS_EAST:
						view = "top";
						break;
					case GROUND_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						mirrored = true;
						break;
					case CEILING_WHEN_OFF_POINTS_EAST:
						view = "top";
						rotated = 180;
						break;
					case CEILING_WHEN_OFF_POINTS_SOUTH:
						view = "leaningRight";
						rotated = 180;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			default: throw new Error("Unexpected case");
		}
		
		this.draw(world, posX, posY, posZ, canvas, view, rotated, mirrored);
	}
	
	proto.draw = function(world, posX, posY, posZ, canvas, view, rotated, mirrored) {
		var baseColour = "rgb(64,64,64)";
		var isThrown = ((world.getBlockMetadata(posX, posY, posZ) >>> 3) == 1);
		
		if (isThrown) 
			var poweredColour = "rgb(255,0,0)";
		else 
			var poweredColour = "rgb(128,0,0)";
			
		/*
		 * Top (up, right, down, left)
		 * Behind (always the same)
		 * Front (up, down) powered or not
		 * Side (up down) powered or not
		 */
		
		canvas.save();
		this.rotateContext(rotated, canvas);
		
		switch(view) {
			case "top":
				canvas.fillStyle = poweredColour;
				canvas.fillRect(3, 2, 2, 4);
				
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 6, 4, 2);
				canvas.fillRect(3, 1, 2, 1);
				break;
			case "facingToward":
				if (isThrown) {
					this.rotateContext(180, canvas);					
				}
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 1, 4, 6);
				canvas.fillRect(3, 0, 2, 1);
				
				canvas.fillStyle = poweredColour;
				canvas.fillRect(3, 1, 2, 4);
				break;
			case "facingAway":
				if (isThrown) {
					this.rotateContext(180, canvas);					
				}
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 1, 4, 6);
				canvas.fillRect(3, 0, 2, 1);
				break;
			case "leaningRight":
				if ((isThrown) ? mirrored : !mirrored) {
					canvas.scale(-1, 1);
					canvas.translate(-8, 0);
				}
	
				canvas.translate(4, 0);
				canvas.rotate(Math.PI*0.15);
	
				canvas.fillStyle = poweredColour;
				canvas.fillRect(2, 1, 2, 5);
	
				canvas.fillStyle = baseColour;
				canvas.fillRect(2, 0, 2, 1+0.5);
	
				canvas.rotate(-Math.PI*0.15);
				canvas.translate(-4, 0);
	
				if (mirrored) {
					canvas.translate(8, 0);
					canvas.scale(-1, 1);
				}
	
				canvas.fillStyle = baseColour;
				canvas.fillRect(1, 6, 6, 2);
				return;
		}
		canvas.restore();
	}
}());
; 
com.mordritch.mcSim.BlockType_Log = function(){}
	com.mordritch.mcSim.BlockType_Log.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Log.prototype.material = "wood";
; 
com.mordritch.mcSim.BlockType_Netherrack = function(){}
	com.mordritch.mcSim.BlockType_Netherrack.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Netherrack.prototype.material = "rock";
; 
com.mordritch.mcSim.BlockType_Obsidian = function(){}
	com.mordritch.mcSim.BlockType_Obsidian.prototype = new com.mordritch.mcSim.BlockType_Stone();
	
	com.mordritch.mcSim.BlockType_Obsidian.prototype.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		canvas.fillStyle = "rgb(163,73,164)";
		canvas.fillRect(0, 0, 8, 8);
	}
; 
com.mordritch.mcSim.BlockType_Ore = function(){}
	com.mordritch.mcSim.BlockType_Ore.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Ore.prototype.material = "rock";
; 
com.mordritch.mcSim.BlockType_OreStorage = function(){}
	com.mordritch.mcSim.BlockType_OreStorage.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_OreStorage.prototype.material = "iron";
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PistonBase";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	var
		ORIENTATION_DOWN = 0,
		ORIENTATION_UP = 1,
		ORIENTATION_NORTH = 2,
		ORIENTATION_SOUTH = 3,
		ORIENTATION_WEST = 4,
		ORIENTATION_EAST = 5,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;

	proto.material = "piston";
	proto.isSticky = false; //bool
	proto.ignoreUpdates = false; //bool

	proto.construct = function(i, j, isSticky)
	{
		this.drawIconBlockMetadataOveride = 2;
		
		if (this.blockType == "pistonStickyBase") {
			this.isSticky = true;
		}
		else {
			this.isSticky = false;
		}
		
		//super(i, j, Material.piston); //TODO: make a plan
		this._renderAsNormalBlock = false;
		this.facing = new com.mordritch.mcSim.facing();
		//setStepSound(soundStoneFootstep);
		//setHardness(0.5);
	}
	
	proto.isOpaqueCube = function() {
		false;
	}
	
	proto.getRearEntity = function(world, entity) {
		var rearEntity;

		switch (entity.storedOrientation) {
			case ORIENTATION_DOWN:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord+1, entity.zCoord);
				break;
			case ORIENTATION_UP:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord-1, entity.zCoord);
				break;
			case ORIENTATION_NORTH:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord, entity.zCoord+1);
				break;
			case ORIENTATION_SOUTH:
				rearEntity = world.getBlockTileEntity(entity.xCoord, entity.yCoord, entity.zCoord-1);
				break;
			case ORIENTATION_WEST:
				rearEntity = world.getBlockTileEntity(entity.xCoord+1, entity.yCoord, entity.zCoord);
				break;
			case ORIENTATION_EAST:
				rearEntity = world.getBlockTileEntity(entity.xCoord-1, entity.yCoord, entity.zCoord);
				break;
			default: throw new Error("Unexpected case");
		}
		
		return rearEntity;
	}

	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.drawMoving_generic(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing);
	}

	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.drawMoving_generic(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing = FACING_DOWN);
	}

	/**
	 * Used to draw portion of a whole block which is extending or retracting
	 * 
	 * Simulator only, not in minecraft.
	 */
	proto.drawMoving_generic = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		var storedMetadata = entity.storedMetadata;
		var rearEntity = this.getRearEntity(world, entity);
		var view = (lookingTowards == FACING_DOWN) ? "Top" : "Side";
		var drawView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;

		if (
			drawView == "towards" ||
			drawView == "away" ||
			!entity.shouldHeadBeRendered &&
			rearEntity != null &&
			typeof rearEntity.storedOrientation != 'undefined' &&
			rearEntity.storedOrientation == entity.storedOrientation
		) {
			//Draw as normal, with an offset which was done by the calling function
			if (forAboveLayer) {
				this["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata);
			}
			else {
				this["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata);
			}
			return;
		}
		
		if (
			posX == entity.xCoord &&
			posY == entity.yCoord &&
			posZ == entity.zCoord
		) {
			//We are the base part, rather than the head, we need to undo the offset and render an extended base
			canvas.save();
			var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;
			this.rotateContext(rotateAmount, canvas);

			switch (entity.progress) {
				case 0:
					canvas.translate(0, 6);
					break;
				case 0.5:
					canvas.translate(0, 4);
					break;
				case 1:
					canvas.translate(0, 2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			if (forAboveLayer) {
				this["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata | 0x8, forAboveLayer); //setting that bit makes it extended
			}
			else {
				this["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, storedMetadata | 0x8, forAboveLayer); //setting that bit makes it extended
			}
			canvas.restore();
		}
		else {
			//Draw the extension
			var pistonExtension = world.Block.pistonExtension;
			// Layout of metadata for pistons and heads are different, so we need to convert, with both, the first 3 bits is the orientiation,
			// with extension, 4th bit is sticky/not sticky while with base, 4th bit is whether or not the piston is extended
			if (this.isSticky) {
				var metadataForPistonExtension = storedMetadata | 0x8; //Set the 4th (isSticky) bit
			}
			else {
				var metadataForPistonExtension = storedMetadata & 0x7; //Only pass the first 3 bits, leaving the 8th bit unset, making it not sticky
			}
			
			if (forAboveLayer) {
				pistonExtension["draw" + view + "View_aboveLayer"](world, posX, posY, posZ, canvas, lookingTowards, metadataForPistonExtension);
			}
			else {
				pistonExtension["draw" + view + "View_currentLayer"](world, posX, posY, posZ, canvas, lookingTowards, metadataForPistonExtension);
			} 
		}
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = true);
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	}
	
	proto.draw_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		if (typeof blockMetadata == 'undefined') blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		var isExtended = this.isExtended(blockMetadata);
		var orientation = this.getOrientation(blockMetadata);
		var drawView, rotatedBy;

		var view = this.getDrawViewAndRotation(currentFacing, orientation).view;
		var rotatedBy = this.getDrawViewAndRotation(currentFacing, orientation).rotateBy;
		
		var stickyColour = "rgb(181, 230, 29)";
		var woodColour = "rgb(168,135,84)";
		var stoneColour = "rgb(64, 64, 64)";
		var poweredColour = "rgb(255,0,0)";
		var unpoweredOnWoodColour = "rgb(128,0,0)";
		var unpoweredOnStoneColour = "rgb(255,255,255)";
		var stickyOrWood = (this.isSticky) ? stickyColour : woodColour;
			
		var drawSize = 8;
		

		switch (view) {
			case "towards":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.moveTo(1, 0);
					canvas.lineTo(1, 1);
					canvas.lineTo(4, 1);
					canvas.lineTo(4, 3);
					canvas.lineTo(6, 3);
					canvas.lineTo(6, 1);
					canvas.lineTo(7, 1);
					canvas.lineTo(7, 7);
					canvas.lineTo(6, 7);
					canvas.lineTo(6, 5);
					canvas.lineTo(4, 5);
					canvas.lineTo(4, 7);
					canvas.lineTo(1, 7);
					canvas.lineTo(1, 0);
					
					canvas.lineTo(0, 0);
					canvas.lineTo(0, 8);
					canvas.lineTo(8, 8);
					canvas.lineTo(8, 0);
					canvas.lineTo(1, 0);
					canvas.fill();
				}
				else {
					if (!isExtended) {
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(0, 0, drawSize, drawSize);
					
						canvas.fillStyle = unpoweredOnWoodColour;
						canvas.fillRect(1, 1, 3, 6);
						canvas.fillRect(4, 3, 2, 2);
						canvas.fillRect(6, 1, 1, 6);
					}
					else {
						canvas.fillStyle = stoneColour;
						canvas.fillRect(0, 0, drawSize, drawSize);
	
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(3, 3, 2, 2);
					}
				}
				break;
			case "away":
				canvas.fillStyle = stoneColour;
				canvas.fillRect(0, 0, drawSize, drawSize);
				
				canvas.fillStyle = stickyOrWood;
				canvas.fillRect(1, 1, 6, 6);

				if (isExtended) {
					canvas.fillStyle = poweredColour;
				}
				else {
					canvas.fillStyle = unpoweredOnStoneColour;
				}
				canvas.fillRect(1, 1, 3, 6);
				canvas.fillRect(4, 3, 2, 2);
				canvas.fillRect(6, 1, 1, 6);

				break;
			case "side":
				canvas.save();
				this.rotateContext(rotatedBy, canvas);
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					if (!isExtended) {
						canvas.beginPath();
						canvas.moveTo(0, 0);
						canvas.lineTo(8, 0);
						canvas.lineTo(8, 2);
						canvas.lineTo(5, 2);
						canvas.lineTo(5, 3);
						canvas.lineTo(6, 3);
						canvas.lineTo(6, 4);
						canvas.lineTo(8, 4);
						canvas.lineTo(8, 0);
						canvas.lineTo(8, 8);
	
						canvas.lineTo(0, 8);
						canvas.lineTo(0, 4);
						canvas.lineTo(2, 4);
						canvas.lineTo(2, 3);
						canvas.lineTo(3, 3);
						canvas.lineTo(3, 2);
						canvas.lineTo(0, 2);
						canvas.lineTo(0, 0);
						canvas.fill();
					}
					else {
						canvas.beginPath();
						canvas.moveTo(2, 0);
						canvas.lineTo(6, 0);
						canvas.lineTo(6, 4);
						canvas.lineTo(8, 4);
						canvas.lineTo(8, 8);
						canvas.lineTo(0, 8);
	
						canvas.lineTo(0, 4);
						canvas.lineTo(2, 4);
						canvas.lineTo(2, 0);
						canvas.fill();
					}
				}
				else {
					if (isExtended) {
						canvas.fillStyle = stoneColour;
						canvas.fillRect(2, 0, 4, 4);
					}
					else {
						canvas.fillStyle = stickyOrWood;
						canvas.fillRect(0, 0, drawSize, 2);
						
						canvas.fillStyle = stoneColour;
						canvas.fillRect(2, 3, 4, 1);
						canvas.fillRect(3, 2, 2, 1);
					}
					canvas.fillRect(0, 4, 8, 4);
				}
				canvas.restore();
				break;
			default:
				throw new Error("Uknown view: "+view);
		}
	}

	/* Relevent to game's renderer
	proto.getBlockTextureFromSideAndMetadata = function(i, j)
	{
		var k = this.getOrientation(j);
		if (k > 5)
		{
			return this.blockIndexInTexture;
		}
		if (i == k)
		{
			if (isExtended(j) || minX > 0.0 || minY > 0.0 || minZ > 0.0 || maxX < 1.0 || maxY < 1.0 || maxZ < 1.0)
			{
				return 110;
			}
			else
			{
				return blockIndexInTexture;
			}
		}
		return i != this.facing.faceToSide[k] ? 108 : 109;
	}
	*/

	/* Relevent to game's renderer
	proto.getRenderType = function()
	{
		return 16;
	}
	*/

	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		world.setBlockMetadataWithNotify(posX, posY, posZ, ORIENTATION_NORTH);
	}

	proto.blockActivated = function(world, posX, posY, posZ)
	{
		return false;
	}

	/**
	 * Unused? 
	 */
	/*
	proto.onBlockPlacedBy = function(world, posX, posY, posZ)
	{
		var orientation = 2;
		world.setBlockMetadataWithNotify(posX, posY, posZ, orientation);
		if (!world.isRemote && !this.ignoreUpdates)
		{
			this.updatePistonState(world, posX, posY, posZ);
		}
	}
	*/

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, l)
	{
		if (!world.isRemote && !this.ignoreUpdates)
		{
			this.updatePistonState(world, posX, posY, posZ);
		}
	}

	proto.onBlockAdded = function(world, posX, posY, posZ)
	{
		if (
			!world.isRemote && world.getBlockTileEntity(posX, posY, posZ) == null &&
			!this.ignoreUpdates
		) {
			this.updatePistonState(world, posX, posY, posZ);
		}
	}

	proto.updatePistonState = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var orientation = this.getOrientation(blockMetadata);
		var isIndirectlyPowered = this.isIndirectlyPowered(world, posX, posY, posZ, orientation);
		if (blockMetadata == 7)
		{
			return;
		}
		if (isIndirectlyPowered && !this.isExtended(blockMetadata))
		{
			if (this.canExtend(world, posX, posY, posZ, orientation))
			{
				world.setBlockMetadata(posX, posY, posZ, orientation | 8);
				world.playNoteAt(posX, posY, posZ, 0, orientation);
			}
		}
		else if (!isIndirectlyPowered && this.isExtended(blockMetadata))
		{
			world.setBlockMetadata(posX, posY, posZ, orientation);
			world.playNoteAt(posX, posY, posZ, 1, orientation);
		}
	}

	proto.isIndirectlyPowered = function(world, posX, posY, posZ, direction)
	{
		if (direction != 0 && world.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if (direction != 1 && world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ, 1))
		{
			return true;
		}
		if (direction != 2 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if (direction != 3 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if (direction != 5 && world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5))
		{
			return true;
		}
		if (direction != 4 && world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ, 0))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 2, posZ, 1))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ - 1, 2))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX, posY + 1, posZ + 1, 3))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY + 1, posZ, 4))
		{
			return true;
		}
		if (world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY + 1, posZ, 5)) {
			return true;
		}
		
		return false;
	}

	proto.powerBlock = function(world, posX, posY, posZ, isExtendedParamater, orientation) {
		this.ignoreUpdates = true;
		if (isExtendedParamater == 0)
		{
			if (this.tryExtend(world, posX, posY, posZ, orientation))
			{
				world.setBlockMetadataWithNotify(posX, posY, posZ, orientation | 8);
				//world.playSoundEffect(posX + 0.5, posY + 0.5, posZ + 0.5, "tile.piston.out", 0.5, world.rand.nextFloat() * 0.25 + 0.6);
			}
			else
			{
				world.setBlockMetadata(posX, posY, posZ, orientation);
			}
		}
		else if (isExtendedParamater == 1)
		{
			var tileentity = world.getBlockTileEntity(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation]);
			if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
			{
				tileentity.clearPistonTileEntity();
			}
			world.setBlockAndMetadata(posX, posY, posZ, world.Block.pistonMoving.blockID, orientation);
			world.setBlockTileEntity(posX, posY, posZ, world.Block.pistonMoving.getTileEntity(this.blockID, orientation, orientation, false, true, world));
			if (this.isSticky)
			{
				var stickyOffsetX = posX + this.facing.offsetsXForSide[orientation] * 2;
				var stickyOffsetY = posY + this.facing.offsetsYForSide[orientation] * 2;
				var stickyOffsetZ = posZ + this.facing.offsetsZForSide[orientation] * 2;
				var stickyBlockID = world.getBlockId(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
				var stickyBlockMetadata = world.getBlockMetadata(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
				var flag = false;
				if (stickyBlockID == world.Block.pistonMoving.blockID)
				{
					var tileentity1 = world.getBlockTileEntity(stickyOffsetX, stickyOffsetY, stickyOffsetZ);
					if (tileentity1 != null && (tileentity1 instanceof com.mordritch.mcSim.TileEntity_Piston))
					{
						var tileentitypiston = tileentity1;
						if (tileentitypiston.getPistonOrientation() == orientation && tileentitypiston.isExtending())
						{
							tileentitypiston.clearPistonTileEntity();
							stickyBlockID = tileentitypiston.getStoredBlockID();
							stickyBlockMetadata = tileentitypiston.getBlockMetadata();
							flag = true;
						}
					}
				}
				if (!flag && stickyBlockID > 0 && this.canPushBlock(stickyBlockID, world, stickyOffsetX, stickyOffsetY, stickyOffsetZ, false) && (world.Block.blocksList[stickyBlockID].getMobilityFlag() == 0 || stickyBlockID == world.Block.pistonBase.blockID || stickyBlockID == world.Block.pistonStickyBase.blockID))
				{
					posX += this.facing.offsetsXForSide[orientation];
					posY += this.facing.offsetsYForSide[orientation];
					posZ += this.facing.offsetsZForSide[orientation];
					world.setBlockAndMetadata(posX, posY, posZ, world.Block.pistonMoving.blockID, stickyBlockMetadata);
					world.setBlockTileEntity(posX, posY, posZ, world.Block.pistonMoving.getTileEntity(stickyBlockID, stickyBlockMetadata, orientation, false, false, world));
					this.ignoreUpdates = false;
					world.setBlockWithNotify(stickyOffsetX, stickyOffsetY, stickyOffsetZ, 0);
					this.ignoreUpdates = true;
				}
				else if (!flag)
				{
					this.ignoreUpdates = false;
					world.setBlockWithNotify(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation], 0);
					this.ignoreUpdates = true;
				}
			}
			else
			{
				this.ignoreUpdates = false;
				world.setBlockWithNotify(posX + this.facing.offsetsXForSide[orientation], posY + this.facing.offsetsYForSide[orientation], posZ + this.facing.offsetsZForSide[orientation], 0);
				this.ignoreUpdates = true;
			}
			//world.playSoundEffect((double)posX + 0.5D, (double)posY + 0.5D, (double)posZ + 0.5D, "tile.piston.in", 0.5F, world.rand.nextFloat() * 0.15F + 0.6F);
		}
		this.ignoreUpdates = false;
	}

	/* Relevent to game's renderer
	proto.setBlockBoundsBasedOnState = function(world, i, j, k)
	{
		var l = world.getBlockMetadata(i, j, k);
		if (isExtended(l))
		{
			switch (getOrientation(l))
			{
				case 0:
					setBlockBounds(0.0, 0.25, 0.0, 1.0, 1.0, 1.0);
					break;

				case 1:
					setBlockBounds(0.0, 0.0, 0.0, 1.0, 0.75, 1.0);
					break;

				case 2:
					setBlockBounds(0.0, 0.0, 0.25, 1.0, 1.0, 1.0);
					break;

				case 3:
					setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 0.75);
					break;

				case 4:
					setBlockBounds(0.25, 0.0, 0.0, 1.0, 1.0, 1.0);
					break;

				case 5:
					setBlockBounds(0.0, 0.0, 0.0, 0.75, 1.0, 1.0);
					break;
			}
		}
		else
		{
			setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
		}
	}
	*/

	/* Relevent to game's renderer
	proto.setBlockBoundsForItemRender = function()
	{
		setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
	}
	*/

	/* Relevent to game's renderer
	proto.getCollidingBoundingBoxes = function(world, i, j, k, axisalignedbb, arraylist)
	{
		setBlockBounds(0.0, 0.0, 0.0, 1.0, 1.0, 1.0);
		//super.getCollidingBoundingBoxes(world, i, j, k, axisalignedbb, arraylist); TODO: Make a plan
	}
	*/

	proto.getOrientation = function(blockMetadata)
	{
		return blockMetadata & 0x7;
	}

	proto.isExtended = function(blockMetadata)
	{
		return (blockMetadata & 0x8) != 0;
	}

	/**
	 * Not implemented, it's for the game, to deternmine which way the piston faces based on the placing player's position 
	proto.determineOrientation = function(world, i, j, k)
	{
		if (Math.abs(entityplayer.posX - i) < 2.0 && Math.abs(entityplayer.posZ - k) < 2.0)
		{
			var d = (entityplayer.posY + 1.8200000000000001) - entityplayer.yOffset;
			if (d - j > 2)
			{
				return 1;
			}
			if (j - d > 0.0)
			{
				return 0;
			}
		}
		var l = MathHelper.floor_double(((entityplayer.rotationYaw * 4) / 360) + 0.5) & 3;
		if (l == 0)
		{
			return 2;
		}
		if (l == 1)
		{
			return 5;
		}
		if (l == 2)
		{
			return 3;
		}
		return l != 3 ? 0 : 4;
	}
	 */

	proto.canPushBlock = function(blockID, world, posX, posY, posZ, flag)
	{
		if (blockID == world.Block.obsidian.blockID)
		{
			return false;
		}
		if (blockID == world.Block.pistonBase.blockID || blockID == world.Block.pistonStickyBase.blockID)
		{
			if (this.isExtended(world.getBlockMetadata(posX, posY, posZ)))
			{
				return false;
			}
		}
		else
		{
			/*
			if (world.Block.blocksList[blockID].getHardness() == -1)
			{
				return false;
			}
			*/
			if (world.Block.blocksList[blockID].getMobilityFlag() == 2)
			{
				return false;
			}
			if (!flag && world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				return false;
			}
		}
		return !(world.Block.blocksList[blockID] instanceof com.mordritch.mcSim.BlockType_Container);
	}
	
	proto.canExtend = function(world, posX, posY, posZ, direction)
	{
		var offsetX = posX + this.facing.offsetsXForSide[direction];
		var offsetY = posY + this.facing.offsetsYForSide[direction];
		var offsetZ = posZ + this.facing.offsetsZForSide[direction];
		
		var i = 0;
		do
		{
			if (i >= 13)
			{
				break;
			}
			//if (offsetY <= 0 || offsetY >= world.worldData.getSizeY() - 1) //original
			if (offsetY < 0 || offsetY >= world.worldData.getSizeY())
			{
				return false;
			}
			var blockID = world.getBlockId(offsetX, offsetY, offsetZ);
			if (blockID == 0)
			{
				break;
			}
			if (!this.canPushBlock(blockID, world, offsetX, offsetY, offsetZ, true))
			{
				return false;
			}
			if (world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				break;
			}
			if (i == 12)
			{
				return false;
			}
			offsetX += this.facing.offsetsXForSide[direction];
			offsetY += this.facing.offsetsYForSide[direction];
			offsetZ += this.facing.offsetsZForSide[direction];
			i++;
		}
		while (true);
		return true;
	}

	proto.tryExtend = function(world, posX, posY, posZ, direction)
	{
		var offsetX = posX + this.facing.offsetsXForSide[direction];
		var offsetY = posY + this.facing.offsetsYForSide[direction];
		var offsetZ = posZ + this.facing.offsetsZForSide[direction];
		
		var i = 0;
		do
		{
			if (i >= 13)
			{
				break;
			}
			//if (offsetY <= 0 || offsetY >= world.worldData.getSizeY() - 1) //the original from the source
			if (offsetY < 0 || offsetY >= world.worldData.getSizeY())
			{
				return false;
			}
			var blockID = world.getBlockId(offsetX, offsetY, offsetZ);
			if (blockID == 0)
			{
				break;
			}
			if (!this.canPushBlock(blockID, world, offsetX, offsetY, offsetZ, true))
			{
				return false;
			}
			if (world.Block.blocksList[blockID].getMobilityFlag() == 1)
			{
				//world.Block.blocksList[blockID].dropBlockAsItem(world, offsetX, offsetY, offsetZ, world.getBlockMetadata(offsetX, offsetY, offsetZ), 0);
				world.setBlockWithNotify(offsetX, offsetY, offsetZ, 0);
				break;
			}
			if (i == 12)
			{
				return false;
			}
			offsetX += this.facing.offsetsXForSide[direction];
			offsetY += this.facing.offsetsYForSide[direction];
			offsetZ += this.facing.offsetsZForSide[direction];
			i++;
		}
		while (true);
		
		var offsetZofBlockToCheck = 0; //int
		for (; offsetX != posX || offsetY != posY || offsetZ != posZ; offsetZ = offsetZofBlockToCheck)
		{
			var offsetXofBlockToCheck = offsetX - this.facing.offsetsXForSide[direction];
			var offsetYofBlockToCheck = offsetY - this.facing.offsetsYForSide[direction];
			offsetZofBlockToCheck = offsetZ - this.facing.offsetsZForSide[direction];
			var blockID = world.getBlockId(offsetXofBlockToCheck, offsetYofBlockToCheck, offsetZofBlockToCheck);
			var blockMetadata = world.getBlockMetadata(offsetXofBlockToCheck, offsetYofBlockToCheck, offsetZofBlockToCheck);
			if (blockID == this.blockID && offsetXofBlockToCheck == posX && offsetYofBlockToCheck == posY && offsetZofBlockToCheck == posZ)
			{
				world.setBlockAndMetadata(offsetX, offsetY, offsetZ, world.Block.pistonMoving.blockID, direction | (this.isSticky ? 8 : 0));
				world.setBlockTileEntity(offsetX, offsetY, offsetZ, world.Block.pistonMoving.getTileEntity(world.Block.pistonExtension.blockID, direction | (this.isSticky ? 8 : 0), direction, true, false, world));
			}
			else
			{
				world.setBlockAndMetadata(offsetX, offsetY, offsetZ, world.Block.pistonMoving.blockID, blockMetadata);
				world.setBlockTileEntity(offsetX, offsetY, offsetZ, world.Block.pistonMoving.getTileEntity(blockID, blockMetadata, direction, true, false, world));
			}
			offsetX = offsetXofBlockToCheck;
			offsetY = offsetYofBlockToCheck;
		}

		return true;
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isExtended = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 1, 5, 4, 2, 3)[orientation];
		}
		return orientation | isExtended;
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if (this.isExtended(blockMetadata)) {
			console.log("Cannot rotate piston at %s, %s, %s, already extended.", posX, posY, posZ);
			return;
		}
		
		var orientation = this.getOrientation(blockMetadata);
		var blockMetadata = new Array(1, 2, 5, 4, 0, 3)[orientation];
		world.setBlockMetadataWithNotify(posX, posY, posZ, blockMetadata);
	}

	proto.getDrawViewAndRotation = function(currentFacing, orientation) {
		var view, rotateBy;
		
		switch (currentFacing) {
			case FACING_DOWN:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_UP:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 90;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_NORTH:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 90;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_EAST:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_WEST:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_EAST:
						view = "away";
						rotateBy = 0;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_SOUTH:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "towards";
						rotateBy = 0;
						break;
					case ORIENTATION_SOUTH:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_WEST:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_EAST:
						view = "side";
						rotateBy = 270;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			case FACING_WEST:
				switch (orientation) {
					case ORIENTATION_DOWN:
						view = "side";
						rotateBy = 180;
						break;
					case ORIENTATION_UP:
						view = "side";
						rotateBy = 0;
						break;
					case ORIENTATION_NORTH:
						view = "side";
						rotateBy = 90;
						break;
					case ORIENTATION_SOUTH:
						view = "side";
						rotateBy = 270;
						break;
					case ORIENTATION_WEST:
						view = "away";
						rotateBy = 0;
						break;
					case ORIENTATION_EAST:
						view = "towards";
						rotateBy = 0;
						break;
					default: throw new Error("Unexpected case");
				}
				break;
			default: throw new Error("Unexpected case");
		}
		return {view: view, rotateBy: rotateBy};
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PistonExtension";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	var
		ORIENTATION_DOWN = 0,
		ORIENTATION_UP = 1,
		ORIENTATION_NORTH = 2,
		ORIENTATION_SOUTH = 3,
		ORIENTATION_WEST = 4,
		ORIENTATION_EAST = 5,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;

	proto.material = "piston";
	
	proto.getDrawViewAndRotation = namespace.BlockType_PistonBase.prototype.getDrawViewAndRotation;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.facing = new com.mordritch.mcSim.facing();
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata, forAboveLayer = true);
	}
	
	proto.drawTopView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing = FACING_DOWN, blockMetadata = entity.storedMetadata, forAboveLayer);
	}

	proto.drawSideView_moving = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, currentFacing) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata = entity.storedMetadata, forAboveLayer);
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.draw_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	}

	proto.draw_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		blockMetadata = (typeof blockMetadata != 'undefined') ? blockMetadata : world.getBlockMetadata(posX, posY, posZ);
		var orientation = blockMetadata & 0x7;
		var rotatedBy = this.getDrawViewAndRotation(currentFacing, orientation).rotateBy;
		var view = this.getDrawViewAndRotation(currentFacing, orientation).view;

		var stickyColour = "rgb(181, 230, 29)";
		var woodColour = "rgb(168,135,84)";
		var stoneColour = "rgb(64, 64, 64)";
		var poweredColour = "rgb(255,0,0)";
		var unpoweredOnWoodColour = "rgb(128,0,0)";
		var unpoweredOnStoneColour = "rgb(255,255,255)";
		
		var stickyOrWood = ((blockMetadata & 0x8) == 0x8) ? stickyColour : woodColour;

		switch (view) {
			case "towards":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.lineTo(1, 0);
					canvas.moveTo(1, 1);
					canvas.moveTo(4, 1);
					canvas.moveTo(4, 3);
					canvas.moveTo(6, 3);
					canvas.moveTo(6, 1);
					canvas.moveTo(7, 1);
					canvas.moveTo(7, 7);
					canvas.moveTo(6, 7);
					canvas.moveTo(6, 5);
					canvas.moveTo(4, 5);
					canvas.moveTo(4, 7);
					canvas.moveTo(1, 7);
					canvas.moveTo(1, 0);
					
					canvas.moveTo(0, 0);
					canvas.moveTo(0, 8);
					canvas.moveTo(8, 8);
					canvas.moveTo(8, 0);
					canvas.moveTo(1, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 8);
					
					canvas.fillStyle = poweredColour;
					canvas.fillRect(1, 1, 3, 6);
					canvas.fillRect(4, 3, 2, 2);
					canvas.fillRect(6, 1, 1, 6);
				}
				break;
			case "away":
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.lineTo(1, 0);
					canvas.moveTo(1, 1);
					canvas.moveTo(4, 1);
					canvas.moveTo(4, 3);
					canvas.moveTo(6, 3);
					canvas.moveTo(6, 1);
					canvas.moveTo(7, 1);
					canvas.moveTo(7, 7);
					canvas.moveTo(6, 7);
					canvas.moveTo(6, 5);
					canvas.moveTo(4, 5);
					canvas.moveTo(4, 7);
					canvas.moveTo(1, 7);
					canvas.moveTo(1, 0);
					
					canvas.moveTo(0, 0);
					canvas.moveTo(0, 8);
					canvas.moveTo(8, 8);
					canvas.moveTo(8, 0);
					canvas.moveTo(1, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 8);
					
					canvas.fillStyle = stoneColour;
					canvas.fillRect(2, 2, 4, 4);
				}
				break;
			case "side":
				canvas.save();
				this.rotateContext(rotatedBy, canvas);
				if (forAboveLayer) {
					canvas.fillStyle = "rgba(128,128,128,0.5)";
					canvas.beginPath();
					canvas.moveTo(0, 0);
	
					canvas.lineTo(0, 0);
					canvas.lineTo(8, 0);
					canvas.lineTo(8, 2);
					canvas.lineTo(5, 2);
					canvas.lineTo(5, 8);
					canvas.lineTo(3, 8);
					canvas.lineTo(3, 2);
					canvas.lineTo(0, 2);
					canvas.lineTo(0, 0);
					
					canvas.fill();
				}
				else {
					canvas.fillStyle = stickyOrWood;
					canvas.fillRect(0, 0, 8, 2);
					
					canvas.fillStyle = stoneColour;
					canvas.fillRect(3, 2, 2, 6);
				}
				canvas.restore();
				break;
			default: throw new Error("Unexepected case")
		}
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var isSticky = blockMetadata & 8;
		var orientation = blockMetadata & 7;
		for (var i=0; i<amount; i++) {
			orientation = new Array(0, 1, 5, 4, 2, 3)[orientation];
		}
		return orientation | isSticky;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ)
	{
		return false;
	}

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, l)
	{
		var direction = this.getDirectionMeta(world.getBlockMetadata(posX, posY, posZ));
		var blockID = world.getBlockId(posX - this.facing.offsetsXForSide[direction], posY - this.facing.offsetsYForSide[direction], posZ - this.facing.offsetsZForSide[direction]);
		if (blockID != world.Block.pistonBase.blockID && blockID != world.Block.pistonStickyBase.blockID)
		{
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
		else
		{
			world.Block.blocksList[blockID].onNeighborBlockChange(world, posX - this.facing.offsetsXForSide[direction], posY - this.facing.offsetsYForSide[direction], posZ - this.facing.offsetsZForSide[direction], l);
		}
	}

	proto.getDirectionMeta = function(blockMetadata)
	{
		return blockMetadata & 0x7;
	}

	proto.onBlockRemoval = function(world, posX, posY, posZ)
	{
		//super.onBlockRemoval(world, posX, posY, posZ); //FIXME
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var faceToSide = this.facing.faceToSide[this.getDirectionMeta(blockMetadata)];
		posX += this.facing.offsetsXForSide[faceToSide];
		posY += this.facing.offsetsYForSide[faceToSide];
		posZ += this.facing.offsetsZForSide[faceToSide];
		var blockID = world.getBlockId(posX, posY, posZ);
		if (blockID == world.Block.pistonBase.blockID || blockID == world.Block.pistonStickyBase.blockID)
		{
			var newBlockMetadata = world.getBlockMetadata(posX, posY, posZ);
			if (world.Block.pistonBase.isExtended(newBlockMetadata))
			{
				//world.Block.blocksList[blockID].dropBlockAsItem(world, posX, posY, posZ, newBlockMetadata, 0);
				world.setBlockWithNotify(posX, posY, posZ, 0);
			}
		}
	}

	proto.enumeratePlaceableBlocks = function() {
		return [];
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Container";
	var funcName = "BlockType_PistonMoving";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	var
		ORIENTATION_DOWN = 0,
		ORIENTATION_UP = 1,
		ORIENTATION_NORTH = 2,
		ORIENTATION_SOUTH = 3,
		ORIENTATION_WEST = 4,
		ORIENTATION_EAST = 5,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;

	proto.material = "piston";
	
	proto.getDrawViewAndRotation = namespace.BlockType_PistonBase.prototype.getDrawViewAndRotation;
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = false, currentFacing = FACING_DOWN);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = true, currentFacing = FACING_DOWN);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = false, currentFacing);
	}
	
	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawGenericView_moving(world, posX, posY, posZ, canvas, forAboveLayer = true, currentFacing);
	}
	
	proto.drawGenericView_moving = function(world, posX, posY, posZ, canvas, forAboveLayer, lookingTowards) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		var blockView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;
		var view = (lookingTowards == FACING_DOWN) ? "Top" : "Side";
		var storedBlock = world.Block.blocksList[entity.storedBlockID];

		if (blockView == "towards" || blockView == "away") {
			storedBlock["draw" + view + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			return;
		}

		var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;	

		switch(entity.storedOrientation) {
			case ORIENTATION_DOWN:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY-1, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX, posY+1, posZ);
				break;
			case ORIENTATION_UP:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY+1, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX, posY-1, posZ);
				break;
			case ORIENTATION_NORTH:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY, posZ-1);
				var entityBehindOf = world.getBlockTileEntity(posX, posY, posZ+1);
				break;
			case ORIENTATION_SOUTH:
				var entityInFrontOf = world.getBlockTileEntity(posX, posY, posZ+1);
				var entityBehindOf = world.getBlockTileEntity(posX, posY, posZ-1);
				break;
			case ORIENTATION_WEST:
				var entityInFrontOf = world.getBlockTileEntity(posX-1, posY, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX+1, posY, posZ);
				break;
			case ORIENTATION_EAST:
				var entityInFrontOf = world.getBlockTileEntity(posX+1, posY, posZ);
				var entityBehindOf = world.getBlockTileEntity(posX-1, posY, posZ);
				break;
			default: throw new Error("Unexpected case");
		}
		
		canvas.save();
		this.rotateContext(rotateAmount, canvas);
		canvas.beginPath();
		canvas.rect(0,0,8,8);
		canvas.closePath();
		canvas.clip();
		
		if (entity.extending) {
			switch (entity.progress) {
				case 0:
					canvas.translate(0, 6);
					break;
				case 0.5:
					canvas.translate(0, 4);
					break;
				case 1:
					canvas.translate(0, 2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			storedBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			if (
				entityInFrontOf != null &&
				entityInFrontOf.storedOrientation == entity.storedOrientation
			) {
				this.rotateContext(rotateAmount, canvas);
				canvas.translate(0, -8);
				this.rotateContext(360-rotateAmount, canvas);
				var otherBlock = world.Block.blocksList[entityInFrontOf.storedBlockID];
				otherBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entityInFrontOf, forAboveLayer, lookingTowards);
			}
		}
		else {
			switch (entity.progress) {
				case 0:
					canvas.translate(0, -6);
					break;
				case 0.5:
					canvas.translate(0, -4);
					break;
				case 1:
					canvas.translate(0, -2);
					break;
				default: throw new Error("Unexpected case");
			}
			this.rotateContext(360-rotateAmount, canvas);
			storedBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			if (
				entityBehindOf != null &&
				entityBehindOf.storedOrientation == entity.storedOrientation
			) {
				this.rotateContext(rotateAmount, canvas);
				canvas.translate(0, 8);
				this.rotateContext(360-rotateAmount, canvas);
				var otherBlock = world.Block.blocksList[entityBehindOf.storedBlockID];
				otherBlock["draw"+view+"View_moving"](world, posX, posY, posZ, canvas, entityBehindOf, forAboveLayer, lookingTowards);
			}
		}
		canvas.restore();
	}

	proto.rotateSelection = function(blockMetadata, amount) {
		//The stored block will be called by the part of the rotateSelection function which updated entities
		return 0;
	}

	proto.drawTopView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		this.drawGenericView_moving_fromAir(world, posX, posY, posZ, canvas, entity, forAboveLayer, FACING_DOWN);
	}

	proto.drawSideView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		this.drawGenericView_moving_fromAir(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
	}

	proto.drawGenericView_moving_fromAir = function(world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards) {
		var storedBlock = world.Block.blocksList[entity.storedBlockID];
		var blockView = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).view;
		var drawView = (lookingTowards == FACING_DOWN) ? "Top" : "Side";

		if (blockView == "towards" || blockView == "away") {
			storedBlock["draw" + drawView + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
			return;
		}

		var rotateAmount = this.getDrawViewAndRotation(lookingTowards, entity.storedOrientation).rotateBy;
		
		canvas.save();
		this.rotateContext(rotateAmount, canvas);
        canvas.beginPath();
        canvas.rect(0,0,8,8);
        canvas.closePath();
        canvas.clip();
		
		switch (entity.progress) {
			case 0:
				canvas.translate(0, 2);
				break;
			case 0.5:
				canvas.translate(0, 4);
				break;
			case 1:
				canvas.translate(0, 6);
				break;
			default: throw new Error("Unexpected case");
		}
		this.rotateContext(360-rotateAmount, canvas);
		storedBlock["draw" + drawView + "View_moving"](world, posX, posY, posZ, canvas, entity, forAboveLayer, lookingTowards);
		
		canvas.restore();
	}

	proto.getBlockEntity = function() {
		return null;
	}
	
	proto.onBlockAdded = function(world, posX, posY, posZ) {
	}
	
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		var tileentity = world.getBlockTileEntity(posX, posY, posZ);
		if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
		{
			tileentity.clearPistonTileEntity();
		}
		else
		{
			//super.onBlockRemoval(world, i, j, k); //TODO: Make a plan
		}
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		//source code seems to do nothing:
		/*
        if (!world.isRemote)
        {
            if (world.getBlockTileEntity(i, j, k) != null);
        }
		 */
	}
	
	proto.getTileEntity = function(blockID, blockMetadata, orientation, flag, flag1, world)
    {
        var tileEntityPiston = new com.mordritch.mcSim.TileEntity_Piston();
        tileEntityPiston.construct(blockID, blockMetadata, orientation, flag, flag1, world);
        return tileEntityPiston;
    }
    
	proto.getTileEntityAtLocation = function(world, posX, posY, posZ) {
        var tileentity = world.getBlockTileEntity(posX, posY, posZ);
        if (tileentity != null && (tileentity instanceof com.mordritch.mcSim.TileEntity_Piston))
        {
            return tileentity;
        }
        else
        {
            return null;
        }
	}

	proto.enumeratePlaceableBlocks = function() {
		return new Array();
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_PressurePlate";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.construct = function() {
		this.tickOnLoad = true;
		this._renderAsNormalBlock = false;
	}
	
	proto.tickRate = function() {
		return 20;
	}
	
	proto.updateTick = function(world, posX, posY, posZ) {
		//Not implemented, in the simulator, pressure plates behave more like switches, since there aren't things
		//around to put weight on them, so instead we just toggle them on and off.
    }
    
	proto.toggleBlock = function(world, posX, posY, posZ) {
		blockMetadata = world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1;
		
		if (blockMetadata) {
			world.setBlockMetadataWithNotify(posX, posY, posZ, 0);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		}
		else {
			world.setBlockMetadataWithNotify(posX, posY, posZ, 1);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, this.blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
		}
	}
    
    
	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		if (blockMetadata > 0)
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		}
		//super.onBlockRemoval(world, posX, posY, posZ);
	}
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		return world.getBlockMetadata(posX, posY, posZ) > 0;
	}
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		if (world.getBlockMetadata(posX, posY, posZ) == 0) {
			return false;
		}
		else {
			return direction == 1;
		}
	}
	
	proto.canProvidePower = function() {
		return true;
	}
	
	proto.getMobilityFlag = function() {
		return 1;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		var Block = world.Block;
		return world.isBlockNormalCube(posX, posY - 1, posZ) || world.getBlockId(posX, posY - 1, posZ) == Block.fence.blockID;
	}

	proto.onNeighborBlockChange = function(world, posX, posY, posZ, neighborBlockId) {
		if (!this.canPlaceBlockAt(world, posX, posY, posZ)) {
			//this.dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0);
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		if (this.blockType == "pressurePlateStone") {
			var plateColour = "rgb(64,64,64)"; //dark grey
		} else {
			var plateColour = "rgb(168,135,84)"; //brown
		}

		if (world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1) {
			var poweredColour = "rgb(255,0,0)";
		}
		else {
			var poweredColour = "rgb(128,0,0)";
		}

		canvas.fillStyle = poweredColour;
		canvas.fillRect(1, 1, 6, 6);
		
		canvas.fillStyle = plateColour;
		canvas.fillRect(2, 2, 4, 4);
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas) {
		if (this.blockType == "pressurePlateStone") {
			canvas.fillStyle = "rgb(64,64,64)"; //dark grey
		} else {
			canvas.fillStyle = "rgb(168,135,84)"; //brown
		}

		if (world.getBlockMetadata(posX, posY, posZ) & 0x1 == 1) {
			canvas.fillRect(1, 7, 6, 1);
		}
		else {
			canvas.fillRect(1, 5, 6, 3);
		}
	}
}());
; 
com.mordritch.mcSim.BlockType_Pumpkin = function(){}
	com.mordritch.mcSim.BlockType_Pumpkin.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_Pumpkin.prototype.material = "pumpkin";
; 
com.mordritch.mcSim.BlockType_RedstoneOre = function(){}
	com.mordritch.mcSim.BlockType_RedstoneOre.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_RedstoneOre.prototype.material = "rock";
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_RedstoneRepeater";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "circuits";
	proto.repeaterState = new Array(1,2,3,4);
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
		
		if (this.blockType == "redstoneRepeaterActive") {
			this.isRepeaterPowered = true;
		}
		
		if (this.blockType == "redstoneRepeaterIdle") {
			this.isRepeaterPowered = false;
		}
	}
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		return this.isPoweringTo(world, posX, posY, posZ, direction);
	}
	
	proto.toggleBlock = function(world, posX, posY, posZ) {
		this.blockActivated(world, posX, posY, posZ);
		world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		var facing = blockMetadata & 0x3;
		var delay = blockMetadata & 0xc;
		for (var i=0; i<amount; i++) {
			facing = new Array(1, 2, 3, 0)[facing];
		}
		return facing | delay;
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var repeaterOrientation = blockMetadata & 0x3;
		repeaterOrientation = (repeaterOrientation + 1) & 0x3;
		world.setBlockAndMetadataWithNotify(posX, posY, posZ, this.blockID, repeaterOrientation | (blockMetadata & 0xc));
	}
	
	proto.blockActivated = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var repeaterDelay = (blockMetadata & 0xc) >> 0x2;
		repeaterDelay = repeaterDelay + 1 << 0x2 & 0xc;
		world.setBlockMetadataWithNotify(posX, posY, posZ, repeaterDelay | blockMetadata & 0x3);
		return true;
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return world.isBlockNormalCube(posX, posY - 1, posZ);
	}

	proto.canBlockStay = function(world, posX, posY, posZ) {
		return this.canPlaceBlockAt(world, posX, posY, posZ);
	}

	proto.onBlockAdded = function (world, posX, posY, posZ)
	{
		world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
	}
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction) {
		if (!this.isRepeaterPowered) {
			return false;
		}
		var repeaterDirection = world.getBlockMetadata(posX, posY, posZ) & 3;
		
		if (repeaterDirection == 0 && direction == 3) {
			return true;
		}
		if (repeaterDirection == 1 && direction == 4) {
			return true;
		}
		if (repeaterDirection == 2 && direction == 2) {
			return true;
		}
		return repeaterDirection == 3 && direction == 5;
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ, direction) {
		if (!this.canBlockStay(world, posX, posY, posZ)) {
			//dropBlockAsItem(world, posX, posY, posZ, world.getBlockMetadata(posX, posY, posZ), 0); //NA for the simulator
			world.setBlockWithNotify(posX, posY, posZ, 0);
			return;
		}
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var ignoreTick = this.ignoreTick(world, posX, posY, posZ, blockMetadata);
		var repeaterDelay = (blockMetadata & 0xc) >> 2;
		if (this.isRepeaterPowered && !ignoreTick) {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.repeaterState[repeaterDelay] * 2);
		}
		else if (!this.isRepeaterPowered && ignoreTick) {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.repeaterState[repeaterDelay] * 2);
		}
	}
	
	proto.ignoreTick = function (world, posX, posY, posZ, blockMetadata) {
		var repeaterDirection= blockMetadata & 3;
		switch (repeaterDirection) {
			case 0:
				return world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3) || world.getBlockId(posX, posY, posZ + 1) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX, posY, posZ + 1) > 0;

			case 2:
				return world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2) || world.getBlockId(posX, posY, posZ - 1) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX, posY, posZ - 1) > 0;

			case 3:
				return world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5) || world.getBlockId(posX + 1, posY, posZ) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX + 1, posY, posZ) > 0;

			case 1:
				return world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4) || world.getBlockId(posX - 1, posY, posZ) == world.Block.redstoneWire.blockID && world.getBlockMetadata(posX - 1, posY, posZ) > 0;
		}
		return false;
	}
	
	proto.updateTick = function(world, posX, posY, posZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var ignoreTick = this.ignoreTick(world, posX, posY, posZ, blockMetadata);
		if (this.isRepeaterPowered && !ignoreTick) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.redstoneRepeaterIdle.blockID, blockMetadata);
		}
		else if (!this.isRepeaterPowered) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.redstoneRepeaterActive.blockID, blockMetadata);
			if (!ignoreTick) {
				var repeaterDelay = (blockMetadata & 0xc) >> 2;
				world.scheduleBlockUpdate(posX, posY, posZ, world.Block.redstoneRepeaterActive.blockID, this.repeaterState[repeaterDelay] * 2);
			}
		}
	}

	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
		
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		
		/*
		Low (1st & 2nd) bits:
		0x0: Facing north
		0x1: Facing east
		0x2: Facing south
		0x3: Facing west
		*/
		var facing = blockMetaData & 0x3;
		
		switch (facing) {
			case 0:
				this.draw(world, posX, posY, posZ, canvas, "top", 0);
				break;
			case 1:
				this.draw(world, posX, posY, posZ, canvas, "top", 90);
				break;
			case 2:
				this.draw(world, posX, posY, posZ, canvas, "top", 180);
				break;
			case 3:
				this.draw(world, posX, posY, posZ, canvas, "top", 270);
				break;
		}
	}
	
	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		var facing = blockMetaData & 0x3;

		var view;
		var rotated = 0;
		var mirrored = false;
		var
			LOOKING_TOWARDS_NORTH = 0,
			LOOKING_TOWARDS_EAST = 1,
			LOOKING_TOWARDS_SOUTH = 2,
			LOOKING_TOWARDS_WEST = 3,
			FACING_NORTH = 0,
			FACING_EAST = 1,
			FACING_SOUTH = 2,
			FACING_WEST = 3;
		
		switch (lookingTowards) {
			case LOOKING_TOWARDS_SOUTH:
				switch (facing) {
					case FACING_EAST:
						view = "side";
						mirrored = false;
						break;
					case FACING_SOUTH:
						view = "top";
						rotated = 0;
						break;
					case FACING_WEST:
						view = "side";
						mirrored = true;
						break;
					case FACING_NORTH:
						view = "top";
						rotated = 180;
						break;
				}
				break;
			case LOOKING_TOWARDS_NORTH:
				switch (facing) {
					case FACING_EAST:
						view = "side";
						mirrored = true;
						break;
					case FACING_SOUTH:
						view = "top";
						rotated = 180;
						break;
					case FACING_WEST:
						view = "side";
						mirrored = false;
						break;
					case FACING_NORTH:
						view = "top";
						rotated = 0;
						break;
				}
				break;
			case LOOKING_TOWARDS_WEST:
				switch (facing) {
					case FACING_EAST:
						view = "top";
						rotated = 180;
						break;
					case FACING_SOUTH:
						view = "side";
						mirrored = false;
						break;
					case FACING_WEST:
						view = "top";
						rotated = 0;
						break;
					case FACING_NORTH:
						view = "side";
						mirrored = true;
						break;
				}
				break;
			case LOOKING_TOWARDS_EAST:
				switch (facing) {
					case FACING_EAST:
						view = "top";
						rotated = 0;
						break;
					case FACING_SOUTH:
						view = "side";
						mirrored = true;
						break;
					case FACING_WEST:
						view = "top";
						rotated = 180;
						break;
					case FACING_NORTH:
						view = "side";
						mirrored = false;
						break;
				}
				break;
		}
		proto.draw(world, posX, posY, posZ, canvas, view, rotated, mirrored);
	}

	proto.draw = function(world, posX, posY, posZ, canvas, view, rotated, mirrored) {
		var poweredColour = "rgb(255,0,0)";
		var unpoweredColour = "rgb(128,0,0)";
		var unusedColour = "rgb(192,192,192)";
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		
 		/*
 		High (3rd & 4th) bits:
		0x0: 1 tick delay
		0x1: 2 tick delay
		0x2: 3 tick delay
		0x3: 4 tick delay
		*/
		var delay = (blockMetaData >>> 2) + 1;
		
		var delayColour1 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour2 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour3 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		var delayColour4 = (this.isRepeaterPowered) ? poweredColour : unpoweredColour;
		
		var delayColour2 = (delay >= 2) ? delayColour2 : unusedColour;
		var delayColour3 = (delay >= 3) ? delayColour3 : unusedColour;
		var delayColour4 = (delay >= 4) ? delayColour4 : unusedColour;
		
		if (view == "top") {
			canvas.save();
			this.rotateContext(rotated, canvas);

			canvas.fillStyle = delayColour1
			canvas.fillRect(3, 0, 2, 2);

			if (delayColour2 != delayColour1) {
				canvas.fillStyle = delayColour2;
			}
			canvas.fillRect(2, 2, 4, 2);

			if (delayColour3 != delayColour2) {
				canvas.fillStyle = delayColour3;
			}
			canvas.fillRect(1, 4, 6, 2);

			if (delayColour4 != delayColour3) {
				canvas.fillStyle = delayColour4;
			}
			canvas.fillRect(0, 6, 8, 2);

			canvas.restore();
		}
		
		if (view == "side") {
			if (mirrored) {
				canvas.save();
				canvas.translate(8, 0);
				canvas.scale(-1, 1);
			}
			
			canvas.fillStyle = delayColour1
			canvas.fillRect(0, 6, 2, 2);

			if (delayColour2 != delayColour1) {
				canvas.fillStyle = delayColour2;
			}
			canvas.fillRect(2, 5, 2, 3);

			if (delayColour3 != delayColour2) {
				canvas.fillStyle = delayColour3;
			}
			canvas.fillRect(4, 4, 2, 4);

			if (delayColour4 != delayColour3) {
				canvas.fillStyle = delayColour4;
			}
			canvas.fillRect(6, 3, 2, 5);

			if (mirrored) {
				canvas.restore();
			}
		}
	}

	proto.enumeratePlaceableBlocks = function() {
		if (this.blockType == "redstoneRepeaterIdle") {
			return new Array(
				{
					blockID: this.blockID,
					blockMetadata: 0,
					blockType: this.blockType,
					blockName: this.getBlockName(0),
					material: this.material
				}
			);
		}
		else {
			return new Array();
		}
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Torch";
	var funcName = "BlockType_RedstoneTorch";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.drawIconBlockMetadataOveride = 4;
		this.tickOnLoad = true;
		this.torchActive = true;
		this.torchUpdates = new Array();
		
		if (!this.isActive()) {
			this.torchActive = false;
		}
	}
		
	proto.isActive = function() {
		if (this.blockType == "torchRedstoneActive") {
			return true;
		}
	
		if (this.blockType == "torchRedstoneIdle") {
			return false;
		}
	}
	
	/**
	 * See if there have been too many torch updates recently, if so, burn out torch
	 * 
	 * @param	{Bool}	logUpdate	Record this in an update when checking for burnout
	 */
	proto.checkForBurnout = function(world, posX, posY, posZ, logUpdate) {
		if(logUpdate) {
			this.torchUpdates.push(
				{
					x: posX,
					y: posY,
					z: posZ,
					updateTime: world.getWorldTime() 
				}
			);
		}
		
		var updateCount = 0;
		for(var i = 0; i < this.torchUpdates.length; i++)
		{
			redstoneupdateinfo = this.torchUpdates[i];
			if(
				redstoneupdateinfo.x == posX &&
				redstoneupdateinfo.y == posY &&
				redstoneupdateinfo.z == posZ &&
				++updateCount >= 8
			) {
				return true;
			}
		}

		return false;
	}
	
	proto.canProvidePower = function() {
		return true;
	}
	
	proto.tickRate = function() {
		return 2;
	}
	
	proto.isPoweringTo = function (world, posX, posY, posZ, direction) {
		//TODO: Confirm last parameter = direction?
		if(!this.torchActive)
		{
			return false;
		}
		var blockMetaData = world.getBlockMetadata(posX, posY, posZ);
		if(blockMetaData == 5 && direction == 1)
		{
			return false;
		}
		if(blockMetaData == 3 && direction == 3)
		{
			return false;
		}
		if(blockMetaData == 4 && direction == 2)
		{
			return false;
		}
		if(blockMetaData == 1 && direction == 5)
		{
			return false;
		}
		return blockMetaData != 2 || direction != 4;
	}
	
	proto.isIndirectlyPowered = function(world, posX, posY, posZ) {
		var direction = world.getBlockMetadata(posX, posY, posZ);
		if(direction == 5 && world.isBlockIndirectlyProvidingPowerTo(posX, posY - 1, posZ, 0))
		{
			return true;
		}
		if(direction == 3 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ - 1, 2))
		{
			return true;
		}
		if(direction == 4 && world.isBlockIndirectlyProvidingPowerTo(posX, posY, posZ + 1, 3))
		{
			return true;
		}
		if(direction == 1 && world.isBlockIndirectlyProvidingPowerTo(posX - 1, posY, posZ, 4))
		{
			return true;
		}
		if (direction == 2 && world.isBlockIndirectlyProvidingPowerTo(posX + 1, posY, posZ, 5))
		{
			return true;
		}
		
		return false;
	}

	proto.updateTick = function(world, posX, posY, posZ) {
		var isIndirectlyPowered = this.isIndirectlyPowered(world, posX, posY, posZ);
		for(; this.torchUpdates.length > 0 && world.getWorldTime() - this.torchUpdates[0].updateTime > 100; this.torchUpdates.splice(0,1)) {}
		
		if(this.torchActive) {
			if(isIndirectlyPowered)
			{
				world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.torchRedstoneIdle.blockID, world.getBlockMetadata(posX, posY, posZ));
				if(this.checkForBurnout(world, posX, posY, posZ, true))
				{
					console.log("Redstone torch at %s, %s, %s burnt out.", posX, posY, posZ);
					//TODO: Provide feedback to the user that the torch has burnt out, in the game you get a fizzle sound and a few particles show.
				}
			}
		}
		else if (!isIndirectlyPowered && !this.checkForBurnout(world, posX, posY, posZ, false)) {
			world.setBlockAndMetadataWithNotify(posX, posY, posZ, world.Block.torchRedstoneActive.blockID, world.getBlockMetadata(posX, posY, posZ));
		}
	}
	
	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction) {
		//TODO: Confirm last parameter = direction?
		
		if(direction == 0)
		{
			return this.isPoweringTo(world, posX, posY, posZ, direction);
		} else
		{
			return false;
		}
	}
	
	proto.onNeighborBlockChange = function(world, posX, posY, posZ) {
		/*
		from the source:
		super.onNeighborBlockChange(world, i, j, k, l);
		world.scheduleBlockUpdate(i, j, k, blockID, tickRate());
		*/
	
		if (this.checkIftorchPlacementInvalid(world, posX, posY, posZ)) {
			world.setBlockWithNotify(posX, posY, posZ, world.Block.air.blockID);
		}
		else {
			world.scheduleBlockUpdate(posX, posY, posZ, this.blockID, this.tickRate());
		}
	}
	
	proto.onBlockAdded = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		var torchActive = this.torchActive;

		if (world.getBlockMetadata(posX, posY, posZ) == 0)
		{
			//super.onBlockAdded(world, posX, posY, posZ);
		}
		if (torchActive)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
	}
	
	proto.onBlockRemoval = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		var torchActive = this.torchActive;
		
		if (torchActive)
		{
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
		}
	}
	
	proto.enumeratePlaceableBlocks = function() {
		if (this.blockType == "torchRedstoneActive") {
			return new Array(
				{
					blockID: this.blockID,
					blockMetadata: 0,
					blockType: this.blockType,
					blockName: this.getBlockName(0),
					material: this.material
				}
			);
		}
		else {
			return new Array();
		}
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_RedstoneWire";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	//proto._super = com.mordritch.mcSim.BlockType_Block.prototype; //doesn't work

	proto.material = "circuits";

	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.blocksNeedingUpdate = new Array();
		this.wiresProvidePower = true;
		this.debugCharge = true;
		this.debugCharge = false;
	}
	
	proto.canProvidePower = function() {
		return this.wiresProvidePower;
	}
	
	proto.onBlockAdded = function(world, posX, posY, posZ) {
		//this._super.onBlockAdded(posX, posY, posZ); //TODO: The MCP source code calls the super method, fortunately with "Block", that function does nothing, but could be an issue with other block types.
		
		this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, this.blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, this.blockID);
		
		this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ - 1);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ + 1);
		
		if(world.isBlockNormalCube(posX - 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX + 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ - 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ - 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ - 1);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ + 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ + 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ + 1);
		}
	}
	
	proto.canPlaceBlockAt = function(world, posX, posY, posZ, direction) {
		var Block = world.Block;
		return world.isBlockNormalCube(posX, posY - 1, posZ) || world.getBlockId(posX, posY - 1, posZ) == Block.glowStone.blockID;
	}
	
	/**
	 * Returns true if the block coordinate passed can provide power, or is a redstone wire, or if its a repeater that is powered.
	 */
	proto.isPowerProviderOrWire = function(world, posX, posY, posZ, direction) {
		var blockID = world.getBlockId(posX, posY, posZ);
		if(blockID == world.Block.redstoneWire.blockID)
		{
			return true;
		}
		
		if(blockID == 0)
		{
			return false;
		}
		
		if(world.Block.blocksList[blockID].canProvidePower() && direction != -1)
		{
			return true;
		}
		
		if(blockID == world.Block.redstoneRepeaterIdle.blockID || blockID == world.Block.redstoneRepeaterActive.blockID)
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			//Original MCP line below:
			//return direction == (blockMetadata & 3) || direction == Direction.footInvisibleFaceRemap[blockMetadata & 3]; // Direction.footInvisibleFaceRemap is an array of ints, with values: 2, 3, 0, 1
			//Replaced by following two lines:			
			var faceRemapArray = new Array(2, 3, 0, 1); //As from Direction.footInvisibleFaceRemap
			return direction == (blockMetadata & 3) || direction == faceRemapArray[blockMetadata & 3]; 
		}

		return false;
	}

	proto.isIndirectlyPoweringTo = function(world, posX, posY, posZ, direction)
	{
		if(!this.wiresProvidePower)
		{
			return false;
		} else
		{
			return this.isPoweringTo(world, posX, posY, posZ, direction);
		}
	 }


	proto.isPoweredOrRepeater = function(world, posX, posY, posZ, direction)
	{
		if (this.isPowerProviderOrWire(world, posX, posY, posZ, direction))
		{
			return true;
		}
		var blockID = world.getBlockId(posX, posY, posZ);
		if (blockID == world.Block.redstoneRepeaterActive.blockID)
		{
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			return direction == (blockMetadata & 3);
		}
		else
		{
			return false;
		}
	}
	
	proto.isPoweringTo = function(world, posX, posY, posZ, direction)
	{
		if(!this.wiresProvidePower)
		{
			return false;
		}
		if(world.getBlockMetadata(posX, posY, posZ) == 0)
		{
			return false;
		}
		if(direction == 1)
		{
			return true;
		}
		var checkWest = this.isPoweredOrRepeater(world, posX - 1, posY, posZ, 1) || !world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPoweredOrRepeater(world, posX - 1, posY - 1, posZ, -1);
		var checkEast = this.isPoweredOrRepeater(world, posX + 1, posY, posZ, 3) || !world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPoweredOrRepeater(world, posX + 1, posY - 1, posZ, -1);
		var checkNorth = this.isPoweredOrRepeater(world, posX, posY, posZ - 1, 2) || !world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPoweredOrRepeater(world, posX, posY - 1, posZ - 1, -1);
		var checkSouth = this.isPoweredOrRepeater(world, posX, posY, posZ + 1, 0) || !world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPoweredOrRepeater(world, posX, posY - 1, posZ + 1, -1);
		
		if(!world.isBlockNormalCube(posX, posY + 1, posZ))
		{
			if(world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPoweredOrRepeater(world, posX - 1, posY + 1, posZ, -1)) {
				checkWest = true;
			}

			if(world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPoweredOrRepeater(world, posX + 1, posY + 1, posZ, -1)) {
					checkEast = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPoweredOrRepeater(world, posX, posY + 1, posZ - 1, -1)) {
				checkNorth = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPoweredOrRepeater(world, posX, posY + 1, posZ + 1, -1)) {
				checkSouth = true;
			}
		}
		
		if(!checkNorth && !checkEast && !checkWest && !checkSouth && direction >= 2 && direction <= 5) {
				return true;
		}
		if(direction == 2 && checkNorth && !checkWest && !checkEast) {
				return true;
		}
		if(direction == 3 && checkSouth && !checkWest && !checkEast) {
				return true;
		}
		if(direction == 4 && checkWest && !checkNorth && !checkSouth) {
				return true;
		}
		return direction == 5 && checkEast && !checkNorth && !checkSouth;
	}

	proto.onBlockRemoval = function(world, posX, posY, posZ) {
		//super.onBlockRemoval(posX, posY, posZ);
		world.notifyBlocksOfNeighborChange(posX, posY + 1, posY, blockID);
		world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);

		this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		
		this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY, posZ);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ - 1);
		this.notifyWireNeighborsOfNeighborChange(world, posX, posY, posZ + 1);
		
		if(world.isBlockNormalCube(posX - 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX - 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX + 1, posY, posZ)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY + 1, posZ);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX + 1, posY - 1, posZ);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ - 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ - 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ - 1);
		}
		
		if(world.isBlockNormalCube(posX, posY, posZ + 1)) {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY + 1, posZ + 1);
		}
		else {
			this.notifyWireNeighborsOfNeighborChange(world, posX, posY - 1, posZ + 1);
		}
	}

	
	proto.notifyWireNeighborsOfNeighborChange = function(world, posX, posY, posZ)
	{
		var blockID = this.blockID;
		
		if(world.getBlockId(posX, posY, posZ) != blockID)
		{
			return;
		} else
		{
			world.notifyBlocksOfNeighborChange(posX, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX - 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX + 1, posY, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ - 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY, posZ + 1, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY - 1, posZ, blockID);
			world.notifyBlocksOfNeighborChange(posX, posY + 1, posZ, blockID);
			return;
		}
	}
	
	
	proto.onNeighborBlockChange = function (world, posX, posY, posZ, direction) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var canPlaceBlockAt = this.canPlaceBlockAt(world, posX, posY, posZ);
		
		if(!canPlaceBlockAt) {
			//world.dropBlockAsItem(posX, posY, posZ, blockMetadata, 0);
			world.setBlockWithNotify(posX, posY, posZ, 0);
		}
		else {
			this.updateAndPropagateCurrentStrength(world, posX, posY, posZ);
		}
		
		//super.onNeighborBlockChange(world, posX, posY, posZ, direction); //Block which this is inherited from does nothing in the method
	}

	/**
	 * Check and see if the target block is a "power provider" (IE: does it connect wires);
	 */
	proto.isPowerProviderOrWire = function(world, posX, posY, posZ, direction) {
		var blockID = world.getBlockId(posX, posY, posZ);
		
		if (blockID == world.Block.redstoneWire.blockID) {
			return true;
		}
		
		if (world.Block.blocksList[blockID].canProvidePower(posX, posY, posZ) && direction != -1) {
			return true;
		}
		
		if (blockID == world.Block.redstoneRepeaterIdle.blockID
			|| blockID == world.Block.redstoneRepeaterActive.blockID
		) {
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
			var footInvisibleFaceRemap = new Array(2, 3, 0, 1); //take from Direction.
			return (direction == (blockMetadata & 3) || direction == footInvisibleFaceRemap[blockMetadata & 3]) 
		}
		else {
			return false;
		} 
		
	}
	
	proto.updateAndPropagateCurrentStrength = function(world, posX, posY, posZ)
	{
		this.calculateCurrentChanges(world, posX, posY, posZ, posX, posY, posZ);
		var blocksNeedingUpdate = this.blocksNeedingUpdate;
		this.blocksNeedingUpdate = new Array();
		
		//TODO: In the MC source, it uses a hash set, which prevents element duplication, use/implement something equivalent
		
		for(var i = 0; i < blocksNeedingUpdate.length; i++)
		{
			world.notifyBlocksOfNeighborChange(blocksNeedingUpdate[i][0], blocksNeedingUpdate[i][1], blocksNeedingUpdate[i][2], this.blockID);
		}

	}

	proto.getMaxCurrentStrength = function(world, posX, posY, posZ, strength)
	{
		if(world.getBlockId(posX, posY, posZ) != this.blockID)
		{
			return strength;
		}
		
		var otherStrength = world.getBlockMetadata(posX, posY, posZ);
		if(otherStrength > strength)
		{
			return otherStrength;
		} else
		{
			return strength;
		}
	}

	proto.calculateCurrentChanges = function(world, posX, posY, posZ, sourcePosX, sourcePosY, sourcePosZ) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var wirePowerLevel = 0;
		
		this.wiresProvidePower = false;
		var isBlockIndirectlyGettingPowered = world.isBlockIndirectlyGettingPowered(posX, posY, posZ);
		this.wiresProvidePower = true;
		
		if (isBlockIndirectlyGettingPowered) {
			wirePowerLevel = 15;
		}
		else {
			for (var direction = 0; direction < 4; direction++) {
				var checkX = posX;
				var checkZ = posZ;
				if (direction == 0) {
					checkX--;
				}
				if (direction == 1) {
					checkX++;
				}
				if (direction == 2) {
					checkZ--;
				}
				if (direction == 3) {
					checkZ++;
				}
				if (checkX != sourcePosX || posY != sourcePosY || checkZ != sourcePosZ) {
					wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY, checkZ, wirePowerLevel);
				}
				if (world.isBlockNormalCube(checkX, posY, checkZ) && !world.isBlockNormalCube(posX, posY + 1, posZ)) {
					if (checkX != sourcePosX || posY + 1 != sourcePosY || checkZ != sourcePosZ) {
						wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY + 1, checkZ, wirePowerLevel);
					}
					continue;
				}
				if (!world.isBlockNormalCube(checkX, posY, checkZ) && (checkX != sourcePosX || posY - 1 != sourcePosY || checkZ != sourcePosZ)) {
					wirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY - 1, checkZ, wirePowerLevel);
				}
			}

			if (wirePowerLevel > 0) {
				wirePowerLevel--;
			}
			else {
				wirePowerLevel = 0;
			}
		}
		if (blockMetadata != wirePowerLevel) {
			//world.editingBlocks = true;
			world.setBlockMetadataWithNotify(posX, posY, posZ, wirePowerLevel);
			world.markBlocksDirty(posX, posY, posZ, posX, posY, posZ);
			//world.editingBlocks = false;
			for (var direction = 0; direction < 4; direction++) {
				var checkX = posX;
				var checkZ = posZ;
				var checkY = posY - 1;
				if (direction == 0) {
					checkX--;
				}
				if (direction == 1) {
					checkX++;
				}
				if (direction == 2) {
					checkZ--;
				}
				if (direction == 3) {
					checkZ++;
				}
				if (world.isBlockNormalCube(checkX, posY, checkZ)) {
					checkY += 2;
				}
				var otherWirePowerLevel = 0;
				otherWirePowerLevel = this.getMaxCurrentStrength(world, checkX, posY, checkZ, -1);
				wirePowerLevel = world.getBlockMetadata(posX, posY, posZ);
				if (wirePowerLevel > 0) {
					wirePowerLevel--;
				}
				if (otherWirePowerLevel >= 0 && otherWirePowerLevel != wirePowerLevel) {
					this.calculateCurrentChanges(world, checkX, posY, checkZ, posX, posY, posZ);
				}
				otherWirePowerLevel = this.getMaxCurrentStrength(world, checkX, checkY, checkZ, -1);
				wirePowerLevel = world.getBlockMetadata(posX, posY, posZ);
				if (wirePowerLevel > 0) {
					wirePowerLevel--;
				}
				if (otherWirePowerLevel >= 0 && otherWirePowerLevel != wirePowerLevel) {
					this.calculateCurrentChanges(world, checkX, checkY, checkZ, posX, posY, posZ);
				}
			}

			if (blockMetadata < wirePowerLevel || wirePowerLevel == 0) {
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX - 1, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX + 1, posY, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY - 1, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY + 1, posZ));
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ - 1));
				this.blocksNeedingUpdate.push(new Array(posX, posY, posZ + 1));
			}
		}
	}
	
	proto.getConnectedDirectionsForDrawing = function(world, posX, posY, posZ) {
		var connectedW = this.isPowerProviderOrWire(world, posX - 1, posY, posZ, 1) || !world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPowerProviderOrWire(world, posX - 1, posY - 1, posZ, -1);
		var connectedE = this.isPowerProviderOrWire(world, posX + 1, posY, posZ, 3) || !world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPowerProviderOrWire(world, posX + 1, posY - 1, posZ, -1);
		var connectedN = this.isPowerProviderOrWire(world, posX, posY, posZ - 1, 2) || !world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPowerProviderOrWire(world, posX, posY - 1, posZ - 1, -1);
		var connectedS = this.isPowerProviderOrWire(world, posX, posY, posZ + 1, 0) || !world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPowerProviderOrWire(world, posX, posY - 1, posZ + 1, -1);
		
		if (!world.isBlockNormalCube(posX, posY + 1, posZ)) {
			if(world.isBlockNormalCube(posX - 1, posY, posZ) && this.isPowerProviderOrWire(world, posX - 1, posY + 1, posZ, -1))
			{
				connectedW = true;
			}
			if(world.isBlockNormalCube(posX + 1, posY, posZ) && this.isPowerProviderOrWire(world, posX + 1, posY + 1, posZ, -1))
			{
				connectedE = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ - 1) && this.isPowerProviderOrWire(world, posX, posY + 1, posZ - 1, -1))
			{
				connectedN = true;
			}
			if(world.isBlockNormalCube(posX, posY, posZ + 1) && this.isPowerProviderOrWire(world, posX, posY + 1, posZ + 1, -1))
			{
				connectedS = true;
			}
		}
		return {
			N: connectedN,
			E: connectedE,
			S: connectedS,
			W: connectedW
		};
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var connected = this.getConnectedDirectionsForDrawing(world, posX, posY, posZ);
		
		if (blockMetadata > 0) {
			canvas.fillStyle = "rgb(255,0,0)";
		}
		else {
			canvas.fillStyle = "rgb(128,0,0)";
		}
		
		if (connected.N || (connected.S && !connected.E && !connected.W)) {
			canvas.fillRect(3, 0, 2, 5);
		}

		if (connected.E || (connected.W && !connected.N && !connected.S)) {
			canvas.fillRect(3, 3, 5, 2);
		}

		if (connected.S || (connected.N && !connected.E && !connected.W)) {
			canvas.fillRect(3, 3, 2, 5);
		}

		if (connected.W || (connected.E && !connected.N && !connected.S)) {
			canvas.fillRect(0, 3, 5, 2);
		}
		
		if (!connected.N && !connected.E && !connected.S && !connected.W) {
			//since 1.0.0 (possibly earlier) we now always draw a square in the middle if there are no connections, instead of a cross
			canvas.fillRect(2, 3, 4, 2);
			canvas.fillRect(3, 2, 2, 4);
		}

		this.drawDebugCharge(blockMetadata, canvas);
	}
	
	proto.drawDebugCharge = function(charge, canvas) {
		if (this.debugCharge) {
			canvas.fillStyle = "rgba(255,255,255,0.8)";
			canvas.fillRect(0,0,8,8);
			
			canvas.fillStyle = "rgb(0,0,0)";
			canvas.strokeStyle = "rgb(255,255,255)";

			canvas.textBaseline = "middle";
			canvas.textAlign = "center";
			canvas.font = "bold " + (6) + "px arial";
			
			/*
			So, a couple of problems with canvas text in Google's chrome:
			
			1. canvas: the fillText method ignores the maxWidth argument
				http://code.google.com/p/chromium/issues/detail?id=20597
			
			2. strokeText() produces no output when canvas dimensions are set dynamically
				http://code.google.com/p/chromium/issues/detail?id=44017
				
			I may be able to work around #2, by re-creating the canvas elements instead of resizing them,
			however, as this is just debug functionality, not going to much effort.

			*/
			
			canvas.fillText(charge, 4, 4, 6-2);
			//canvas.strokeText(charge, 4, 4, 6-2);
		}
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, lookingTowards) {
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var connected = this.getConnectedDirectionsForDrawing(world, posX, posY, posZ);
		var NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;
		
		if (blockMetadata > 0) {
			canvas.fillStyle = "rgb(255,0,0)";
		}
		else {
			canvas.fillStyle = "rgb(128,0,0)";
		}
		
		var drawLeft = false;
		var drawMiddle = false;
		var drawRight = false;
		var connections = 0;

		if (connected.N) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawMiddle = true;
					break;
				case NORTH:
					drawMiddle = true;
					break;
				case WEST:
					drawRight = true;
					break;
				case EAST:
					drawLeft = true;
					break;
			}
		}

		if (connected.S) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawMiddle = true;
					break;
				case NORTH:
					drawMiddle = true;
					break;
				case WEST:
					drawLeft = true;
					break;
				case EAST:
					drawRight = true;
					break;
			}
		}

		if (connected.E) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawLeft = true;
					break;
				case NORTH:
					drawRight = true;
					break;
				case WEST:
					drawMiddle = true;
					break;
				case EAST:
					drawMiddle = true;
					break;
			}
		}

		if (connected.W) {
			connections++;
			switch (lookingTowards) {
				case SOUTH:
					drawRight = true;
					break;
				case NORTH:
					drawLeft = true;
					break;
				case WEST:
					drawMiddle = true;
					break;
				case EAST:
					drawMiddle = true;
					break;
			}
		}
		
		if ((connections == 1) && (drawLeft || drawRight)) {
			drawLeft = true;
			drawRight = true;
		}
		
		if (drawLeft && !drawRight) {
			canvas.fillRect(0, 6, 5, 2);
		}
		
		if (!drawLeft && drawRight) {
			canvas.fillRect(3, 6, 5, 2);
		}
		
		if (drawLeft && drawRight) {
			canvas.fillRect(0, 6, 8, 2);
		}
		
		if (!drawLeft && !drawRight && !drawMiddle) {
			//No connections
			canvas.fillRect(2, 6, 4, 2);
		}
		
		if (!drawLeft && !drawRight && drawMiddle) {
			canvas.fillRect(3, 6, 2, 2);
		}
		
		this.drawDebugCharge(blockMetadata, canvas);
	}

	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 3, 1, 3);
		worldData.setBlockAndMetadata(1, 0, 0, this.blockID, blockMetadata);

		worldData.setBlockAndMetadata(0, 0, 1, this.blockID, blockMetadata);
		worldData.setBlockAndMetadata(1, 0, 1, this.blockID, blockMetadata);
		worldData.setBlockAndMetadata(2, 0, 1, this.blockID, blockMetadata);

		worldData.setBlockAndMetadata(1, 0, 2, this.blockID, blockMetadata);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);
		this.drawTopView_currentLayer(world, 1, 0, 1, canvas);
	}
}());
; 
com.mordritch.mcSim.BlockType_SandStone = function(){}
	com.mordritch.mcSim.BlockType_SandStone.prototype = new com.mordritch.mcSim.BlockType_Block();

	com.mordritch.mcSim.BlockType_SandStone.prototype.material = "rock";
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Container";
	var funcName = "BlockType_Sign";

	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.material = "wood";
	
	var textColor = "rgb(0,0,0)";
	var woodColor = "rgb(168,135,84)";
	var shadowColor = "rgba(128,128,128,0.5)";
	this.isFreestanding = false;
	
	var
		WALLMOUNTED_NORTH = 2,
		WALLMOUNTED_EAST = 5,
		WALLMOUNTED_WEST = 4,
		WALLMOUNTED_SOUTH = 3,
		FACING_NORTH = 0,
		FACING_EAST = 1,
		FACING_SOUTH = 2,
		FACING_WEST = 3,
		FACING_DOWN = 4;
	
	proto.construct = function() {
		this._renderAsNormalBlock = false;
		this.eventBindings = [];
		this.isFreestanding = !!(this.blockType == "signPost");
	}
	
	/*
	 * Added for simulator
	 */
	proto.sameBlockTypeAs = function(blockId) {
		var signPost_BlockId = 63;
		var signWall_BlockId = 68;

		return (blockId == signPost_BlockId || blockId == signWall_BlockId);
	}

	/**
	 * MCP source does not have this method since the code for placing a sign is handled in the ItemSign class. 
	 */
	proto.onBlockPlaced = function(world, posX, posY, posZ, facing) {
		var signPost_BlockId = world.Block.signPost.blockID;
		var signWall_BlockId = world.Block.signWall.blockID;
		var placementValid = false;
		
		if (world.getBlockMaterial(posX + 1, posY, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_NORTH);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX - 1, posY, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_SOUTH);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY, posZ + 1).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_EAST);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY, posZ - 1).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, WALLMOUNTED_WEST);
			placementValid = true;
		}
		
		if (world.getBlockMaterial(posX, posY - 1, posZ).isSolid()) {
			world.setBlockAndMetadata(posX, posY, posZ, signPost_BlockId, 0);
			placementValid = true;
		}
		
		if (!placementValid) {
			throw new Error("Sign placement failed.");
		}
		else {
			this.toggleBlock(world, posX, posY, posZ);
		}
	}
	
	/*
	 * Added for simulator:
	 */
	proto.canPlaceBlockAt = function(world, posX, posY, posZ) {
		return (
			world.getBlockMaterial(posX, posY - 1, posZ).isSolid() ||
			world.getBlockMaterial(posX, posY, posZ + 1).isSolid() ||
			world.getBlockMaterial(posX, posY, posZ - 1).isSolid() ||
			world.getBlockMaterial(posX + 1, posY, posZ).isSolid() ||
			world.getBlockMaterial(posX - 1, posY, posZ).isSolid()
		);
	}
	
	proto.rotateBlock = function(world, posX, posY, posZ) {
		var signPost_BlockId = world.Block.signPost.blockID;
		var signWall_BlockId = world.Block.signWall.blockID;
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		var runAwayLoopPrevention = 0;

		do {
			runAwayLoopPrevention++;
			
			if (runAwayLoopPrevention > 22) throw new Error("Runaway loop!");
			
			if (world.getBlockId(posX, posY, posZ) == signPost_BlockId) {
				blockMetadata = (blockMetadata + 1) & 0xf;
				world.setBlockMetadata(posX, posY, posZ, blockMetadata);
				if (blockMetadata == 0) {
					blockMetadata = WALLMOUNTED_NORTH;
					world.setBlockAndMetadata(posX, posY, posZ, signWall_BlockId, blockMetadata);
				}
			}
			else {
				blockMetadata = new Array(0,0,5,4,2,3)[blockMetadata];
				world.setBlockMetadata(posX, posY, posZ, blockMetadata);
				if (blockMetadata == WALLMOUNTED_NORTH) {
					blockMetadata == 0;
					world.setBlockAndMetadata(posX, posY, posZ, signPost_BlockId, blockMetadata);
				}
			}
			
			if (!this.checkIfSignPlacementInvalid(world, posX, posY, posZ)) {
				world.notifyBlockChange(posX, posY, posZ, world.getBlockId(posX, posY, posZ));
				break;
			}
		} while (true);
	}
	
	proto.rotateSelection = function(blockMetadata, amount) {
		for (var i=0; i<amount; i++) {
			if (this.blockType == "signWall") {
				blockMetadata = new Array(0, 0, 5, 4, 2, 3)[blockMetadata];
			}
			else {
				blockMetadata = (blockMetadata + 4) & 0xf;
			}
		}

		return blockMetadata;
	}
	
	/*
	 * Added for simulator:
	 */
	proto.checkIfSignPlacementInvalid = function(world, posX, posY, posZ, facing) {
		if (world.getBlockId(posX, posY, posZ) == world.Block.signPost.blockID) {
			return (!world.getBlockMaterial(posX, posY - 1, posZ).isSolid());
		}
		else {
			var blockMetadata = world.getBlockMetadata(posX, posY, posZ);

			if (blockMetadata == 2 && world.getBlockMaterial(posX, posY, posZ + 1).isSolid()) {
				return false;
			}

			if (blockMetadata == 3 && world.getBlockMaterial(posX, posY, posZ - 1).isSolid()) {
				return false;
			}

			if (blockMetadata == 4 && world.getBlockMaterial(posX + 1, posY, posZ).isSolid()) {
				return false;
			}

			if (blockMetadata == 5 && world.getBlockMaterial(posX - 1, posY, posZ).isSolid()) {
				return false;
			}
			
			return true;
		}
	}
	
	proto._onNeighborBlockChange = proto.onNeighborBlockChange;
	proto.onNeighborBlockChange = function(par1World, par2, par3, par4, par5)
	{
		var flag = false;

		if (this.isFreestanding)
		{
			if (!par1World.getBlockMaterial(par2, par3 - 1, par4).isSolid())
			{
				flag = true;
			}
		}
		else
		{
			var i = par1World.getBlockMetadata(par2, par3, par4);
			flag = true;

			if (i == 2 && par1World.getBlockMaterial(par2, par3, par4 + 1).isSolid())
			{
				flag = false;
			}

			if (i == 3 && par1World.getBlockMaterial(par2, par3, par4 - 1).isSolid())
			{
				flag = false;
			}

			if (i == 4 && par1World.getBlockMaterial(par2 + 1, par3, par4).isSolid())
			{
				flag = false;
			}

			if (i == 5 && par1World.getBlockMaterial(par2 - 1, par3, par4).isSolid())
			{
				flag = false;
			}
		}

		if (flag)
		{
			//dropBlockAsItem(par1World, par2, par3, par4, par1World.getBlockMetadata(par2, par3, par4), 0);
			par1World.setBlockWithNotify(par2, par3, par4, 0);
		}

		this._onNeighborBlockChange(par1World, par2, par3, par4, par5);
	}
	
	proto.getBlockEntity = function() {
		return new namespace.TileEntity_Sign();
	}

	proto.toggleBlock = function(world, posX, posY, posZ) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		this.triggerEvent('toggleBlock', {
			block: this,
			entity: entity,
			world: world,
			posX: posX,
			posY: posY,
			posZ: posZ
		});
	}
	
	proto.on = function(eventType, callback) {
		this.eventBindings.push({eventType: eventType, callback: callback});
	}
	
	proto.triggerEvent = function(eventType, parameters) {
		parameters.eventType = eventType;
		
		for (var i in this.eventBindings) {
			if (this.eventBindings[i].eventType == eventType) {
				this.eventBindings[i].callback(parameters);
			}
		}
	}
	
	proto.isOpaqueCube = function() {
		return false;
	}
	
	/**
	 * Checks to see if the sign is a single letter and if so, draws just the letter instead and returns true.
	 *
	 */
	proto.checkForAndDrawLabel = function(world, posX, posY, posZ, canvas, forAboveLayer) {
		var entity = world.getBlockTileEntity(posX, posY, posZ);
		if (
			entity != null &&
			entity.text[3].length == 0 &&
			entity.text[2].length == 0 &&
			entity.text[1].length == 0 && (
				entity.text[0].length == 1 ||
				(entity.text[0].length == 2 && entity.text[0].charAt(0) == "-")
			)
			
		) {
			var letter = "";
		
			canvas.fillStyle  = (forAboveLayer) ? shadowColor : textColor;
			canvas.textBaseline = "middle";
			canvas.textAlign = "center";
			canvas.font = "bold " + (7) + "px arial";
			

			if (entity.text[0].length == 1) {
				letter = entity.text[0].charAt(0);
			}
			else {
				letter = entity.text[0].charAt(1);
				canvas.fillRect(1, 0.5, 6, 1);
			}
			canvas.fillText(letter, 4, 5, 8);
			
			return true;
		}
		else {
			return false;
		}
	}
	
	proto.drawTopView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, currentFacing = null, forAboveLayer = false);
	}

	proto.drawTopView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing) {
		this.drawTopView_generic(world, posX, posY, posZ, canvas, currentFacing = null, forAboveLayer = true);
	}
	
	proto.drawTopView_generic = function(world, posX, posY, posZ, canvas, currentFacing, forAboveLayer) {
		if (this.checkForAndDrawLabel(world, posX, posY, posZ, canvas, forAboveLayer)) {
			return;
		}
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		canvas.fillStyle = (forAboveLayer) ? shadowColor : woodColor;
		
		if (this.blockType == 'signPost') {
			if (blockMetadata != 0) {
				canvas.save();
				canvas.translate(4, 4);
				canvas.rotate(22.5*blockMetadata*Math.PI/180);
				canvas.translate(-4, -4);
			}
			
			canvas.fillStyle = woodColor;
			canvas.fillRect(0.5, 3, 7, 2);
			canvas.fillStyle = textColor;
			canvas.fillRect(1.5, 4, 5, 1);
	
			if (blockMetadata != 0) {
				canvas.restore();
			}
		}
		
		else {
			canvas.save();
			canvas.translate(4, 4);
			switch (blockMetadata) {
				case WALLMOUNTED_NORTH:
				case 0:
					canvas.rotate(0*Math.PI/180);
					break;
				case WALLMOUNTED_EAST:
					canvas.rotate(90*Math.PI/180);
					break;
				case WALLMOUNTED_SOUTH:
					canvas.rotate(180*Math.PI/180);
					break;
				case WALLMOUNTED_WEST:
					canvas.rotate(270*Math.PI/180);
					break;
				default: throw new Error("Unexpected case.");
			}
			canvas.translate(-4, -4);
			
			canvas.beginPath();
			canvas.moveTo(1, 8);
			canvas.lineTo(7, 8);
			canvas.lineTo(7, 6);
			canvas.lineTo(1, 6);
			canvas.fill();
			
			
			canvas.restore();
		}
	}

	proto.drawSideView_currentLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = false);
	}

	proto.drawSideView_aboveLayer = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata) {
		this.drawSideView_generic(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer = true);
	}
	
	proto.drawSideView_generic = function(world, posX, posY, posZ, canvas, currentFacing, blockMetadata, forAboveLayer) {
		if (this.checkForAndDrawLabel(world, posX, posY, posZ, canvas, forAboveLayer)) {
			return;
		}
		
		var blockMetadata = world.getBlockMetadata(posX, posY, posZ);
		
		if (forAboveLayer && this.blockType == 'signPost') {
			canvas.fillStyle = shadowColor;
			canvas.fillRect(1, 1, 6, 5);
			canvas.fillRect(3, 6, 2, 2);
		}
		
		if (!forAboveLayer && this.blockType == 'signPost') {
			canvas.fillStyle = woodColor;
			canvas.fillRect(1, 1, 6, 5);
			canvas.fillRect(3, 6, 2, 2);
		
			canvas.fillStyle = textColor;
			canvas.fillRect(2, 2, 2, 1);	
			canvas.fillRect(5, 2, 1, 1);	
		
			canvas.fillRect(2, 4, 1, 1);	
			canvas.fillRect(4, 4, 2, 1);	
		}
		
		var
			DRAW_FRONT = 0,
			DRAW_LEFT = 1,
			DRAW_RIGHT = 2,
			DRAW_BACK = 3,
			drawView = null;
		
		if (this.blockType == 'signWall') {
			switch (currentFacing) {
				case FACING_NORTH:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_RIGHT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_EAST:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_FRONT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_SOUTH:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_BACK;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_LEFT;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				case FACING_WEST:
					switch (blockMetadata) {
						case WALLMOUNTED_EAST:
							drawView = DRAW_FRONT;
							break;
						case WALLMOUNTED_NORTH: case 0:
							drawView = DRAW_LEFT;
							break;
						case WALLMOUNTED_SOUTH:
							drawView = DRAW_RIGHT;
							break;
						case WALLMOUNTED_WEST:
							drawView = DRAW_BACK;
							break;
						default: throw new Error("unexpected case");
					}
					break;
				default: throw new Error("Unexpected case");
			}

			canvas.fillStyle = (forAboveLayer) ? shadowColor : woodColor;
			
			switch(drawView) {
				case DRAW_FRONT:
					canvas.fillRect(1, 1, 6, 5);
				
					if (!forAboveLayer) {
						canvas.fillStyle = textColor;
						canvas.fillRect(2, 2, 2, 1);	
						canvas.fillRect(5, 2, 1, 1);	
					
						canvas.fillRect(2, 4, 1, 1);	
						canvas.fillRect(4, 4, 2, 1);	
					}
					break;
				case DRAW_BACK:
					canvas.fillRect(1, 1, 6, 5);
					break;
				case DRAW_LEFT:
					canvas.fillRect(0, 1, 2, 5);
					break;
				case DRAW_RIGHT:
					canvas.fillRect(6, 1, 2, 5);
					break;
				default: throw new Error("Unexpected case");
			}
		}
	}
	
	proto.drawIcon = function(blockObj, canvas, blockMetadata) {
		var worldData = new com.mordritch.mcSim.World_Schematic(null, 1, 1, 1);
		worldData.setBlockAndMetadata(0, 0, 0, 63, 2);
		
		var world = new com.mordritch.mcSim.World(blockObj, worldData);

		this.drawSideView_generic(
			world,
			posx = 0,
			posY = 0,
			posZ = 0,
			canvas,
			blockMetadata = 2,
			forAboveLayer = false
		);
	}

}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "BlockType_Block";
	var funcName = "BlockType_Stairs";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;
	
	proto.construct = function(blockType, blockID, blockDefinition, Block) {
		this.modelBlock = Block[blockDefinition.modelBlock];
		this.blockMaterial = this.modelBlock.blockMaterial;
	}
	
	proto.isOpaqueCube = function() {
		return false;
	}
	
	proto.renderAsNormalBlock = function() {
		return false;
	}
	
}());
; 
com.mordritch.mcSim.BlockType_Step = function(){}
	com.mordritch.mcSim.BlockType_Step.prototype = new com.mordritch.mcSim.BlockType_Block();

	com.mordritch.mcSim.BlockType_Step.prototype.material = "rock";
; 
com.mordritch.mcSim.BlockType_StoneBrick = function(){}
	com.mordritch.mcSim.BlockType_StoneBrick.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_StoneBrick.prototype.material = "rock";
; 
com.mordritch.mcSim.BlockType_Sponge = function(){}
	com.mordritch.mcSim.BlockType_Sponge.prototype = new com.mordritch.mcSim.BlockType_Block();

	com.mordritch.mcSim.BlockType_Sponge.prototype.material = "sponge";
; 
com.mordritch.mcSim.BlockType_SoulSand = function(){}
	com.mordritch.mcSim.BlockType_SoulSand.prototype = new com.mordritch.mcSim.BlockType_Block();
	
	com.mordritch.mcSim.BlockType_SoulSand.prototype.material = "sand";
; 
com.mordritch.mcSim.TileEntity__Default = function() {
	//this.nameToClassMap = new Array();
	//this.classToNameMap = new Array();
	this.xCoord = 0; //int
	this.yCoord = 0; //int
	this.zCoord = 0; //int
	this.tileEntityInvalid = false; //bool
	this.blockMetadata = -1; //int
	this.blockType = null; //in source code it's of type "Block"
	this.worldObj = null;
	
	this.facing = new com.mordritch.mcSim.facing();

	
	/**
	 * Used to import NBT data
	 */
	this.readFromNBT = function(nbttagcompound, worldObj) {
		this.worldObj = worldObj;

		this.xCoord = nbttagcompound.x.payload;
		this.yCoord = nbttagcompound.y.payload;
		this.zCoord = nbttagcompound.z.payload;
		
		//TODO: port: (done above now)
		/*
		 *         
		xCoord = nbttagcompound.getInteger("x");
        yCoord = nbttagcompound.getInteger("y");
        zCoord = nbttagcompound.getInteger("z");

		 */
	}
	
	/**
	 * Used to rotate the entire world or a selection of blocks, torches for example can have their metadata updated appropriately
	 * 
	 * Accepts amount of times to rotate the block 90 degrees clockwise, so, to rotate it 180 degress clockwise, the amount would be 2, 270 would be 3
	 */
	this.rotateSelection = function(amount) {
	}
	
	/**
	 * Used to export NBT data
	 */
	this.writeToNBT = function(nbttagcompound) {
		if (typeof this.entityId == "undefined") {
			throw new Error("entityId not defined, ensure it is defined in the inheriting entity \"class\".");
		}
		nbttagcompound.id = {
			payload: this.entityId,
			type: 8
		};
		
		nbttagcompound.x = {
			payload: this.xCoord,
			type: 3
		};
		
		nbttagcompound.y = {
			payload: this.yCoord,
			type: 3
		};
		
		nbttagcompound.z = {
			payload: this.zCoord,
			type: 3
		};
		
		return nbttagcompound;
		
		
		//TODO: port (done above)
		/*
	        String s = (String)classToNameMap.get(getClass());
	        if (s == null)
	        {
	            throw new RuntimeException((new StringBuilder()).append(getClass()).append(" is missing a mapping! This is a bug!").toString());
	        }
	        else
	        {
	            nbttagcompound.setString("id", s);
	            nbttagcompound.setInteger("x", xCoord);
	            nbttagcompound.setInteger("y", yCoord);
	            nbttagcompound.setInteger("z", zCoord);
	            return;
	        }
		 */
	}
	
	/**
	 * Called for each entity each time the game ticks.
	 */
	this.updateEntity = function() {
		
	}
	
	/**
	 * Called when loading world/shematic data
	 */
	this.createAndLoadEntity = function() {
		//TODO: Port
		
		/*
        TileEntity tileentity = null;
        try
        {
            Class class1 = (Class)nameToClassMap.get(nbttagcompound.getString("id"));
            if (class1 != null)
            {
                tileentity = (TileEntity)class1.newInstance();
            }
        }
        catch (Exception exception)
        {
            exception.printStackTrace();
        }
        if (tileentity != null)
        {
            tileentity.readFromNBT(nbttagcompound);
        }
        else
        {
            System.out.println((new StringBuilder()).append("Skipping TileEntity with id ").append(nbttagcompound.getString("id")).toString());
        }
        return tileentity;
		 */
	}
	
	/**
	 * 
	 */
	this.getBlockMetadata = function() {
		if (this.blockMetadata == -1) {
			this.blockMetadata = this.worldObj.getBlockMetadata(this.xCoord, this.yCoord, this.zCoord);
		}
		return this.blockMetadata;
	}
	
	/**
	 * 
	 */
	this.onInventoryChanged = function() {
		if (this.worldObj != null) {
			
			this.blockMetadata = worldObj.getBlockMetadata(this.xCoord, this.yCoord, this.zCoord);
			//this.worldObj.updateTileEntityChunkAndDoNothing(this.xCoord, this.yCoord, this.zCoord, this); //TODO: Is this needed?
		}
	}
	
	this.getDistanceFrom = function(otherX, otherY, otherZ) {
		var distanceX = (this.xCoord + 0.5) - otherX;
		var distanceY = (this.yCoord + 0.5) - otherY;
		var distanceZ = (this.zCoord + 0.5) - otherZ;
		
		return distanceX * distanceX + distanceY * distanceY + distanceZ * distanceZ;
	}
	
	/**
	 * Gets a block object based on the coordinates of the entity
	 * 
	 * @return {Object}	type of block
	 */
	this.getBlockType = function() {
		if (this.blockType == null) {
			this.blockType = this.worldObj.blocksList[this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord)];
		}
		return this.blockType;
	}
	
	this.isInvalid = function() {
		return this.tileEntityInvalid;
	}
	
	this.invalidate = function() {
		this.tileEntityInvalid = true;
	}
	
	this.validate = function() {
		this.tileEntityInvalid = false;
	}
	
	this.onTileEntityPowered = function() {
		
	}
	
	this.updateContainingBlockInfo = function() {
		this.blockType = null;
		this.blockMetadata = -1;
	}
	
}; 
com.mordritch.mcSim.TileEntity__Unknown = function() {};


	com.mordritch.mcSim.TileEntity__Unknown.prototype = new com.mordritch.mcSim.TileEntity__Default();

	/**
	 * Used to import NBT data
	 */
	com.mordritch.mcSim.TileEntity__Unknown.prototype._readFromNBT = com.mordritch.mcSim.TileEntity__Unknown.prototype.readFromNBT; //a super method of sorts
	com.mordritch.mcSim.TileEntity__Unknown.prototype.readFromNBT = function(nbttagcompound) {
		this._readFromNBT(nbttagcompound);
		this.mappingId = nbttagcompound.id.payload;
		this.entityId = nbttagcompound.id.payload;
		this.loaded_NBT_Data = nbttagcompound;
	}
	
	/**
	 * Used to export NBT data
	 */
	com.mordritch.mcSim.TileEntity__Unknown.prototype._writeToNBT = com.mordritch.mcSim.TileEntity__Unknown.prototype.writeToNBT; //a super method of sorts
	com.mordritch.mcSim.TileEntity__Unknown.prototype.writeToNBT = function() {
		var nbttagcompound = this.loaded_NBT_Data;
		return this._writeToNBT(nbttagcompound);
	}
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "TileEntity__Default";
	var funcName = "TileEntity_Piston";
	
	namespace[funcName] = function() {};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.storedBlockID = 0;
	proto.storedMetadata = 0;
	proto.storedOrientation = 0; //the side the front of the piston is on
	proto.extending = false; //if this piston is extending or not
	proto.shouldHeadBeRendered = false;
	proto.progress = 0.0;
	proto.lastProgress = 0.0; //the progress in (de)extending
	proto.pushedObjects = [];
	proto.worldObj = null;
	
	proto.construct = function(storedBlockID, storedMetadata, storedOrientation, extending, shouldHeadBeRendered, worldObj) {
		this.storedBlockID = storedBlockID;
		this.storedMetadata = storedMetadata;
		this.storedOrientation = storedOrientation;
		this.extending = extending;
		this.shouldHeadBeRendered = shouldHeadBeRendered;
		this.worldObj = worldObj;
		this.entityId = "Piston"; //used by the base class's writeToNBT() method
	}

	proto.rotateSelection = function(amount) {
		var storedBlock = this.worldObj.Block.blocksList[this.storedBlockID];
		this.storedMetadata = storedBlock.rotateSelection(this.storedMetadata, amount);
	}

	proto.getStoredBlockID = function() {
		return this.storedBlockID;
	}
	
	/**
	 * Returns block data at the location of this entity (client-only).
	 */
	proto.getBlockMetadata = function() {
		return this.storedMetadata;
	}
	
	/**
	 * Returns true if a piston is extending
	 */
	proto.isExtending = function() {
		return this.extending;
	}
	
	/**
	 * Returns the orientation of the piston as an int
	 */
	proto.getPistonOrientation = function() {
		return this.storedOrientation;
	}
	
	proto.shouldRenderHead = function() {
		return this.shouldHeadBeRendered;
	}
	
	/**
	 * Get interpolated progress value (between lastProgress and progress) given the fractional time between ticks as an
	 * argument.
	 */
	proto.getProgress = function(par1) {
		if (par1 > 1.0) par1 = 1.0;

		return this.lastProgress + (progress - lastProgress) * par1;
	}
	
	proto.getOffsetX = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsXForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsXForSide[storedOrientation];
		}
	}
	
	proto.getOffsetY = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsYForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsYForSide[storedOrientation];
		}
	}
	
	proto.getOffsetZ = function(par1) {
		if (this.extending) {
			return (this.getProgress(par1) - 1.0) * Facing.offsetsZForSide[storedOrientation];
		}
		else {
			return (1.0 - this.getProgress(par1)) * Facing.offsetsZForSide[storedOrientation];
		}
	}
	
	/* Used by renderer only?
	proto.updatePushedObjects = function(par1, par2)
	{
		if (!this.extending)
		{
			par1--;
		}
		else
		{
			par1 = 1.0 - par1;
		}

		AxisAlignedBB axisalignedbb = Block.pistonMoving.getAxisAlignedBB(worldObj, xCoord, yCoord, zCoord, storedBlockID, par1, storedOrientation);

		if (axisalignedbb != null)
		{
			List list = worldObj.getEntitiesWithinAABBExcludingEntity(null, axisalignedbb);

			if (!list.isEmpty())
			{
				pushedObjects.addAll(list);
				Entity entity;

				for (Iterator iterator = pushedObjects.iterator(); iterator.hasNext(); entity.moveEntity(par2 * (float)Facing.offsetsXForSide[storedOrientation], par2 * (float)Facing.offsetsYForSide[storedOrientation], par2 * (float)Facing.offsetsZForSide[storedOrientation]))
				{
					entity = (Entity)iterator.next();
				}

				pushedObjects.clear();
			}
		}
	}
	*/

	/**
	 * removes a pistons tile entity (and if the piston is moving, stops it)
	 */
	proto.clearPistonTileEntity = function() {
		if (this.lastProgress < 1.0 && this.worldObj != null) {
			this.lastProgress = this.progress = 1.0;
			this.worldObj.removeBlockTileEntity(this.xCoord, this.yCoord, this.zCoord);
			this.invalidate();

			if (this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord) == this.worldObj.Block.pistonMoving.blockID) {
				this.worldObj.setBlockAndMetadataWithNotify(this.xCoord, this.yCoord, this.zCoord, this.storedBlockID, this.storedMetadata);
			}
		}
	}
	
	/**
	 * Allows the entity to update its state. Overridden in most subclasses, e.g. the mob spawner uses this to count
	 * ticks and creates a new spawn inside its implementation.
	 */
	proto.updateEntity = function() {
        this.worldObj.markBlockNeedsUpdate(this.xCoord, this.yCoord, this.zCoord);
		this.lastProgress = this.progress;

		if (this.lastProgress >= 1.0) {
			//this.updatePushedObjects(1.0, 0.25); //For renderer only?
			this.worldObj.removeBlockTileEntity(this.xCoord, this.yCoord, this.zCoord);
			this.invalidate();

			if (this.worldObj.getBlockId(this.xCoord, this.yCoord, this.zCoord) == this.worldObj.Block.pistonMoving.blockID) {
				this.worldObj.setBlockAndMetadataWithNotify(this.xCoord, this.yCoord, this.zCoord, this.storedBlockID, this.storedMetadata);
			}

			return;
		}

		this.progress += 0.5;

		if (this.progress >= 1.0) {
			this.progress = 1.0;
		}

		if (this.extending) {
			//this.updatePushedObjects(this.progress, (this.progress - this.lastProgress) + 0.0625); //For renderer only?
		}
	}
	
	/**
	 * Reads a tile entity from NBT.
	 */
	proto._readFromNBT = proto.readFromNBT; //a super method of sorts
	proto.readFromNBT = function(nbttagcompound, worldObj)
	{
		this._readFromNBT(nbttagcompound, worldObj);
		
		var storedBlockID = nbttagcompound.blockId.payload;
		var storedMetadata = nbttagcompound.blockData.payload;
		var storedOrientation = nbttagcompound.facing.payload;
		var progress = nbttagcompound.progress.payload;
		var extending = nbttagcompound.extending.payload;
		
		//function(storedBlockID, storedMetadata, storedOrientation, extending, shouldHeadBeRendered, worldObj)
		this.construct(
			storedBlockID,
			storedMetadata,
			storedOrientation,
			extending,
			false,
			worldObj
		);
		
		/*
		super.readFromNBT(par1NBTTagCompound);
		storedBlockID = par1NBTTagCompound.getInteger("blockId");
		storedMetadata = par1NBTTagCompound.getInteger("blockData");
		storedOrientation = par1NBTTagCompound.getInteger("facing");
		lastProgress = progress = par1NBTTagCompound.getFloat("progress");
		extending = par1NBTTagCompound.getBoolean("extending");
		*/
	}

	/**
	 * Writes a tile entity to NBT.
	 */
	proto._writeToNBT = proto.writeToNBT; //a super method of sorts
	proto.writeToNBT = function()
	{
		var nbttagcompound = this._writeToNBT({});
		
		nbttagcompound.blockId = {
			payload: this.storedBlockID,
			type: 3
		};
		
		nbttagcompound.blockData = {
			payload: this.storedMetadata,
			type: 3
		};
		
		nbttagcompound.facing = {
			payload: this.storedOrientation,
			type: 3
		};
		
		nbttagcompound.progress = {
			payload: this.lastProgress,
			type: 5
		};
		
		nbttagcompound.extending = {
			payload: (this.extending) ? 1 : 0,
			type: 1
		};
		return nbttagcompound;

		/*
		super.writeToNBT(par1NBTTagCompound);
		par1NBTTagCompound.setInteger("blockId", storedBlockID);
		par1NBTTagCompound.setInteger("blockData", storedMetadata);
		par1NBTTagCompound.setInteger("facing", storedOrientation);
		par1NBTTagCompound.setFloat("progress", lastProgress);
		par1NBTTagCompound.setBoolean("extending", extending);
		*/
	}
}());
; 
(function(){
	var namespace = com.mordritch.mcSim;
	var parentFunc = "TileEntity__Default";
	var funcName = "TileEntity_Sign";
	
	namespace[funcName] = function() {this.construct();};
	namespace[funcName].prototype = new namespace[parentFunc]();
	var proto = namespace[funcName].prototype;

	proto.worldObj = null;
	proto.entityId = "Sign";
	
	proto.construct = function() {
		this.text = new Array("", "", "", "");
	}
	
	/**
	 * Reads a tile entity from NBT.
	 */
	proto._readFromNBT = proto.readFromNBT; //a super method of sorts
	proto.readFromNBT = function(nbttagcompound, worldObj)
	{
		this._readFromNBT(nbttagcompound, worldObj);
		
		var text = [
			nbttagcompound.Text1.payload,
			nbttagcompound.Text2.payload,
			nbttagcompound.Text3.payload,
			nbttagcompound.Text4.payload
		];
		
		this.worldObj = worldObj;
		this.text = text;
	}

	/**
	 * Writes a tile entity to NBT.
	 */
	proto._writeToNBT = proto.writeToNBT; //a super method of sorts
	proto.writeToNBT = function()
	{
		var nbttagcompound = this._writeToNBT({});
		
		nbttagcompound.Text1 = {
			payload: this.text[0],
			type: 8
		};
		
		nbttagcompound.Text2 = {
			payload: this.text[1],
			type: 8
		};
		
		nbttagcompound.Text3 = {
			payload: this.text[2],
			type: 8
		};
		
		nbttagcompound.Text4 = {
			payload: this.text[3],
			type: 8
		};
		
		return nbttagcompound;

		/*
		super.writeToNBT(par1NBTTagCompound);
		par1NBTTagCompound.setInteger("blockId", storedBlockID);
		par1NBTTagCompound.setInteger("blockData", storedMetadata);
		par1NBTTagCompound.setInteger("facing", storedOrientation);
		par1NBTTagCompound.setFloat("progress", lastProgress);
		par1NBTTagCompound.setBoolean("extending", extending);
		*/
	}
}());
; 
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
}; 
com.mordritch.mcSim.Entity__Unknown = function() {};
	com.mordritch.mcSim.Entity__Unknown.prototype = new com.mordritch.mcSim.Entity__Default();
	
	/**
	 * For now, all required functionality is in the default. 
	 */

