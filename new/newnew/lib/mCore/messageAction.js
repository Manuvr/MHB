'use strict';
var merge = require('lodash.merge');
var mapKeys = require('lodash.mapkeys');

// If not specified, messages that demand an acknowledgement will be
//   retried this many times.
var DEFAULT_RETRY_COUNT = 3;

/**
 * Generates a new uniqueID in a 16-bit range.
 * Never chooses zero, despite it being a valid choice for this field. Zero is spooky.
 */
var generateUniqueId = function() {
  return Math.random() * (65535 - 1) + 1;
}




function queues() {
  this.outbound_queue = [];
    
  this.flush = function() {
    // Flush the outbound queue.
    return 0;
  };
}



// THIS MUST BE CALLED WITH A .BIND() FROM THE PARENT TO GET THE "THIS"
// TO WORK PROPERLY...
function parseAct(jsonBuff) {

  switch (jsonBuff.messageName) {
    case 'LEGEND_MESSAGES':
      // actions on public members...
      merge(this.mLegend, jsonBuff.message);
      // final emit to client??
      break;
    case 'KA':
      console.log("i got a ka");
      // When we get a KA, we should ACK it immediately.
      var ack_message = {
        "messageId":  1,
        "messageDef": 'REPLY',
        "uniqueId":   jsonBuff.uniqueId,
        "flag":       0,
        "args":       []
      };
      //this.emit('doneBuilding', 'data', ack_message)
      break;
    case 'REPLY':
      // Dive into our dialog objects and find out what was being ACK'd.
      if (this.queues.outbound_queue[0].uniqueId === jsonBuff.uniqueId) {
        this.queues.outbound_queue[0].flag = -1;
        buildAct.bind(this)(this.queues.outbound_queue[0])
        // This is an ACK to ob_msg. Call its callback, remove it from the 
        //   outbound queue, and consume the next waiting message if any.
      }
      
      break;
    case 'REPLY_RETRY':
      // Dive into our dialog objects and find out what was being NACK'd.
      if (this.queues.outbound_queue[0].uniqueId === jsonBuff.uniqueId) {
        this.queues.outbound_queue[0].flag = -2;
        buildAct.bind(this)(this.queues.outbound_queue[0])
      }
      
      break;
    case 'REPLY_FAIL':
      // Dive into our dialog objects and find out what was being failed.
      if (this.queues.outbound_queue[0].uniqueId === jsonBuff.uniqueId) {
        this.queues.outbound_queue[0].flag = -3;
        buildAct.bind(this)(this.queues.outbound_queue[0])
      }
      
      break;
    case 'SELF_DESCRIBE':
      var mapping = ["MTU", "Protocol version", "Identity",
        "Firmware version", "Hardware version", "Extended detail"];
      var temp = {};
      for (var i = 0; i < jsonBuff.message.length; i++) {
        temp[mapping[i]] = jsonBuff.message[i];
      }
      jsonBuff.message = temp;
      break;
    default:
      break;
  }
  
  this.emit('doneParsing', 'client', jsonBuff);
}



// THIS MUST BE CALLED WITH A .BIND() FROM THE PARENT TO GET THE "THIS"
// TO WORK PROPERLY...
function buildAct(jsonBuff) {
  var result = null;
  jsonBuff.uniqueId = (undefined !== jsonBuff.uniqueId) ? jsonBuff.uniqueId :
    generateUniqueId();

  switch(jsonBuff.messageDef) {
    case 'REPLY':
    case 'REPLY_RETRY':
    case 'REPLY_FAIL':
    case 'KA':
      // These are the cases that ignore the outbound queue lock.
      result = this.buildBuffer(this.mLegend, this.types, jsonBuff);
      break;
    // these are "pre-outbound queue" actions  
    case 'SELF_DESCRIBE':
    case 'LEGEND_MESSAGES':
    default:
      if(jsonBuff.flag > -4 && jsonBuff.flag < 0){
         result = jsonBuff.flag;
      }
      else if ((this.queues.outbound_queue.length > 0) && (this.queues.outbound_queue[0].uniqueId === jsonBuff.uniqueId)) {
        // This message needs to wait.
        this.queues.outbound_queue.push(jsonBuff);
      }
      else {
        result = this.buildBuffer(this.mLegend, this.types, jsonBuff);
        if (result && (jsonBuff.flag & 0x0004)) {
          this.queues.outbound_queue.push(jsonBuff);
        }
      }
      break;
  }
  
  // what to send / do
  switch(result) {
  case -1:
    // success 
    this.queues.outbound_queue.shift();
    buildAct.bind(this)(this.queues.outbound_queue[0]);
    // another switch case on messageDef of jsonBuff?
    break;
  case -2:
    // retry
    if (!jsonBuff.hasOwnProperty(retries_remaining)) {
      // If we don't yet have a retry count-down, install one.
      jsonBuff.retries_remaining = DEFAULT_RETRY_COUNT;
    }
    if (jsonBuff.retries_remaining > 0) {
      jsonBuff.flag = this.mLegend[jsonBuff.messageId].flag;
      jsonBuff.retries_remaining--;
      this.emit('doneBuilding', 'data', this.buildBuffer(this.mLegend, this.types, jsonBuff));
    }
    break;
  case -3:
    // failed ack
    this.queues.outbound_queue.shift();
    buildAct.bind(this)(this.queues.outbound_queue[0]);
    break;
  case null:
    // pushed to outbound_queue... stops recursion
     break;
  default:
     // If we successfully built a packet, send it to the transport.
    this.emit('doneBuilding', 'data', result);
    //if(this.outbound_queue.length > 0){
    //  this.queues.outbound_queue.shift();
    //  buildAct.bind(this)(this.outbound_queue[0]);
    //}
  };
 
  
}



module.exports = {
  parseAct:   parseAct,
  buildAct:   buildAct,
  queues:     queues
};
