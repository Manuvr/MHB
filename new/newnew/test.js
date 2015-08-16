//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

var a = {
  b: "c",
  d: "q"
}

console.log(a);

var derp = function(obj) {
  delete obj.b;
  obj.d = "f";
}
derp(a);

console.log(a);
