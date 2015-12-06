'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');



// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(addr) {
  ee.call(this);

  // set scope for private methods
  var that = this;

  var connect_state = false;

  // From local EE to Device functions
  this.toTransport = function(method, data) {
    switch (method) {
      case 'connect':
        if (data !== connect_state) {
          that.emit('counterParty', 'connect', data);
          connect_state = data;
          that.send('connected', connect_state);
        }
        that.send('log', {
          body:      'Transport '+(connect_state ? 'received' : 'lost')+' a connection.',
          verbosity: 6
        });
        break;
      case 'data':
        that.send('log', {
          body:      'Transport received data: '+ JSON.stringify(data),
          verbosity: 7
        });
      default:
        that.send(method, data);
        break;
    }
  }


  this.interface_spec = {
    type: 'mTransport',
    name: 'Loopback',
    schema: {
      inputs: {
        'data': {
          label: "Data",
          args: [ { label: 'Data', type: 'buffer' }],
          func: function(me, data) {
            me.emit('counterParty', 'data', data);
          },
          hidden: false
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' }, { label: 'Address', type: 'string' } ],
          func: function(me, data) {
            if (connect_state != data[0]) {
              if (data[0]) {
                me.emit('lb_spawn_complement');
              }
              me.emit('counterParty', 'connect', data[0]);
            }
          },
          hidden: false
        }
      },
      outputs: {
        'connected': {
          type: 'boolean',
          state: 'connected',
          value: connect_state
        },
        'localAddress': {
          label: 'Local Address',
          type: 'string',
          value: addr
        },
        'remoteAddress': {
          label: 'Remote Address',
          type: 'string',
          value: ''
        },
        'listening': {
          label: 'Listening',
          type: 'boolean',
          value: true
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

  var cp_addr = Math.random().toString();

  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    var nu_loop = new mTransport(Math.random().toString());

    nu_loop.once('lb_spawn_complement',
      function() {
        var cp_loop = new mTransport(cp_addr);
        cp_loop.interface_spec.schema.outputs.remoteAddress.value = nu_loop.interface_spec.schema.outputs.localAddress.value;
        nu_loop.interface_spec.schema.outputs.remoteAddress.value = cp_addr;
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
    name: 'LoopbackFactory',
    schema: {
      inputs: {
        'scan': {
          label: "Scan",
          args: [ { label: 'Scan', type: 'boolean' } ],
          func: function(me, data) {
            setTimeout(function() {
              me.send('scanResult', cp_addr);
            }, ioDelay)
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
        'listening': {
          label: 'Listening',
          type: 'boolean',
          value: true
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
