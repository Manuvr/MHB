'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var merge = require('lodash.merge');
var messageHandler = require('../messageHandler.js');

var generateUniqueId = function() {
  return (Math.random() * (65535 - 1) + 1) & 0xFFFF;
}

var self_description = {
  // This is our self-description. It is how we present ourselves to
  //   the thing on the otherside of a transport.
  'mtu': 50000,
  'devFlags': 0,
  'pVersion': "0.0.1",
  'identity': "DeaconMgmt",
  //THIS IS NEW
  'counter_identity' : "Deacon",
  'fVersion': '0.0.1',
  'hVersion': '0',
  'serialNum': 0,
  'extDetail': ''
};

var mLegend = {
  0x8000: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'CHANGE_NAME'
  },
  0x8001: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'CHANGE_URL'
  },
  0x8002: {
    flag: 0x0000,
    argForms: {
      '1': [1]
    },
    name: 'CHANGE_TX_POWER'
  }
};


/*
* TODO:
* This is called by mHub. It is passed an argument from SELF_DESCRIBE.
*   We are to decide if we handle it or not by returning a boolean.
*/
function handledByUs(slf_desc) {
}



// mEngine Factory function
function mEngine(parent) {
  ee.call(this);
  var that = this;

  this.mLegend = mLegend;

  // Emits to session
  var fromEngine = function(method, data) {
    that.send(method, data)
  }

  // Emits to parent
  var toParent = function(target, data) {
    that.send('log', {
        body:      "MHBDebug toParent: '"+target+"'   Data:\n"+data+"' ",
        verbosity: 4
    });
    that.mH.sendToAdjunct('parent', target, data);
  }


  this.interface_spec = {
    schema: {
      type: 'mEngine',
      name: 'DeaconMgmt',  // How we present ourselves to the client.
      describe: self_description,
      inputs: {
        'setName': {
          label: "Set the advertised name",
          args: [ { label: 'Name', type: 'string' }],
          func: function(me, data) {
            toParent('send_msg', {
              name:  'CHANGE_NAME',
              args:  [data]
            });
          },
          hidden: false
        },
        'setURL': {
          label: "Set the advertised URL",
          args: [ { label: 'URL', type: 'string' }],
          func: function(me, data) {
            toParent('send_msg', {
              name:  'CHANGE_URL',
              args:  [data]
            });
          },
          hidden: false
        },
        'setTxPower': {
          label: "Set transmission power",
          args: [ { label: 'dB', type: 'number' }],
          func: function(me, data) {
            toParent('send_msg', {
              name:  'CHANGE_TX_POWER',
              args:  [data]
            });
          },
          hidden: false
        }
      },
      outputs: {
      }
    },
    taps: {
    },
    adjuncts:{
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct('parent', parent, true);
  toParent('registerEngine', { legend: this.mLegend, definition: self_description } );
};
inherits(mEngine, ee);

mEngine.prototype.getConfig = function() {
  return interface_spec;
}

module.exports = {
  init: mEngine,
  self_description: self_description,
  handledByUs:  handledByUs
}; //mEngine;
