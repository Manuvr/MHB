//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

function derp() {
  ee.call(this);
  this.a = 'b';
  var that = this;
  var test = function(arg) {
    that.a = arg;
    console.log('inner voices:' + that.a);
  }
  this.on('herp', test);
};

inherits(derp, ee);

derp.prototype.init = function(value) {
  this.a = value;
  console.log(this.a)
}

var lerp = new derp();

lerp.emit('herp', 'wut');

lerp.on('herp', function(arg) {
  console.log('first: ' + arg);
})

console.log('second: ' + lerp.a);
