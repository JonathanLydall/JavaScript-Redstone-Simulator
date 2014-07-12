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
var funcName = "documentResize";

namespace[funcName] = function(gui) {
	this.gui = gui;
	this.L10n = gui.localization;
	this.inverseProperty = {
			zTopMore: "zTopLess",
			zTopLess: "zTopMore",
			zBottomMore: "zBottomLess",
			zBottomLess: "zBottomMore",
			xLeftMore: "xLeftLess",
			xLeftLess: "xLeftMore",
			xRightMore: "xRightLess",
			xRightLess: "xRightMore",
			yTopMore: "yTopLess",
			yTopLess: "yTopMore",
			yBottomMore: "yBottomLess",
			yBottomLess: "yBottomMore"
	};
	this.selectedBlockId = "1"; //expects a string
	
	this.construct = function() {
		var t = this;
		this.modal = new com.mordritch.mcSim.guiFullModal(this.gui); 
		this.modal.addButton({
			label: this.L10n.getString("button.text.apply"),
			onActivateFunction: function() {
				t.setDimensions();
			},
			isDefault: true
		});
		
		this.setContent();
	};
	
	this.setContent = function() {
		var html =
			'<div class="documentResize">' +
				'<div>' +
					'<table>' +
						'<tr>' + 
							'<th></th>' + 
							'<th>'+this.L10n.getString('resize.x')+'</th>' + 
							'<th>'+this.L10n.getString('resize.y')+'</th>' + 
							'<th>'+this.L10n.getString('resize.z')+'</th>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.current')+':</td>' + 
							'<td><span class="readonly xCurrent"></span></td>' + 
							'<td><span class="readonly yCurrent"></span></td>' + 
							'<td><span class="readonly zCurrent"></span></td>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.difference')+':</td>' + 
							'<td><span class="readonly xDifference">0</span></td>' + 
							'<td><span class="readonly yDifference">0</span></td>' + 
							'<td><span class="readonly zDifference">0</span></td>' + 
						'</tr>' +
						'<tr>' + 
							'<td style="text-align: left;">'+this.L10n.getString('resize.new')+':</td>' + 
							'<td><span class="readonly xNew"></span></td>' + 
							'<td><span class="readonly yNew"></span></td>' + 
							'<td><span class="readonly zNew"></span></td>' + 
						'</tr>' +
					'</table>' +
					'<table style="margin-left: 34px;">' +
						'<tr>' +
							'<td style="text-align: left; width: 300px;">' +
								this.L10n.getString('resize.x.description') + '<br/><br/>' +
								this.L10n.getString('resize.y.description') + '<br/><br/>' +
								this.L10n.getString('resize.z.description') + '' +
							'</td>' +
						'</tr>' +
					'</table>' +
				'</div>';
				
		html += '<div><br/>'+this.L10n.getString('resize.populatelowerlayers')+'<br/><select class="restingBlockType">';

		var placeableBlocks = this.gui.placeableBlocks;
		for (var i in placeableBlocks) {
			block = this.gui.mcSim.Block.blocksList[placeableBlocks[i].blockID];
			if (placeableBlocks[i].blockMetadata == 0 || block.blockMaterial.isOpaque() && block.renderAsNormalBlock()) {
				var blockId = (placeableBlocks[i].blockMetadata == 0) ? placeableBlocks[i].blockID : placeableBlocks[i].blockID + ':' + placeableBlocks[i].blockMetadata;
				var blockName = this.gui.localization.getString(placeableBlocks[i].blockName);
				
				if (blockId == this.selectedBlockId) {
					html += '<option selected="selected" value="'+blockId+'">'+blockId+' - '+blockName+'</option>';
				}
				else {
					html += '<option value="'+blockId+'">'+blockId+' - '+blockName+'</option>';
				}
				 
			}
		}
		html += '</div>';
		
		html += '<select class="restingBlockType">';
			html +=
				'<div><br/>' +
					'<table style="border-collapse: seperate; border-spacing: 0;">' +
						'<colgroup>' +
							'<col style="width: 34px;">' + //1
							'<col style="width: 34px;">' + //2
							'<col>' + //3
							'<col style="width: 34px;">' + //4
							'<col style="width: 34px;">' + //5
						'</colgroup>' +
						'<tr>' +
							'<td colspan="5" style="text-align: left; padding-bottom: 10px;"><b>' + this.L10n.getString('resize.x.and.z') + '</td>' + 
						'</tr>' +
						'<tr>' + //1
							'<td class="bottomGray rightGray"><span style="font-weight: bold;">N: ↑</span></td>' + 
							'<td class="topDashedGray bottomBlack" colspan="3"><span class="plusButton button zTopMore">+</span></td>' + 
							'<td class="bottomGray leftGray"></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftDashedGray rightBlack" rowspan="3"><span class="minusButton button xLeftMore">+</span></td>' + 
							'<td class="bottomDashedGray rightDashedGray"></td>' + 
							'<td class="bottomDashedGray"><span class="minusButton button zTopLess">-</span></td>' + 
							'<td class="bottomDashedGray leftDashedGray"></td>' + 
							'<td class="rightDashedGray leftBlack" rowspan="3"><span class="minusButton button xRightMore">+</span></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="rightDashedGray"><span class="minusButton button xLeftLess">-</span></td>' + 
							'<td>'+
								'<table style="margin: 0;">'+
									'</tr>' +
										'<td></td>'+
										'<td><input class="zTop"></td>'+
										'<td></td>'+
									'<tr>' +
									'</tr>' +
										'<td><input class="xLeft"></td>'+
										'<td></td>'+
										'<td><input class="xRight"></td>'+
									'<tr>' +
									'</tr>' +
										'<td></td>'+
										'<td><input class="zBottom"></td>'+
										'<td></td>'+
									'<tr>' +
								'</table>'+
							'</td>' + 
							'<td class="leftDashedGray"><span class="minusButton button xRightLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //4
							'<td class="rightDashedGray topDashedGray"></td>' + 
							'<td class="topDashedGray"><span class="minusButton button zBottomLess">-</span></td>' + 
							'<td class="leftDashedGray topDashedGray"></td>' + 
						'</tr>' +
						'<tr>' + //5
							'<td class="topGray rightGray"></td>' + 
							'<td class="topBlack bottomDashedGray" colspan="3"><span class="plusButton button zBottomMore">+</span></td>' + 
							'<td class="topGray leftGray"></td>' + 
						'</tr>' +
					'</table>' + 

					'<table style="border-collapse: seperate; border-spacing: 0; margin-left: 34px;">' +
						'<colgroup>' +
							'<col style="width: 100px;">' +
						'</colgroup>' +
						'<tr>' +
							'<td style="text-align: left; padding-bottom: 10px;"><b>' + this.L10n.getString('resize.y.only') + '</b></td>' + 
						'</tr>' +
						'<tr>' + //1
							'<td class="topDashedGray rightGray leftGray bottomBlack" style="padding-right: 2px;"><span class="plusButton button yTopMore">+</span></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftBlack rightBlack bottomDashedGray"><span class="minusButton button yTopLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="leftBlack rightBlack"><input class="yTop"></td>' + 
						'</tr>' +
						'<tr>' + //3
							'<td class="leftBlack rightBlack" style="height: 46px"></td>' + 
						'</tr>' +
						'<tr>' + //4
							'<td class="leftBlack rightBlack"><input class="yBottom"></td>' + 
						'</tr>' +
						'<tr>' + //2
							'<td class="leftBlack rightBlack topDashedGray"><span class="minusButton button yBottomLess">-</span></td>' + 
						'</tr>' +
						'<tr>' + //5
							'<td class="rightGray leftGray bottomDashedGray topBlack"><span class="plusButton button yBottomMore">+</span></td>' + 
						'</tr>' +
					'</table>' + 
				'</div>' +
			'</div>';
			
		this.modal.setContent(html);
		
		var t = this;
		$('.documentResize input').on('change keyup', function(e) {
			if (e.type == "change" || (e.type == "keyup" && e.which == 13)) {
				t.onInputChange();
			}
		});
		
		$('.documentResize .restingBlockType').on('change keyup', function(e) {
			t.selectedBlockId = $('.documentResize .restingBlockType').val();
		});
		
		$('.documentResize .button.zTopMore').on('click', function() { t.onButtonClick("zTop", 1);});
		$('.documentResize .button.zTopLess').on('click', function() { t.onButtonClick("zTop", -1);});
		$('.documentResize .button.zBottomMore').on('click', function() { t.onButtonClick("zBottom", 1);});
		$('.documentResize .button.zBottomLess').on('click', function() { t.onButtonClick("zBottom", -1);});
		
		$('.documentResize .button.xLeftMore').on('click', function() { t.onButtonClick("xLeft", 1);});
		$('.documentResize .button.xLeftLess').on('click', function() { t.onButtonClick("xLeft", -1);});
		$('.documentResize .button.xRightMore').on('click', function() { t.onButtonClick("xRight", 1);});
		$('.documentResize .button.xRightLess').on('click', function() { t.onButtonClick("xRight", -1);});
		
		$('.documentResize .button.yTopMore').on('click', function() { t.onButtonClick("yTop", 1);});
		$('.documentResize .button.yTopLess').on('click', function() { t.onButtonClick("yTop", -1);});
		$('.documentResize .button.yBottomMore').on('click', function() { t.onButtonClick("yBottom", 1);});
		$('.documentResize .button.yBottomLess').on('click', function() { t.onButtonClick("yBottom", -1);});
	};
	
	this.getCurrentDimensions = function() {
		if (this.gui.mcSim.World == null) {
			return {x: 0, y: 0, z:0 };
		}
		else {
			return {
				x: this.gui.mcSim.World.worldData.getSizeX(),
				y: this.gui.mcSim.World.worldData.getSizeY(),
				z: this.gui.mcSim.World.worldData.getSizeZ()
			};
		}
	};
	
	this.setDimensions = function() {
		var xCurrent = parseInt(this.getCurrentDimensions().x);
		var yCurrent = parseInt(this.getCurrentDimensions().y);
		var zCurrent = parseInt(this.getCurrentDimensions().z);

		var xDifference = parseInt(this.model.xRight) + parseInt(this.model.xLeft);
		var yDifference = parseInt(this.model.yTop) + parseInt(this.model.yBottom);
		var zDifference = parseInt(this.model.zTop) + parseInt(this.model.zBottom);
		
		var xNew = xCurrent + xDifference;
		var yNew = yCurrent + yDifference;
		var zNew = zCurrent + zDifference;
		
		if (xNew < 1 || yNew < 1 || zNew < 1) {
			return;
		}
		
		var World = this.gui.mcSim.World;
		
		if (
			this.model.xRight != 0 ||
			this.model.xLeft != 0 ||
			this.model.zTop != 0 ||
			this.model.zBottom != 0 ||
			this.model.yTop != 0 ||
			this.model.yBottom != 0
		) {
			World.commitAll();
			World.worldData.setDimensions(
				sizeX = xNew,
				sizeY = yNew,
				sizeZ = zNew,
				offsetX = this.model.xLeft,
				offsetY = this.model.yBottom,
				offsetZ = this.model.zTop
			);
			
			if (this.selectedBlockId != 0) {
				if (this.selectedBlockId.indexOf(":") > 0) {
					var blockId = parseInt(this.selectedBlockId.split(":")[0], 10);
					var blockMetadata = parseInt(this.selectedBlockId.split(":")[1], 10);
				}
				else {
					var blockId = parseInt(this.selectedBlockId, 10);
					var blockMetadata = 0;
				}
			
				for (var x=0; x < xNew; x++) {
					for (var y=0; y < this.model.yBottom; y++) {
						for (var z=0; z < zNew; z++) {
							World.setBlockAndMetadata(x, y, z, blockId, blockMetadata);
						}
					}
				}
			}
			World.loadAll();
			
			this.gui.refreshModelViews();
		}
		
		this.modal.hide();
	};
	
	this.show = function() {
		this.model = {
			zTop: 0,
			zBottom: 0,
			xLeft: 0,
			xRight: 0,
			yTop: 0,
			yBottom: 0
		};

		this.updateModelView();
		this.modal.show();
	};
	
	this.onInputChange = function() {
		var val, inverseProperty;
		
		for (var property in this.model) {
			val = $('.documentResize .' + property).val();
			if (parseInt(val, 10) != val) {
				$('.documentResize .' + property).addClass("invalidBackgroundColor");
			}
			else {
				$('.documentResize .' + property).removeClass("invalidBackgroundColor");
			}
			
			if (parseInt(val, 10) == val && parseInt(val, 10) != this.model[property]) {
				this.model[property] = parseInt(val, 10);
				this.updateModelView();
			}
		}
	};
	
	this.onButtonClick = function(property, delta) {
		this.model[property] = this.model[property] + delta;
		
		this.updateModelView();
	};
	
	this.updateModelView = function() {
		var xCurrent = parseInt(this.getCurrentDimensions().x, 10);
		var yCurrent = parseInt(this.getCurrentDimensions().y, 10);
		var zCurrent = parseInt(this.getCurrentDimensions().z, 10);

		var xDifference = parseInt(this.model.xRight, 10) + parseInt(this.model.xLeft, 10);
		var yDifference = parseInt(this.model.yTop, 10) + parseInt(this.model.yBottom, 10);
		var zDifference = parseInt(this.model.zTop, 10) + parseInt(this.model.zBottom, 10);
		
		var xNew = xCurrent + xDifference;
		var yNew = yCurrent + yDifference;
		var zNew = zCurrent + zDifference;
		 
		$('.documentResize .xCurrent').text(xCurrent);
		$('.documentResize .yCurrent').text(yCurrent);
		$('.documentResize .zCurrent').text(zCurrent);

		$('.documentResize .xDifference').text(xDifference);
		$('.documentResize .yDifference').text(yDifference);
		$('.documentResize .zDifference').text(zDifference);

		$('.documentResize .xNew').text(xNew);
		$('.documentResize .yNew').text(yNew);
		$('.documentResize .zNew').text(zNew);
		
		if (xNew > 0) {
			$('.documentResize .xNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .xNew').addClass("invalidBackgroundColor");
		}

		if (yNew > 0) {
			$('.documentResize .yNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .yNew').addClass("invalidBackgroundColor");
		}

		if (zNew > 0) {
			$('.documentResize .zNew').removeClass("invalidBackgroundColor");
		}
		else {
			$('.documentResize .zNew').addClass("invalidBackgroundColor");
		}

		for (var property in this.model) {
			$('.documentResize .' + property).val(this.model[property]);
			$('.documentResize .' + property).removeClass("invalidBackgroundColor");
		}
	};
	
	this.construct();
};
})();
