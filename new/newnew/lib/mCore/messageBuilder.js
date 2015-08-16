var int24 = require('int24');



/**
* After types have been flattened into a buffer, a uniqueID assigned, and a message-id
*   boiled down to an integer, this function is called to merge it all together, generate 
*   a checksum, and reurn a buffer fit for the transport.
* There is no good reason for this function to fail.
*/
var builder = function(messageID, uniqueID, argBuffObj){
	//  Binary Model:
	//  uint24le        uint8       uint16le    uint16le    (buffer)
	//  totalLength     checkSum    uniqueID    messageId    raw
	//  total bytes   uID to end

	var buffSum = 0;
	var checkBuf;
	var headBuf = new Buffer(4);
	var midBuf = new Buffer(4);

	if(undefined !== argBuffObj && argBuffObj.length){
		int24.writeUInt24LE(headBuf, 0, argBuffObj.length + 8);
		midBuf.writeUInt16LE(uniqueID, 0);
		midBuf.writeUInt16LE(messageID,2);
		checkBuf = Buffer.concat([midBuf, argBuffObj]);
	} else {
		int24.writeUInt24LE(headBuf, 0, 8);
		checkBuf = new Buffer(4);
		checkBuf.writeUInt16LE(uniqueID, 0);
		checkBuf.writeUInt16LE(messageID,2);
	}

	// calculate the checksum, and then add them together
	for(var i = 0; i < checkBuf.length; i++){
		buffSum += checkBuf.readUInt8(i);
	}
	buffSum += 0x55;
	buffSum %= 256;
	headBuf.writeUInt8(buffSum, 3);

	return Buffer.concat([headBuf, checkBuf]);
};



/**
* Given a structure full of Message definitions, build a BINBLOB that represents them.
* Returns false on failure. A buffer containing the results on success.
*
* We need to loop twice. The first time to count everything and decide how large a buffer
*   to create, and the second time to actually do the writing.
*/
var packOwnLegendMessages = function(msg_defs) {
  var required_size = 0;
	for (var msg_def in msg_defs) {
	  if (msg_defs.hasOwnProperty(msg_def)) {
	    // If this isn't prototypical cruft, we count it in the tally.
	    required_size += 4;                       // +4 for the obligatory fields: flags (16-bit) and messageId (16-bit).
	    required_size += msg_def.def.length + 1;  // +(some more) for the string to represent the message class.
	    for (var argForm in msg_def.argForms) {
	      if (msg_def.argForms.hasOwnProperty(argForm)) {
	        // At this point, argForm should be one of (possibly many) valid argument forms
	        //   for the msg_def we are operating on. Now we're just adding bytes....
	        required_size += argForm.length + 1;  // +1 for the null-terminator.
	      }
	    }
	    required_size++;   // +1 for the second consecutive null-terminator to denote the end of this def.
	  }
	}

	if (required_size === 0) {
	  return false;
	}
	
	var return_value = Buffer(required_size);
	var offset       = 0;
	for (var msg_def in msg_defs) {
	  if (msg_defs.hasOwnProperty(msg_def)) {
	    // If this isn't prototypical cruft, we write it to the buffer.
	    return_value.writeUInt16LE(messageID,    offset);
	    return_value.writeUInt16LE(msg_def.flag, offset + 2);
	    offset += 4;

	    return_value.write(msg_def.def, offset, 'ascii');  // +(some more) for the string to represent the message class.
	    offset += msg_def.def.length;
	    return_value[offset++] = 0;
	    
	    for (var argForm in msg_def.argForms) {
	      if (msg_def.argForms.hasOwnProperty(argForm)) {
	        // At this point, argForm should be one of (possibly many) valid argument forms
	        //   for the msg_def we are operating on. Now we're just adding bytes....
	        for (var n = 0; n < argForm.length; n++) {
	          return_value[offset++] = argForm[n];
	        }
	        return_value[offset++] = 0;
	      }
	    }
	    return_value[offset++] = 0; // +1 for the second consecutive null-terminator to denote the end of this def.
	  }
	}
	return return_value;
}




module.exports = builder;

