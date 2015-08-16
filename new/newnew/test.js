//Eventemitter scope function playground...

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;

var a = new ee();

var b = new ee();

var derp = function() {
  console.log("THIS IS DERP FROMCORE ON A");
}

var herp = function() {
  console.log("haha wut");
}

a.on('fromCore', derp)

a.on('fromCore', herp)

a.on('fromEngine', function() {
  console.log("this is fromEngine on a");
})

b.on('fromEngine', function() {
  console.log("this is fromEngine on b");
})

a.emit('fromCore');

b.emit('fromEngine');

b.parent = a;

a = b;

a.emit('fromEngine');

a.parent.emit('fromEngine');

a.parent.emit('fromCore');

a.parent.removeListener('fromCore', derp)

a.parent.emit('fromCore');
