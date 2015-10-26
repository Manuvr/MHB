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
        'assign': {
          label: "Assign",
          args:
            [
              {
                label: 'Engine name',
                type: 'string'
              }
            ],
          func: function(me, message) {
            // doesn't do anything yet.
            me.send('log', ['TODO: We know we should assign an engine at this point.', 2]);
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
