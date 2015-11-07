'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');

var SerialPortStatic = require("serialport");
var SerialPort = SerialPortStatic.SerialPort;

//// EXPOSED OBJECT / CONSTRUCTOR
//function mTransport(port) {
//  ee.call(this);
//
//  // set scope for private methods
//  var that = this;
//
//  var device = null;
//
//  // From local EE to Device functions
//  var toTransport = function(method, data) {
//    switch (method) {
//      case 'connect':
//        if (data.shift()) {
//          var port = data.shift();
//          if (port) {
//            var options = data.shift();
//            if (!options) {
//              options = {baudrate:  115200};
//            }
//            that.device = new SerialPort(port, options, false);
//            // TODO: Make this look better.
//            device.on("open", function () {
//              that.emit('fromTransport', 'connected', true);
//
//              device.on('data', function(data) {
//                that.fromTransport('data', data);
//              });
//            });
//          }
//        }
//        else if (that.device && that.device.isOpen()) {
//          // Disconnect...
//          that.device.close();
//        }
//        else {
//          // Port not open. Do nothing.
//        }
//        that.device.open();
//        break;
//      case 'scan':
//    }
//  }
//};


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(addr, params) {
  ee.call(this);

  // set scope for private methods
  var that = this;
  var _port = new SerialPort(addr, params, false);

  this.interface_spec = {
    type: 'mTransport',
    name: 'SerialPort',
    schema: {
      inputs: {
        'data': {
          label: "Data",
          args: [ { label: 'Data', type: 'buffer' }],
          func: function(me, data) {
            if (_port) _port.write(data);
          },
          hidden: false
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' }, { label: 'Address', type: 'string' } ],
          func: function(me, data) {
            _port.open();
          },
          hidden: false
        }
      },
      outputs: {
        'connected': {
          type: 'boolean',
          value: false
        },
        'listening': {
          type: 'boolean',
          value: false
        },
        'localAddress': {
          label: 'Port',
          type: 'string',
          value: ''
        },
        'portConfig': {
          label: 'Port Config',
          type: 'string',
          value: ''
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
};


// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
  };

  this.interface_spec = {
    type: 'mTransport',
    name: 'SerialPortFactory',
    schema: {
      inputs: {
        'scan': {
          label: "Scan",
          args: [ { label: 'Scan', type: 'boolean' } ],
          func: function(me, data) {
            // List the serial ports on the system.
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
          },
          hidden: false
        }
      },
      outputs: {
        'scanResult': {
          label: ['Address'],
          type: 'array',
          value: []
        },
        'connected': {
          // NOTE: Unlink the instance 'connected', the factory returns the instanced
          //         transport as it's data. Also... no state.
          label: 'Instanced Transport',
          type: 'object',
          value: false
        }
      }
    },
    adjuncts: {
    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);
};

inherits(mTransport, ee);
inherits(mTransportFactory, ee);

module.exports = {
  init: function() {
    return new mTransportFactory();
  }
};
