'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

// Global default MHB and engine list;
var MHB = require('./MHB.js')
var engines = [];

// class function for actual sessions
function session(transport, core) {
  ee.call(this);
  var that = this;

  this.transport = transport;

  if (core === undefined) {
    this.engine = MHB;
  } else {
    this.engine = core;
  }

  // CONNECTED LISTENERS
  this.engine.parent.on('fromCore', fromCore);
  this.transport.on('fromTransport', fromTransport);
  this.engine.on('fromEngine', fromEngine);
  this.on('fromClient', fromClient);

  // sender emits... logic shouldn't go here
  var toCore = function(type, data) {
    that.engine.parent.emit('toCore', type, data)
  }
  var toEngine = function(type, data) {
    that.engine.emit('toEngine', type, data);
  }
  var toTransport = function(type, data) {
    that.transport.emit('toTransport', type, data);
  }

  // notice the origin....
  var toClient = function(origin, type, data) {
    that.emit('toClient', origin, type, data);
  }

  // input logic
  // default cast for ALL unknown types is to emit to the client.  This allows
  // us to debug
  var fromCore = function(type, data) {
    switch (type) {
      case 'data':
        that.toTransport('data', data);
        break;
      case 'log': // passthrough
      default:
        that.toClient('core', type, data);
    }
  }

  var fromEngine = function(type, data) {
    switch (type) {
      case 'client':
        if (data.message === 'SELF_DESCRIBE') {
          that.swapEngine(data.args[0], data.args[1]) // ?? Need to inspect JSONbuff
        }
        that.toClient('engine', type, data)
        break;
      case 'log': // passthrough
      default:
        that.toClient('engine', type, data);
    }
  }

  var fromTransport = function(type, data) {
    switch (type) {
      case 'data':
        that.engine.parent.emit('toCore', 'data', data)
        break;
      case 'log': // passthrough
      default:
        that.toClient('transport', type, data)
    }
  }

  // this is essentially our inbound API. May want to expand this a bit?
  // For example: add some custom types that translate in to others
  // IE: emit('macro', 'sendBufferDataToDevice', whatever)
  // result: toCore('data', whatever)
  // Current approach assumes client knows about dest and type architecture.
  var fromClient = function(destination, type, data) {
    switch (destination) {
      case 'transport':
        that.toTransport(type, data);
        break;
      case 'engine':
        that.toEngine(type, data);
        break;
      case 'session':
        // deal with state or something?
        break;
      default:
        console.log("Unknown emit destination: " + destination + " | " + type);
    }
  };

  // special case functions
  var swapEngine = function(name, version) {
    var engineConfig;
    for (var i = 0; i < engines.length; i++) {
      engineConfig = engines[i].getConfig();
      if (name === engineConfig.name &&
        version === engineConfig.version) {
        that.engine = new engines[i](that.engine)
        that.toClient('session', 'log', 'Found engine for ' + name + ', ' +
          version)
        break;
      }
    }
    that.toClient('session', 'log', 'No version found in self-describe.')
  };
}
inherits(session, ee);

// EXPOSED SESSION FACTORY
function mSession() {
  this.core = MHB;
}

// sample public method
mSession.prototype.addEngine = function(engine) {
  engines.push(engine);
}

mSession.prototype.replaceCore = function(core) {
  this.core = core;
}

mSession.prototype.init = function(transport) {
  return new session(transport);
}

module.exports = mSession;
