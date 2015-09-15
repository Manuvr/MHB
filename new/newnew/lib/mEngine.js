'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var merge = require('lodash.merge');

// Config for mConnector to act on... pulled in to the constructor.
var config = {
  name: 'DHB',
  version: '1.0.0',
  inputs: {
    'data': 'data'
  },
  outputs: {
    'GLOVE_MODEL': 'direct_socket', // these will be definitions in connector
    'ERROR': 'log'
      //etc
  },
  state: {
    'LED_1': 'number',
    'GLOVE_MODEL': 'string'
  }
};

function customBuild(data) {
  // manipulate buildable data with switch case
  return data
}

/**
 * This is where functionality specific to the Manuvrable ought to be cased-off.
 *
 */
function customRead(data) {
  // manipulate parsed data with switch case
  return data;
}

// mEngine Factory function
function mEngine(parent) {
  ee.call(this);
  var that = this;
  this.config = config;
  this.parent = parent;

  // Emits to session
  var fromEngine = function(type, data) {
    that.emit('fromEngine', type, data)
  }

  // Emits to parent
  var toParent = function(type, data) {
    that.parent.emit('toEngine', type, data)
  }

  // Inputs from session
  var toEngine = function(type, data) {
    switch (type) {
      case 'send':
        // build new
        that.toParent(type, customBuild(data));
        break;
      case 'state':
        // do something
        break;
      default:
        that.fromEngine('log', ["not a valid type", 2])
        break;
    }
  }

  // Inputs from parent
  var fromParent = function(type, data) {
    switch (type) {
      case 'client':
        that.fromEngine(type, customRead(data));
      case 'log':
        that.fromEngine(type, data);
      case 'config':
        that.fromEngine(type, merge({}, data, config))
      default:
        // something random from parent
        that.fromEngine(type, data);

    }
  }

  // listeners
  this.on('toEngine', toEngine)
  this.parent.on('fromEngine', fromParent)

};
inherits(mEngine, ee);

mEngine.prototype.getConfig = function() {
  return config;
}

module.exports = mEngine;
