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
