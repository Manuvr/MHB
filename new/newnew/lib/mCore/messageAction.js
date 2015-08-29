'use strict';
var merge = require('lodash.merge');
var mapKeys = require('lodash.mapkeys');

function messageAction(messageId) {
  if (actionList.hasOwnProperty(messageId)) {
    return actionList[messageId]
  } else {
    return function(jsonBuff) {
      this.emit('doneParsing', 'client', jsonBuff);
    }
  }
}

function ackCheck(jsonBuff) {

}

// THIS MUST BE CALLED WITH A .BIND() FROM THE PARENT TO GET THE "THIS"
// TO WORK PROPERLY...

var actionList = {
  'LEGEND_MESSAGES': function(jsonBuff) {
    // actions on public members...
    merge(this.legendMessage, jsonBuff.message);
    // final emit to client??
    this.emit('doneParsing', 'client', jsonBuff);
  },
  'KA': function(jsonBuff) {
    this.emit('doneParsing', 'client', jsonBuff)
  },
  'SELF_DESCRIBE': function(jsonBuff) {
    var mapping = ["MTU", "Protocol version", "Identity",
      "Firmware version", "Hardware version", "Extended detail"
    ];
    var temp = {}
    for (var i = 0; i < jsonBuff.message.length; i++) {
      temp[mapping[i]] = jsonBuff.message[i];
    }
    jsonBuff.message = temp;
    this.emit('doneParsing', 'client', jsonBuff);
  }
}



module.exports = messageAction;
