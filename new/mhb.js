'use strict';

// ****************
// REQUIRES
// ****************
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();

var logger = require('winston');

//var bt = require('./bluetooth.js')();
var serial = require('./serialport.js')();
var Receiver = require('./receiver.js');
var MessageParser = require('./message_parser');
var dhbBuilder = require('./builder.js');
var utils = require('./utils.js');
//var argparse = require('./dhb-argparser.js');
//var exec = require('./dhb-exec.js');
//var gesture = require('../capture/capture.js');
//var runGestures = gesture(events);

// instantiated with pass-through requires
//var dhbArgParser = new argparse(dhbModels);
//var dhbExec = new exec(dhbModels, dhbArgParser);
// REPLACED THESE WITH BELOW
var messageParser = new MessageParser();

var opts = {};

// ****************
// HELPER FUNCTIONS
// ****************

// reinstatiates pass-through requires when dhbModels is updated
var refreshModels = function() {
	//dhbModels.outCommand = buildOutCommands(dhbModels.commands);
	//dhbArgParser = new argparse(dhbModels);
	//dhbExec = new exec(dhbModels, dhbArgParser);
  console.log('IMPLEMENT REFRESH');
};

// builds "outCommand" in dhbModels.
// This invrerts the key and "def", adds a "len" to the argForms and moves the contents to "data"
// in:  { "22" : { flag: 0, def: "testCommand", argForms: { "3": [6, 6, 6] } } }
// out: { "testCommand" : { command: 22, flag: 0, argForms: { "3": { len: 3, data: { [ 6, 6, 6] } } } } }
//
// Note: Eventually, I'd like to change the argForms key to a description of what the length will do. IE: set what?
var buildOutCommands = function (obj) {
	var new_obj = {};
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			new_obj[obj[prop].def] = { command: parseInt(prop), flag: obj[prop].flag };
			new_obj[obj[prop].def].argForms = {};
			for (var argProp in obj[prop].argForms) {
				if(obj[prop].argForms.hasOwnProperty(argProp)){
					new_obj[obj[prop].def].argForms[argProp] = {
						data: obj[prop].argForms[argProp],
						len : argProp
					}
				}
			}
		}
	}
	//console.log(new_obj);
	return new_obj;
};



/**
* Given a structure full of Message definitions, build a BINBLOB that represents them.
* Returns false on failure. A buffer containing the results on success.
*
* We need to loop twice. The first time to count everything and decide how large a buffer
*   to create, and the second time to actually do the writing.
*/
var packOwnLegendMessages = function(msg_defs) {
  var required_size = 0;
	for (var msg_def in msg_defs) {
	  if (msg_defs.hasOwnProperty(msg_def)) {
	    // If this isn't prototypical cruft, we count it in the tally.
	    required_size += 4;                       // +4 for the obligatory fields: flags (16-bit) and messageId (16-bit).
	    required_size += msg_def.def.length + 1;  // +(some more) for the string to represent the message class.
	    for (var argForm in msg_def.argForms) {
	      if (msg_def.argForms.hasOwnProperty(argForm)) {
	        // At this point, argForm should be one of (possibly many) valid argument forms
	        //   for the msg_def we are operating on. Now we're just adding bytes....
	        required_size += argForm.length + 1;  // +1 for the null-terminator.
	      }
	    }
	    required_size++;   // +1 for the second consecutive null-terminator to denote the end of this def.
	  }
	}

	if (required_size === 0) {
	  return false;
	}
	
	var return_value = Buffer(required_size);
	var offset       = 0;
	for (var msg_def in msg_defs) {
	  if (msg_defs.hasOwnProperty(msg_def)) {
	    // If this isn't prototypical cruft, we write it to the buffer.
	    return_value.writeUInt16LE(messageID,    offset);
	    return_value.writeUInt16LE(msg_def.flag, offset + 2);
	    offset += 4;

	    return_value.write(msg_def.def, offset, 'ascii');  // +(some more) for the string to represent the message class.
	    offset += msg_def.def.length;
	    return_value[offset++] = 0;
	    
	    for (var argForm in msg_def.argForms) {
	      if (msg_def.argForms.hasOwnProperty(argForm)) {
	        // At this point, argForm should be one of (possibly many) valid argument forms
	        //   for the msg_def we are operating on. Now we're just adding bytes....
	        for (var n = 0; n < argForm.length; n++) {
	          return_value[offset++] = argForm[n];
	        }
	        return_value[offset++] = 0;
	      }
	    }
	    return_value[offset++] = 0; // +1 for the second consecutive null-terminator to denote the end of this def.
	  }
	}
	return return_value;
}




// first pass outCommand instantiation
// TODO: REFACTOR
//dhbModels.outCommand = buildOutCommands(dhbModels.commands);

// ****************
// REPLY QUEUEING
// ****************

// if true, this will bypass the reply queue and execute
var autoExecReplies = true;
var sendReplies = false;

// we'll want this to emit whenever it's updated. Stick objects here prior to building...
var replyQueue = [];

var processReply = function(uniqueID, params) {
};

var sendReply = function() {
};

// ****************
// EXECUTION
// ****************

var generateMessage = function(jsonBuffer) {
	//var metaObj = dhbExec.runIt(jsonBuffer);

  var message = messageParser.parse(jsonBuffer);
  if(message) {
    events.emit('MESSAGE', message);
  }

	//runTypeSwitch(metaObj);
	//if(metaObj.refresh) {
		//refreshModels();
		//events.emit('outCommand', dhbModels.outCommand);
	//}
};

// FPS emitter... should probably be broken out.
var frames = 0;

setInterval(function(){
	if(frames !== 0) {
		events.emit("FPS", (frames / 5) );
		frames = 0;
	}
}, 5000);


// ****************
// CONTROL VARIABLES
// ****************

// Determines the protocol to send over... 0 = none, 1 = bluetooth, 2 = serial
var commMode = 0;

// ****************
// LISTENERS
// ****************

var receiver = new Receiver();
receiver.parser.on('readable', function() {
	var jsonBuff;
	while (jsonBuff = receiver.parser.read()) {
		generateMessage(jsonBuff);
	}
});

//TODO: move this to transport layer
receiver.events.on('sendSync', function(){
	var buff = (Buffer([0x04, 0x00, 0x00, 0x55], 'hex'));

  console.log('RECONFIG SYNC');
	//switch(commMode){
		//case 1: bt.write(buff); break;
		//case 2: serial.write(buff); break;
		//default: console.log('No glove connection to send sync to.'); break;
	//}
});

// generic transport events
events.on('recieved', function(buffer) {
  receiver.parser.write(buffer);
});



// ****************
// EXPOSED OBJECT
// ****************

var mhb = module.exports = function(){
	if (!(this instanceof mhb)) { return new mhb(); }
	
	this.addTransport = function(xport){
    console.log('Added a transport.');
	};

	this.sendToHost = function(buffer){
    console.log('Sending message to host from DHB.');
		receiver.parser.write(buffer);
	};

	this.build = function(messageID, uniqueID, argBuffObj) {
		return dhbBuilder(messageID, uniqueID, argBuffObj);
	};

  this.setOptions = function(optionsToSet) {
    for(var opt in optionsToSet) {
      opts[opt] = optionsToSet[opt];
    }
  };

	this.events = events;
};

