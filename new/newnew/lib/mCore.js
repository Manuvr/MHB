'use strict'

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55, 0x04, 0x00, 0x00,
  0x55, 0x04, 0x00, 0x00, 0x55, 0x04, 0x00, 0x00, 0x55
], 'hex');

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var uuid = require('node-uuid');

var merge      = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');

var receiver = require('./mCore/receiver.js');
var messageParser = require('./mCore/messageParser.js');
var mFlags = require('./mCore/messageFlags.js');
var mLegend = require('./mCore/messageLegend.js');
var types = require('./mCore/types.js');
var parseAction = require('./mCore/messageAction.js').parseAct;
var buildAction = require('./mCore/messageAction.js').buildAct;
var dialogQueues = require('./mCore/messageAction.js').queues;
var messageBuilder = require('./mCore/messageBuilder.js')

// Config for mConnector to act on
var config = {
  name: 'MHB',
  state: {
    'connected'      : {type: 'boolean',  value: false},
    'listening'      : {type: 'boolean',  value: true},
    'localAddress'   : {type: 'string',   value: ''},
    'remoteAddress'  : {type: 'string',   value: ''}
  },
  inputs: {
    'scan':          {label:  'Scan',              type: 'none'},
    'data':          {label:  'Data',              type: 'buffer'},
    'connect':       {label:  'Connect', desc: ['Connect'], type: 'array'}
  },
  outputs: {
    'connected':     {type:   'boolean',        state: 'connected'},
    'scanResult':    {label:  ['Address'],      type:  'array'},
    'localAddress':  {label:  'Local Address',  type:  'string',  state: 'localAddress'},
    'remoteAddress': {label:  'Remote Address', type:  'string',  state: 'remoteAddress'},
    'log': 'log'
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
  
  this.queues = new dialogQueues();

  var sendSync = function() {
    if (that.syncCount < 25) {
      that.timer = setInterval(function() {
        that.receiver.parser.write(SYNC_PACKET_DEF);
        that.syncCount++;
      }, 500)
    } else {
      clearInterval(that.timer);
      //fromEngine('');
      fromEngine('log', ['This used to be a blank emit. Interval cleared.', 7]);
    }
  }


  this.receiver = new receiver();

  this.receiver.ee.on('syncInSync', function() {
    fromCore('log', ['Received sync packet, sending back...', 6]);
  });

  this.receiver.ee.on('outOfSync', function(outOfSync, reason) {
    if (outOfSync) {
      fromCore('data', SYNC_PACKET_DEF);
      fromEngine('log', ['Became desync\'d because ' + reason + '.', 6]);
    } else {
      clearInterval(that.timer);
      that.syncCount = 0;
      // Start sending KA
      var ka_message = {
        "messageId":  8,
        "messageDef": 'KA',
        "flag":       0,
        "args":       []
      };
      buildAction.bind(that)(ka_message);

      // We must have just become sync'd.
      fromEngine('log', ['Became sync\'d and sent a KA.', 6]);
    }
  });

  this.buildBuffer = messageBuilder;

  this.mLegend  = _clonedeep(mLegend);
  this.types = types;

  this.messageParser = new messageParser(this.mLegend, mFlags)

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
        data.flag = that.mLegend[data.messageId].flag;
        buildAction.bind(that)(data);
        break;
      case 'badsync':
        // Initiate a malformed sync packet. We notice the desync first.
        fromEngine('log', [
          'Sending bad data via transport. Trying to initiate a desync....',
          4
        ]);
        fromCore('data', new Buffer(45));
        break;
      case 'state':
        // do something
        break;
      case 'config':
        fromEngine('config', config);
      default:
        fromEngine('log', ['Not a valid type.', 2]);
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
        if (data) {
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
  
  // Dialog callback signals.
  this.on('doneParsing',  fromEngine);
  this.on('doneBuilding', fromCore);

  this.receiver.parser.on('readable', function() {
    var jsonBuff;
    while (jsonBuff = that.receiver.parser.read()) {
      // Try to extract meaning from the parsed packet.
      if (that.messageParser.parse(jsonBuff)) {
        // If the message and its arguments all parsed ok, act on it...
        parseAction.bind(that)(jsonBuff);
      }
      else {
        fromEngine('log', ['Transport returned a packet, but parse failed:\n ' + jsonBuff.strigify(), 3]);
      }
    }
  });
};
inherits(mCore, ee);

mCore.prototype.getConfig = function() {
  return config;
}

module.exports = mCore;
