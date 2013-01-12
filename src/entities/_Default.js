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
}