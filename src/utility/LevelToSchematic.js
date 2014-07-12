com.mordritch.mcSim.convertLevelToSchematic = function(level) {
	var schematic = {
		"Schematic": {
			"type": 10,
			"payload": {
				"Height": {
					"type": 2, 
					"payload": 128
				},
				"Length": {
					"type": 2,
					"payload": 16
				},
				"Width": {
					"type": 2,
					"payload": 16
				},
				"Entities": {
					"type": 9,
					"payload": {
						"type": 10,
						"payload": new Array()
					}
				},
				"TileEntities": {
					"type": 9,
					"payload": {
						"type": 10,
						"payload": new Array()
					}
				},
				"Materials": {
					"type": 8,
					"payload": "Alpha"
				},
				"Blocks": {
					"type": 7,
					"payload": ""
				},
				"Data": {
					"type": 7,
					"payload": ""
				}
			}
		}
	};
	
	var data = "";
	var charCode;
	var nibble1;
	var nibble2;
	for (var i=0; i < 16*16*64; i++) {
		charCode = level.Level.payload.Blocks.payload.charCodeAt(i) & 0xff;
		nibble1 = charCode.toString(16)[0];
		nibble2 = charCode.toString(16)[1];
		
		nibble1Val = parseInt(nibble1, 16);
		nibble2Val = parseInt(nibble2, 16);  
		
		data += String.fromCharCode(nibble1Val) + String.fromCharCode(nibble1Val);  
	}

	schematic.Schematic.payload.Blocks.payload = level.Level.payload.Blocks.payload;
	schematic.Schematic.payload.Data.payload = data;
	
	return schematic;
};


$.ajax({
		url: 'http://localhost/projects3/JsNbtParser/php/getSchematic.php',
		beforeSend: function( xhr ) {
			xhr.overrideMimeType( 'text/plain; charset=x-user-defined' ); //Unless set, charAtCode doesn't always return the expected result
		},
		success: function( data ) {
			var sd = convertLevelToSchematic(new NbtParser().decode(data));
			gui.modelData.loadSchematic({nbtData: sd});
		}
});