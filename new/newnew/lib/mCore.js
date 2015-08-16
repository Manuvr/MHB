'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

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

// PRIVATE FUNCTIONS
function parse(message) {
  var newMessage = {};
  // switch case to parse specific messages
  return newMessage;
}

function customBuild(data) {
  // manipulate buildable data with switch case
  return data
}

function customRead(data) {
  // manipulate parsed data with switch case
  return data;
}

// mEngine Factory function
function mCore() {
  ee.call(this);
  var that = this;
  this.config = config;
  this.parent = this; // freaky way of doing a chained assignment from session

  // listeners
  this.on('toEngine', toEngine)
  this.on('toCore', toCore)

  // Emits to session
  var fromEngine = function(type, data) {
    that.emit('fromEngine', type, data)
  }

  // Inputs from session
  var toEngine = function(type, data) {
    switch (type) {
      case 'send':
        // build new
        that.parse(data);
        break;
      case 'state':
        // do something
        break;
      default:
        that.mCore('log', "not a valid type")
        break;
    }
  }

  var fromCore = function(type, data) {
    that.emit('fromEngine', type, data)
  }

  // Inputs from session
  var toCore = function(type, data) {
    switch (type) {
      case 'send':
        // build new
        that.parse(data);
        break;
      case 'state':
        // do something
        break;
      default:
        that.fromEngine('log', "not a valid type")
        break;
    }
  }

};
util.inherits(mEngine, ee);

mCore.prototype.getConfig = function() {
  return config;
}

module.exports = mCore;
