'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

// Global default MHB and engine list;
var MHB = require('./mCore.js')
var engines = [];


/**
 * A generated session object constructor
 * @class
 * @param  {object} transport An instantiated mTransport
 * @param  {object} core      An instantiated mCore
 */
function session(transport, core) {
  ee.call(this);

  this.transport = transport;

  if (core === undefined) {
    this.core = new MHB();
  } else {
    this.core = core;
  }
  // initial assignment
  this.engine = this.core;

  var that = this;

  // sender emits... logic shouldn't go here
  var toCore = function(type, data) {
    that.core.emit('toCore', type, data)
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
        toTransport('data', data);
        break;
      case 'log': // passthrough
      default:
        toClient('core', type, data);
    }
  }

  var fromEngine = function(type, data) {
    switch (type) {
      case 'client':
        if (data.message === 'SELF_DESCRIBE') {
          swapEngine(data.args[0], data.args[1]) // ?? Need to inspect JSONbuff
        }
        //toClient('engine', type, data)
        break;
      case 'transport':
        toTransport('connected', false);
        break;
      case 'log': // passthrough
      default:
        //toClient('engine', type, data);
    }
    toClient('engine', type, data)
  }

  var fromTransport = function(type, data) {
    switch (type) {
      case 'data':
        toCore('data', data)
        break;
      case 'connected':
        console.log("herap" + data)
        toCore('connected', data);
        break;
      case 'log': // passthrough
      default:
        toClient('transport', type, data)
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
        toTransport(type, data);
        break;
      case 'engine':
        toEngine(type, data);
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
        that.engine.removeListener('fromEngine', fromEngine);
        that.engine = new engines[i](that.engine)
        that.engine.on('fromEngine', fromEngine);
        toClient('session', 'log', 'Found engine for ' + name + ', ' +
          version)
        break;
      }
    }
    toClient('session', 'log', 'No version found in self-describe.')
  };

  // CONNECTED LISTENERS

  //fromCore is ALWAYS the initial listener...
  this.core.on('fromCore', fromCore);
  this.transport.on('fromTransport', fromTransport);
  this.on('fromClient', fromClient);

  // needs to be removed and reset to the new Engine when changing...
  this.engine.on('fromEngine', fromEngine);

}
inherits(session, ee);


/**
 * Return a human-readable string representing the session.
 * The core is what actually represents the state of the session, and thus
 *   it is the source of the unique identifier.
 */
session.prototype.toString = function() {
  return ('UUID: ' + this.core.uuid + '   Via ' + this.transport.getName() + ' which is ' + (this.transport.isConnected() ?'connected':'unconnected'));
}


/**
 */
session.prototype.toJSON = function() {
  var return_obj = {};
  return_obj.session   = {uuid: this.core.uuid};
  
  return_obj.transport = this.transport;
  return_obj.engine    = this.core.getConfig();
  return JSON.stringify(return_obj);
}



// EXPOSED SESSION FACTORY

/**
 * Constructor information for mSession
 * @class {object} This is the empty generator class
 */
function mSession() {
  this.core = MHB;
}

/**
 * Adds an "mEngine" to the engine search array
 * @param  {function} engine This requires an UNINSTANTIATED mEngine function
 */
mSession.prototype.addEngine = function(engine) {
  engines.push(engine);
}

/**
 * Replaces the MHB default core (not reccomended)
 * @param  {object} core This requires an INSTANTIATED mCore
 */
mSession.prototype.replaceCore = function(core) {
  this.core = core;
}

/**
 * This returns a new session object with the given transport
 * @param  {object} transport Requires a "new-ed" mTransport
 * @return {object} Returns an "newed" session object
 */
mSession.prototype.init = function(transport) {
  return new session(transport);
}


module.exports = mSession;
