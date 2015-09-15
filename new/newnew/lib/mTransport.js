'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?


//require device library
//

// sample config for transport parameters
var config = {
  describe: {
    'mtu': 1000000,
    'pVersion': "0.0.1",
    'identity': "Digitabulum",
    'fVersion': '1.5.4',
    'hVersion': '0',
    'extDetail': ''
  },
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
      desc: ['Connect'],
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

  this.connAddress = "";

  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        //that.device.(imperative connection fxn call)
        break;
      case 'data':
        //that.device.write(data, function(err, bytesWritten) {
        //  if (err) console.log(err);
        //});
        break;
      case 'scan':
        //that.device.(discovery fxn);
        break;
      case 'disconnect':
        //that.device.close();
        break;
      case 'address':
        that.address = data;
      default:
        fromTransport('log', ['toTransport wut?', 7]);
        break;
    }
  }

  // from device to local EE functions
  var fromTransport = function(type, args) {
    switch (type) {
      case 'data':
        that.emit('fromTransport', 'data', args);
        break;
      case 'closed':
        that.emit('fromTransport', 'disconnect')
        break;
      case 'found':
        that.emit('fromTransport', 'scanResult', [args[0]])
        break;
      case 'log':
      default:
        that.emit('fromTransport', type, args);
        break;
    }
  }

  // from local EE
  this.on('toTransport', toTransport);

  // from device
  //this.device = new UnderlyingDeviceLibrary();

  this.device.on('data', function() {
    that.fromTransport('data', arguments[0])
  });
  this.device.on('found', function() {
    that.fromTransport('found', [arguments[0]])
  });
  this.device.on('closed', function() {
    that.fromTransport('closed', arguments[0])
  })

  // From local EE to Device functions

  // will depend on transport library....
};

inherits(mTransport, ee);

module.exports = mTransport;
