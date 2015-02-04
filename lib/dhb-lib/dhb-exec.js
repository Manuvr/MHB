function Exec(models, argParser) {

	// We'll be maintaining "types" that our parent will use to parse each returned jsonBuffer

	this.argParser = argParser;

	this.LEGEND_MESSAGES = function (jsonBuff) {

		var zeroScanner;
		var zeroLoc;
		var startLoc;
		var i = 0;
		var tempObj = {};
		var parseArr = [];
		var doubleZero;
		var argSize;
		var isDynamic;

		while (i < jsonBuff.raw.length) {
			// this should run once per command sent
			doubleZero = 0;
			tempObj[jsonBuff.raw.readUInt16LE(i)] = {};
			tempObj[jsonBuff.raw.readUInt16LE(i)].flag = jsonBuff.raw.readUInt16LE(i + 2);
			tempObj[jsonBuff.raw.readUInt16LE(i)].argForms = {};
			zeroScanner = i + 4;
			zeroLoc = 0;


			// scan for the zero, and assign the string before it to the label
			while (zeroLoc === 0) {
				if (jsonBuff.raw.readUInt8(zeroScanner) === 0x00) {
					zeroLoc = zeroScanner;
				} else {
					zeroScanner++;
				}
			}
			tempObj[jsonBuff.raw.readUInt16LE(i)].def = jsonBuff.raw.toString('ascii', i + 4, zeroLoc);

			// start parsing command type order arrays
			if (jsonBuff.raw.readUInt8(zeroLoc + 1) !== 0x00) {
				while (doubleZero === 0) {
					startLoc = zeroLoc + 1;
					zeroScanner = startLoc;
					zeroLoc = 0;
					argSize = 0;
					isDynamic = 0;

					while (zeroLoc === 0) {
						if (jsonBuff.raw.readUInt8(zeroScanner) === 0) {
							zeroLoc = zeroScanner;
						} else {
							zeroScanner++;
						}
					}
					if (jsonBuff.raw.readUInt8(zeroLoc + 1) === 0x00) {
						doubleZero = 1;
					}

					while (startLoc < zeroLoc) {
						if (!models.argRef.hasOwnProperty(jsonBuff.raw.readUInt8(startLoc))) {
							isDynamic = 1;
						} else if (models.argRef[jsonBuff.raw.readUInt8(startLoc)].len === 0) {
							isDynamic = 1;
						} else {
							argSize += models.argRef[jsonBuff.raw.readUInt8(startLoc)].len;
						}
						parseArr.push(jsonBuff.raw.readUInt8(startLoc));
						startLoc++
					}
					if (isDynamic || argSize === 0) {
						tempObj[jsonBuff.raw.readUInt16LE(i)].argForms[0] = parseArr;
					} else {
						tempObj[jsonBuff.raw.readUInt16LE(i)].argForms[argSize] = parseArr;
					}
					parseArr = [];
				}
			}
			i = zeroLoc + 2;
		}
		return tempObj;
	};

	this.IMU_MAP_STATE = function (jsonBuff) {
		var gm = models.gloveModel.IMU_set;
		var set = 0;
		var countSets = 0;
		var argObj = jsonBuff.args;
		if (Object.keys(argObj).length === 68) {
			var argObjSub = Object.keys(argObj[Object.keys(argObj)[0]]);
			for (var b = 0; b < Object.keys(gm).length; b++) {
				var imuBase = Object.keys(gm)[b];
				var imuBaseProperties = Object.keys(gm[imuBase]);
				for (var f = 0; f < imuBaseProperties.length; f++) {
					imuBaseReading = imuBaseProperties[f];

					// deal with error not being included yet
					if (f < 10) {
						if (set % 4 === 3) {
							gm[imuBase][imuBaseReading] = argObj[set];
						}
						else {
							gm[imuBase][imuBaseReading] = argObj[set][argObjSub[countSets]];
						}
						// bump counter every 3 readings
						if (countSets++ % 3 === 2) {
							set++;
							countSets = 0;
						}
					}
				}
			}
		}
		else {
			console.log("ArgObj not properly sized.");
			return;
		}
		return gm;
	};

	this.messageRef =  {
		1: {     },
		2: {     },
		3: {     },
		4: {     },
		5: {     },
		16: {    },
		17: { callback: this.LEGEND_MESSAGES, refresh: true, argParse: false, type: "LEGEND_MESSAGES"  },
		18: {    },
		19: {    },
		20: {    },
		256: {   },
		257: {   },
		258: {   },
		512: {   },
		768: {   },
		769: {   },
		1024: {  },
		1025: {  },
		1026: {  },
		1027: {  },
		1028: {  },
		1029: {  },
		1030: {  },
		1031: {  },
		1032: {  },
		1281: {  },
		4096: {  },
		4097: {  },
		4099: {  },
		4100: {  },
		4101: {  },
		4102: {  },
		8192: {  },
		8345: {  },
		12288: { },
		12290: { },
		16384: { },
		16385: { },
		16386: { },
		16387: { },
		16388: { },
		20480: { },
		20736: { },
		20992: { },
		21248: { },
		21504: { },
		24576: { },
		24577: { },
		24578: { },
		24579: { },
		32768: { },
		40960: { },
		40961: { },
		40962: { },
		40963: { },
		40964: { },
		40965: { },
		40966: { },
		40967: { },
		40968: { },
		45056: { },
		45057: { },
		57344: { },
		57345: { },
		57346: { },
		57347: { },
		57348: { },
		57349: { },
		57360: { },
		58401: { callback: this.IMU_MAP_STATE , argParse: true, type: "GLOVE_MODEL" },
		65533: { },
		65534: { },
		65535: { }
	}

}

// use is dhbExec.messageRef['jsonBuff.messageID'].callback
Exec.prototype.runIt = function(jsonBuff) {

	// parses args if required (special cases like legend messages don't get this
	if(this.messageRef[jsonBuff.messageId].argParse){
		jsonBuff = this.argParser.getArgs(jsonBuff);
	}

	return {
		msg: jsonBuff,
		output: this.messageRef[jsonBuff.messageId].callback(jsonBuff),
		type: this.messageRef[jsonBuff.messageId].type,
		refresh: this.messageRef[jsonBuff.messageId].refresh
	}
};

module.exports = Exec;