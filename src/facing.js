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
}