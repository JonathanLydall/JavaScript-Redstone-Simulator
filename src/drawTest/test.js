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

function drawTests(context) {
	underLined(context);
	
	return;
	drawCornerTrack(context);
	context.translate(0, 8);
	drawStraightTrack(context);
	context.translate(0, -8);

	context.translate(8, 0);
	context.translate(4, 4);
	context.rotate(90*Math.PI/180);
	context.translate(-4, -4);

	drawStraightTrack(context);
}

function underLined(canvas) {
	var fontColour = "rgb(0,0,0)";

	canvas.fillStyle  = fontColour;
	canvas.textBaseline = "middle";
	canvas.textAlign = "center";
	canvas.font = "bold " + (7) + "px arial";
	canvas.fillText("A", 4, 5, 8);
	canvas.fillRect(1,0.5,6,1);
	
}

function drawSignSide(canvas) {
	var woodColor = "rgb(168,135,84)";
	var textColor = "rgb(0,0,0)";
	canvas.fillStyle = woodColor;
	canvas.fillRect(1, 1, 6, 5);
	canvas.fillRect(3, 6, 2, 2);

	canvas.fillStyle = textColor;
	canvas.fillRect(2, 2, 2, 1);	
	canvas.fillRect(5, 2, 1, 1);	

	canvas.fillRect(2, 4, 1, 1);	
	canvas.fillRect(4, 4, 2, 1);	
}

function drawSignPost(canvas) {
	var woodColor = "rgb(168,135,84)";
	var textColor = "rgb(0,0,0)";
	canvas.fillStyle = woodColor;
	canvas.fillRect(0.5, 3, 7, 2);
	canvas.fillStyle = textColor;
	canvas.fillRect(1.5, 4, 5, 1);
}

function drawStraightTrack(ctx) {
	ctx.fillStyle = "rgb(97,66,38)"; //brown
	ctx.fillRect(0.5, 0.5, 7, 1);
	ctx.fillRect(0.5, 2.5, 7, 1);
	ctx.fillRect(0.5, 4.5, 7, 1);
	ctx.fillRect(0.5, 6.5, 7, 1);
	
	ctx.fillStyle = "rgb(127,127,127)"; //grey
	ctx.fillRect(1, 0, 1, 8);
	ctx.fillRect(6, 0, 1, 8);
}

function drawCornerTrack(ctx) {
	ctx.strokeStyle = "rgb(97,66,38)"; //brown
	ctx.lineWidth = 1;

	ctx.beginPath();

	ctx.moveTo(2.5, 2.5);
	ctx.lineTo(7.5, 7.5);

	ctx.moveTo(6, 0.5);
	ctx.lineTo(7.5, 7.5);

	ctx.moveTo(0.5, 6);
	ctx.lineTo(7.5, 7.5);

	ctx.stroke();

	ctx.fillStyle = "rgb(127,127,127)"; //grey
	ctx.beginPath();
	ctx.moveTo(1, 8);
	ctx.arcTo(1, 1, 8, 1, 6.5);
	ctx.lineTo(8, 1);
	ctx.lineTo(8, 2);
	ctx.arcTo(2, 2, 2, 8, 5.5);
	ctx.lineTo(2, 8);
	ctx.lineTo(1, 8);
	ctx.fill();

	//And the other track.

	ctx.beginPath();
	ctx.moveTo(6, 8);
	ctx.arcTo(6, 6, 8, 6, 1.5);
	ctx.lineTo(8, 6);
	ctx.lineTo(8, 7);
	ctx.arcTo(7, 7, 7, 8, 0.5);
	ctx.lineTo(7, 8);
	ctx.lineTo(6, 8);
	ctx.fill();
}
