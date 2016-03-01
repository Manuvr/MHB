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
    argForm: [14],
    minimumArgs: 0,
    name: 'CHANGE_NAME'
  },
  0x8001: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'CHANGE_URL'
  },
  0x8002: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'setCryptAlgo'
  },
  0x8003: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'takeOwnership'
  },
  0x8004: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'bless'
  },
  0x8005: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'setKey'
  },
  0x8006: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'setIV'
  },
  0x8007: {
    flag: 0x0000,
    argForm: [3],
    minimumArgs: 0,
    name: 'setRotationInterval'
  },
  0x8008: {
    flag: 0x0000,
    argForm: [1],
    minimumArgs: 0,
    name: 'CHANGE_TX_POWER'
  },
  0x8009: {
    flag: 0x0000,
    argForm: [14],
    minimumArgs: 0,
    name: 'deviceSighted'
  },
  0x800A: {
    flag: 0x0000,
    argForm: [],
    minimumArgs: 0,
    name: 'reboot'
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
        body:      "Sending To Device: '"+target+"'   Data:\n"+JSON.stringify(data)+"' ",
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
        },
        'setCryptAlgo': {
          label: "Set the algorithm used to derive the UID",
          args: [ { label: 'UID Algo', type: 'string' }],
          func: function(me, data) {
            // Pass no arguments for no obfuscation.
            toParent('send_msg', {
              name:  'setCryptAlgo',
              args:  [data]
            });
          },
          hidden: false
        },
        'takeOwnership': {
          label: "Sets the given 256-byte key to be the new owner.",
          args: [ { label: 'New Owner', type: 'string' }],
          func: function(me, data) {
            // This is used to transfer ownership of the beacon to the given owner.
            toParent('send_msg', {
              name:  'takeOwnership',
              args:  [data]
            });
          },
          hidden: false
        },
        'bless': {
          label: "Set the initial manufacturer data",
          args: [ { label: 'Manu Data', type: 'string' }],
          func: function(me, data) {
            // This should only be done once by the manufacturer. This payload contains
            //   paramaters from the registry, and should be burned to EEPROM/conf file/whatever.
            // If this call succeeds, all subsequent calls should be rejected.
            toParent('send_msg', {
              name:  'bless',
              args:  [data]
            });
          },
          hidden: false
        },

        'setKey': {
          label: "Set the key used to encrypt the UID",
          args: [ { label: 'UID Key', type: 'string', def:'0000000000000000000000000000000000000000000000000000000000000000' }],
          func: function(me, data) {
            toParent('send_msg', {
              name:  'setKey',
              args:  [data]
            });
          },
          hidden: false
        },
        'setIV': {
          label: "Set the IV used to encrypt the UID",
          args: [ { label: 'UID Salt', type: 'string', def:'00000000000000000000000000000000' }],
          func: function(me, data) {
            // Pass no args to use all zeros.
            toParent('send_msg', {
              name:  'setIV',
              args:  [data]
            });
          },
          hidden: false
        },
        'reboot': {
          label: "Reboot the counterparty.",
          args: [],
          func: function(me, data) {
            // Pass no args to use all zeros.
            toParent('send_msg', {
              name:  'reboot',
              args:  [data]
            });
          },
          hidden: false
        },
        'setRotationInterval': {
          label: "Set the interval of the UID rotation, in seconds",
          args: [ { label: 'UID Rotation Interval', type: 'string' }],
          func: function(me, data) {
            toParent('send_msg', {
              name:  'setRotationInterval',
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
      'names': {
      },
      'types': {
        "mEngine": {
          "deviceSighted" : function(me, msg, adjunctID){
            console.log('A remote beacon found BT MAC '+msg.data[0]);
            return true;
          },
          "getID" : function(me, msg, adjunctID){
            console.log('DeaconMgmt got a thingID back from a beacon.');
            return true;
          }
        }
      }
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
