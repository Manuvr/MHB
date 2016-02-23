'use strict';

// this is where the Express app would live
var leg = require('../lib/mCore/messageLegend.js');
var typ = require('../lib/mCore/types.js');


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
        tempObj[msg_code].argForm.push(current_type_code);

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

function packOwnLegendMessages(msg_defs) {
  var required_size = 0;
  for (var idx in msg_defs) {
    if (msg_defs.hasOwnProperty(idx)) {
      var msg_def = msg_defs[idx];
      // If this isn't prototypical cruft, we count it in the tally.
      required_size += 5; // +5 for the obligatory fields: flags (16-bit), messageId (16-bit), and minimum count (8-bit).
      required_size += msg_def.name.length + 1; // +(some more) for the string to represent the message class.
      // At this point, argForm should be one of (possibly many) valid argument forms
      //   for the msg_def we are operating on. Now we're just adding bytes....
      required_size += msg_def.argForm.length + 1; // +1 for the null-terminator.
    }
  }

  if (required_size === 0) {
    return false;
  }

  var return_value = Buffer(required_size);
  var offset = 0;
  for (var idx in msg_defs) {
    if (msg_defs.hasOwnProperty(idx)) {
      var msg_def = msg_defs[idx];
      // If this isn't prototypical cruft, we write it to the buffer.
      return_value.writeUInt16LE(parseInt(idx), offset);
      return_value.writeUInt16LE(msg_def.flag, offset + 2);
      return_value.writeUInt8(msg_def.minimumArgs, offset + 4);
      offset += 5;

      return_value.write(msg_def.name, offset, 'ascii'); // +(some more) for the string to represent the message class.
      offset += msg_def.name.length;
      return_value.writeUInt8(0, offset++);

      var i = 0;
      while (i < msg_def.argForm.length) {
        return_value.writeUInt8(msg_def.argForm[i++], offset++); // +(some more) for the string to represent the argument form.
      }
      return_value.writeUInt8(0, offset++);
    }
  }
  return return_value;
}



var tmp = {};
tmp.raw = packOwnLegendMessages(leg);
console.log(JSON.stringify(tmp)+"\n\n");

var tmp_out = legendMessage(tmp, typ)
console.log(JSON.stringify(tmp_out));

