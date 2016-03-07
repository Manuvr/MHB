'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
var fs = require("fs");
var th = require("telehash");

//delete th.extensions.http;

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
function mTransport(options) {
  ee.call(this);

  // set scope for private methods
  var that = this;
  var connect_state = false;

  var client_mesh = null;
  var client_link = null;
  var client_stream = null;


  this.disconnect = function() {
  }

  this.transmit = function(dat) {
    if (client_stream) {
      client_stream.write(dat);
    }
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


  if (options && options.link) {
    client_link = options.link;
    console.log('\nLINK contents: ' + JSON.stringify(client_link)+'\n');
    client_link.on('status',
      function(err) {
        if (err) {
          client_stream = client_link.stream();
          connect_state = true;
          that.send('connected', connect_state);
          client_stream.on('data',
            function(dat) {
              var tmp_buf = new Buffer(dat, 'utf8')
              console.log('Data coming from stream: ' + dat);
              that.send('data', tmp_buf);
            }
          );

          that.send('log', {
            body:      'Telehash client became connected.',
            verbosity: 6
          });
        }
        else {
          connect_state = true;
          that.send('log', {
            body:      'Telehash client became disconnected. '+err,
            verbosity: 4
          });
        }
      }
    );
  }
};




// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  // TODO: All files that contain identity information should be encrypted.
  this.router_id_path = DEFAULT_ID_PATH;  // Path to the default router ID file.
  this.router_mesh    = null;
  var router_id       = null;
  var discovery_state = false;

  // Holds a JSON list of all authorized links to be passed into the mesh-creation
  //   function.
  var authorized_links = null;

  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
      return new mTransport();
  }

  // This function is called once the consequences of the mesh startup are known.
  var meshStarted = function(err, _mesh) {
    if (err) {
      that.send('log', {
        body: 'Mesh failed to start, despite having a good ID. Error was: ' + err,
        verbosity: 2
      });
      that.send('listening', false);
      that.send('localAddress', '');
    }
    else {
      that.router_mesh = _mesh;
      that.send('log', {
        body: 'Mesh started. Router ID is ' + router_id.hashname,
        verbosity: 4
      });
      that.send('listening', true);
      that.send('localAddress', that.router_mesh.uri());
    }
  }


  // This exec's when all transports have entered discovery mode.
  this.discoveryState = function(_disc_stu) {
    discovery_state = (_disc_stu) ? true : false;  // Boolean normallization.
    that.send('log', {
      body: 'TelehashFactory discovery callback: ' + discovery_state,
      verbosity: 5
    });
    that.send('discovering', discovery_state);
  }


  // Call with a boolean argument and optional timeout value to make the router mesh
  //   discoverable or not. If a non-zero timeout value is provided, the mesh will
  //   only be discoverable for that duration.
  this.discover = function(_discoverable, _discvr_timeout) {
    if (discovery_state ^ _discoverable) {
      if (_discoverable) {
        that.router_mesh.accept = function(from) {
          that.send('log', {
            body: 'TelehashFactory is accepting a link from: ' + JSON.stringify(from),
            verbosity: 5
          });
          var _link = that.router_mesh.link(from);
          me.send('connected', new mTransport({link: _link}));
        }
      }
      else {
        that.router_mesh.accept = undefined;
      }

      that.router_mesh.discover(_discoverable,
        function() {
          that.discoveryState(_discoverable);
        }
      );

      if (_discoverable && _discvr_timeout) {
        setTimeout(that.discoveryState, _discvr_timeout);
      }
    }
  }

  this.startRouter = function(err, id_data) {
    router_id = id_data;
    th.mesh(
      {
        id:   router_id,
        //udp4: {
        //  host: DEFAULT_IP,
        //  port: DEFAULT_PORT
        //},
        //tcp4: {
        //  host: DEFAULT_IP,
        //  port: DEFAULT_PORT
        //},
        http: {
          host: DEFAULT_IP,
          port: DEFAULT_PORT
        }
      },
      meshStarted
    );
  }

  this.interface_spec = {
    type: 'mTransportFactory',
    name: 'TelehashFactory',
    schema: {
      inputs: {
        'connect' : {
          label: "Connect",
          args: [ { label: 'Hashname', type: 'string' },
                  { label: 'ID File', type: 'string', def: DEFAULT_CLIENT_ID_PATH } ],
          func: function(me, data) {
            if (data.length > 0) {
              var _hashname  = data.shift();
              var _keyfile = (data.length > 0) ? data.shift() : DEFAULT_CLIENT_ID_PATH;
              if (me.router_mesh) {
                me.send('log', {
                  body: 'Attempting connection to ' + _hashname + " with keyfile " + _keyfile,
                  verbosity: 4
                });
                var nu_link = me.router_mesh.link(_hashname);
                me.send('connected', new mTransport({link: nu_link}));
              }
              else {
                me.send('log', {
                  body: 'Cannot establish connection to ' + _hashname + ' without an active router.',
                  verbosity: 4
                });
              }
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
            var _keyfile = (data.length > 0) ? data.shift() : me.router_id_path;

            if (me.router_mesh && !d_state) {
              // Router is running and ought not be.
              me.router_mesh.close();
              me.send('listening', false);
              me.send('localAddress', '');
              me.router_mesh = null;
            }
            else if (d_state) {
              // Start the server listening.
              if (!me.router_mesh) {
                loadKeyData(me, _keyfile, me.startRouter);
              }
              else {
                me.send('log', {
                  body: 'TelehashFactory is already listening on ' + me.router_id.hashname,
                  verbosity: 5
                });
              }
            }
            else {
              me.send('log', {
                body: 'TelehashFactory is not listening.',
                verbosity: 6
              });
            }
          },
          hidden: false
        },
        'discover' : {
          label: "Discover",
          args: [
            { label: 'Discover', type: 'boolean', def: false },
            { label: 'Timeout (ms)', type: 'number', def: 0 }
          ],
          func: function(me, data) {
            if (me.router_mesh) {
              var _discoverable   = false;
              var _discvr_timeout = false;
              if (data.length > 0) _discoverable   = (data.shift()) ? true : false;
              if (data.length > 0) _discvr_timeout = data.shift();
              me.discover(_discoverable, _discvr_timeout);
            }
            else {
              me.send('log', {
                body: 'TelehashFactory is not yet running a mesh.',
                verbosity: 3
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
        'discovering': {
          label: 'Discovering',
          type: 'boolean',
          value: false
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
