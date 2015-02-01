var util = require('util');

// stick our interpretation functions here for now
// changing pattern to use function from app.js instead of function in inCommand

var runIt = function(jsonBuffer) {
	// runs the arg parser on our object
	if(commands[jsonBuffer.messageId].def === "LEGEND_MESSAGES"){
		legendParser(jsonBuffer);
		outCommand = buildOutCommands(commands);
		//console.log(util.inspect(commands, {depth:null}))
	} else {
		jsonBuffer  = argParser(jsonBuffer);
		executeCommand(jsonBuffer);
		var responseMessage = JSON.stringify(jsonBuffer);
		var holdObj = {
			name : commands[jsonBuffer.messageId].def,
			totalLength : jsonBuffer.totalLength,
			checkSum : jsonBuffer.checkSum,
			uniqueId : jsonBuffer.uniqueId,
			messageId : jsonBuffer.messageId,
			raw : jsonBuffer.raw,
			args : jsonBuffer.args
		};
		//console.log("parsed command: " + holdObj.name + "\n" + responseMessage);
		io.sockets.emit('message_update', holdObj);
	}
};



var execute_GENERIC = function (jsonBuff) {
	// set up for generic command
};

var executeCommand = function (jsonBuff) {
	if (commandCallbacks[jsonBuff.messageId].callback != undefined) {
		commandCallbacks[jsonBuff.messageId].callback(jsonBuff);
	}
	else {
		execute_GENERIC(jsonBuff);
	}
};

var argParser = function(jsonBuff) {
	//console.log(jsonBuff.raw);
	if( commands.hasOwnProperty(jsonBuff.messageId)) {
		var handler = commands[jsonBuff.messageId];

		// check to see if the buffer is empty
		if ([] !== jsonBuff.raw && jsonBuff.raw.length !== 0) {
			// instantiate an output object
			var outObj = {};
			var buffLen = jsonBuff.raw.length;
			//console.log(buffLen);
			var i = 0;
			var parseType;
			var argNum = 0; // assigned property names in outObj

			if (undefined === handler.argForms[buffLen]) {
				if (handler.argForms[0] === undefined) {
					// length is wrong and no dynamic length type exists
					console.log("No valid parsing patterns");
					jsonBuff.args = {};
					return jsonBuff;
				} else {
					// assuming a dynamic length arg type
					while (i < buffLen) {
						parseType = argRef[handler.argForms[0][argNum]];
						if (parseType.len === 0) {
							outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, buffLen));
							i = buffLen;
						} else {
							outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, i + parseType.len));
							i += parseType.len
						}
						argNum++;
					}
				}
			} else {
				// assuming a fixed length arg type
				while (i < buffLen) {
					parseType = argRef[handler.argForms[buffLen][argNum]];
					console.log("i : " + i + " buffLen: " + buffLen);
					console.log(parseType);
					outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, i + parseType.len));
					argNum++;
					i += parseType.len

				}
			}
			jsonBuff.args = outObj;
		} else {
			// I'm an empty array!
			console.log("No args present");
			jsonBuff.args = {};
			return jsonBuff;
		}
	} else {
		console.log("I don't have a command for this messageID. (no arguments will be parsed) - " +
		jsonBuff.messageId);
	}
	return jsonBuff;
};


var buildOutCommands = function(obj){
	new_obj = {};
	for (var prop in obj) {
		if(obj.hasOwnProperty(prop)) {
			new_obj[obj[prop].def] = parseInt(prop);
		}
	}
	return new_obj;
};

var outCommand = buildOutCommands(commands);
