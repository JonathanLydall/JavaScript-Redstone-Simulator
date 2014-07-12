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
			throw new Error("WorldTypeLevel.getPosition(): x is out of bounds.");
		
		if (y >= this.chunkSizeY || y < 0)
			throw new Error("WorldTypeLevel.getPosition(): y is out of bounds.");
		
		if (z >= this.chunkSizeZ || z < 0)
			throw new Error("WorldTypeLevel.getPosition(): z is out of bounds.");
		
		return y + z * this.chunkSizeY + x * this.chunkSizeY * this.chunkSizeZ;
	};
	
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
	};
	
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
	};
	
	/**
	 * Returns the x size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeX = function() {
		return this.chunkSizeX;
	};
	
	/**
	 * Returns the y size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeY = function() {
		return this.chunkSizeY;
	};
	
	/**
	 * Returns the z size of the schematic in terms minecraft co-ordinate system
	 */
	this.getSizeZ = function() {
		return this.chunkSizeX;
	};
	
	/**
	 * Retrieve a Tile Entity
	 */
	this.getTileEntity = function(x, y, z) {
		//TODO: Implement
	};
	
	/**
	 * Retrieve an entity
	 */
	this.getEntity = function(x, y, z) {
		
	};
	
	/**
	 * Removes internal reference to the schematic object allowing it to be freed by the garbage collector.
	 * 
	 * We can't force freeing of memory in Javascript, but as long as there is no referrence to the object
	 * then the garbage collector should eventually free it up. 
	 */
	this.destroy = function() {
		this.level = undefined;
	};
};
