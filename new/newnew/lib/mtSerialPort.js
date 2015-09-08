'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var SerialPort = require("serialport").SerialPort
// may want to subscribe to global emitter?


var config = {
  name: 'SerialPort',
  state: {
    'connected'      : {type: 'boolean',  value: false},
    'listening'      : {type: 'boolean',  value: true},
    'localAddress'   : {type: 'string',   value: ''}
  },
  inputs: {
    'data':          {label:  'Data',              type: 'buffer'},
    'connect':       {label:  'Connect', desc: ['Connect', 'Mode'], type: 'array'}
  },
  outputs: {
    'connected':     {type:   'boolean',        state: 'connected'},
    'localAddress':  {label:  'Local Address',  type:  'string',  state: 'localAddress'},
    'log': 'log'
  }
};




// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(port) {
  ee.call(this);

  // set scope for private methods
  var that = this;

  var device = new SerialPort(port, {}, false);

  serialPort.on("open", function () {
    that.emit('fromTransport', 'connected', true);
      
    device.on('data', function(data) {
      that.fromTransport('data', data);
    });
  });
  
  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        that.emit('toDevice', 'connected', data);
        that.device = 
        break;
      case 'data':
        that.emit('toDevice', type, data);
        serialPort.write("ls\n", function(err, results) {
          fromTransport('log', ['Error while writing to serial port: '+err, 2]);
        });
        break;
      case 'config':
        that.emit('fromTransport', 'config', config);
        break;
      default:
        fromTransport('log', ['SerialPort wut?', 7]);
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
};

inherits(mTransport, ee);


module.exports = mTransport;
