// this is the master "require" js file when using this library


// requires
var dhbParser = require('./dhb-parser.js');
var dhbBuilder = require('./dhb-builder.js');
var bt = require('./bluetooth.js');
var EventEmitter = require('events').EventEmitter;

var ee = new EventEmitter();


var DHB = function(options){
	if (!(this instanceof DHB)) { return new DHB(); }

	// if we want options in the future, they can be in this object
	if (!options) {
		options = {};
	}

	// dhb options
	this.write = function(buffer) {
		dhbParser.write(buffer);
	};

	this.build = function(messageID, uniqueID, argBuffObj) {
		return dhbBuilder(messageID, uniqueID, argBuffObj);
	};

};

dhbParser.on("readable", function() {
	var e;
	while (e = parser.read()) {
		//stream or push e (which is a JSON object) to the defs parser
		console.log(e);
	}
});

ee.on("addedToBufferIn", function() {
	if(null != jsonBuffArrayIn[0]) {
		exec_in(jsonBuffArrayIn[0]);
		jsonBuffArrayIn.shift();
	}
});

// tests
dhbParser.write(Buffer([0x04, 0x00, 0x00, 0x55], 'hex'));
console.log(dhbBuilder(0x04, 0x04, undefined));

module.exports = DHB;