'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
// may want to subscribe to global emitter?




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
    name: 'Loopback',
    schema: {
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
          value: addr
        },
        'remoteAddress': {
          type: 'string',
          value: ''
        }
      },
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
            me.emit('lb_spawn_complement');
            me.emit('counterParty', 'connect', data);
          },
          hidden: false
        }
      },
      outputs: {
        'connected': {
          type: 'boolean',
          state: 'connected'
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
    type: 'mTransport',
    name: 'LoopbackFactory',
    schema: {
      state: {
        'listening': {
          type: 'boolean',
          value: true
        },
        'scanResult': {
          type: 'array',
          value: []
        }
      },
      inputs: {
        'scan': {
          label: "Scan",
          args: [ { label: 'Scan', type: 'boolean' } ],
          func: function(me, data) {
            setTimeout(function() {
              me.send('scanResult', me.transport1_addr);
            }, ioDelay)
          },
          hidden: false
        }
      },
      outputs: {
        'scanResult': {
          label: ['Address'],
          type: 'array',
          state: 'scanResult'
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
