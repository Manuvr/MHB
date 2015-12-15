'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
var bt = require('bluetooth-serial-port');


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(addr) {
  ee.call(this);

  // set scope for private methods
  var that = this;

  this.device = new bt.BluetoothSerialPort();

  // From local EE to Device functions
  this.toTransport = function(method, data) {
    switch (method) {
      case 'connect':
        if (data !== connect_state) {
          that.device = new bt.BluetoothSerialPort();
          connect_state = data;
          that.send('connected', data);
        }
        break;
      case 'data':
        that.send('log', ['Transport received data: '+data.toString(), 6]);
      default:
        that.send(method, data);
        break;
    }
  }

  this.interface_spec = {
    type: 'mTransport',
    name: 'BluetoothSerial',
    schema: {
      inputs: {
        'data': {
          label: "Data",
          args: [ { label: 'Data', type: 'buffer' }],
          func: function(me, data) {
            that.device.write(data, function(err, bytesWritten) {
              if (err) me.send('log', [err, 2]);
            });
          },
          hidden: false
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' },
                  { label: 'Address', type: 'string' } ],
          func: function(me, data) {
            me.emit('lb_spawn_complement');
            me.emit('counterParty', 'connect', data);
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
          value: true
        },
        'localAddress': {
          label: 'Local Address',
          type: 'string',
          value: ''
        },
        'remoteAddress': {
          label: 'Remote Address',
          type: 'string',
          value: ''
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
};

var ioDelay = 5;

// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    var nu_loop = new mTransport(Math.random().toString());

    nu_loop.once('lb_spawn_complement',
      function() {
        var cp_addr = Math.random().toString();
        var cp_loop = new mTransport(cp_addr);
        cp_loop.interface_spec.schema.state.remoteAddress.value = nu_loop.interface_spec.schema.state.localAddress.value;
        nu_loop.interface_spec.schema.state.remoteAddress.value = cp_addr;
        nu_loop.send('remoteAddress', cp_addr);

        /*
         * Constructs an entangled pair of transport instances that constitute a cross-over cable.
         * This is an oddity specific to a loopback. Normal transports don't need
         *   anything like this because they are not creating both sides of the link.
         */

        cp_loop.on('counterParty', function(method, data) {
          setTimeout(function() {   // for faking I/O delay
            nu_loop.toTransport(method, data);
          }, ioDelay)
        });

        nu_loop.on('counterParty', function(method, data) {
          setTimeout(function() {   // for faking I/O delay
            cp_loop.toTransport(method, data);
          }, ioDelay)
        });

        that.send('connected', cp_loop);
      }
    );

    return nu_loop;
  };

  this.interface_spec = {
    type: 'mTransportFactory',
    name: 'BluetoothSerialFactory',
    schema: {
      inputs: {
        'scan': {
          label: "Scan",
          args: [ { label: 'Scan', type: 'boolean' } ],
          func: function(me, data) {
            that.device.inquire();
          },
          hidden: false
        },
        'connect' : {
          label: "Connect",
          args: [ { label: 'Remote Address', type: 'string' },
                  { label: 'Port', type: 'number' } ],
          func: function(me, data) {
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
          },
          hidden: false
        },
        'listen' : {
          label: "Listen",
          args: [ { label: 'Listen', type: 'boolean' },
                  { label: 'Local Address', type: 'string' },
                  { label: 'Port', type: 'number' } ],
          func: function(me, data) {
          },
          hidden: false
        }
      },
      outputs: {
        'listening': {
          type: 'boolean',
          value: true
        },
        'scanResult': {
          label: ['Address'],
          type: 'array',
          value: []
        },
        'connected': {
          // NOTE: Unlink the instance 'connected', the factory returns the instanced
          //         transport as it's data. Also... no state.
          label: 'Instanced Transport',
          type: 'object'
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
