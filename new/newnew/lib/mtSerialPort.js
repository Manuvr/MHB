'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var SerialPortStatic = require("serialport");
var SerialPort = SerialPortStatic.SerialPort;
// may want to subscribe to global emitter?


var config = {
  name: 'SerialPort',
  state: {
    'connected'      : {type: 'boolean',  value: false},
    'listening'      : {type: 'boolean',  value: true},
    'localAddress'   : {type: 'string',   value: ''}
  },
  inputs: {
    'scan':          {label:  'Scan',              type: 'none'},
    'data':          {label:  'Data',              type: 'buffer'},
    'connect':       {label:  'Connect', desc: ['Connect', 'Port', 'Mode'], type: 'array'}
  },
  outputs: {
    'connected':     {type:   'boolean',        state: 'connected'},
    'scanResult':    {label:  ['Port'],         type:  'array'},
    'localAddress':  {label:  'Local Address',  type:  'string',  state: 'localAddress'},
    'log': 'log'
  }
};




// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(port) {
  ee.call(this);

  // set scope for private methods
  var that = this;

  var device = null;

  // From local EE to Device functions
  var toTransport = function(type, data) {
    switch (type) {
      case 'connect':
        if (data.shift()) {
          var port = data.shift();
          if (port) {
            var options = data.shift();
            if (!options) {
              options = {baudrate:  115200};
            }
            that.device = new SerialPort(port, options, false);
            // TODO: Make this look better.
            device.on("open", function () {
              that.emit('fromTransport', 'connected', true);
                
              device.on('data', function(data) {
                that.fromTransport('data', data);
              });
            });
          }
        }
        else if (that.device && that.device.isOpen()) {
          // Disconnect...
          that.device.close();
        }
        else {
          // Port not open. Do nothing.
        }
        that.device.open();
        break;
      case 'data':
        that.emit('toDevice', type, data);
        that.device.write(data, function(err, results) {
          fromTransport('log', ['Error while writing to serial port: '+err, 2]);
        });
        break;
      case 'config':
        that.emit('fromTransport', 'config', config);
        break;
      case 'scan':
        SerialPortStatic.list(
          function (err, ports) {
            if (!err) {
              var port_list = [];
              ports.forEach(function(port) {
                port_list.push(port.comName);
              });
              that.emit('fromTransport', 'scanResult', port_list);
            }
            else {
              fromTransport('log', ['Failed to scan serial ports. Err: '+ err, 2]);
            }
        });
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
