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

//Initialize a name space, deliberately not a class or using variables to try avoid any potential namespace
//conflict (except for "com" still potentially being in conflict)
if (typeof window["com"] == "undefined") window["com"] = {};
if (typeof window.com["mordritch"] == "undefined") window.com["mordritch"] = {};
if (typeof window.com.mordritch["mcSim"] == "undefined") window.com.mordritch["mcSim"] = {};
