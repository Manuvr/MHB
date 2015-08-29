'use strict';

// var types = require('./types');
// var commands = require('./messageLegend.js');

function legendMessage(jsonBuff, commands, types) {
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
    tempObj[jsonBuff.raw.readUInt16LE(i)].flag = jsonBuff.raw.readUInt16LE(i +
      2);
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
    tempObj[jsonBuff.raw.readUInt16LE(i)].def = jsonBuff.raw.toString('ascii',
      i + 4, zeroLoc);

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
          if (!types.hasOwnProperty(jsonBuff.raw.readUInt8(startLoc))) {
            isDynamic = 1;
          } else if (types[jsonBuff.raw.readUInt8(startLoc)].len === 0) {
            isDynamic = 1;
          } else {
            argSize += types[jsonBuff.raw.readUInt8(startLoc)].len;
          }
          parseArr.push(jsonBuff.raw.readUInt8(startLoc));
          startLoc++;
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
}


/**
 * Passed a sequence of type-codes, returns true if there is a variable-length type among them. False otherwise.
 */
function containsVariableLengthTypeCode(argForm, types) {
  //for (var key in Object.getOwnPropertyNames(command_def.argForms)) {
  //}
  var i = 0;
  var parseType;
  while (i < argForm.length) {
    parseType = types[argForm[i++]];
    if (parseType.len === 0) {
      return true;
    }
  }
  return false;
}


/**
 * Passed a sequence of type-codes, returns the minimum number of bytes required to store it.
 * All variable-length types are presumed to have a minimum length of 1.
 * Returns -1 on failure, since 0 is a valid return (argForm may have no types in it).
 */
function minimumSizeOfArgForm(argForm, types) {
  //for (var key in Object.getOwnPropertyNames(command_def.argForms)) {
  //}
  var i = 0;
  var return_value = 0;
  var parseType;
  while (i < argForm.length) {
    parseType = types[argForm[i++]];
    return_value += (parseType.len > 0) ? parseType.len : 1;
  }
  return return_value;
}


// /**
//  * @return length of extracted string if there exists a null-terminator between 'offset' and the end of the raw buffer. Otherwise, returns -1.
//  */
// function extractNullTerminatedString(jsonBuff, offset) {
//   var i = offset;
//   var max = jsonBuff.raw.length;
//   while (i < max) {
//     if (jsonBuff.raw.readUInt8(i) === 0) {
//       jsonBuff.args[jsonBuff.args.length()] = parseType.read(jsonBuff.raw.slice(
//         offset, i));
//       return (i - offset);
//     }
//     i++;
//   }
//   return -1;
// }



/**
 * Calling this fxn with a messageDef and a raw payload length will return either...
 *   A) An array of argForms that might fit the length.
 *   B) An empty set, if no such arg forms are found.
 */
function getPotentialArgForms(messageDef, len, types) {
  var return_value = {};
  for (var argForm in messageDef.argForms) {
    if (messageDef.argForms.hasOwnProperty(argForm)) {
      if (minimumSizeOfArgForm(argForm, types) == len) {
        return_value[return_value.length] = argForm;
      } else if ((minimumSizeOfArgForm(argForm, types) < len) && (
          containsVariableLengthTypeCode(argForm, types))) {
        // If the form contains variable-length types, the length need not be an exact match.
        return_value[return_value.length] = argForm;
      } else {
        // If the minimum length of the form exceeds the length of our payload,
        //   we disqualify it as a possible parse candidate.
      }
    }
  }
  return return_value;
}



function typeParse(jsonBuff, commands, types) {
  var handler = commands[jsonBuff.messageId];
  var outObj = []; // instantiate an output object

  // check to see if the buffer is empty
  if ([] !== jsonBuff.raw && jsonBuff.raw.length !== 0) {
    // If the buffer is non-empty, fetch a list of possible ways to interpret it...
    var handlers = getPotentialArgForms(
      commands[jsonBuff.messageId],
      jsonBuff.raw.length,
      types);

    if (handlers.length > 0) {
      for (var argForm in handlers) {
        var buffLen = jsonBuff.raw.length;

        var i = 0;
        var parseType;
        var argNum = 0; // assigned property names in outObj

        // As long as there are still bytes to consume, and there are still arguments
        //   expected, keep rolling...
        while ((i < buffLen) && (argNum < argForm.length)) {
          parseType = types[handler.argForms[buffLen][argNum]];
          if (parseType.len > 0) {
            // A fixed-length argument...
            outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, i + parseType
              .len));
            i += parseType.len;
          } else if (parseType.name == 'String(ascii)') { // TODO: should have a more-efficient comparison.
            // A string (which is a variable length).
            var tmp_len = i;
            while (tmp_len < buffLen) {
              if (jsonBuff.raw.readUInt8(tmp_len) === 0) {
                outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, tmp_len));
                i = tmp_len + 1;
                tmp_len = buffLen; // This kills the loop.
              } else {
                tmp_len++;
              }
            }
          } else if (parseType.name == 'StringB(ascii)') { // TODO: This case should NEVER happen. Firmware's fault.
            // A string (which is a variable length).
            var tmp_len = i;
            while (tmp_len < buffLen) {
              if (jsonBuff.raw.readUInt8(tmp_len) === 0) {
                outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, tmp_len));
                i = tmp_len + 1;
                tmp_len = buffLen; // This kills the loop.
              } else {
                tmp_len++;
              }
            }
          } else {
            // And here we have the all-consuming argument. Since we have no means of
            //   telling the length of this, we take up the rest of the raw buffer and
            //   hope it is the last argument.
            outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, buffLen));
            i = buffLen;
          }

          argNum++; // Move on to the next argument...
        }

        // Ok... time to check our exit condition...
        if ((outObj.length == argForm.length) && (i == buffLen)) {
          // If we have used all the bytes, and we are also at the end of the form spec, we
          //   take it as an indication of success. Populate the jsonBuff with the arguments
          //   we parsed and return. No need to look at additional argForms.
          //jsonBuff.args = outObj;
          return outObj;
        } else {
          // If something is still out-of-balance, we continue the loop and try the next
          //   argForm that met the length criteria.
        }
      }
    } else {
      // This is a bad condition to be in. It means that we have no way to parse the
      //   payload. If we have more than one message legend floating about, now would
      //   be a good time to consult them before asploding.
    }
  } else {
    // I'm an empty array!
    //console.log('No args present');
  }
  return outObj;
}

/**
 * TODO: There is no good reason for this to be a special-case parser, as it's types are
 *   not ambiguous. But until the general typeParse() fxn can handle several strings, we need it.
 */
// function selfDescribeParse(jsonBuff) {
//   var handler = commands[jsonBuff.messageId];
//
//   if (jsonBuff.raw.length > 0) {
//     if (jsonBuff.raw.length >= 9) {
//       // 9 bytes is the absolute-smallest this payload can be if it is greater than zero.
//       var i = 0; // Our means of keeping track of our position in the buffer.
//       jsonBuff.args[0] = jsonBuff.raw.readUInt32LE(i); // This is our counter-party's MTU.
//       i += 4;
//
//       // Now to try and read the required strings.
//       var nu_offset = extractNullTerminatedString(jsonBuff, i);
//       while (0 <= nu_offset) {
//         i = nu_offset + 1;
//         nu_offset = extractNullTerminatedString(jsonBuff, i);
//       }
//
//       switch (jsonBuff.args.length) {
//         case 6:
//         case 7:
//           // This is success.
//           // TODO: This is enough information to load the appropriate object for the
//           //   Manuvrable that we are connected to.
//           break;
//         default:
//           // If we are here, we have failed to correctly parse this message.
//           console.log('Failed to parse the minimum required number of strings.');
//           break;
//       }
//     } else {
//       // Otherwise, it is clearly wrong.
//       // TODO: Shut down communication? Revert to a de-sync'd state?
//       console.log('Looks like we got an invalid self-describe message...');
//     }
//   } else {
//     // TODO: This is to be interpreted as a request-for-self-description. Reply on the same unique-ID.
//     console.log('Our identity is being queried...');
//   }
//   return jsonBuff;
// }



function MessageParser(commands, types) {
  this.commands = commands;
  this.types = types;
  var that = this;

}

MessageParser.prototype.parse = function(jsonBuff) {
  if (!this.commands.hasOwnProperty(jsonBuff.messageId)) {
    console.log('No messageID. (no arguments will be parsed) ', jsonBuff);
    return false;
  }
  jsonBuff.messageDef = this.commands[jsonBuff.messageId].def;
  jsonBuff.flag = this.commands[jsonBuff.messageId].flag;
  jsonBuff.args = [];
  jsonBuff.message = jsonBuff.messageCode === 11 ?
    legendMessage(jsonBuff, this.commands, this.types) : typeParse(jsonBuff,
      this.commands, this.types);
  delete jsonBuff.raw;
  delete jsonBuff.totalLength;
  delete jsonBuff.checkSum;

  return true;
};

MessageParser.prototype.updateCommands = function(commands) {
  this.commands = commands;
}

MessageParser.prototype.updateTypes = function(types) {
  this.types = types;
}

module.exports = MessageParser;
