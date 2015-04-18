
// we instantiate with commands so we don't have to pass it EVERY time...
function argParser(dhbModels) {
	this.models = dhbModels;

};

argParser.prototype.getArgs = function(jsonBuff) {
	//console.log(jsonBuff.raw);
	if( this.models.commands.hasOwnProperty(jsonBuff.messageId)) {
		var handler = this.models.commands[jsonBuff.messageId];

		// check to see if the buffer is empty
		if ([] !== jsonBuff.raw && jsonBuff.raw.length !== 0) {
			// instantiate an output object
			var outObj = [];
			var buffLen = jsonBuff.raw.length;
			//console.log(buffLen);
			var i = 0;
			var parseType;
			var argNum = 0; // assigned property names in outObj

			if (undefined === handler.argForms[buffLen]) {
				if (handler.argForms[0] === undefined) {
					// length is wrong and no dynamic length type exists
					console.log("No valid parsing patterns");
					return jsonBuff;
				} else {
					// assuming a dynamic length arg type
					while (i < buffLen) {
						parseType = this.models.commands.argRef[handler.argForms[0][argNum]];
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
					parseType = this.models.argRef[handler.argForms[buffLen][argNum]];
					//console.log("i : " + i + " buffLen: " + buffLen);
					//console.log(parseType);
					outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, i + parseType.len));
					argNum++;
					i += parseType.len

				}
			}
			jsonBuff.args = outObj;
		} else {
			// I'm an empty array!
			console.log("No args present");
			jsonBuff.args = [];
			return jsonBuff;
		}
	} else {
		console.log("I don't have a command for this messageID. (no arguments will be parsed) " +
		jsonBuff.messageId);
	}
	return jsonBuff;
};

module.exports = argParser;
