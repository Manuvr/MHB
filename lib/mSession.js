'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var messageHandler = require('./messageHandler.js');
var MHB = require('./mCore.js');

function session(transport) {
  ee.call(this);

  var that = this;
  this.core = new MHB();

  this.sessionEstablished = false;

  this.interface_spec = {
    type: 'mSession',
    schema: {
      state: {
        'sessionEstablished' : {
          type: 'boolean',
          value: false
        }
      },
      inputs: {
        'assign': {
          label: "Assign",
          args:
            [
              {
                label: 'Assign',
                type: 'object'
              }
            ],
          func: function(me, message) {
            // doesn't do anything yet.
          },
          hidden: false
        }
      },
      outputs: {

      }
    },
    adjuncts: {
    },
    taps: {
      "mTransport" : {
        "data" : function(me, msg, adjunctID) {
          that.core.emit("toCore", msg.data)
          return false; // don't want this going to the client
        },
        "connected" : function(me, msg, adjunctID){
          me.mH.sendToAdjunct("engine", ['connected'], msg.data);
          return true;
        }
      },
      "mEngine" : {
        "sessionEstablished" : function(me, msg, adjunctID){
          me.sessionEstablished = msg.data;
          return true;
        },
        "syncd" : function(me, msg, adjunctID){
          if (!me.sessionEstablished) {
            // If there was not a session established before, then continue the setup phase...
            me.mH.sendToAdjunct("engine", ['SELF_DESCRIBE'], {});
          }
          return false;
        },
        "transport" : function(me, msg, adjunctID){
          me.mH.sendToAdjunct("transport", ['connected'], false);
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct("transport", transport)
  this.mH.addAdjunct("engine", this.core)

  this.core.on('fromCore', this.mH.sendToAdjunct.bind(null, "transport", ['data']));
}
inherits(session, ee);

session.prototype.addEngine = function(engine) {
  this.mH.addAdjunct("engine", engine(this.interface_spec.adjuncts["engine"].instance));
}

module.exports = session;
