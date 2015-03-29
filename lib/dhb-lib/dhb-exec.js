function Exec(models, argParser) {

	// We'll be maintaining "types" that our parent will use to parse each returned jsonBuffer

	this.argParser = argParser;
	this.models = models;

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

	// IMU_MAP_STATE
  // Description: Map the IMU output reads to the Glove Model
  // ------------------------------------------
  //  Get initial Glove Model
  var gm = models.gloveModel.IMU_set;
  var lm = models.legendMap;
  var bones = models.bones;
  var measures = models.measures;
  var propsInArg = measures.length; 
  
    // Map Glove Object for every frame read
	this.IMU_MAP_STATE = function (jsonBuff) {
		var argArr = jsonBuff.args;
    var gmUpdated = null;
    var currentBone = null;
    var currentProp = null;

    gmUpdated = lm.reduce(function(obj, val, i, arr) {
     if(val) {
      // Figure out which IMU we are on
      // i.e. CAPRALS, METACARPALS, PP_1, IP_1...
      currentBone = Math.floor(i / propsInArg);

      // Figure out which property in the IMU we are setting
      // i.e. quat, accel, mag, gyro, temp
      currentProp = i % propsInArg;

      var boneName  = bones[currentBone];
      var propName = measures[currentProp];

      obj[boneName][propName] = argArr[i];

      // Return updated Glove Model
      return obj;
     } 
    }, gm);
    return gmUpdated;



	};

	this.messageRef =  {

		// These are domain specific (glove for now)
		1542: 	{ callback: this.IMU_MAP_STATE  , reply: false, refresh: false, argParse: true , type: "GLOVE_MODEL" },

		// These are HARD CODED
		0:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_UNDEFINED'},
		1:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_REPLY'},
		2:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_REPLY_RETRY'},
		3:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_REPLY_FAIL'},
		4:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_SESS_ESTABLISHED'},
		5:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_SESS_HANGUP'},
		6:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_SESS_AUTH_CHALLENGE'},
		7:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_SELF_DESCRIBE'},
		10:		{ callback: undefined           , reply: false, refresh: false, argParse: false, type: 'MANUVR_MSG_LEGEND_TYPES'},
		11: 	{ callback: this.LEGEND_MESSAGES, reply: true , refresh: true , argParse: false, type: 'LEGEND_MESSAGES'},
	}
}

// use is dhbExec.messageRef['jsonBuff.messageID'].callback
Exec.prototype.runIt = function(jsonBuff) {
	// default values for unassigned messageRef
	var _output = "";
	var _type = "NONE";
	var _refresh = false;
	var _reply = false;

	if(undefined === this.messageRef[jsonBuff.messageId]){
		// We don't have a profile... Attempt to parse args anyway!
		jsonBuff = this.argParser.getArgs(jsonBuff);
	} else {
		// parses args if required (special cases like legend messages don't get this)
		if(this.messageRef[jsonBuff.messageId].argParse){
			jsonBuff = this.argParser.getArgs(jsonBuff);
		} else
		// accounting for empty types... still parse.  Likely need to change this
		if (undefined === this.messageRef[jsonBuff.messageId].argParse){
			jsonBuff = this.argParser.getArgs(jsonBuff);
		}

		if(undefined !== this.messageRef[jsonBuff.messageId].callback) {
			_output = this.messageRef[jsonBuff.messageId].callback(jsonBuff)
		}

		if(undefined !== this.messageRef[jsonBuff.messageId].type) {
			_type = this.messageRef[jsonBuff.messageId].type;
		}

		if(undefined !== this.messageRef[jsonBuff.messageId].reply) {
			_reply = this.messageRef[jsonBuff.messageId].reply;
		}

		if(undefined !== this.messageRef[jsonBuff.messageId].refresh){
			_refresh = this.messageRef[jsonBuff.messageId].refresh
		}
	}

	return {
		def: this.models.commands[jsonBuff.messageId].def,
		msg: jsonBuff,
		output: _output,
		type: _type,
		refresh: _refresh,
		reply: _reply
	}
};

module.exports = Exec;
