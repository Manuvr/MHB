var models = require('./dhb-models.js');

var LEGEND_MESSAGES = function(jsonBuff){
	var zeroScanner;
	var zeroLoc;
	var startLoc;
	var i = 0;
	var tempObj = {};
	var parseArr = [];
	var doubleZero;
	var argSize;
	var isDynamic;

	while(i < jsonBuff.raw.length) {
		// this should run once per command sent
		doubleZero = 0;
		tempObj[jsonBuff.raw.readUInt16LE(i)] = {};
		tempObj[jsonBuff.raw.readUInt16LE(i)].flag = jsonBuff.raw.readUInt16LE(i + 2);
		tempObj[jsonBuff.raw.readUInt16LE(i)].argForms = {};
		zeroScanner = i + 4;
		zeroLoc = 0;


		// scan for the zero, and assign the string before it to the label
		while(zeroLoc === 0){
			if(jsonBuff.raw.readUInt8(zeroScanner) === 0x00) {
				zeroLoc = zeroScanner;
			} else {
				zeroScanner++;
			}
		}
		tempObj[jsonBuff.raw.readUInt16LE(i)].def = jsonBuff.raw.toString('ascii', i + 4, zeroLoc);

		// start parsing command type order arrays
		if(jsonBuff.raw.readUInt8(zeroLoc + 1) !== 0x00) {
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
					if (!argRef.hasOwnProperty(jsonBuff.raw.readUInt8(startLoc))) {
						isDynamic = 1;
					} else if (argRef[jsonBuff.raw.readUInt8(startLoc)].len === 0) {
						isDynamic = 1;
					} else {
						argSize += argRef[jsonBuff.raw.readUInt8(startLoc)].len;
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

var IMU_MAP_STATE = function(jsonBuff) {
	var gm = new models.gloveModel.IMU_set;
	var set = 0;
	var countSets = 0;
	var argObj = jsonBuff.args;
	console.log(argObj);
	if(Object.keys(argObj).length === 68) {
		var argObjSub = Object.keys(argObj[Object.keys(argObj)[0]]);
		for (var b = 0; b < Object.keys(gm).length; b++) {
			var imuBase = Object.keys(gm)[b];
			var imuBaseProperties = Object.keys(gm[imuBase]);
			for (f = 0; f < imuBaseProperties.length; f++) {
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
					if (countSets++ % 3  === 2) {
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