'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

// Config for mConnector to act on
var config = {
  name: 'MHB',
  version: '1.0.0',
  emits: {
    'GENERIC': 'console_log', // these will be definitions in connector
    'ERROR': 'console_log'
      //etc
  }
};

// PRIVATE FUNCTIONS
function parse(message) {
  var newMessage = {};
  // switch case to parse specific messages
  return newMessage;
}

// EXPOSED OBJECT / CONSTRUCTOR
function mCore() {
  this.config = config;
};

mCore.prototype.init = function() {
  ee.call(this);
  var that = this;

  this.on('toParse', function(buffer) {
    parse(buffer);
  })

  this.on('done', function(packet) {
    that.emit('fromParse', parse(packet));
  })

  return this;
}

util.inherits(mCore, ee);


mCore.prototype.getConfig = function(message) {
  // TBD... This involves message definitions for specific module emits
  return config;
}

module.exports = mCore;
