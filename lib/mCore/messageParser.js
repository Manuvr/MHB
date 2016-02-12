'use strict';

/**
 * This is a special-case parser that extracts a message legend from a message payload.
 * A fully-formed message legend is returned on success. False otherwise.
 *
 * Format is binary with a variable length.
 *   |--------------------------------------|  /---------------\ |-----|
 *   | Message Code |       |       | Type  |  | Several NTSs  | |  0  |
 *   |--------------------------------------|  \---------------/ |-----|
 *           2          1       1       1              y            1     <---- Bytes
 *
 * Since the counterparty can't know how big any given definition might be, we need to
 *   take care to bake our null-terminators into the output so that the parser on the
 *   other side can take the condition "a zero-length string" to signify the end of a message
 *   definition, and can move on to the next entry.
 *
 * Because these definitions might be much larger than their corrosponding MESSAGE_LEGEND entries,
 *   it is expected that they will be sent piece-wise to the counterparty so that neither side is
 *   expected to hold the entire definition set at once in a single message.
 *
 *
 * @param   {object}  jsonBuff  An object containing a message legend that needs un-packing.
 * @config  {Buffer}  raw       A buffer that contains the payload of a MessageLegend message.
 * @param   {object}  types     An object containing our own type legend.
 * @returns {object}
 */
function semanticMessage(jsonBuff, types) {
  var i = 0;
  var tempObj = {};  // A list of semantic objects to be returned.

  while (i < jsonBuff.raw.length) {
    // this should run once per semantic definition sent.
    var msg_code = jsonBuff.raw.readUInt16LE(i);
    tempObj[msg_code] = {};
    tempObj[msg_code].flag        = jsonBuff.raw.readUInt16LE(i + 2);
    tempObj[msg_code].minimumArgs = jsonBuff.raw.readUInt8(i + 3);
    tempObj[msg_code].argForm     = [];
    i += 5;

    // scan for the zero, and assign the string it delineates to the message label
    var strIdx = i;
    while (jsonBuff.raw.readUInt8(i++) !== 0) { }
    
    tempObj[msg_code].name = jsonBuff.raw.toString('ascii', strIdx, i);

    // scan for the next zero, and assign the string it delineates to the argument list
    // This may be a zero-length string. But it is required to be present.
    var current_type_code = jsonBuff.raw.readUInt8(i++);
    while (current_type_code !== 0) {
      if (types.hasOwnProperty(current_type_code)) {
        // If the type exists add the argument type to the argForm field...
        tempObj[msg_code].argForms.push(types[current_type_code]);
        
        if (types[current_type_code].len === 0) {
          // This type is dynamically sized.
        }             
        else {
          // This type is a fixed size.
        }
      }
      else {
        // Encountered a type code that we don't recognize...
      }
      // Get the next byte from the buffer...
      current_type_code = jsonBuff.raw.readUInt8(i++);
    }
  }
  return tempObj;
}


/**
 * This is a special-case parser that extracts a message legend from a message payload.
 * A fully-formed message legend is returned on success. False otherwise.
 *
 * Format is binary with a variable length:
 *   |-------------------------------------------------------|----------------------|
 *   | Message Code | Flags | Minimum required | Label (NTS) | Arguemnt types (NTS) |
 *   |-------------------------------------------------------|----------------------|
 *           2          2             1              x                  y         <---- Bytes
 *
 * @param   {object}  jsonBuff  An object containing a message legend that needs un-packing.
 * @config  {Buffer}  raw       A buffer that contains the payload of a MessageLegend message.
 * @param   {object}  types     An object containing our own type legend.
 * @returns {object}
 */
function legendMessage(jsonBuff, types) {
  var i = 0;
  var tempObj = {};

  while ((i + 7) <= jsonBuff.raw.length) {
    // this should run once per message definition sent.
    // A message definition occupies 7 bytes minimum.
    var msg_code = jsonBuff.raw.readUInt16LE(i);
    tempObj[msg_code] = {};
    tempObj[msg_code].flag        = jsonBuff.raw.readUInt16LE(i + 2);
    tempObj[msg_code].minimumArgs = jsonBuff.raw.readUInt8(i + 3);
    tempObj[msg_code].argForm     = [];
    i += 5;

    // scan for the zero, and assign the string it delineates to the message label
    var strIdx = i;
    while (jsonBuff.raw.readUInt8(i++) !== 0) { }
    
    tempObj[msg_code].name = jsonBuff.raw.toString('ascii', strIdx, i);

    // scan for the next zero, and assign the string it delineates to the argument list
    // This may be a zero-length string. But it is required to be present.
    var current_type_code = jsonBuff.raw.readUInt8(i++);
    while (current_type_code !== 0) {
      if (types.hasOwnProperty(current_type_code)) {
        // If the type exists add the argument type to the argForm field...
        tempObj[msg_code].argForms.push(types[current_type_code]);
        
        if (types[current_type_code].len === 0) {
          // This type is dynamically sized.
        }             
        else {
          // This type is a fixed size.
        }
      }
      else {
        // Encountered a type code that we don't recognize...
      }
      // Get the next byte from the buffer...
      current_type_code = jsonBuff.raw.readUInt8(i++);
    }
  }
  return tempObj;
}


/**
 * Passed a sequence of type-codes, returns true if there is a variable-length type among them.
 * False otherwise.
 *
 * @param   {array}   argForm  An array of type codes that we will evaluate for length-ambiguity.
 * @param   {object}  types    An object containing our own type legend.
 * @returns {boolean}
 */
function containsVariableLengthTypeCode(argForm, types) {
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
 *
 * @param   {array}   argForm  An array of type codes for which we will sum lengths.
 * @param   {object}  types    An object containing our own type legend.
 * @returns {integer}
 */
function minimumSizeOfArgForm(argForm, types) {
  var i = 0;
  var return_value = 0;
  var parseType;
  while (i < argForm.length) {
    parseType = types[argForm[i++]];
    return_value += (parseType.len > 0) ? parseType.len : 1;
  }
  return return_value;
}


/**
 * Calling this fxn with a messageDef and a raw payload length will return either...
 *   A) An array of argForms that might fit the length.
 *   B) An empty set, if no such arg forms are found.
 *
 * @param   {object}  messageDef  The definition of the message being parsed.
 * @param   {integer} len         The length of the payload we are tasked with parsing.
 * @param   {object}  types    An object containing our own type legend.
 * @returns {array}
 */
function getPotentialArgForms(messageDef, len, types) {
  var return_value = [];
  for (var key in messageDef.argForms) {
    if (messageDef.argForms.hasOwnProperty(key)) {
      if (minimumSizeOfArgForm(messageDef.argForms[key], types) == len) {
        return_value[return_value.length] = messageDef.argForms[key];
      } else if ((minimumSizeOfArgForm(messageDef.argForms[key], types) < len) && (
          containsVariableLengthTypeCode(messageDef.argForms[key], types))) {
        // If the form contains variable-length types, the length need not be an exact match.
        return_value[return_value.length] = messageDef.argForms[key];
      } else {
        // If the minimum length of the form exceeds the length of our payload,
        //   we disqualify it as a possible parse candidate.
      }
    }
  }
  //console.log('Potential argForms: '+ JSON.stringify(return_value, null, 2));
  return return_value;
}



/**
 * This is the last step in message parsing. Function takes a raw buffer and from it
 *   inflates typed arguments; placing them into an array in jsonBuff.
 * Any message class that does not have its own special parse requirements will
 *   pass through this function on its way into MHB.
 *
 * @param   {object}  jsonBuff     An object containing the message we wish to pack.
 * @config  {integer} messageId    The caller needs to have decided what kind of message this is.
 * @config  {Buffer}  raw          The buffer containing the source data for our parse.
 * @param   {object}  messageDefs  An object containing the message legend against which we will parse.
 * @param   {object}  types        An object containing our own type legend.
 * @returns {array}
 */
function typeParse(jsonBuff, messageDefs, types) {
  var outObj = []; // instantiate an output object

  // check to see if the buffer is empty
  if (jsonBuff.raw && jsonBuff.raw.length !== 0) {
    var messageDef = messageDefs[jsonBuff.messageId];
    // If the buffer is non-empty, fetch a list of possible ways to interpret it...
    var handlers = getPotentialArgForms(
      messageDef,
      jsonBuff.raw.length,
      types);

    var buffLen = jsonBuff.raw.length;
    var parseType;
    for (var handler in handlers) {
        var i = 0;
        var argNum = 0; // assigned property names in outObj

        // As long as there are still bytes to consume, and there are still arguments
        //   expected, keep rolling...
        while ((i < buffLen) && (argNum < handlers[handler].length)) {
          var currentTypeCode = handlers[handler][argNum];
          parseType = types[currentTypeCode];
          if (parseType.len > 0) {
            // A fixed-length argument...
            outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, i + parseType.len));
            i += parseType.len;
          }
          else if ((currentTypeCode == 14) || (currentTypeCode == 175) ) {
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
        if ((outObj.length == handlers[handler].length) && (i == buffLen)) {
          // If we have used all the bytes, and we are also at the end of the form spec, we
          //   take it as an indication of success. Populate the jsonBuff with the arguments
          //   we parsed and return. No need to look at additional argForms.
          //jsonBuff.args = outObj;
          //console.log("Parser: returning")
          return outObj;
        } else {
          //console.log("Parser: rejected arg form")
          // If something is still out-of-balance, we continue the loop and try the next
          //   argForm that met the length criteria.
          outObj = [];
        }
      }
  } else {
    //console.log('Parser: No args present');
  }
  return outObj;
}

/**
 * TODO: There is no good reason for this to be a special-case parser, as it's types are
 *   not ambiguous. But until the general typeParse() fxn can handle several strings, we need it.
 */
// function selfDescribeParse(jsonBuff) {
//   var handler = messageLegend[jsonBuff.messageId];
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


/**
 * @constructor
 *
 */
function MessageParser(messageLegend, types) {
  this.messageLegend = messageLegend;
  this.types = types;
  var that = this;

}

MessageParser.prototype.parse = function(jsonBuff) {
  if (!this.messageLegend.hasOwnProperty(jsonBuff.messageId)) {
    console.log('No messageID. (no arguments will be parsed) ', jsonBuff);
    return false;
  }
  jsonBuff.messageName = this.messageLegend[jsonBuff.messageId].name;
  jsonBuff.flag = this.messageLegend[jsonBuff.messageId].flag;
  jsonBuff.args = jsonBuff.messageId === 11 ?
    legendMessage(jsonBuff, this.types) : typeParse(jsonBuff,
      this.messageLegend, this.types);
  delete jsonBuff.raw;
  delete jsonBuff.totalLength;
  delete jsonBuff.checkSum;

  return true;
};

MessageParser.prototype.updateCommands = function(messageLegend) {
  this.messageLegend = messageLegend;
}

MessageParser.prototype.updateTypes = function(types) {
  this.types = types;
}

module.exports = MessageParser;
