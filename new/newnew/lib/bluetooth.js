'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

//require device library
var bt = require('bluetooth-serial-port');

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
    'getConfig': 'button'
  },
  outputs: {
    'connect': 'action',
    'disconnect': 'action',
    'scanResult': 'string',
    'log': 'log'
  }
  // etc
};

// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  this.connAddress = "";

  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        that.device.findSerialPortChannel(address, function(channel) {
          btSerial.connect(address, channel, function() {
            //connected
          }, function() {
            //failed, but channel acquired
          });
        }, function() {
          //failed, and no channel acquired
        });
        break;
      case 'data':
        that.device.write(data, function(err, bytesWritten) {
          if (err) console.log(err);
        });
        break;
      case 'scan':
        that.device.inquire();
        break;
      case 'disconnect':
        that.device.close();
        break;
      case 'address':
        that.address = data;
      default:
        console.log('wut? ' + data);
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
          that.emit('fromTransport', 'scanResult', [args[0], args[1]])
          break;
        default:
          console.log('No condition for this emit: ' + args);
          break;
      }
    }
    // will depend on transport library....

  // LISTENERS
  // from local EE
  this.on('toTransport', toTransport);

  // from device
  this.device = new bt.BluetoothSerialPort();

  this.device.on('data', function() {
    that.fromTransport('data', arguments[0])
  });
  this.device.on('found', function() {
    that.fromTransport('found', [arguments[0], arguments[1]])
  });
  this.device.on('closed', function() {
    that.fromTransport('closed', arguments[0])
  })

};

inherits(mTransport, ee);

module.exports = mTransport;
