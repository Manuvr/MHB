/*
* mSession is the abstract representation of a connection to a Manuvrable.
*/

/*jslint node: true */
'use strict'

var inherits = require('util').inherits;
var messageHandler = require('./messageHandler_refactor.js');

function session() {

  var that = this;

  this.sessionEstablished = false;

  this.interface_spec = {
    type: 'mSession',
    schema: {
      messages: {
        "sessionEstablished" : {
          input: true,
          output: true,
          label: "Session Established",
          hidden: false,
          input_func: function(me, data){
            me.test = "herp"
            console.log("got a session established! and this should work: " + me.test)
          },
          args: [
            { label: "Message To Send",
              type: "string",
              hType: "String",
              def: "Default Value",
              value: "test"
            }
          ]
        }
      }
    },
    adjuncts: {
    },
    taps: {
      "mSession" : {
        "sessionEstablished" : function(me, msg, adjunctID){
          me.test = "herp"
          console.log("TAPPIN! and this should work: " + me.test)
          return true;
        }
      }
    }
  };

  messageHandler.call(this);
}
inherits(session, messageHandler);


module.exports = session;
