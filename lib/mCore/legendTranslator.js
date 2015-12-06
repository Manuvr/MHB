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
  var ifSpec = {};

};
