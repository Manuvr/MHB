//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

var a = new ee();


a.on('derp', function(args) {
  readOut('derp', arguments);
})

function readOut(name, args) {
  console.log(name)
  console.log(args)
}

a.emit('derp', 'herp', 'lerp')

a.emit('derp', 'mcgerp');

a.emit('derp', 'guy');
