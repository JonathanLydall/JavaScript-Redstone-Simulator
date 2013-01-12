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
 * Mostly replicates behaviour of the Block object from the game's source code.
 */
com.mordritch.mcSim.Block = function() {
	this.blocksList = new Array();
	
	this.blockDefinitions = {
		unknown: {
			blockID: -1,
			className: "BlockType__Unknown",
			blockName: "unknown",
			material: "rock"
		},
		air: {
			blockID: 0,
			className: "BlockType_Air",
			blockName: "air",
			material: "air"
		},
		stone: {
			blockID: 1,
			className: "BlockType_Stone",
			blockName: "stone",
			textureblockID: 1,
			hardness: 1.5,
			resistance: 10
		},
		grass: {
			blockID: 2,
			className: "BlockType_Grass",
			blockName: "grass",
			hardness: 0.6
		},
		dirt: {
			blockID: 3,
			className: "BlockType_Dirt",
			blockName: "dirt",
			textureblockID: 2,
			hardness: 0.5
		},
		cobblestone: {
			blockID: 4,
			className: "BlockType_Block",
			blockName: "stonebrick",
			textureblockID: 16,
			material: "rock",
			hardness: 2.0
		},
		planks: {
			blockID: 5,
			className: "BlockType_Block",
			blockName: "wood",
			hardness: 2.0,
			material: "wood",
			requiresSelfNotify: true
		},
		sapling: {
			blockID: 6,
			className: "BlockType_Sapling",
			blockName: "sapling",
			requiresSelfNotify: true
		},
		bedrock: {
			blockID: 7,
			className: "BlockType_Block",
			blockName: "bedrock",
			unbreakable: true,
			material: "rock"
		},
		waterMoving: {
			blockID: 8,
			className: "BlockType_Flowing",
			blockName: "water",
			material: "water",
			requiresSelfNotify: true
		},
		waterStill: {
			blockID: 9,
			className: "BlockType_Stationary",
			blockName: "water",
			material: "water",
			requiresSelfNotify: true
		},
		lavaMoving: {
			blockID: 10,
			className: "BlockType_Flowing",
			blockName: "lava",
			material: "lava",
			requiresSelfNotify: true
		},
		lavaStill: {
			blockID: 11,
			className: "BlockType_Stationary",
			blockName: "lava",
			material: "lava",
			requiresSelfNotify: true
		},
		sand: {
			blockID: 12,
			className: "BlockType_Sand",
			blockName: "sand"
		},
		gravel: {
			blockID: 13,
			className: "BlockType_Gravel",
			blockName: "gravel"
		},
		oreGold: {
			blockID: 14,
			className: "BlockType_Ore",
			blockName: "oreGold"
		},
		oreIron: {
			blockID: 15,
			className: "BlockType_Ore",
			blockName: "oreIron"
		},
		oreCoal: {
			blockID: 16,
			className: "BlockType_Ore",
			blockName: "oreCoal"
		},
		wood: {
			blockID: 17,
			className: "BlockType_Log",
			blockName: "log",
			requiresSelfNotify: true
		},
		leaves: {
			blockID: 18,
			className: "BlockType_Leaves",
			blockName: "leaves",
			requiresSelfNotify: true
		},
		sponge: {
			blockID: 19,
			className: "BlockType_Sponge",
			blockName: "sponge"
		},
		glass: {
			blockID: 20,
			className: "BlockType_Glass",
			blockName: "glass",
			material: "glass"
		},
		oreLapis: {
			blockID: 21,
			className: "BlockType_Ore",
			blockName: "oreLapis"
		},
		blockLapis: {
			blockID: 22,
			className: "BlockType_Block",
			blockName: "blockLapis",
			material: "rock"
		},
		dispenser: {
			blockID: 23,
			className: "BlockType_Dispenser",
			blockName: "dispenser",
			requiresSelfNotify: true
		},
		sandStone: {
			blockID: 24,
			className: "BlockType_SandStone",
			blockName: "sandStone"
		},
		music: {
			blockID: 25,
			className: "BlockType_Note",
			blockName: "musicBlock",
			hardness: 0.8
		},
		bed: {
			blockID: 26,
			className: "BlockType_Bed",
			blockName: "bed",
			hardness: 0.2
		},
		railPowered: {
			blockID: 27,
			className: "BlockType_Rail",
			blockName: "goldenRail",
			requiresSelfNotify: true
		},
		railDetector: {
			blockID: 28,
			className: "BlockType_DetectorRail",
			blockName: "detectorRail",
			requiresSelfNotify: true
		},
		pistonStickyBase: {
			blockID: 29,
			className: "BlockType_PistonBase",
			blockName: "pistonStickyBase",
			requiresSelfNotify: true
		},
		web: {
			blockID: 30,
			className: "BlockType_Web",
			blockName: "web",
			textureblockID: 11,
			hardness: 4
		},
		tallGrass: {
			blockID: 31,
			className: "BlockType_TallGrass",
			blockName: "tallgrass"
		},
		deadBush: {
			blockID: 32,
			className: "BlockType_DeadBush",
			blockName: "deadbush"
		},
		pistonBase: {
			blockID: 33,
			className: "BlockType_PistonBase",
			blockName: "pistonBase",
			requiresSelfNotify: true
		},
		pistonExtension: {
			blockID: 34,
			className: "BlockType_PistonExtension",
			textureblockID: 107,
			requiresSelfNotify: true
		},
		cloth: {
			blockID: 35,
			className: "BlockType_Cloth",
			blockName: "cloth"
		},
		pistonMoving: {
			blockID: 36,
			className: "BlockType_PistonMoving"
		},
		plantYellow: {
			blockID: 37,
			className: "BlockType_Flower",
			blockName: "flower"
		},
		plantRed: {
			blockID: 38,
			className: "BlockType_Flower",
			blockName: "rose"
		},
		mushroomBrown: {
			blockID: 39,
			className: "BlockType_Mushroom",
			blockName: "mushroom"
		},
		mushroomRed: {
			blockID: 40,
			className: "BlockType_Mushroom",
			blockName: "mushroom"
		},
		blockGold: {
			blockID: 41,
			className: "BlockType_OreStorage",
			blockName: "blockGold"
		},
		blockSteel: {
			blockID: 42,
			className: "BlockType_OreStorage",
			blockName: "blockIron"
		},
		stairDouble: {
			blockID: 43,
			className: "BlockType_Step",
			blockName: "stairDouble"
		},
		stairSingle: {
			blockID: 44,
			className: "BlockType_Step", //slabs
			blockName: "stairSingle"
		},
		brick: {
			blockID: 45,
			className: "BlockType_Block",
			blockName: "brick",
			material: "rock"
		},
		tnt: {
			blockID: 46,
			className: "BlockType_TNT",
			blockName: "tnt"
		},
		bookShelf: {
			blockID: 47,
			className: "BlockType_Bookshelf",
			blockName: "bookshelf"
		},
		cobblestoneMossy: {
			blockID: 48,
			className: "BlockType_Block",
			blockName: "stoneMoss",
			material: "rock"
		},
		obsidian: {
			blockID: 49,
			className: "BlockType_Obsidian",
			blockName: "obsidian"
		},
		torchWood: {
			blockID: 50,
			className: "BlockType_Torch",
			blockName: "torch",
			requiresSelfNotify: true
		},
		fire: {
			blockID: 51,
			className: "BlockType_Fire",
			blockName: "fire"
		},
		mobSpawner: {
			blockID: 52,
			className: "BlockType_MobSpawner",
			blockName: "mobSpawner"
		},/*
		stairCompactPlanks: {
			blockID: 53,
			className: "BlockType_Stairs",
			blockName: "stairsWood",
			modelBlock: "planks",
			requiresSelfNotify: true
		},*/
		chest: {
			blockID: 54,
			className: "BlockType_Chest",
			blockName: "chest",
			requiresSelfNotify: true
		},
		redstoneWire: {
			blockID: 55,
			className: "BlockType_RedstoneWire",
			blockName: "redstoneDust",
			requiresSelfNotify: true
		},
		oreDiamond: {
			blockID: 56,
			className: "BlockType_Ore",
			blockName: "oreDiamond"
		},
		blockDiamond: {
			blockID: 57,
			className: "BlockType_OreStorage",
			blockName: "blockDiamond"
		},
		workbench: {
			blockID: 58,
			className: "BlockType_Workbench",
			blockName: "workbench"
		},
		crops: {
			blockID: 59,
			className: "BlockType_Crops",
			blockName: "crops",
			requiresSelfNotify: true
		},
		tilledField: {
			blockID: 60,
			className: "BlockType_Farmland",
			blockName: "farmland",
			requiresSelfNotify: true
		},
		stoneOvenIdle: {
			blockID: 61,
			className: "BlockType_Furnace",
			blockName: "furnace",
			requiresSelfNotify: true
		},
		stoneOvenActive: {
			blockID: 62,
			className: "BlockType_Furnace",
			blockName: "furnace",
			requiresSelfNotify: true
		},
		signPost: {
			blockID: 63,
			className: "BlockType_Sign",
			blockName: "sign",
			material: "wood",
			requiresSelfNotify: true
		},
		doorWood: {
			blockID: 64,
			className: "BlockType_Door",
			blockName: "doorWood",
			material: "wood",
			requiresSelfNotify: true
		},
		ladder: {
			blockID: 65,
			className: "BlockType_Ladder",
			blockName: "ladder",
			requiresSelfNotify: true
		},
		rail: {
			blockID: 66,
			className: "BlockType_Rail",
			blockName: "rail",
			requiresSelfNotify: true
		},/*
		stairCompactCobblestone: {
			blockID: 67,
			className: "BlockType_Stairs",
			blockName: "stairsStone",
			modelBlock: "cobblestone",
			requiresSelfNotify: true
		},*/
		signWall: {
			blockID: 68,
			className: "BlockType_Sign",
			blockName: "sign",
			material: "wood",
			requiresSelfNotify: true
		},
		lever: {
			blockID: 69,
			className: "BlockType_Lever",
			blockName: "lever",
			requiresSelfNotify: true
		},
		pressurePlateStone: {
			blockID: 70,
			className: "BlockType_PressurePlate",
			blockName: "pressurePlate",
			material: "rock",
			requiresSelfNotify: true,
			renderAsNormalBlock: false
		},
		doorSteel: {
			blockID: 71,
			className: "BlockType_Door",
			blockName: "doorIron",
			material: "iron",
			requiresSelfNotify: true
		},
		pressurePlatePlanks: {
			blockID: 72,
			className: "BlockType_PressurePlate",
			blockName: "pressurePlate",
			material: "wood",
			requiresSelfNotify: true,
			renderAsNormalBlock: false
		},
		oreRedstone: {
			blockID: 73,
			className: "BlockType_RedstoneOre",
			blockName: "oreRedstone",
			requiresSelfNotify: true
		},
		oreRedstoneGlowing: {
			blockID: 74,
			className: "BlockType_RedstoneOre",
			blockName: "oreRedstone",
			requiresSelfNotify: true
		},
		torchRedstoneIdle: {
			blockID: 75,
			className: "BlockType_RedstoneTorch",
			blockName: "notGate",
			requiresSelfNotify: true
		},
		torchRedstoneActive: {
			blockID: 76,
			className: "BlockType_RedstoneTorch",
			blockName: "notGate",
			requiresSelfNotify: true
		},
		button: {
			blockID: 77,
			className: "BlockType_Button",
			blockName: "button",
			requiresSelfNotify: true
		},
		snow: {
			blockID: 78,
			className: "BlockType_Snow",
			blockName: "snow"
		},
		ice: {
			blockID: 79,
			className: "BlockType_Ice",
			blockName: "ice"
		},
		blockSnow: {
			blockID: 80,
			className: "BlockType_SnowBlock",
			blockName: "snow"
		},
		cactus: {
			blockID: 81,
			className: "BlockType_Cactus",
			blockName: "cactus"
		},
		blockClay: {
			blockID: 82,
			className: "BlockType_Clay",
			blockName: "clay"
		},
		reed: {
			blockID: 83,
			className: "BlockType_Reed",
			blockName: "reeds"
		},
		jukebox: {
			blockID: 84,
			className: "BlockType_JukeBox",
			blockName: "jukebox",
			requiresSelfNotify: true
		},
		fence: {
			blockID: 85,
			className: "BlockType_Fence",
			blockName: "fence"
		},
		pumpkin: {
			blockID: 86,
			className: "BlockType_Pumpkin",
			blockName: "pumpkin",
			requiresSelfNotify: true
		},
		netherrack: {
			blockID: 87,
			className: "BlockType_Netherrack",
			blockName: "hellrock"
		},
		slowSand: {
			blockID: 88,
			className: "BlockType_SoulSand",
			blockName: "hellsand"
		},
		glowStone: {
			blockID: 89,
			className: "BlockType_GlowStone",
			blockName: "lightgem",
			material: "glass"
		},
		portal: {
			blockID: 90,
			className: "BlockType_Portal",
			blockName: "portal"
		},
		pumpkinLantern: {
			blockID: 91,
			className: "BlockType_Pumpkin",
			blockName: "litpumpkin",
			requiresSelfNotify: true
		},
		cake: {
			blockID: 92,
			className: "BlockType_Cake",
			blockName: "cake",
			requiresSelfNotify: true
		},
		redstoneRepeaterIdle: {
			blockID: 93,
			className: "BlockType_RedstoneRepeater",
			blockName: "diode",
			requiresSelfNotify: true
		},
		redstoneRepeaterActive: {
			blockID: 94,
			className: "BlockType_RedstoneRepeater",
			blockName: "diode",
			requiresSelfNotify: true
		},
		lockedChest: {
			blockID: 95,
			className: "BlockType_LockedChest",
			blockName: "lockedchest",
			requiresSelfNotify: true
		},
		trapdoor: {
			blockID: 96,
			className: "BlockType_TrapDoor",
			blockName: "trapdoor",
			material: "wood",
			requiresSelfNotify: true
		},
		/*
		silverfish: {
			blockID: 97,
			className: "BlockType_Silverfish",
			blockName: "silverfish",
			hardness: 0.7
		},*/
		stoneBrick: {
			blockID: 98,
			className: "BlockType_StoneBrick",
			blockName: "stonebricksmooth"
		},/*
		stoneBrick: {
			blockID: 99,
			className: "BlockType_HugeBrownMushroom",
			blockName: "stoneBrick",
			material: "wood"
		},
		: {
			blockID: 100,
			material: "wood",
			className: BlockType_HugeRedMushroom
		},
		: {
			blockID: 101,
			material: "iron",
			className: BlockType_IronBars
		},
		: {
			blockID: 102,
			material: "glass",
			className: BlockType_GlassPane
		},
		: {
			blockID: 103,
			className: BlockType_Melon
		},
		: {
			blockID: 104,
			className: BlockType_StemPumpkin
		},
		: {
			blockID: 105,
			className: BlockType_StemMelon
		},
		: {
			blockID: 106,
			className: BlockType_Vines
		},
		*/
		fenceGate: {
			blockID: 107,
			className: "BlockType_FenceGate",
			blockName: "fenceGate",
			material: "rock",
			requiresSelfNotify: false
		},/*
		stairsBrick: {
			blockID: 108,
			className: "BlockType_Stairs",
			blockName: "stairsBrick",
			modelBlock: "brick"
		},
		stairsStoneBrickSmooth: {
			blockID: 109,
			className: "BlockType_Stairs",
			blockName: "stairsStoneBrickSmooth",
			modelBlock: "stoneBrick"
		},
		: {
			blockID: 110,
			className: BlockType_Mycelium
		},
		: {
			blockID: 111,
			className: BlockType_LilyPad
		},
		: {
			blockID: 112,
			material: "rock",
			className: BlockType_NetherBrick
		},*/
		netherFence: {
			blockID: 113,
			material: "rock",
			blockName: "netherFence",
			className: "BlockType_Fence"
		},/*
		stairsNetherBrick: {
			blockID: 114,
			className: "BlockType_Stairs",
			blockName: "stairsNetherBrick",
			modelBlock: "netherBrick"
		},
		: {
			blockID: 115,
			className: BlockType_NetherWart
		},
		: {
			blockID: 116,
			className: BlockType_EnchantmentTable
		},
		: {
			blockID: 117,
			className: BlockType_BrewingStand
		},
		: {
			blockID: 118,
			className: BlockType_Cauldron
		},
		: {
			blockID: 119,
			material: "portal",
			className: BlockType_EndPortal
		},
		: {
			blockID: 120,
			className: BlockType_EndPortalFrame
		},
		: {
			blockID: 121,
			material: "rock",
			className: BlockType_EndStone
		},
		: {
			blockID: 122,
			className: BlockType_DragonEgg
		},*/
		redstoneLampIdle: {
			blockID: 123,
			blockName: "redstoneLight",
			className: "BlockType_RedstoneLight"
		},
		redstoneLampActive: {
			blockID: 124,
			blockName: "redstoneLight",
			className: "BlockType_RedstoneLight"
		}
	}

	this.construct = function() {
		this.loadBlockTypes();
	}
	
	/**
	 * Iterates through the BlockList object and tries to load each block type
	 */
	this.loadBlockTypes = function() {
		var className;
		var loadedCount = 0;
		var blockDefinition;
		
		for (var blockType in this.blockDefinitions) {
			blockDefinition = this.blockDefinitions[blockType];
			className = blockDefinition.className;
			blockID = blockDefinition.blockID;
			
			
			//this.consoleOut(typeof window[className]+" "+className);
			if (!(typeof com.mordritch.mcSim[className] == "undefined")) {
				this[blockType] = new com.mordritch.mcSim[className]();
				this[blockType]._construct(blockType, blockID, blockDefinition, this);
				this.blocksList[blockID] = this[blockType];
				loadedCount++;
				//this.consoleOut("Loaded block ID "+BlocksList[blockType].blockID+" \""+ blockType +"\" of type \"" + className + "\".");
				//if (this[blockType].renderAsNormalBlock()) console.log(blockType);
			}
			else {
				this[blockType] = new com.mordritch.mcSim.BlockType__Unknown();
				this[blockType]._construct(blockType, blockID, blockDefinition, this);
				
				this.blocksList[blockID] = this[blockType];
				//this.consoleOut("Could not load block ID "+blockID+" \""+ blockType +"\" of type \"" + className + "\".");
			}
			
			
		}


		blockDefinition = this.blockDefinitions.unknown;
		for (var i = 0; i < 128; i++) {
			
			if (typeof this.blocksList[i] == 'undefined') {
				blockType = "unknown_" + i;
				blockID = i;
				this[blockType] = new com.mordritch.mcSim.BlockType__Unknown();
				this[blockType]._construct(blockType, blockID, blockDefinition);
				this.blocksList[blockID] = this[blockType];
			}
		}


		return "Loaded "+loadedCount+" block types.";
	}
	
	this.construct();
}
