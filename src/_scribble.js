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
