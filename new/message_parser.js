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

function typeParse(jsonBuff) {
  if(commands.hasOwnProperty(jsonBuff.messageId)) {
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
      jsonBuff.args = [];
      return jsonBuff;
    }
  } else {
    console.log('I do not have a command for this messageID. (no arguments will be parsed) ' +
    jsonBuff.messageId);
  }
  return jsonBuff;
}

function MessageParser() { }

MessageParser.prototype.parse = function(jsonBuff) {

  var message = null;
  var messageId = commands[jsonBuff.messageId].def;
  var updatedJsonBuff = typeParse(jsonBuff);

  switch(messageId) {
    //TODO: Change messageIds to consts?
    case 'LEGEND_MESSAGES':
      var tempObj = legendMessage(updatedJsonBuff);
      message = {
        id: 'LEGEND_MESSAGES',
        text: tempObj
      };
      console.log('TEMPOBJ: ', tempObj);
      break;

    case 'IMU_MAP_STATE':
      console.log('GM: ', updatedJsonBuff);
      message = {
        id: 'IMU_MAP_STATE',
        text: updatedJsonBuff
      };
      break;

    default:
      console.log('DEFAULT CASE: ', updatedJsonBuff);
  }

  return message;

};
module.exports = MessageParser;