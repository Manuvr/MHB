//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

function wut() {
  console.log(this.a)
};


function derp() {
  var a = "guy"
  wut.bind(this)()
}

derp();
