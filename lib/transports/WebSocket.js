'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var Server = require('socket.io');
var Client = require('socket.io-client');
var messageHandler = require('../messageHandler.js');

var DEFAULT_PORT = 2319;


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(socket) {
  ee.call(this);

  // set scope for private methods
  var that = this;
  var connect_state = false;
  var _sock = (socket) ? socket : false;
  var _addr = '';
  var _port = DEFAULT_PORT;

  if (_sock) {
    _sock.on('connect', 
      function() {
        var address = socket.handshake.address;
        that.send('remoteAddress', address.address + ':' + address.port);
        that.send('log', ['Socket connected: ' + address.address + ':' + address.port, 5]);
        that.send('connected', true);
      }
    );

    _sock.on('error',
      function(err) {
        that.send('log', ['A socket.io client experienced an error: ' + err, 3]);
        that.send('connected', false);
      }
    );

    _sock.on('disconnect',
      function() {
        that.send('log', ['Socket disconnected', 5]);
        that.send('connected', false);
      }
    );

    _sock.on('reconnect',
      function() {
        that.send('log', ['Socket reconnected', 5]);
        that.send('connected', true);
      }
    );

    _sock.on('data',
      function(dat) {
        that.send('data', dat);
      }
    );
    
    var address = socket.handshake.address;
    _addr = address.address;
    _port = address.port;
  }
  
  this.disconnect = function() {
    _sock.disconnect();
  }

  this.transmit = function(dat) {
    _sock.emit('data', dat);
  }


  this.interface_spec = {
    type: 'mTransport',
    name: 'Websocket',
    schema: {
      state: {
        'connected': {
          type: 'boolean',
          value: false
        },
        'data': {
          type: 'string',
          value: ''
        },
        'port': {
          type: 'number',
          value: _port
        },
        'localAddress': {
          type: 'string',
          value: _addr
        },
        'remoteAddress': {
          type: 'string',
          value: ''
        }
      },
      inputs: {
        'disconnect': {
          label: "Disconnect",
          args: [ ],
          func: function(me, data) {
            me.disconnect();
          },
          hidden: false
        },
        'data': {
          label: "Send Data",
          args: [ { label: 'Data', type: 'string' }],
          func: function(me, data) {
            me.transmit(data);
          },
          hidden: false
        }
      },
      outputs: {
        'connected': {
          type: 'boolean',
          state: 'connected'
        },
        'data': {
          label: 'Received data',
          type: 'string',
          state: 'data'
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

  this.server = null;

  // will depend on transport library....
  // Used to get a transport instance (the thing that 
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    return new mTransport();
  };


  this.interface_spec = {
    type: 'mTransport',
    name: 'WebSocketFactory',
    schema: {
      state: {
        'listening': {
          type: 'boolean',
          value: false
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
          },
          hidden: false
        },
        'connect' : {
          label: "Connect",
          args: [ { label: 'Remote Address', type: 'string' },
                  { label: 'Port', type: 'number' } ],
          func: function(me, data) {
            if (data.length > 0) {
              var address = data.shift() + ':';
              address += (data.length > 0) ? data.shift() : DEFAULT_PORT;
              me.send('log', ['Attempting connection to ' + address, 6]);
              var nu_inst = new Client(address);
              nu_inst.once('connect', 
                function () {
                  var instance = new mTransport(nu_inst);
                  me.send('connected', instance);
                }
              );
            }
            else {
              me.send('log', ['Unspecified address.', 2]);
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
            if (data.length === 0) {
              me.send('log', ['Insufficient parameter count.', 3]);
              return;
            }
            var d_state = data.shift();
            
            if (me.server && !d_state) {
              // Server is running and ought not be.
              me.server.close();
              me.server.removeEventListener('connection');
              me.send('listening', false);
              me.send('localAddress', me.server.origins());
            }
            else if (d_state) {
              // Start the server listening.
              if (!me.server) {
                var listen_addr = (data.length) ? data.shift() : '*';
                var listen_port = (data.length) ? data.shift() : DEFAULT_PORT;
  
                me.server = new Server();
                me.server.listen(listen_port);
                me.server.on('connection', 
                  function (socket) {
                    var instance = new mTransport(socket);
                    var address = socket.handshake.address;
                    me.send('log', ['New connection from ' + address.address + ':' + address.port, 7]);
                    me.send('connected', instance);
                  }
                );
                me.send('listening', true);
                me.send('localAddress', me.server.origins());
              }
              else {
                me.send('log', ['SocketFactory is already listening on ' + me.server.origins(), 5]);
              }
            }
            else {
              me.send('log', ['SocketFactory is not listening.', 6]);
            }
          },
          hidden: false
        }
      },
      outputs: {
        'listening': {
          label: 'Listening',
          type: 'boolean',
          state: 'listening'
        },
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

