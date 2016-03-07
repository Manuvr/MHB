'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
var fs = require("fs");
var th = require("telehash");

var DEFAULT_PORT    = 42424;
var DEFAULT_IP      = "0.0.0.0";

// The default ID of the router in order to listen.
// We *must* have an identity to listen because we must have a router.
// Specific connections can do without this.
var DEFAULT_ID_PATH        = "./routerID.json";
var DEFAULT_CLIENT_ID_PATH = "./clientID.json";

// tries to grab the local IP...
require('dns').lookup(require('os').hostname(), function (err, add, fam) {
  DEFAULT_IP = add;
})



var loadKeyData = function(caller, _path, callback) {
  if (fs.existsSync(_path) && fs.lstatSync(_path).isFile()) {
    var return_value = JSON.parse(fs.readFileSync(_path));
    caller.send('log', {
      body: 'Loaded endpoint ID: ' + return_value.hashname,
      verbosity: 5
    });
    if (callback) {
      callback(false, return_value);
    }
  }
  else {
    th.generate(
      function(err, endpoint) {
        if (err) {
          caller.send('log', {
            body: 'Error generating endpoint ID: ' + err,
            verbosity: 2
          });
          if (callback) {
            callback(err, false);
          }
        }
        else {
          fs.writeFile(_path, JSON.stringify(endpoint),
            function(err1) {
              if (err1) {
                caller.send('log', {
                  body: 'Generated router ID but failed to retain it in '+_path+'. ' + err1,
                  verbosity: 3
                });
              }
              else {
                caller.send('log', {
                  body: 'Generated and stored endpoint ID: ' + endpoint.hashname,
                  verbosity: 6
                });
              }
            }
          );
          if (callback) {
            callback(false, endpoint);
          }
        }
      }
    );
  }
}


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(socket) {
  ee.call(this);

  // set scope for private methods
  var that = this;
  var connect_state = false;
  var _sock = (socket) ? socket : false;
  var _addr = '';
  var _port = '';

  if (_sock) {

    var address = _sock.address();
    _addr = _sock.remoteAddress;
    _port = _sock.remotePort

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

    _sock.on('data',
      function(dat) {
        var tmp_buf = new Buffer(dat, 'utf8')
        that.send('data', tmp_buf);
      }
    );
  }

  this.disconnect = function() {
    _sock.disconnect();
  }

  this.transmit = function(dat) {
    _sock.write(dat)
  }


  this.interface_spec = {
    type: 'mTransport',
    name: 'Telehash',
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
        'localAddress': {
          label: 'Local Address',
          type: 'string',
          value: ''
        },
        'remoteAddresses': {
          label: 'Remote Addresses',
          type: 'string',
          value: ''
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);

  setTimeout(function(){
    that.send('remoteAddresses', _addr + ':' + _port);
    that.send('log', {
      body:      'Telehash connected: ' + _addr + ':' + _port,
      verbosity: 5
    });
    that.send('connected', true);


  }, 1000)
};




// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  var router_id_path = DEFAULT_ID_PATH;
  this.router_inst   = null;
  var router_id      = null;
  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
      return new mTransport();
  }

  var meshStarted = function(err) {
    if (err) {
      that.send('log', {
        body: 'Mesh failed to start, despite having a good ID. Error was: ' + err,
        verbosity: 2
      });
      that.send('listening', false);
      that.send('localAddress', '');
    }
    else {
      that.send('log', {
        body: 'Mesh started. Router ID is ' + router_id.hashname,
        verbosity: 4
      });
      that.send('listening', true);
      that.send('localAddress', router_id.hashname);
    }
  }


  this.startRouter = function(err, id_data) {
    router_id = id_data;
    th.mesh({id: router_id}, meshStarted);
  }



  this.interface_spec = {
    type: 'mTransportFactory',
    name: 'TelehashFactory',
    schema: {
      inputs: {
        'connect' : {
          label: "Connect",
          args: [ { label: 'Remote Address', type: 'string' },
                  { label: 'ID File', type: 'string', def: DEFAULT_CLIENT_ID_PATH } ],
          func: function(me, data) {
            if (data.length > 0) {
              var address  = data.shift();
              var _keyfile = (data.length > 0) ? data.shift() : DEFAULT_CLIENT_ID_PATH;
              me.send('log', {
                  body: 'Attempting connection to ' + address + " with keyfile " + _keyfile,
                  verbosity: 4
              });
              var nu_inst = new net.mTransport();
              //loadKeyData(nu_inst, _keyfile, callback)
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
          args: [
            { label: 'Listen', type: 'boolean', def: true },
            { label: 'ID File', type: 'string', def: DEFAULT_ID_PATH }
          ],
          func: function(me, data) {
            if (data.length === 0) {
              me.send('log', {
                  body: 'Insufficient parameter count.',
                  verbosity: 3
              });
              return;
            }
            var d_state  = data.shift();   // The desired listening state.

            // The file containing the desired identity.
            var _keyfile = (data.length > 0) ? data.shift() : DEFAULT_ID_PATH;

            if (me.router_inst && !d_state) {
              // Router is running and ought not be.
              me.router_inst.close();
              me.send('listening', false);
              me.send('localAddress', '');
              me.router_inst = null;
            }
            else if (d_state) {
              // Start the server listening.
              if (!me.router_inst) {
                loadKeyData(me, _keyfile, me.startRouter);
              }
              else {
                me.send('log', {
                  body: 'SocketFactory is already listening on ' + me.router_inst.origins(),
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