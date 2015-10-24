'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
// may want to subscribe to global emitter?




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
        that.send('connected', data);
        break;
      case 'data':
        that.emit('toDevice', method, data);
        break;
      case 'config':
        that.send('config', interface_spec.adjuncts.Loopback);
        break;
      case 'scan':
        that.emit('toDevice', method, data);
        break;
      default:
        that.send('log', ['Loopback wut?', 7]);
        break;
    }
  }

  // from local EE
  this.on('toTransport', toTransport);


  this.on('fromDevice', function(method, data) {
    that.send(method, data);
  });

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
          value: ''
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
            me.emit('toDevice', 'data', data);
          },
          hidden: false
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' }, { label: 'Address', type: 'string' } ],
          func: function(me, data) {
            me.emit('toDevice', 'connect', data);
            me.send(['connected'], data);   // TODO: Should wait to get the signal...
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




// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;


  /*
   * Constructs an entangled pair of transport instances that constitute a cross-over cable.
   * This is an oddity specific to a loopback. Normal transports don't need
   *   anything like this because they are not creating both sides of the link.
   */
  this.transport0 = new mTransport();
  this.transport1 = new mTransport();

  // Give each transport some mock address.
  this.transport0_addr = Math.random().toString();
  this.transport1_addr = Math.random().toString();

  var ioDelay = 5;
  this.transport0.on('toDevice', function(method, data) {
    // for faking I/O delay
    setTimeout(function() {
          that.transport1.emit('fromDevice', method, data);
    }, ioDelay)
  });

  this.transport1.on('toDevice', function(method, data) {
    setTimeout(function() {
          that.transport0.emit('fromDevice', method, data);
    }, ioDelay)
  });


  // We update our attached session with our local address...
  //this.transport0.send('localAddress', transport0_addr);
  //this.transport1.send('localAddress', transport1_addr);


  //// from local EE
  //this.on('input',
  //  function(message) {
  //    switch (message.target[0]) {
  //      case 'config':
  //        emitOutput('_adjunctDef', interface_spec);
  //        break;
  //      default:
  //        emitOutput('log', ['LoopbackFactory wut?', 7]);
  //        break;
  //    }
  //  }
  //);

  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    var temp = this.transport0
    that.mH.removeAdjunctListener('loop0') // this is sort of a hack for now...
    return temp;
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
        'localAddress': {
          type: 'string',
          value: ''
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
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' }, { label: 'Address', type: 'string' } ],
          func: function(me, data) {

            me.mH.addAdjunct('loop1', me.transport1);
          },
          hidden: false
        }
      },
      outputs: {
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
        }
      }
    },
    adjuncts: {
    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct('loop0', that.transport0);
};

inherits(mTransport, ee);
inherits(mTransportFactory, ee);

module.exports = {
  init: function() {
    return new mTransportFactory();
  }
};
