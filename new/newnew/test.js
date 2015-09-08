//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

var merge = require('lodash.merge');


var a = {
  "hey": "im from a"
}

var b = {
  "guy": "im from b",
  "hey": "this is b-hey"
}

var derp = {
  "hey": "derp"
};
merge(derp, a, b);

console.log(derp);

console.log(a);
