'use strict'

// template for DHB middle-man interaction
var ee = require('events').EventEmitter;

// Config for mConnector to act on... pulled in to the constructor.
var config = {
  name: 'DHB',
  version: '1.0.0',
  emits: {
    'GLOVE_MODEL': 'direct_socket', // these will be definitions in connector
    'ERROR': 'console_log'
      //etc
  },
  state: {
    'LED_1': 'number',
    'GLOVE_MODEL': 'string'
  }
};

// mEngine Factory function
function mEngine() {
  this.config = config;
};

mEngine.prototype.init = function(parent) {
  var that = this;
  this.config = config;
  ee.call(this);

  this.parent = parent;

  var parse = function(message) {
    var newMessage = {};
    // switch case to parse specific messages
    return newMessage;
  }

  var build = function(objectPacket) {

  }

  var toParse = function(buffer) {
    that.parent.emit('toParse', buffer)
  }

  var fromParse = function(buffer) {
    that.emit('fromParse', parse(packet))
  }

  // listeners
  this.on('toParse', toParse)
  this.parent.on('fromParse', fromParse)

  return this;
}


module.exports = mEngine;
