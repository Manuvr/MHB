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
  'fVersion': '0.0.1',
  'hVersion': '0',
  'serialNum': 1198482374902,
  'extDetail': ''
};

var mLegend = {
  0x8000: {
    flag: 0x0004,
    argForms: {
      '1': [14]
    },
    name: 'TXT_MSG'
  }, // A simple text message.
  0x8001: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'TXT_MSG_NO_ACK'
  }  // Same thing, but does not require an ACK.
};


/*
* TODO:
* This is called by mHub. It is passed an argument from SELF_DESCRIBE.
*   We are to decide if we handle it or not by returning a boolean.
*/
function handledByUs(slf_desc) {
}


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

  that.esBeacon = require('eddystone-beacon');

  this.mLegend = mLegend;

  that.namespace    = '00010203040506070809';
  that.nonce        = 'abcdefabcdef';
  that.url          = 'http://www.neustar.biz';

  var batteryVoltage = 500; // between 500 and 10,000 mV
  var temperature = 22.0; // between -128.0 and 128.0

  that.options = {
    name:          'Deacon',
    txPowerLevel:  -21,
    tlmCount:      2
  };


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
      name: 'MHBDebug',  // How we present ourselves to the client.
      describe: self_description,
      inputs: {
        'setName': {
          label: "Set the advertised name",
          args: [ { label: 'URL', type: 'string' }],
          func: function(me, data) {
            me.options.name = data;
            me.esBeacon.advertiseUid(that.namespace, that.nonce, that.options);
            me.esBeacon.advertiseUrl(that.url, that.options);
          },
          hidden: false
        },
        'setURL': {
          label: "Set the advertised URL",
          args: [ { label: 'URL', type: 'string' }],
          func: function(me, data) {
            me.url = data.toString();
            me.esBeacon.advertiseUid(that.namespace, that.nonce, that.options);
            me.esBeacon.advertiseURL(me.url, me.options);
          },
          hidden: false
        },
        'setTxPower': {
          label: "Set transmission power",
          args: [ { label: 'dB', type: 'number' }],
          func: function(me, data) {
            me.options.txPowerLevel = data;
            me.esBeacon.advertiseUid(that.namespace, that.nonce, that.options);
            me.esBeacon.advertiseUrl(that.url, that.options);
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

  that.esBeacon.setBatteryVoltage(batteryVoltage);
  that.esBeacon.setTemperature(temperature);
  that.esBeacon.advertiseUid(that.namespace, that.nonce, that.options);
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
