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

// We'll put actionable executions here based on the type
//var runTypeSwitch = function(metaObj) {

	//if( metaObj.type !== "GLOVE_MODEL") {
		//console.log("Received ", metaObj.def);
	//}
	//switch(metaObj.type) {
		//case "LEGEND_MESSAGES":
      ////console.log(metaObj.output);
			//console.log(metaObj);
			//dhbModels.commands = metaObj.output;
			//break;
		//case "GLOVE_MODEL":
			////emit the glove model
			//var temp = dhbModels.gloveModel;
			//temp.IMU_set = metaObj.output;
			//frames++;

			//events.emit('gloveModel', temp);

      //if(opts.record) {
        //utils.recordFile(temp, opts);
      //}

			//break;
		//case "IMU_TAP":
          //console.log('tap from dhb');
			//metaObj.output;
          //events.emit('IMU_TAP', metaObj.msg);
			//break;
		//case "IMU_DOUBLE_TAP":
          //console.log('double tap from dhb');
			//metaObj.output;
          //events.emit('IMU_DOUBLE_TAP', metaObj.msg);
			//break;
		//case "NO_TYPE":
			//events.emit('genericMessage', metaObj, metaObj.def);
			//console.log(metaObj);
			//break;
		//default:
			//console.log("Something ended up in the default case.  This should never happen.")
			//console.log(metaObj);
			//break;
	//}
//};


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

// bluetooth
//bt.ee.on('btListAdd', function(address, name) {
	//events.emit('btFound', address, name);
//});

//bt.ee.on('btData', function(buffer) {
	//receiver.parser.write(buffer);
//});

//bt.ee.on('connected', function(status) {
	//events.emit('btConnection', status);
	//// this reinstantiates the parser to clear the previous connections buffer
	//receiver.reset();
	//if(status === 1){
		//commMode = 1;
	//} else {
		//commMode = 0;
	//}
//});

// serial
serial.ee.on('serialData', function(buffer){
	receiver.parser.write(buffer);
});

serial.ee.on('serialList', function(list){
	events.emit('serialList', list);
});

serial.ee.on('serialConnected', function(value){
	events.emit('serialConnected', value);
	// this reinstantiates the parser to clear the previous connections buffer
	receiver.reset();
	if(value === 0){
		commMode = 0;
	} else {
		commMode = 2;
	}
});

serial.ee.on('serialError', function(error){
	// do nothing for now?  Already logging to console...
});


// wut
events.emit('testEmit');
    
// ****************
// TEST COMMANDS
// ****************


// ****************
// EXPOSED OBJECT
// ****************

var mhb = module.exports = function(){
	if (!(this instanceof mhb)) { return new mhb(); }

	//this.scanBluetooth = function(){
    //bt.scan();
	//};

	this.autoConnectSerial = function(){
		serial.scanAndConnect();
	};

	this.connectSerial = function(port){
		serial.connect(port);
	};

	this.scanSerial = function(){
		serial.getList();
	};

	this.closeSerial = function(){
		serial.close();
	};

	this.sendToGlove = function(buffer){
    console.log('SEND TO GLOVE', buffer);
		//switch(commMode){
			//case 1: bt.write(buffer); break;
			//case 2: serial.write(buffer); break;
			//default: console.log("No glove connection present to send data to."); break;
		//}
	};

	this.sendToHost = function(buffer){
    logger.debug('Sending message to host from DHB.');
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

  this.playRecording = function(file, framerate) {
    var recordingOptions = {
      file: file,
      framerate: framerate
    };
    utils.processFile(events, recordingOptions);
  };

	this.events = events;

	//this.bt = bt;
};

