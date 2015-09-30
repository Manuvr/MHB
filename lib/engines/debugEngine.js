'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var merge = require('lodash.merge');

/** This is the default config for this Engine. */
var interface_spec = {
  schema: {
    describe: {
      'mtu': 50000,
      'pVersion': "0.0.1",
      'identity': "MHBDebug",
      'fVersion': '0.0.1',
      'hVersion': '0',
      'extDetail': ''
    },
    state: {
      'lastText': {
        type:  'string',
        value: ''
      }
    },
    inputs: {
      'sendText': {
        label: 'sendText',
        type:  'string'
      },
      'sendTextNoAck': {
        label: 'sendText',
        type:  'string'
      }
    },
    outputs: {
      'gotText': {
        label: 'gotText',
        type:  'string'
      }
    }
  },
  adjuncts:{
  }
};


var mLegend = {
  0x8000: {
    flag: 0x0004,
    argForms: {
      '1': [14]
    },
    def: 'TXT_MSG'
  }, // A simple text message.
  0x8001: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    def: 'TXT_MSG_NO_ACK'
  }  // Same thing, but does not require an ACK.
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
  this.interface_spec = interface_spec;
  this.parent = parent;
  this.uuid   = parent.uuid;

  this.mLegend = mLegend;
  
  // Emits to session
  var fromEngine = function(method, data) {
    that.emit('fromEngine', method, data)
  }

  // Emits to parent
  var toParent = function(method, data) {
    fromEngine('log', ["MHBDebug toParent: '"+method+"'   Data:\n"+data+"' ", 7]);
    that.parent.emit('toEngine', method, data)
  }

  // Inputs from session
  var toEngine = function(method, data) {
    fromEngine('log', ["MHBDebug toEngine: '"+method+"'   Data:\n"+data+"' ", 7]);
    switch (method) {
      case 'sendText':
        fromEngine('log', ["Sending a text message across the wire: '"+data+"' ", 6]);
        // TODO: Build the message according to our local message legend and ship it.
        break;
      case 'sendTextNoAck':
        fromEngine('log', ["Sending a text message across the wire without caring about ACK: '"+data+"' ", 6]);
        // TODO: Build the message according to our local message legend and ship it.
        break;
      default:
        toParent(method, customBuild(data));
        break;
    }
  }

  // Inputs from parent
  var fromParent = function(method, data) {
    fromEngine('log', ["MHBDebug fromParent: '"+method+"'   Data:\n"+data+"' ", 7]);
    switch (method) {
      case 'client':
        fromEngine(method, customRead(data));
        break;
      case 'log':
        fromEngine(method, data);
        break;
      case 'config':
        // TODO: merge() is sloppy here...
        fromEngine(method, merge({}, data, interface_spec));
        break;
      default:
        // something random from parent
        fromEngine(method, data);
        break;
    }
  }

  // listeners
  this.on('toEngine', toEngine)
  this.parent.on('fromEngine', fromParent)
  
  toParent('registerLegend', mLegend);

};
inherits(mEngine, ee);

mEngine.prototype.getConfig = function() {
  return interface_spec;
}

module.exports = {init: mEngine, config: interface_spec}; //mEngine;

