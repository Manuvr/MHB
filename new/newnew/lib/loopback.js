'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

// sample config for transport parameters
var config = {
  name: 'Loopback',
  state: {
    'connected': {type: 'boolean',   value: false},
    'listening': {type: 'boolean',   value: false},
    'address':   {type: 'string',    value: ''}
  },
  inputs: {
    'scan': 'button',
    'data': 'buffer',
    'address': 'string',
    'connect': 'button',
    'disconnect': 'button',
    'getConfig': 'button'
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
  })
  this.transport1.on('toDevice', function(type, data) {
    that.transport0.emit('fromDevice', type, data);
  })
  
  this.transport0.config.state.connected.value = true;
  this.transport1.config.state.connected.value = true;
  this.transport0.emit('fromTransport', 'connected', true);
  this.transport1.emit('fromTransport', 'connected', true);
}


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  this.config  = JSON.parse(JSON.stringify(config));
  this.config.state.address.value = Math.random().toString();

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

  // from local EE
  this.on('toTransport', toTransport);


  this.on('fromDevice', function(type, data) {
    fromTransport(type, data);
  });

  // will depend on transport library....
};

inherits(mTransport, ee);

/* Is this transport listening for conections? */
mTransport.prototype.isListening = function(optional) {
  return this.config.state.listening.value;
}

/* Is this transport connected to something? */
mTransport.prototype.isConnected = function() {
  return this.config.state.connected.value;
}

/* Is this transport connected to something? */
mTransport.prototype.getName = function() {
  return this.config.name;
}


mTransport.prototype.getConfig = function() {
  return config;
}

module.exports = pairConstructor;
