'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

// sample config for transport parameters
var config = {
  name: 'IP Socket',
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



// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  // From local EE to Device functions
  var toTransport = function(method, data) {
    switch (method) {
      case 'connect':
        that.emit('toDevice', 'connected', data);
        fromTransport('connected', data);
        break;
      case 'data':
        that.emit('toDevice', method, data);
        break;
      case 'config':
        that.emit('fromTransport', 'config', config);
        break;
      case 'scan':
        that.emit('toDevice', method, data);
        break;
      default:
        fromTransport('log', ['Loopback wut?', 7]);
        break;
    }
  }

  // from device to local EE functions
  var fromTransport = function(method, args) {
    switch (method) {
      case 'connected':
        that.emit('fromTransport', 'connected', args);
        break;
      case 'data':
        that.emit('fromTransport', 'data', args);
        break;
      case 'log':
      default:
        that.emit('fromTransport', method, args);
        break;
    }
  }

  // from local EE
  this.on('toTransport', toTransport);


  this.on('fromDevice', function(method, data) {
    fromTransport(method, data);
  });

  // will depend on transport library....
};

inherits(mTransport, ee);


module.exports = mTransport;