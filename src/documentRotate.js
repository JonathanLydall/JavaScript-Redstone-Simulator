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
var funcName = "documentRotate";

namespace[funcName] = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;

	this.construct = function() {
		var t = this;
		this.progressModal = new com.mordritch.mcSim.guiFullModal(this.gui);
		 
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modal.addButton({
			label: this.L10n.getString("button.text.apply"),
			onActivateFunction: function() {
				t.onOkClick();
			}
		});
		
		this.setContent();
	}
	
	this.setContent = function() {
		var clockwise = this.L10n.getString("document.rotate.clockwise");
		var html =
			'<div class="documentRotate">' +
				'<p><strong>' + this.L10n.getString("document.rotate.modalheading") + '</strong></p>' +
				'<p>' + this.L10n.getString("document.rotate.disclaimer") + '</p>' +
				'<p>' +
					'<input id="radioRotateBy90" type="radio" name="rotateAmount" value="90" checked="true"> <label for="radioRotateBy90">90&deg; '+ clockwise +'</label><br />' +  
					'<input id="radioRotateBy180" type="radio" name="rotateAmount" value="180"> <label for="radioRotateBy180">180&deg; '+ clockwise +'</label><br />' +  
					'<input id="radioRotateBy270" type="radio" name="rotateAmount" value="270"> <label for="radioRotateBy270">270&deg; '+ clockwise +'</label><br />' +  
				'</p>' +
			'</div>';
			
		this.modal.setContent(html);
	}
	
	this.onOkClick = function() {
		this.modal.hide();

		this.progressModal.setContent(
			'<strong>'+this.L10n.getString('document.rotate.progress.title')+'</strong>' +
			'<p>'+this.L10n.getString('document.rotate.progress.body')+'</p>'
		);
		this.progressModal.setDomClass('prompt');
		this.progressModal.disableControls();
		this.progressModal.show();
		
		//Give the DOM a chance to show the updated modal
		var t = this;
		setTimeout(function() {
			t.doRotate();
		},5);
	}
	
	this.doRotate = function() {
		var rotateAmountInDegrees = parseInt($('.documentRotate input["rotateAmount"]:checked').val());
		var rotateAmount = Math.floor(rotateAmountInDegrees/90);
		var block, blockMetadata;
		var startedAt = new Date().getTime();
		
		var World = this.gui.mcSim.World;
		var blocksList = World.Block.blocksList;
		World.commitAll();
		World.worldData.rotateSelection(rotateAmountInDegrees);
		World.loadAll();

		var sizeX = World.worldData.getSizeX();
		var sizeY = World.worldData.getSizeY();
		var sizeZ = World.worldData.getSizeZ();
		
		for (var x=0; x<sizeX; x++) { for (var y=0; y<sizeY; y++) { for (var z=0; z<sizeZ; z++) { 
			block = blocksList[World.getBlockId(x, y, z)];
			blockMetadata = World.getBlockMetadata(x, y, z);
			blockMetadata = block.rotateSelection(blockMetadata, rotateAmount);
			World.setBlockMetadata(x, y, z, blockMetadata);
		} } }
		
		var count = 0;
		var loadedTileEntityList = World.loadedTileEntityList;
		for (var tileEntity in loadedTileEntityList) {
			count++;
			loadedTileEntityList[tileEntity].rotateSelection(rotateAmount);
		}
		
		console.log("Rotated %s blocks and %s tile enties in %sms.", sizeX*sizeY*sizeZ, count, new Date().getTime() - startedAt)
		this.gui.refreshModelViews();
		this.progressModal.enableControls();
		this.progressModal.hide();
	}
	
	this.show = function() {
		this.modal.show();
	}
	
	
	this.construct();
}})();
