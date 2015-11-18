'use strict';
var merge = require('lodash.merge');
var mapKeys = require('lodash.mapkeys');

// This will have to be instantiated to prevent multiple mCores from stomping on eachother
var stateThing = {
  connected: false,
  selfSync: false,
  counterPartySync: false,
  receivedSelfDefine: false,
  sentSelfDefine: false,
  receivedLegendMsg: false,
  sentLegendMsg: false,
  sessionEstablished: false,

  connectTimer: false,
  syncTimer: false,
  syncInterval: false,
  waitingOnAck: false,

  outputLock: true,
  immediateQueue: [],
  outboundQueue: [],
  ackQueue: {}
}

// these message objects are coming from the transport
var inboundDispatch = function(msgObj, state){
  switch(msgObj.messageDef){
    case 'KA':

      break;
    default:

      break;
  }
  stateActor(currentState, msgObj)
}

var outboundActions = function(msgObj){
  switch(jsonBuff.messageDef) {
    case 'KA':
      currentState.ackQueue.push(msgObj)
    case 'REPLY':
    case 'REPLY_RETRY':
    case 'REPLY_FAIL':
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
  stateActor(currentState)
}

// these message objects are going to the transport
var outboundDispatch = function(msgObj){
  switch(jsonBuff.messageDef) {
    case 'KA':
    case 'REPLY':
    case 'REPLY_RETRY':
    case 'REPLY_FAIL':
      currentState.immediateQueue.push(msgObj)
      break;
    default:
      currentState.outboundQueue.push(msgObj)
      break;
  }
  stateActor(currentState)
}

var receivedSync = function(selfSync){
  stateThing.selfSync = selfSync;
  if(!selfSync){
    stateThing.counterPartySync = false;
  }
  stateActor(stateThing)
}

var stateActor = function(state, inbound) {
  // XOR determining if not connected or a timer exists
  if(!state.connected ^ state.connectTimer){
    if(state.connected){
      // set up timer
      return;
    } else {
      // clear timer
    }
  }




  if(inbound === undefined){
    //this is outbound
  } else {
    // this is inbound logic
  }

  // general state checking logic



  // queue logic
  if(state.immediateQueue.length > 0){
    outboundActions(state.immediate)
  }

  outboundActions(state.outboundQueue[0])
}
