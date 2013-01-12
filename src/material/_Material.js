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
