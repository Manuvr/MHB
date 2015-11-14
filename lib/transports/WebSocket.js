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
        var address = _sock.handshake.address;
        _addr = address.address;
        _port = address.port;
        that.send('remoteAddress', _addr + ':' + _port);
        that.send('log', {
          body:      'Socket connected: ' + _addr + ':' + _port,
          verbosity: 5
        });
        that.send('connected', true);
      }
    );

    _sock.on('error',
      function(err) {
        that.send('log', {
          body:      'A socket.io client experienced an error: ' + err,
          verbosity: 3
        });
        that.send('connected', false);
      }
    );

    _sock.on('disconnect',
      function() {
        that.send('log', {
          body:      'Socket disconnected',
          verbosity: 5
        });
        that.send('connected', false);
      }
    );

    _sock.on('reconnect',
      function() {
        that.send('log', {
          body:      'Socket reconnected',
          verbosity: 5
        });
        that.send('connected', true);
      }
    );

    _sock.on('data',
      function(dat) {
        that.send('data', dat);
      }
    );
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
          value: false
        },
        'data': {
          label: 'Received data',
          type: 'string',
          value: ''
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
    type: 'mTransportFactory',
    name: 'WebSocketFactory',
    schema: {
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
              me.send('log', {
                  body: 'Attempting connection to ' + address,
                  verbosity: 4
              });
              var nu_inst = new Client(address);
              nu_inst.once('connect',
                function () {
                  var instance = new mTransport(nu_inst);
                  me.send('connected', instance);
                }
              );
            }
            else {
              me.send('log', {
                  body: 'Unspecified address.',
                  verbosity: 2
              });
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
              me.send('log', {
                  body: 'Insufficient parameter count.',
                  verbosity: 3
              });
              return;
            }
            var d_state = data.shift();

            if (me.server && !d_state) {
              // Server is running and ought not be.
              me.server.close();
              me.send('listening', false);
              me.send('localAddress', '');
              me.server = null;
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
                    me.send('log', {
                      body: 'New connection from ' + address.address + ':' + address.port
                    });
                    me.send('connected', instance);
                  }
                );
                me.send('listening', true);
                me.send('localAddress', me.server.origins());
              }
              else {
                me.send('log', {
                  body: 'SocketFactory is already listening on ' + me.server.origins(),
                  verbosity: 5
                });
              }
            }
            else {
              me.send('log', {
                body: 'SocketFactory is not listening.',
                verbosity: 6
              });
            }
          },
          hidden: false
        }
      },
      outputs: {
        'listening': {
          label: 'Listening',
          type: 'boolean',
          value: false
        },
        'scanResult': {
          label: ['Address'],
          type: 'array',
          value: []
        },
        'localAddress': {
          label: 'Local Address',
          type: 'string',
          value: ''
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
