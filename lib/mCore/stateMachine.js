'use strict'
var merge = require('lodash.merge');
var mapKeys = require('lodash.mapkeys');

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

var generateUniqueId = function() {
  return (Math.random() * (65535 - 1) + 1) & 0xFFFF;
}

var ackMessage = function(uniqueId){
  return {
    "messageId":  1,
    "messageDef": 'REPLY',
    "uniqueId":   uniqueId,
    "flag":       0,
    "args":       []
  };
};

var kaMessage = function() {
  return {
  "uniqueId": generateUniqueId(),
  "messageId": 8,
  "messageDef": 'KA',
  "flag": 0,
  "args": []
  };
}

// new state constructor
function initState() {
  return {
    firstConnect: false,
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

    outputLock: false,
    outboundQueue: [],
    ackQueue: []
  };
};

// Exported Constructor
function stateMachine(parentScope){
  var currentState = initState();

  var buildEmit = function(msgObj, func){
    return function() {
      if(func) func();
      parentScope.emit('doneBuilding', 'data', parentScope.buildBuffer(parentScope.mLegend, parentScope.types, msgObj));
    }
  }

  var parseEmit = function(msgObj){
    return function() {
      parentScope.emit('doneParsing', msgObj);
    }
  }

  var inboundActions = function(msgObj){
    //console.log(JSON.stringify(msgObj, null, 2))
    var delayEmit = function(){};
    switch(msgObj.messageDef){
      case 'KA':
      console.log("ka: " + msgObj.uniqueId)
        delayEmit = buildEmit( ackMessage(msgObj.uniqueId), function(){ parseEmit(msgObj)() } );
        currentState.counterPartySync = true;
        break;
      case 'LEGEND_MESSAGES':
      case 'SELF_DESCRIBE':
      case 'REPLY':
        console.log("UNIQUE REPLY ID: " + msgObj.uniqueId)
        currentState.ackQueue.map( function(cur, idx, arr){
          if(msgObj.uniqueId === cur.uniqueId) {
            if(cur.hasOwnProperty("callback")){
              cur.callback();
            }
            arr.splice(idx, 1)
            currentState.outputLock = false;
          }
        })

        break;
      case 'REPLY_RETRY':
      case 'REPLY_FAIL':
      default:
        // emit to the client
        delayEmit = parseEmit(msgObj)
        break;
    }
    stateActor()
    delayEmit();
  }

  // THESE ARE ACTIONS EITHER RUN IMMEDIATELY OR
  var outboundActions = function(msgObj){
    msgObj.uniqueId = (undefined !== msgObj.uniqueId) ? msgObj.uniqueId : generateUniqueId();
    var delayEmit = function(){};
    switch(msgObj.messageDef) {
      // the top 4 cases will IMMEDIATELY get here
      case 'KA':
        currentState.ackQueue.push( { uniqueId:[msgObj.uniqueId], obj: msgObj } );
        delayEmit = buildEmit(msgObj, function(){
          setTimeout(function(){
          currentState.ackQueue = [];
          currentState.outputLock = false;
        }, 100) });
        currentState.outputLock = true;
      case 'REPLY':
      case 'REPLY_RETRY':
      case 'REPLY_FAIL':

        break;
      // These cases will only get here when executed.
      case 'SELF_DESCRIBE':
      case 'LEGEND_MESSAGES':
      default:
        parentScope.buildBuffer(parentScope.mLegend, parentScope.types, msgObj);
        if (result && (msgObj.flag & 0x0004)) {
          this.queues.outbound_queue.push(re);
        }
        break;
    }
    //delayEmit();
    stateActor();
    delayEmit();
  }

  // ALL CHECKING OF STATE IS SET HERE
  // Despite hating the nested if "pyramid of doom", we need something like this... perhaps we should write
  // functions that represent each state and have it pass through....
  var stateActor = function() {
    var state = currentState; // just for shorthand

    if (state.connected) {

      if(!state.firstConnect) { state.firstConnect = true };


      if(state.selfSync) {


        if(state.counterPartySync){

          if(state.syncTimer){
            clearInterval(state.syncTimer)
            state.syncTimer = false;
          }

          if(state.sessionEstablished){



          } else {

          }
        } else {
          // !counterPartySync
          // emit KA only?
          if(state.ackQueue.length < 1){
            outboundActions( kaMessage() )
          } else {

          }


        }
      } else { // !selfSync
        if(!state.syncTimer){
          state.syncTimer = setInterval(function(){
            parentScope.emit('doneBuilding', 'data', SYNC_PACKET_DEF);
          }, 500)
        } else { // !selfSync && syncTimer active

        }
      }

    } else {
      // !connected
      // Determines if NOT connected XOR there is a connect timer already (and we've connected once)
      // will set or reset the timer if necessary
      if(( !state.connected ^ state.connectTimer ) &&  state.firstConnect === true){
        state.connectTimer = setTimeout(function() {
          state.connectTimer = false;
          console.log("I SHOULD ASPLODE NAO. Hang up the transport?")
        }, 5000)
      } else if(state.firstConnect === true){
        clearTimeout(state.connectTimer);
        state.connectTimer = false;
      } else if(state.firstConnect === false){
        // attempt to connect?
      }
    }


    // queue logic
    if(!state.outputLock && state.outboundQueue.length > 0){
      console.log("something is in the outbound queue")
      outboundActions(state.outboundQueue.shift())
    }
  }

  // EXPOSED STUFF BELOW

  this.markConnected = function(connected){
    currentState.connected = connected;

    if(connected &&!currentState.syncTimer){
      currentState.syncTimer = setInterval(function(){
        parentScope.emit('doneBuilding', 'data', SYNC_PACKET_DEF);
      }, 500)
      if (currentState.connectTimer) {
        // If the session grace-timer is running, stop it. We have reconnected.
        clearTimeout(currentState.connectTimer);
        currentState.connectTimer = false;
      }
    }
    else if(!connected && currentState.syncTimer){
      // Don't bother sending sync to a counterparty that isn't there.
      clearInterval(currentState.syncTimer);
      currentState.syncTimer = false;
    }

    stateActor()
  }

  this.clientIn = function(msgObj){
    // if it's an "immediate" type, we just run it.  otherwise, we queue and run stateActor

    // build logic to attach messageId or messageDef depending on which one is missing

    switch(msgObj.messageDef) {
      case 'KA':
      case 'REPLY':
      case 'REPLY_RETRY':
      case 'REPLY_FAIL':
        outboundActions(msgObj)
        break;
      default:
        currentState.outboundQueue.push(msgObj)
        stateActor()
        break;
    }
  }

  this.transIn = function(msgObj){
    inboundActions(msgObj)
    //console.log(JSON.stringify(currentState, null, 2))
  }

  this.markSync = function(selfSync){
    currentState.selfSync = selfSync;
    if (!selfSync) currentState.counterPartySync = false;
    stateActor()
  }
}

module.exports = stateMachine;
