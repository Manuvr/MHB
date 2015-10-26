'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var messageHandler = require('./messageHandler.js');
var MHB = require('./mCore.js');

function session(transport) {
  ee.call(this);

  var that = this;
  this.core = new MHB(transport);

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
      },
      outputs: {
      }
    },
    adjuncts: {
    },
    taps: {
      "mEngine" : {
        "sessionEstablished" : function(me, msg, adjunctID){
          me.sessionEstablished = msg.data;
          return true;
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct("engine", this.core)
  this.mH.addMetaAdj("metaGuy", "engine")

}
inherits(session, ee);

session.prototype.addEngine = function(engine) {
  this.mH.addAdjunct("engine", engine(this.interface_spec.adjuncts["engine"].instance));
}

module.exports = session;
