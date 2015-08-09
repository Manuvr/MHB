'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

var bt = require('bluetooth-serial-port');

// sample config for transport parameters
var config = {
  address: null,
  port: null
    // etc
};

// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  var that = this;
  this.transport = new bt(); // will change base on transport
  this.init();

  var toTransport = function(buffer) {
    that.transport = 'x';
  }

  var fromTransport = function(buffer) {
    that.emit('fromTransport', buffer)
  }

  // will depend on transport library....
  this.transport.on('fromTransport', fromTransport);
  this.on('toTransport', toTransport);
};

util.inherits(mTransport, ee);

mTransport.prototype.init = function() {

};

mTransport.prototype.send = function(buffer) {

};

mTransport.prototype.getConfig = function(message) {
  // TBD... This involves message definitions for specific module emits
  return config;
}
