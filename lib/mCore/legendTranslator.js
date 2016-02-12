var _ = require('lodash');
var flags = require('./messageFlags')
var types = require('./types')

/*
* The purpose of this file is to provide a translation layer between
*   interface_spec and messageLegends.
*
*
* The interface_spec is the thing that is common to all the messageHandler
*   classes, and which is ultimately propagated to client software.
*
* Message Legends are the specifics of what needs to be sent to firmware,
*   and are formed this way:

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

*/


/*
* Takes a interface_spec, and returns a message legend for sending to
*   a piece of firm
*/
var translateToMessageLegend = function(ifSpec) {
  if () {
  }
  if () {
  }
  //var messageId = ifSpec ? ifSpec.messAgerand() & 0xFFFF;
};


/*
* Takes a message legend, and returns an interface_spec for merger
*   by an engine.
*/
var translateToInterfaceSpec = function(leg) {
  var ifSpec = {
    inputs: {},
    outputs: {}
  };

  ifSpec.schema = _.reduce(leg, function(res, val, key){
    if(val.flag & flags.LISTENS) {
      res.inputs[val.name] = {
        label: val.name,
        args: [
          val.argForms
        ]
        func: function(me, data){

        }
      }

    }

    //


    return res;
  }, ifSpec)

  var testIntSpec = {
    type: "typeOfModule",
    name: "testModule",
    construct: function(){
      // do stuff on init;

    }
    schema: {
      describe: {
        'mtu': 16777215,  // Largest-possible MTU for the protocol.
        'pVersion': "0.0.1",
        'identity': "test",
        'fVersion': '1.5.4',
        'hVersion': '0',
        'extDetail': '',
        'serialNum': 0,
        'devFlags': 0
      },
      // inputs: {
      //   "submit" : {
      //     export: true, // 0x0002
      //     demand_ack: true, // 0x0004
      //     auth_only: true, // 0x0008
      //
      //     label: "Test Submit",
      //     args: [
      //         { label: "Message To Send",
      //           type: "string",
      //           def: "Default Value"
      //         },
      //         { label: "confirm",
      //           type: "string",
      //           def: "Default Value"
      //         }],
      //     func: function(me, data) {
      //
      //     }
      //   }
      // },
      // outputs: {
      //   "message" : {
      //     label: "message",
      //     type: "string",
      //     value: "current/last message state",
      //     hidden: false
      //   }
      // }

      // NEW MESSAGE STRUCTURE:
      //  THIS NEEDS TO BE UPDATED IN TO ALL THE MODULES SO WE
      //  HAVE HARDWARE PARITY IN OUR LEGEND/INTSPEC

      messages: {
        "SUBMIT": {
          label: "Test Submit"
          export: true,
          demand_ack: true,
          auth_only: true,
          hidden: false,
          input: function (me, data){

          },
          output: false
          args: [
            { label: "Message To Send",
              type: "string",
              hType: "String"
              def: "Default Value"
              value: "test"
            },
            { label: "count",
              type: "number",
              hType: "Int32"
              def: "Default Value",
              value: "test2"
            }]
        }
      }
    },
    adjuncts: {}, // handled by messageHandler
    taps: {       // handles intercepting
      "childIntspecType" : {
        "message" : function(me, msg, adjunctID){
          console.log(msg.data)
          return false; // true = pass to parent
        }
      }
    }
  }




};
