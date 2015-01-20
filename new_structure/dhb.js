// this is the master "require" js file when using this library


// requires
var dhbparser = require('dhb-parser.js');
var builder = require('dhb-builder.js');
var bt = require('bluetooth.js');

// helper functions

var DHB = module.exports = function(options){
	if (!(this instanceof DHB)) { return new DHB(); }

	// if we want options in the future, they can be in this object
	if (!options) {
		options = {};
	}


}

dbhparser.parser.on("readable", function() {
	var e;
	while (e = parser.read()) {
		//stream or push e (which is a JSON object) to the defs parser
	}
});

dhbparser.write()