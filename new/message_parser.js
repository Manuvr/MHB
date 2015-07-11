'use strict';

var types = require('./types');

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
}

function typeParse(models, jsonBuff) {
  if( models.commands.hasOwnProperty(jsonBuff.messageId)) {
    var handler = models.commands[jsonBuff.messageId];

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
            parseType = models.commands.argRef[handler.argForms[0][argNum]];
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
          parseType = models.argRef[handler.argForms[buffLen][argNum]];
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
}

function MessageParser(dhbModels) {
	this.models = dhbModels;
}

MessageParser.prototype.parse = function(jsonBuff) {

  var messageId = jsonBuff.messageId;
  var updatedJsonBuff = typeParse(this.models, jsonBuff);

  switch(messageId) {
    case 'LEGEND_MESSAGES':
      legendMessage(updatedJsonBuff);
      break;

    case 'GLOVE_MODEL':
      console.log(updatedJsonBuff);
      break;

    default:
      console.log('DEFAULT CASE: ', updatedJsonBuff);
  }
};
module.exports = MessageParser;
