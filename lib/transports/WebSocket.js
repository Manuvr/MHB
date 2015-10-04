'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var SocketIO = require('socket.io');


// sample config for transport parameters
var interface_spec = {
  schema: {
    state: {
      'name': {
        type: 'string',
        value: 'WebSocketFactory'
      },
      'listening': {
        type: 'boolean',
        value: false
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
      'listen': [
        {
          label: 'Listen',
          type: 'boolean'
        },
        {
          label: 'Address',
          type: 'string'
        },
        {
          label: 'Port',
          type: 'number'
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
        },
        {
          label: 'Port',
          type: 'number'
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
      }
    }
  },
  adjuncts: {
    "WebSocket": {
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
          'connect': [
            {
              label: 'Connect',
              type: 'boolean'
            },
            {
              label: 'Address',
              type: 'string'
            },
            {
              label: 'Port',
              type: 'number'
            }
          ]
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
    }
  }
};



// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(socket) {
  ee.call(this);

  // set scope for private methods
  var that = this;
  
  this.input = function(message) {
    if (message.target.length > 1) {
      console.log('Too many elements on target. We are the bottom.'+message.target);
    }
    else {
      var method = message.target.shift();
      switch (method) {
        case 'connect':
          that.emit('toDevice', 'connected', data);
          fromTransport('connected', data);
          break;
        case 'data':
          that.emit('toDevice', method, data);
          break;
        case 'config':
          fromTransport('config', interface_spec.adjuncts.WebSocket);
          break;
        case 'scan':
          that.emit('toDevice', method, data);
          break;
        default:
          that.log('mTransport', 'No method named ' + method + ' in fromClient().', 2);
          break;
      }
    }
  };

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
        fromTransport('config', interface_spec.adjuncts.WebSocket);
        break;
      case 'scan':
        that.emit('toDevice', method, data);
        break;
      default:
        fromTransport('log', ['Loopback wut?', 7]);
        break;
    }
  }

  if (socket) {
    socket.on('connect', 
      function() {
        var address = socket.handshake.address;
        emitOutput('remoteAddress', address.address + ':' + address.port);
        that.fromTransport('log', ['Socket connected: ' + address.address + ':' + address.port, 5]);
        that.fromTransport('connected', true);
      }
    );

    socket.on('error',
      function(err) {
        that.fromTransport('log', ['A socket.io client experienced an error: ' + err, 3]);
        that.fromTransport('connected', false);
      }
    );

    socket.on('disconnect',
      function() {
        that.fromTransport('log', ['Socket disconnected', 5]);
        that.fromTransport('connected', false);
      }
    );

    socket.on('reconnect',
      function() {
        that.fromTransport('log', ['Socket reconnected', 5]);
        that.fromTransport('connected', true);
      }
    );
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

  this.server = null;
  
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
          if (message.data.length > 0) {
            var address = message.data.shift();
            if (message.data.length > 0) {
              address += ':'+message.data.shift();
            }
            emitOutput('log', ['Attempting connection to ' + address, 6]);
            io.connect(address);
          }
          else {
            emitOutput('log', ['Unspecified address.', 2]);
          }
          break;
        case 'listen':
          // Start the socket server listening.
          if (!server) {
            var listen_port = 2319;
            if (data.length && data.hasOwnProperty('port')) {
              listen_port = data.port;
            }
            server = new SocketIO({port: listen_port});
            server.on('connection', 
              function (socket) {
                var instance = new mTransport(socket);
                var address = socket.handshake.address;
                emitOutput('log', ['New connection from ' + address.address + ':' + address.port, 7]);
                emitOutput('connected', instance);
              }
            );
            emitOutput('log', ['SocketFactory is now listening on ' + server.origins(), 5]);
          }
          else {
            if (data.length == 0) {
              server.removeEventListener('connection');
              emitOutput('log', ['SocketFactory is already listening on ' + server.origins(), 4]);
            }
            else {
              emitOutput('log', ['SocketFactory is already listening on ' + server.origins(), 4]);
            }
          }
          emitOutput('localAddress', server.origins());
          break;

        case 'config':
          emitOutput('_adjunctDef', interface_spec);
          break;
        case 'scan':
          that.emit('toDevice', message.method, message.data);
          break;
        default:
          emitOutput('log', ['SocketFactory wut?', 7]);
          break;
      }
    }
  );

  // will depend on transport library....
  // Used to get a transport instance (the thing that 
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    return new mTransport();
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

