'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

// sample config for transport parameters
var config = {
  name: 'Loopback',
  state: {
    'connected': {
      type: 'boolean',
      value: false
    },
    'listening': {
      type: 'boolean',
      value: true
    },
    'localAddress': {
      type: 'string',
      value: ''
    },
    'remoteAddress': {
      type: 'string',
      value: ''
    }
  },
  inputs: {
    'scan': {
      label: 'Scan',
      type: 'none'
    },
    'data': {
      label: 'Data',
      type: 'buffer'
    },
    'connect': {
      label: 'Connect',
      desc: ['Connect', 'Address'],
      type: 'array'
    }
  },
  outputs: {
    'connected': {
      type: 'boolean',
      state: 'connected'
    },
    'scanResult': {
      label: ['Address'],
      type: 'array'
    },
    'localAddress': {
      label: 'Local Address',
      type: 'string',
      state: 'localAddress'
    },
    'remoteAddress': {
      label: 'Remote Address',
      type: 'string',
      state: 'remoteAddress'
    },
    'log': 'log'
  }
};


/**
 * Constructs an entangled pair of transports that constitute a cross-over cable.
 * This method is an oddity specific to a loopback. Normal transports don't need
 *   a method like this because they are not creating both sides of the link.
 */
function pairConstructor() {
  this.transport0 = new mTransport();
  this.transport1 = new mTransport();

  var that = this;

  var transport0_addr = Math.random().toString();
  var transport1_addr = Math.random().toString();

  this.transport0.on('toDevice', function(type, data) {
    switch (type) {
      case 'scan':
        // This is an oddity specific to a loopback.
        that.transport1.emit('fromDevice', 'scanResult', [transport0_addr]);
        break;
      default:
        that.transport1.emit('fromDevice', type, data);
        break;
    }
  });

  this.transport1.on('toDevice', function(type, data) {
    switch (type) {
      case 'scan':
        // This is an oddity specific to a loopback.
        that.transport0.emit('fromDevice', 'scanResult', [transport1_addr]);
        break;
      default:
        that.transport0.emit('fromDevice', type, data);
        break;
    }
  });


  // We update our attached session with our local address...
  this.transport0.emit('fromTransport', 'localAddress', transport0_addr);
  this.transport1.emit('fromTransport', 'localAddress', transport1_addr);

  //this.transport0.emit('fromTransport', 'connected', true);
  //this.transport1.emit('fromTransport', 'connected', true);
}



// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        that.emit('toDevice', 'connected', data);
        fromTransport('connected', data);
        break;
      case 'data':
        that.emit('toDevice', type, data);
        break;
      case 'config':
        that.emit('fromTransport', 'config', config);
        break;
      case 'scan':
        that.emit('toDevice', type, data);
        break;
      default:
        fromTransport('log', ['Loopback wut?', 7]);
        break;
    }
  }

  // from device to local EE functions
  var fromTransport = function(type, args) {
    switch (type) {
      case 'connected':
        that.emit('fromTransport', 'connected', args);
        break;
      case 'data':
        that.emit('fromTransport', 'data', args);
        break;
      case 'log':
      default:
        that.emit('fromTransport', type, args);
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


module.exports = pairConstructor;
