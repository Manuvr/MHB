/*
 * Thanks matanamir... Just needed this one function
 * Credit: https://github.com/matanamir/int24
 */
var writeUInt24LE = function(buf, offset, value) {
  Math.floor(value, 0xffffff)
  buf[offset + 2] = (value & 0xff0000) >>> 16;
  buf[offset + 1] = (value & 0x00ff00) >>> 8;
  buf[offset] = value & 0x0000ff;
}



/**
 * Calling this fxn with a messageDef and an integer will return either...
 *   A) An array of argForms that have the same cardinality as the supplied integer.
 *   B) An empty set, if no such arg forms are found.
 */
function getPotentialArgFormsByCardinality(messageDef, card) {
  var return_value = {};
  for (var argForm in messageDef.argForms) {
    if (messageDef.argForms.hasOwnProperty(argForm)) {
      if (argForm.length == card) {
        return_value[return_value.length] = argForm;
      }
    }
  }
  return return_value;
}


/**
 * After types have been flattened into a buffer, a uniqueID assigned, and a message-id
 *   boiled down to an integer, this function is called to merge it all together, generate
 *   a checksum, and reurn a buffer fit for the transport.
 * There is no good reason for this function to fail.
 */
var formPacketBuffer = function(messageID, uniqueID, argBuffObj) {
  //  Binary Model:
  //  uint24le        uint8       uint16le    uint16le    (buffer)
  //  totalLength     checkSum    uniqueID    messageId    raw
  //  total bytes   uID to end

  var buffSum = 0;
  var checkBuf;
  var headBuf = new Buffer(4);
  var midBuf = new Buffer(4);

  if (argBuffObj && argBuffObj.length) {
    writeUInt24LE(headBuf, 0, argBuffObj.length + 8);
    midBuf.writeUInt16LE(uniqueID, 0);
    midBuf.writeUInt16LE(messageID, 2);
    checkBuf = Buffer.concat([midBuf, argBuffObj]);
  } else {
    writeUInt24LE(headBuf, 0, 8);
    checkBuf = new Buffer(4);
    checkBuf.writeUInt16LE(uniqueID, 0);
    checkBuf.writeUInt16LE(messageID, 2);
  }

  // calculate the checksum, and then add them together
  for (var i = 0; i < checkBuf.length; i++) {
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
      required_size += 4; // +4 for the obligatory fields: flags (16-bit) and messageId (16-bit).
      required_size += msg_def.def.length + 1; // +(some more) for the string to represent the message class.
      for (var argForm in msg_def.argForms) {
        if (msg_def.argForms.hasOwnProperty(argForm)) {
          // At this point, argForm should be one of (possibly many) valid argument forms
          //   for the msg_def we are operating on. Now we're just adding bytes....
          required_size += argForm.length + 1; // +1 for the null-terminator.
        }
      }
      required_size++; // +1 for the second consecutive null-terminator to denote the end of this def.
    }
  }

  if (required_size === 0) {
    return false;
  }

  var return_value = Buffer(required_size);
  var offset = 0;
  for (var msg_def in msg_defs) {
    if (msg_defs.hasOwnProperty(msg_def)) {
      // If this isn't prototypical cruft, we write it to the buffer.
      return_value.writeUInt16LE(messageID, offset);
      return_value.writeUInt16LE(msg_def.flag, offset + 2);
      offset += 4;

      return_value.write(msg_def.def, offset, 'ascii'); // +(some more) for the string to represent the message class.
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



/**
* Call this with a plush message in jsonBuff, the messageDef by which it is to be
*   interpreted, and the types in which it is to be encoded. It will either return
*   false on error, or a formed buffer that represents the packet to be sent over
*   the transport.
*
* Rules:
* If there is already a uniqueID in the jsonBuff, it will be used. Otherwise, one will
*   be generated and inserted into the jsonBuff upon success.
* messageDef will contain a set of argForms, many of which might fit the jsonBuff.
*   A best-attempt will be made to choose the correct argForm for the task until we
*   think of a way to unambiguously dictate it when needed.
*
* Sample object follows:

{

  "args" : []
}

*/
var builder = function(messageDefs, types, jsonBuff) {
  var return_value = false;

  var flattened_args = false;

  if (jsonBuff.args && jsonBuff.args.length > 0) {
    var arg_forms = getPotentialArgFormsByCardinality(messageDefs[jsonBuff.messageId], jsonBuff.args.length);
    // At this point, if we have more than one potential match, we will need to start
    //   eliminating options based on examining the types of the arguments, or something
    //   hopefully smarter.
    // TODO: For now this only proceeds if there is one match.
    if (arg_forms.length != 1) {
      return false;
    }
    var parseType;
    var temp_buffer;
    for (var i = 0; i < arg_forms.length; i++) {
      parseType = types[arg_forms[i]];
      temp_buffer = parseType.write(jsonBuff.args[i]);

      // Safely accumulate into collected_buffer...
      flattened_args = (flattened_args) ? Buffer.concat([flattened_args,
        temp_buffer
      ]) : temp_buffer;
    }
  }

  return_value = formPacketBuffer(jsonBuff.messageId, jsonBuff.uniqueId,
    flattened_args);

  // if (return_value) {
  //   // If we got a buffer back, we know that we succeeded, and we should now
  //   //   mutate the jsonBuff appropriately.
  //   jsonBuff.uniqueId = jsonBuff.uniqueId;
  // }
  return return_value;
}


module.exports = builder;
