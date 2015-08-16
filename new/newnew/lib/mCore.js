'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var receiver = require('./mCore/receiver.js');

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
  this.receiver = new receiver();

  // input listeners
  this.on('toEngine', toEngine)
  this.on('toCore', toCore)

  this.receiver.parser.on('readable', function() {
    var jsonBuff;
    while (jsonBuff = that.receiver.parser.read()) {
      generateMessage(jsonBuff);
    }
  });


  // Emits OUT
  var fromEngine = function(type, data) {
    that.emit('fromEngine', type, data)
  }
  var fromCore = function(type, data) {
    that.emit('fromEngine', type, data)
  }

  // Inputs from session
  var toEngine = function(type, data) {
    switch (type) {
      case 'send':
        // build new
        that.buildBuffer(data);
        break;
      case 'state':
        // do something
        break;
      default:
        that.mCore('log', "not a valid type")
        break;
    }
  }

  // Inputs from Transport
  var toCore = function(type, data) {
    switch (type) {
      case 'data':
        that.receiver.parser.write(data);
        break;
      default:
        that.fromEngine('log', "not a valid type")
        break;
    }
  }

};
util.inherits(mCore, ee);

mCore.prototype.getConfig = function() {
  return config;
}

module.exports = mCore;
