// this is the master "require" js file when using this library



// requires
var dhbparser = require('dhb-parser.js');
var builder = require('dhb-builder.js');
var bt = require('bluetooth.js');

// helper functions

var DHB = module.exports = function(options){
	if (!(this instanceof DHB)) { return new DHB(); }

	if (!options) {
		options = {};
	}



}