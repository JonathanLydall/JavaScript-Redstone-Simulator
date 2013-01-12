<?php
include_once 'error_handling.php';
include_once 'utf8_handling.php';
/*

Author: Jonathan Lydall (http://www.mordritch.com/code/php/parseNbtToJson/)

Last Modified: 2011-06-24

 * 
 * Validates an NBT file, reads through the binary file to ensure format is valid NBT.
 * 
 * 
 * 
Usage:
parseNbt::parse($inputString)
- $inputString: Uncompressed binary NBT data.

Notes:
- The NBT format stores longs in 64bits, and until PHP 6 is released, PHP can only support 64bit integers if compiled for
  a 64bit system, which is normally not the case.
- At present there is no real error checking, if the format is invalid, the end of the file will be reached unexpectedly.


Example output (when converted into JSON):
{
	"error": false,
	"nbtData": {
		"Schematic": {
			"type":10,
			"payload": {
				"Height": {
					"type":2,
					"payload":1
				},
				"Length": {
					"type":2,
					"payload":1
				},
				"Width": {
					"type":2,
					"payload":1
				},
				"Entities": {
					"type":9,
					"payload":[]
				},
				"TileEntities": {
					"type":9,
					"payload":[]
				},
				"Materials": {
					"type":8,
					"payload":"Alpha"
				},
				"Blocks": {
					"type":7,
					"payload":[2]
				},
				"Data": {
					"type":7,
					"payload":[0]
				}
			}
		}
	}
}

*/

class nbtValidator {
	private static $nbtTags = array(
		0=>"TAG_End",
		1=>"TAG_Byte",
		2=>"TAG_Short",
		3=>"TAG_Int",
		4=>"TAG_Long",
		5=>"TAG_Float",
		6=>"TAG_Double",
		7=>"TAG_Byte_Array",
		8=>"TAG_String",
		9=>"TAG_List",
		10=>"TAG_Compound"
	);
	private static $pointer = 0;
	private static $nbtData = "";

	public static function validate($nbtData, $mustStartWithTagName = null) {
		self::$nbtData = $nbtData;
		
		$tagId = self::readByte();
		if ($tagId != self::nbtTagId("TAG_Compound")) {
			$returnArray = array(
				"error" => true,
				"errorDescription" => "Unexpected starting tag type of $tagId found, expected " . self::nbtTagId("TAG_Compound") . "."
			);
			return false;
		}
		
		//Extracted chunks seem to start with an unnamed compoung tag, while schematics don't, this if statement handles such an occurrence
		if (self::readShort() != 0) {
			self::$pointer = self::$pointer - 2;
		}
		
		$tagName = self::readString();
		if ($parentTagName != null && $tagName != $mustStartWithTagName) {
			$returnArray = array(
				"error" => true,
				"errorDescription" => "Unexpected starting tag type of $tagId found, expected " . self::nbtTagId("TAG_Compound") . "."
			);
			return false;
		}
		
		else {
			return self::switchTag($tagId);
		}
		
		
	}
	
	private static function switchTag($tagId) {
		$tagType = self::nbtTagType($tagId);
		
		switch ($tagType) {
			/*
			Should only occur to signify the end of a compound tag's payload, so we should never be "processing" a tag of type end.
			
			case "TAG_End":
				self::processTag_end($payload);
				break;
			*/
			case "TAG_Byte":
				return self::getTagData_byte();
				break;
			case "TAG_Short":
				return self::getTagData_short();
				break;
			case "TAG_Int":
				return self::getTagData_int();
				break;
			case "TAG_Long":
				return self::getTagData_long();
				break;
			case "TAG_Float":
				return self::getTagData_float();
				break;
			case "TAG_Double":
				return self::getTagData_double();
				break;
			case "TAG_Byte_Array":
				return self::getTagData_byteArray();
				break;
			case "TAG_String":
				return self::getTagData_string();
				break;
			case "TAG_List":
				return self::getTagData_list();
				break;
			case "TAG_Compound":
				return self::getTagData_compound();
				break;
			default:
				//TODO: If we get here, an unspecified tag type has been found
				break;
		}
	}
	
	/*
	Functions to handle reading actual tagtypes
	*/
	
	private static function getTagData_byte() {
		return self::readByte();
	}
	
	private static function getTagData_short() {
		return self::readShort();
	}
	
	private static function getTagData_int() {
		return self::readInt();
	}
	
	private static function getTagData_long() {
		return self::readLong();
	}
	
	private static function getTagData_float() {
		return self::readFloat();
	}
	
	private static function getTagData_double() {
		return self::readDouble();
	}
	
	private static function getTagData_byteArray() {
		return self::readByteArray();
	}
	
	private static function getTagData_string() {
		return self::readString();
	}
	
	private static function getTagData_list() {
		$returnArray = array();
		$tagId = self::readByte();
		$length = self::readInt();
		for ($i = 0; $i < $length; $i++) {
			if (self::memoryLimitReached()) return;
			$returnArray[] = self::switchTag($tagId);
		}
		return array(
			"type" => $tagId,
			"payload" => $returnArray
		);
		
	
	}
	
	private static function getTagData_compound() {
		$returnArray = array();
		
		$tagId = self::readByte();
		while ($tagId != self::nbtTagId("TAG_End")) {
			if (self::memoryLimitReached()) return;
			$tagName = self::readString();
			$returnArray[$tagName] = array(
				"type" => $tagId,
				"payload" => self::switchTag($tagId)
			);
			$tagId = self::readByte();
		}

		return $returnArray;
	}
	
	/*
	Functions which read data of a certain type
	*/
	
	private static function readByte() {
		$data = substr(self::$nbtData, self::$pointer, 1);
		self::$pointer+= 1;
		
		$array = unpack("Cdata", $data);
		return $array["data"];		
	}
	
	private static function readByteArray() {
		$length = self::readInt();
		$data = substr(self::$nbtData, self::$pointer, $length);
		self::$pointer+= $length;
		return $data;
	}
	
	private static function readShort() {
		$data = substr(self::$nbtData, self::$pointer, 2);
		$data = self::fromBigEndian($data);
		self::$pointer+= 2;
		
		$array = unpack("sdata", $data);
		return $array["data"];		
	}
	
	private static function readInt() {
		$data = substr(self::$nbtData, self::$pointer, 4);
		$data = self::fromBigEndian($data);
		self::$pointer+= 4;
		
		//In PHPs (un)pack(), a long is always 32bits.
		$array = unpack("ldata", $data);
		return $array["data"];		
	}
	
	private static function readLong() {
		/*
		TODO: Better handle 64bit longs on 32bit environments
		
		PHP 5.x does not support 64bit numbers unless it's compiled for a 64bit system.
		As it's unlikely the redstone simulator, would ever encounter long values 
		when reading schematic files, at this time not expending effort on working
		around this limitation. One could convert 64bit numbers to a float, but 
		seems there is no super easy way of doing so. As such, for now, will read it
		as an int on 64 bit environments, otherwise, it's treated as an overflowed to
		32 bit value.
		
		PHP 6 is planning support for 64 bit integers.
		*/
		
		
		$data = substr(self::$nbtData, self::$pointer, 8);
		$data = self::fromBigEndian($data);
		self::$pointer+= 8;
		
		if (PHP_INT_SIZE == 8) {
			$array = unpack("idata", $data);
		}
		else {
			//fall back to reading as a 32bit long, we are overflowing the number here.
			$data = substr($data, 4, 4);
			$array = unpack("ldata", $data);
		}
		return $array["data"];		
	}
	
	private static function readFloat() {
		$systemFloatSize = strlen(pack("f", (float)0));
		if ($systemFloatSize != 4) {
			//TODO: Handle error. Float size varies from system to system, handle if it's wrong.
		}

		$data = substr(self::$nbtData, self::$pointer, 4);
		$data = self::fromBigEndian($data);
		self::$pointer+= 4;
		
		$array = unpack("fdata", $data);
		return $array["data"];
	}
	
	private static function readDouble() {
		$systemFloatSize = strlen(pack("d", (float)0));
		if ($systemFloatSize != 8) {
			//TODO: Handle error. Double size varies from system to system, handle if it's wrong.
		}

		$data = substr(self::$nbtData, self::$pointer, 8);
		$data = self::fromBigEndian($data);
		self::$pointer+= 8;
		
		$array = unpack("ddata", $data);
		return $array["data"];
	}
	
	private static function readString() {
		$length = self::readShort();
		$data = substr(self::$nbtData, self::$pointer, $length);
		//TODO: NBT uses UTF-8 character encoding, ensure we don't need special code to handle.
		self::$pointer+= $length;
		
		return $data;
	}
	
	/*
	Miscellaneous utility functions:
	*/
	
	private static function fromBigEndian($binaryData) {
		//NBT files have all data in big endian format.

		if (self::isBigEndianEnvironment())
			return $binaryData;
		else
			return strrev($binaryData);
	}
	
	private static function isBigEndianEnvironment() {
		return (pack('s', 1) == "\x00\x01");
	}

	private static function nbtTagId($type) {
		foreach (self::$nbtTags as $tagId => $tagType) {
			if ($tagType === $type) {
				return $tagId;
			}
		}
		return null;
	}

	private static function nbtTagType($id) {
		foreach (self::$nbtTags as $tagId => $tagType) {
			if ($tagId === $id) {
				return $tagType;
			}
		}
		return null;
	}
}
?>