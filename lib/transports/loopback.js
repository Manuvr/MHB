'use strict'

// Template for transports (bluetooth, serial, loopback, TCP/IP)
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
// may want to subscribe to global emitter?


var interface_spec = {
  schema: {
    state: {
      'name': {
        type: 'string',
        value: 'LoopbackFactory'
      },
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
      'scan': [
        {
          label: 'Scan',
          type: 'boolean'
        }
      ],
      'connect': [
        {
          label: 'Connect',
          type: 'boolean'
        },
        {
          label: 'Address',
          type: 'string'
        }
      ]
    },
    outputs: {
      'connected': {
        type: 'object',
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
  },
  adjuncts: {
    "Loopback": {
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
            label: 'Data',
            type: 'buffer'
          },
          'connect': {
            label: 'Connect',
            desc: ['Connect', 'Address'],
            type: 'array'
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
          },
          'log': 'log'
        }
      }
    }
  }
};




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
        fromTransport('connected', data);
        break;
      case 'data':
        that.emit('toDevice', method, data);
        break;
      case 'config':
        fromTransport('config', interface_spec.members.transport);
        break;
      case 'scan':
        that.emit('toDevice', method, data);
        break;
      default:
        fromTransport('log', ['Loopback wut?', 7]);
        break;
    }
  }

  // from device to local EE functions
  var fromTransport = function(method, args) {
    var message = {
      target:  [method],
      data:    args
    };
    
    that.emit('fromTransport', message);
  }

  // from local EE
  this.on('toTransport', toTransport);


  this.on('fromDevice', function(method, data) {
    fromTransport(method, data);
  });

  // will depend on transport library....
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
  var transport0_addr = Math.random().toString();
  var transport1_addr = Math.random().toString();
  
  var ioDelay = 5;
  this.transport0.on('toDevice', function(message) {
    // for faking I/O delay
    setTimeout(function() {
      switch (method) {
        case 'scan':
          // This is an oddity specific to a loopback.
          that.transport1.emit('fromDevice', 'scanResult', [
            transport0_addr
          ]);
          break;
        default:
          that.transport1.emit('fromDevice', method, data);
          break;
      }
    }, ioDelay)
  });

  this.transport1.on('toDevice', function(method, data) {
    setTimeout(function() {
      switch (method) {
        case 'scan':
          // This is an oddity specific to a loopback.
          that.transport0.emit('fromDevice', 'scanResult', [
            transport1_addr
          ]);
          break;
        default:
          that.transport0.emit('fromDevice', method, data);
          break;
      }
    }, ioDelay)
  });


  // We update our attached session with our local address...
  //this.transport0.emit('fromTransport', 'localAddress', transport0_addr);
  //this.transport1.emit('fromTransport', 'localAddress', transport1_addr);


  // from device to local EE functions
  var emitOutput = function(method, args) {
    var message = {
      target: [method],
      data:   args
    };
    that.emit('output', message);
  }

  // from local EE
  this.on('input', 
    function(message) {
      if (message.target.length != 1) {
        // This is the bottom. If we have more than 1 element in the target array, we fail.
        emitOutput('log', ['Too many targets! Doing nothing...', 7]);
        return;
      }
      
      switch (message.target[0]) {
        case 'connect':
          // Need to braodcast the other half of the transport
          emitOutput('connected', this.transport0);
          emitOutput('connected', this.transport1);
          break;
        case 'config':
          emitOutput('_adjunctDef', interface_spec);
          break;
        case 'scan':
          that.emit('toDevice', message.method, message.data);
          break;
        default:
          emitOutput('log', ['LoopbackFactory wut?', 7]);
          break;
      }
    }
  );

  // will depend on transport library....
  // Used to get a transport instance (the thing that 
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    return this.transport0;
  };
};

inherits(mTransport, ee);
inherits(mTransportFactory, ee);

module.exports = {
  init: function() {
    return new mTransportFactory();
  },
  IFSpec: interface_spec
}; 

