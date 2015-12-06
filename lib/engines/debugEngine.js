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
  'identity': "MHBDebug",
  'fVersion': '0.0.1',
  'hVersion': '0',
  'serialNum': 0,
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
      name: 'MHBDebug',  // How we present ourselves to the client.
      describe: self_description,
      inputs: {
        'sendText': {
          label: "Send Text With ACK",
          args: [ { label: 'Text', type: 'string' }],
          func: function(me, data) {
            that.send('log', {
              body:      "Sending a text message across the wire: '"+data+"' ",
              verbosity: 4
            });
            // TODO: Build the message according to our local message legend and ship it.
            toParent('send_msg', {
              name:  'TXT_MSG',
              args:  [data]
            });
          },
          hidden: false
        },
        'sendTextNoAck': {
          label: "Send Text",
          args: [ { label: 'Text', type: 'string' }],
          func: function(me, data) {
            that.send('log', {
              body:      "Sending a text message across the wire without caring about ACK: '"+data+"' ",
              verbosity: 4
            });
            toParent('send_msg', {
              name:  'TXT_MSG_NO_ACK',
              args:  [data]
            });
          },
          hidden: false
        }
      },
      outputs: {
        'gotText': {
          label: 'gotText',
          type:  'string',
          value: ''
        }
      }
    },
    taps: {
      "mEngine": {
        "unhandledMsg" : function(me, msg, adjunctID) {
          // This is where we should intercept messages that we handle.
          // customRead() decides if we should continue emitting toward the client...
          return customRead(adjunctID, data);
        },
        "TXT_MSG" : function(me, msg, adjunctID){
          that.send('log', {
            body:      "Got TXT_MSG" + JSON.stringify(msg, null, 2),
            verbosity: 6
          });
          me.send('gotText', msg.data.args[0]);
          toParent('send_msg', {
            name:  'REPLY',
            uniqueId: msg.data.uniqueId
          });
          return true;
        },
        "TXT_MSG_NO_ACK" : function(me, msg, adjunctID){
          that.send('log', {
            body:      "Got TXT_MSG_NO_ACK" + JSON.stringify(msg, null, 2),
            verbosity: 6
          });
          me.send('gotText', msg.data.args[0]);
          return true;
        },
        "msg" : function(me, msg, adjunctID){
          console.log("FROM DEBUG ENGINE: " + JSON.stringify(msg, null, 2))
          return true
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
