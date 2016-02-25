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
  'identity': "Deacon",
  //THIS IS NEW:
  'counter_identity' : "DeaconMgmt",
  'fVersion': '0.0.1',
  'hVersion': '0',
  'serialNum': 1198482374902,
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
      '1': [14]
    },
    name: 'setCryptAlgo'
  },
  0x8003: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'takeOwnership'
  },
  0x8004: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'bless'
  },
  0x8005: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'setKey'
  },
  0x8006: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'setIV'
  },
  0x8007: {
    flag: 0x0000,
    argForms: {
      '1': [3]
    },
    name: 'setRotationInterval'
  },
  0x8008: {
    flag: 0x0000,
    argForms: {
      '1': [1]
    },
    name: 'CHANGE_TX_POWER'
  },
  0x8009: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'deviceSighted'
  }
};


var beaconConfig = {
  cryptAlgo:           'SHA256',
  cryptIV:             '',
  cryptKey:            '',
  rotationPeriod:      10,                            // In seconds
  UID:                 '000000000000abcd',
  url:                 'http://www.neustar.biz',
  eddyOpts:  {
    name:          'Deacon',
    txPowerLevel:  -21,
    tlmCount:      2
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

  that.esBeacon = require('eddystone-beacon');

  this.mLegend = mLegend;

  that.namespace    = '00010203040506070809';
  that.url          = 'http://www.neustar.biz';

  var batteryVoltage = 500; // between 500 and 10,000 mV
  var temperature = 22.0; // between -128.0 and 128.0

  that.options = {
    name:          'Deacon',
    txPowerLevel:  -21,
    tlmCount:      2
  };

  this.rotationInterval = false;


  this.rotateUID = function() {
    switch (this.beaconConfig.cryptAlgo) {
      case 'aes':
        // CryptoMAC
        break;
      case 'sha':
        // HashMAC
        break;
      default:
        // Unsure what to do here...
        break;
    }
  }


  // Emits to session
  var fromEngine = function(method, data) {
    that.send(method, data)
  }

  // Emits to parent
  var toParent = function(target, data) {
    that.mH.sendToAdjunct('parent', target, data);
  }

  this.setName = function(data) {
    that.esBeacon.stop();
    that.beaconConfig.eddyOpts.name = data.toString();
    that.esBeacon.advertiseUid(that.beaconConfig.UID.slice(0,10), that.beaconConfig.UID.slice(10,16), that.beaconConfig.eddyOpts);
    that.esBeacon.advertiseUrl(that.beaconConfig.url, that.beaconConfig.eddyOpts);
    console.log('DEACON: Set name to ' + data);
  };

  this.setURL = function(data) {
    that.esBeacon.stop();
    that.beaconConfig.url = data.toString();
    that.esBeacon.advertiseUid(that.beaconConfig.UID.slice(0,10), that.beaconConfig.UID.slice(10,16), that.beaconConfig.eddyOpts);
    that.esBeacon.advertiseUrl(that.beaconConfig.url, that.beaconConfig.eddyOpts);
    console.log('DEACON: Set URL to ' + data);
  };

  this.setTxPower = function(data) {
    that.esBeacon.stop();
    that.beaconConfig.eddyOpts.txPowerLevel = data;
    that.esBeacon.advertiseUid(that.beaconConfig.UID.slice(0,10), that.beaconConfig.UID.slice(10,16), that.beaconConfig.eddyOpts);
    that.esBeacon.advertiseUrl(that.beaconConfig.url, that.beaconConfig.eddyOpts);
    console.log('DEACON: Set TxPower to '+data);
  };

  this.setCryptAlgo = function(data) {
  }

  this.takeOwnership = function(data) {
  }

  this.bless = function(data) {
  }

  this.setIV = function(data) {
    that.beaconConfig.cryptIV = data;
  }

  this.setKey = function(data) {
    that.beaconConfig.cryptKey = data;
  }


  this.interface_spec = {
    schema: {
      type: 'mEngine',
      name: 'Deacon',  // How we present ourselves to the client.
      describe: self_description,
      inputs: {
        'scanResult': {
          func: function(me, data) {
            // We do this to act as an "inverse beacon". The idea is to
            //   passively collect MAC addresses and relay them back to our
            //   counterparty.
            // TODO: We might have some sort of "debounce" on the data to prevent
            //   repeat sightings until the thing is not seen for some amount of time.
            me.send('deviceSighted', msg.data.args[0]);
            return true
          },
          hidden: true
        },
        'setName': {
          label: "Set the advertised name",
          args: [ { label: 'Name', type: 'string' }],
          func: function(me, data) {
            me.setName(data.toString());
          },
          hidden: false
        },
        'setURL': {
          label: "Set the advertised URL",
          args: [ { label: 'URL', type: 'string' }],
          func: function(me, data) {
            me.setURL(data.toString());
          },
          hidden: false
        },
        'setCryptAlgo': {
          label: "Set the algorithm used to derive the UID",
          args: [ { label: 'UID Algo', type: 'string' }],
          func: function(me, data) {
            // Pass no arguments for no obfuscation.
            me.setCryptAlgo(data.toString());
          },
          hidden: false
        },
        'takeOwnership': {
          label: "Sets the given 256-byte key to be the new owner.",
          args: [ { label: 'New Owner', type: 'string' }],
          func: function(me, data) {
            // This is used to transfer ownership of the beacon to the given owner.
            me.takeOwnership(data.toString());
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
            me.bless(data.toString());
          },
          hidden: false
        },

        'setKey': {
          label: "Set the key used to encrypt the UID",
          args: [ { label: 'UID Key', type: 'string' }],
          func: function(me, data) {
            me.setKey(data.toString());
          },
          hidden: false
        },
        'setIV': {
          label: "Set the IV used to encrypt the UID",
          args: [ { label: 'UID Salt', type: 'string' }],
          func: function(me, data) {
            // Pass no args to use all zeros.
            me.setIV(data.toString());
          },
          hidden: false
        },
        'setRotationInterval': {
          label: "Set the interval of the UID rotation, in seconds",
          args: [ { label: 'UID Rotation Interval', type: 'string' }],
          func: function(me, data) {
            var nu = parseInt(data) * 1000;
            if (nu != me.beaconConfig.rotationPeriod) {
              // If the provided value differs from the existing value, replace it.
              me.beaconConfig.rotationPeriod = nu;
              if (me.rotationInterval) {
                // If there is an interval already running, we should stop it.
                clearInterval(me.rotationInterval);
                me.rotationInterval = false;
              }
            }

            if (!me.rotationInterval) {
              // If there is NOT already a rotation interval running...
              if (me.beaconConfig.rotationPeriod) {
                // ...and the setting says there ought to be one, set it running.
                me.rotationInterval = setInterval(me.rotateUID(), me.beaconConfig.rotationPeriod);
              }
            }
          },
          hidden: false
        },
        'setTxPower': {
          label: "Set transmission power",
          args: [ { label: 'dB', type: 'number' }],
          func: function(me, data) {
            me.setTxPower(parseInt(data));
          },
          hidden: false
        }
      },
      outputs: {
        'deviceSighted': {
          label: ['MAC'],
          type: 'string',
          value: ''
        }
      }
    },
    taps: {
      'names': {
      },
      'types': {
        "mEngine": {
          "CHANGE_NAME" : function(me, msg, adjunctID){
            me.setName(msg.data.args[0].toString());
            return true;
          },
          "CHANGE_URL" : function(me, msg, adjunctID){
            me.setURL(msg.data.args[0].toString());
            return true;
          },
          "CHANGE_TX_POWER" : function(me, msg, adjunctID){
            me.setTxPower(parseInt(msg.data.args[0]));
            return true
          },
          "setCryptAlgo" : function(me, msg, adjunctID){
            me.setCryptAlgo(parseInt(msg.data.args[0]));
            return true;
          },
          "takeOwnership" : function(me, msg, adjunctID){
            me.takeOwnership(parseInt(msg.data.args[0]));
            return true;
          },
          "bless" : function(me, msg, adjunctID){
            me.bless(parseInt(msg.data.args[0]));
            return true;
          },
          "setKey" : function(me, msg, adjunctID){
            me.setKey(parseInt(msg.data.args[0]));
            return true;
          },
          "setIV" : function(me, msg, adjunctID){
            me.setIV(parseInt(msg.data.args[0]));
            return true;
          },
          "getID" : function(me, msg, adjunctID){
            toParent('send_msg', {
              name:  'getID',
              uniqueId: msg.uniqueId,
              args:  [data]
            });
            return true;
          },
          "setRotationInterval" : function(me, msg, adjunctID){
            return true;
          },
        }
      }
    },
    adjuncts:{
    }
  };

  that.esBeacon.setBatteryVoltage(batteryVoltage);
  that.esBeacon.setTemperature(temperature);
  that.esBeacon.advertiseUid(that.beaconConfig.UID.slice(0,10), that.beaconConfig.UID.slice(10,16), that.beaconConfig.eddyOpts);
  that.esBeacon.advertiseUrl(that.url, that.options);

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
