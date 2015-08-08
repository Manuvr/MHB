'use strict';

var types = require('./types');
var commands = require('./commands');

function legendMessage(jsonBuff) {
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
function containsVariableLengthTypeCode(argForm) {
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
function minimumSizeOfArgForm(argForm) {
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


/**
* @return length of extracted string if there exists a null-terminator between 'offset' and the end of the raw buffer. Otherwise, returns -1. 
*/
function extractNullTerminatedString(jsonBuff, offset) {
  var i   = offset;
  var max = jsonBuff.raw.length;
  while (i < max) {
    if (jsonBuff.raw.readUInt8(i) === 0){
      jsonBuff.args[jsonBuff.args.length)] = parseType.read(jsonBuff.raw.slice(offset, i));
      return (i-offset);
    }
    i++;
  }
  return -1;
}



function typeParse(jsonBuff) {
    var handler = commands[jsonBuff.messageId];

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
          console.log('No valid parsing patterns');
          return jsonBuff;
        } else {
          // assuming a dynamic length arg type
          while (i < buffLen) {
            parseType = commands.argRef[handler.argForms[0][argNum]];
            if (parseType.len === 0) {
              outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, buffLen));
              i = buffLen;
            } else {
              outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, i + parseType.len));
              i += parseType.len;
            }
            argNum++;
          }
        }
      } else {
        // assuming a fixed length arg type
        while (i < buffLen) {
          parseType = types[handler.argForms[buffLen][argNum]];
          //console.log("i : " + i + " buffLen: " + buffLen);
          //console.log(parseType);
          outObj[argNum] = parseType.read(jsonBuff.raw.slice(i, i + parseType.len));
          argNum++;
          i += parseType.len;

        }
      }
      jsonBuff.args = outObj;
    } else {
      // I'm an empty array!
      console.log('No args present');
      return jsonBuff;
    }
  return jsonBuff;
}



/**
* TODO: There is no good reason for this to be a special-case parser, as it's types are
*   not ambiguous. But until the general typeParse() fxn can handle several strings, we need it.
*/
function selfDescribeParse(jsonBuff) {
    var handler = commands[jsonBuff.messageId];

    if (jsonBuff.raw.length > 0) {
      if (jsonBuff.raw.length >= 9) {
        // 9 bytes is the absolute-smallest this payload can be if it is greater than zero.
        var i = 0;   // Our means of keeping track of our position in the buffer.
        jsonBuff.args[0] = jsonBuff.raw.readUInt32LE(i);   // This is our counter-party's MTU.
        i += 4;
        
        // Now to try and read the required strings.
        var nu_offset = extractNullTerminatedString(jsonBuff, i);
        while (0 <= nu_offset) {
          i = nu_offset+1;
          nu_offset = extractNullTerminatedString(jsonBuff, i);
        }

        switch (jsonBuff.args.length) {
          case 6:
          case 7:
            // This is success.
            // TODO: This is enough information to load the appropriate object for the
            //   Manuvrable that we are connected to.
            break;
          default:
            // If we are here, we have failed to correctly parse this message.
            console.log('Failed to parse the minimum required number of strings.');
            break;
        }
      }
      else {
        // Otherwise, it is clearly wrong.
        // TODO: Shut down communication? Revert to a de-sync'd state?
        console.log('Looks like we got an invalid self-describe message...');
      }
    }
    else {
      // TODO: This is to be interpreted as a request-for-self-description. Reply on the same unique-ID.
      console.log('Our identity is being queried...');
    }
  return jsonBuff;
}



function MessageParser() { }

MessageParser.prototype.parse = function(jsonBuff) {

  if(!commands.hasOwnProperty(jsonBuff.messageId)) {
    console.log('No messageID. (no arguments will be parsed) ', jsonBuff);
    return null;
  }

  jsonBuff.args = [];
  
  var message = null;
  var messageId = commands[jsonBuff.messageId].def;

  switch(messageId) {
    //TODO: Change messageIds to consts?
    case 'KA':    // Keep-alive.
      console.log('KA');
      // TODO: We should ACK this by changing the messageId to MANUVR_MSG_REPLY (0x01) and sending it.
      break;

    case '<UNDEFINED>':    // No way to deal with this. It should stop here?
      console.log('<UNDEFINED>');
      // TODO: We should NACK this by changing the messageId to MANUVR_MSG_REPLY_FAIL and sending it.
      break;

    case 'LEGEND_TYPES':
      console.log('LEGEND_TYPES');
      // TODO: On a future date, this ought to be used to dynamically describe types. Not today.
      break;

    case 'LEGEND_MESSAGES':
      var tempObj = legendMessage(typeParse(jsonBuff));
      message = {
        id: 'LEGEND_MESSAGES',
        text: tempObj
      };
      console.log('LEGEND_MESSAGES: ', tempObj);
      break;

    case 'SELF_DESCRIBE':
      var tempObj = selfDescribeParse(jsonBuff);
      message = {
        id: 'SELF_DESCRIBE',
        text: tempObj
      };
      console.log('SELF_DESCRIBE: ', tempObj);
      break;

    default:
      // This is where we wind up when we don't respond to a message that is valid.
      message = {
        id:   messageId,
        text: typeParse(jsonBuff)
      };
      // TODO: Pass to Connector?
      break;
  }

  return message;

};
module.exports = MessageParser;
