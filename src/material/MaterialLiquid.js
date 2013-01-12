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
