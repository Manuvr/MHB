// ****************
// REQUIRES
// ****************
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();

var bt = require('./bluetooth.js')();
var dhbModels = require('./dhb-models.js');
var dhbParser = require('./dhb-parser.js');
var dhbBuilder = require('./dhb-builder.js');
var argparse = require('./dhb-argparser.js');
var exec = require('./dhb-exec.js');
var gesture = require('../capture/capture.js');
var runGestures = gesture(events);

// instantiated with pass-through requires
var dhbArgParser = new argparse(dhbModels);
var dhbExec = new exec(dhbModels, dhbArgParser);

// adding temp for logging. remove and move to helper lib
var fs = require('fs');
var util = require('util');

// ****************
// HELPER FUNCTIONS
// ****************

// reinstatiates pass-through requires when dhbModels is updated
var refreshModels = function() {
	dhbModels.outCommand = buildOutCommands(dhbModels.commands);
	dhbArgParser = new argparse(dhbModels);
	dhbExec = new exec(dhbModels, dhbArgParser);
};

// builds "outCommand" in dhbModels.
// This invrerts the key and "def", adds a "len" to the argForms and moves the contents to "data"
// in:  { "22" : { flag: 0, def: "testCommand", argForms: { "3": [6, 6, 6] } } }
// out: { "testCommand" : { command: 22, flag: 0, argForms: { "3": { len: 3, data: { [ 6, 6, 6] } } } } }
//
// Note: Eventually, I'd like to change the argForms key to a description of what the length will do. IE: set what?
var buildOutCommands = function (obj) {
	new_obj = {};
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
dhbModels.outCommand = buildOutCommands(dhbModels.commands);

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

var execute = function(jsonBuffer) {
	var metaObj = dhbExec.runIt(jsonBuffer);
	runTypeSwitch(metaObj);
	if(metaObj.refresh) {
		refreshModels()
		events.emit('outCommand', dhbModels.outCommand);
	}
};

// DELETE ME LATER!   --FPS TEST--
			var frames = 0;

			var same = 0;

			setInterval(function(){
				console.log("FPS: " + frames / 5);
				console.log("Same Frames: " + same);
				same = 0;
				frames = 0;
			}, 5000);

// We'll put actionable executions here based on the type
var runTypeSwitch = function(metaObj) {


	if( metaObj.type !== "GLOVE_MODEL") {
		console.log("Received ", metaObj.def);
	}
	switch(metaObj.type) {
		case "LEGEND_MESSAGES":
      //console.log(metaObj.output);
			console.log(metaObj);
			dhbModels.commands = metaObj.output;
			break;
		case "GLOVE_MODEL":
			//emit the glove model
			var temp = dhbModels.gloveModel;
			if(JSON.stringify(temp.IMU_set) === JSON.stringify(metaObj.output)){
				same++;
			}

			temp.IMU_set = metaObj.output;
			frames++;


			events.emit('gloveModel', temp);

            // TEMP LOG TO FILE
            // This needs to be added a generic helper lib
            // Remove require to fs above
            //fs.appendFile("outputData.txt", JSON.stringify(temp), function(err) {
            //    if(err) throw err;
            //});

			//console.log(temp);
			break;
		case "IMU_TAP":
      		console.log('tap from dhb');
			metaObj.output;
      		events.emit('IMU_TAP', metaObj.msg);
			break;
		case "IMU_DOUBLE_TAP":
      		console.log('double tap from dhb');
			metaObj.output;
      		events.emit('IMU_DOUBLE_TAP', metaObj.msg);
			break;
		case "NO_TYPE":
			events.emit('genericMessage', metaObj, metaObj.def);
			console.log(metaObj);
			break;
		default:
			console.log("Something ended up in the default case.  This should never happen.")
			console.log(metaObj);
			break;
	}
};


// ****************
// LISTENERS
// ****************

dhbParser.parser.on("readable", function() {
	var e;
	while (e = dhbParser.parser.read()) {
		execute(e);
	}
});

dhbParser.events.on('sendSync', function(){
	bt.write(Buffer([0x04, 0x00, 0x00, 0x55], 'hex'));
})

bt.ee.on("btListAdd", function(address, name) {
	events.emit('btFound', address, name);
});

bt.ee.on("btData", function(buffer) {
	dhbParser.parser.write(buffer);
});

bt.ee.on('connected', function(status) {
	events.emit('btConnection', status)
});

events.emit('testEmit');
    
// ****************
// TEST COMMANDS
// ****************

// cleared these because they represented an old model... We should build more in our testing framework and
// delete this section soon.

// ****************
// EXPOSED OBJECT
// ****************

var dhb = module.exports =  function(options){
	if (!(this instanceof dhb)) { return new dhb(); }

	// if we want options in the future, they can be in this object
	if (!options) {
		options = {};
	}

	this.scan = function(){
		bt.scan();
	};

	this.sendToGlove = function(buffer){
		bt.write(buffer);
	};

	this.sendToHost = function(buffer){
		dhbParser.parser.write(buffer);
	};

	this.build = function(messageID, uniqueID, argBuffObj) {
		return dhbBuilder(messageID, uniqueID, argBuffObj);
	};

	this.events = events;

	// should alias by reference... I'm not 100% though, so we may need the refresh script to do this
	this.models = dhbModels;

	this.bt = bt;
};
