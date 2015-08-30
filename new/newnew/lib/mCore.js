'use strict'

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55, 0x04, 0x00, 0x00, 0x55, 0x04, 0x00, 0x00, 0x55, 0x04, 0x00, 0x00, 0x55], 'hex');

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var uuid = require('node-uuid');

var merge = require('lodash.merge');
var receiver = require('./mCore/receiver.js');
var messageParser = require('./mCore/messageParser.js');
var mLegend = require('./mCore/messageLegend.js');
var mFlags = require('./mCore/messageFlags.js');
var messageAction = require('./mCore/messageAction.js');
var messageBuilder = require('./mCore/messageBuilder.js')

var types = require('./mCore/types.js');
var defs = require('./mCore/messageLegend.js');

// Config for mConnector to act on
var config = {
  name: 'MHB',
  version: '1.0.0',
  inputs: {
    'data': 'data'
  },
  outputs: { // these will be definitions in connector
    'ERROR': 'log'
      //etc
  },
  state: {
    'LED_1': 'number',
    'GLOVE_MODEL': 'string'
  }
};

// mEngine Factory function
function mCore() {
  ee.call(this);
  var that = this;
  this.config = config;
  this.parent = this; // freaky way of doing a chained assignment from session
  this.uuid = uuid.v4();
  this.timer;
  
  this.syncCount = 0;
  
  var sendSync = function(){
    if(that.syncCount < 25){
      that.timer = setInterval( function(){
          that.receiver.parser.write(SYNC_PACKET_DEF);
          that.syncCount++;
      }, 500)
    } else {
      clearInterval(that.timer);
      fromEngine('');
    }
  }

  this.receiver = new receiver();
  
  this.receiver.ee.on('syncInSync', function() {
    fromCore('log', ['Received sync packet, sending back...', 6]);
  });
  
  this.receiver.ee.on('outOfSync', function(outOfSync, reason) {
      if(outOfSync) {
        fromCore('data', SYNC_PACKET_DEF);
        fromCore('log', ['Became desync\'d because ' + reason + '.', 6]);
      }
      else {
        clearInterval(that.timer);
        that.syncCount = 0;
        // Start sending KA
        // We must have just become sync'd.
        fromCore('log', ['Became sync\'d.', 6]);
      }
  });
  
  this.messageParser = new messageParser(mLegend, mFlags)
  this.buildBuffer = messageBuilder;

  this.defs = types;
  this.types = defs;

  this.outMsgQueue = [];

  // Emits OUT
  var fromEngine = function(type, data) {
    that.emit('fromEngine', type, data)
  }
  var fromCore = function(type, data) {
    that.emit('fromCore', type, data)
  }

  // Inputs from session
  var toEngine = function(type, data) {
    switch (type) {
      case 'send':
        // build new
        var built = that.buildBuffer(that.defs, that.types, data)
        if (built) {
          fromCore('data', built);
        } else {
          fromCore('log', ['TODO: Was wut', 3]);
        }
        break;
      case 'badsync':
        // Initiate a malformed sync packet. We notice the desync first.
        fromCore('log', ['Sending bad data via transport. Trying to initiate a desync....', 4]);
        fromCore('data', new Buffer(45));
        break;
      case 'state':
        // do something
        break;
      default:
        fromCore('log', ['Not a valid type.', 2]);
        break;
    }
  }

  // Inputs from Transport
  var toCore = function(type, data) {
    switch (type) {
      case 'data':
        that.receiver.parser.write(data);
        break;
      case 'connected':
        fromEngine('log', ['AM I CONNECTED? ' + data, 5]);
        if(data) { 
          sendSync()
        }
        break;
      default:
        fromEngine('log', ['Not a valid type.', 2]);
        break;
    }
  }

  // input listeners
  this.on('toEngine', toEngine);
  this.on('toCore', toCore);
  this.on('doneParsing', fromEngine);

  this.receiver.parser.on('readable', function() {
    var jsonBuff;
    while (jsonBuff = that.receiver.parser.read()) {
      // Try to extract meaning from the parsed packet.
      that.messageParser.parse(jsonBuff);
      messageAction(jsonBuff.messageId).bind(that)(jsonBuff);
    }
  });
  
  
  // DERETE MERRRR
  sendSync();
  
};
inherits(mCore, ee);

mCore.prototype.getConfig = function() {
  return config;
}

module.exports = mCore;
