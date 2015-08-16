'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

// sample config for transport parameters
var config = {
  state: {
    'connected': 'boolean',
    'listening': 'boolean',
    'address': 'string'
  },
  inputs: {
    'scan': 'button',
    'data': 'buffer',
    'address': 'string',
    'connect': 'button',
    'disconnect': 'button',
    'getConfig':  'button'
  },
  outputs: {
    'connect': 'action',
    'disconnect': 'action',
    'scanResult': 'string',
    'log': 'log'
  }
};


/**
* Constructs an entangled pair of transports that constitute a cross-over cable.
*/
function pairConstructor() {
  this.transport0 = new mTransport();
  this.transport1 = new mTransport();
  
  var that = this;
  
  this.transport0.on('toDevice', function(type, data) {
    that.transport1.emit('fromDevice', type, data);
  }
  this.transport1.on('toDevice', function(type, data) {
    that.transport0.emit('fromDevice', type, data);
  }
}


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  this.address = Math.random();

  // from local EE
  this.on('toTransport', toTransport);


  this.on('fromDevice', function(type, data) {
    that.fromTransport(type, data);
  });

  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'data':
        that.emit('toDevice', type, data);
        break;
      default:
        console.log('loopback wut? ' + data);
        break;
    }
  }

  // from device to local EE functions
  var fromTransport = function(type, args) {
      switch (type) {
        case 'data':
          that.emit('fromTransport', 'data', args);
          break;
        default:
          console.log('No condition for this emit: ' + args);
          break;
      }
    }
    // will depend on transport library....
};

inherits(mTransport, ee);

module.exports = pairConstructor;
