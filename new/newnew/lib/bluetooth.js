'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?

//require device library
var bt = require('bluetooth-serial-port');

// sample config for transport parameters
var config = {
  name: 'Bluetooth',
  state: {
    'connected'      : {type: 'boolean',  value: false},
    'listening'      : {type: 'boolean',  value: false},
    'localAddress'   : {type: 'string',   value: ''},
    'remoteAddress'  : {type: 'string',   value: ''}
  },
  inputs: {
    'scan':          {label:  'Scan',                           type: 'none'},
    'data':          {label:  'Data',                           type: 'buffer'},
    'connect':       {label:  'Connect', desc: ['Connect', 'MAC', 'Name'], type: 'array'}
  },
  outputs: {
    'connected':     {type:   'boolean',          state: 'connected'},
    'scanResult':    {label:  ['MAC','Name'],     type:  'array'},
    'localAddress':  {label:  'Local Address',    type:  'string',  state: 'localAddress'},
    'remoteAddress': {label:  'Remote Address',   type:  'string',  state: 'remoteAddress'},
    'log': 'log'
  }
  // etc
};

// EXPOSED OBJECT / CONSTRUCTOR
function mTransport() {
  ee.call(this);

  // set scope for private methods
  var that = this;
  
  // We update our attached session with our local address...
  this.transport1.emit('fromTransport', 'localAddress', 'BlueToothAdapter');

  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        if (data.shift()) {
          var mac_address = data.shift();
          that.device.findSerialPortChannel(mac_address, function(channel) {
            btSerial.connect(mac_address, channel, function() {
              //connected
              that.emit('fromTransport', 'connected', true);
              that.emit('fromTransport', 'remoteAddress', mac_address.toString()+ ' ' + channel);
            }, function() {
              //failed, but channel acquired
              that.emit('fromTransport', 'connected', false);
            });
          }, function() {
            //failed, and no channel acquired
            that.emit('fromTransport', 'connected', false);
          });
        }
        else {
          // False means we disconnect.
          that.device.close();
        }
        break;
      case 'data':
        that.device.write(data, function(err, bytesWritten) {
          if (err) fromTransport('log', [err, 2]);
        });
        break;
      case 'config':
        that.emit('fromTransport', 'config', config);
        break;
      case 'scan':
        that.device.inquire();
        break;
      default:
        fromTransport('log', ['Bluetooth wut?', 7]);
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
        that.emit('fromTransport', 'connected', false)
        break;
      case 'found':
        that.emit('fromTransport', 'scanResult', [args[0], args[1]])
        break;
      case 'log':
      default:
        that.emit('fromTransport', type, args);
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
