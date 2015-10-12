'use strict'
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var inspect = require('util').inspect;

var _cloneDeep = require('lodash.clonedeep');
var _has = require('lodash.has');
var _merge = require('lodash.merge');
var _defaultsDeep = require('lodash.defaultsdeep');

// Global default MHB and engine list;
var MHB = require('./mCore.js');

/** This is an array of possible Engines that might connect to a session. */
var engines = [];

/** This is the default config for an mSession. */
var interface_spec = {
  schema: {
    type: 'mSession',
    state: {
      'engine_stack': {
        type: 'array',
        value: []
      }
    },
    inputs: {
      'assign':[
        {
          label: 'Assign',
          type: 'object'
        }
      ]
    },
    outputs: {
      'config': {
        type: 'object',
        label: 'ConfigObj',
        state: 'remoteAddress'
      },
      'log': {
        type: 'array',
        label: 'Log'
        //state: 'remoteAddress'
      }
    }
  },
  adjuncts: {
  },
  taps: {
  }
};

/**
 * A generated session object constructor
 *
 * @class
 * @param  {object} transport An instantiated mTransport
 * @param  {object} core      An instantiated mCore
 */
function session(transport, core) {
  ee.call(this);
  this.interface_spec = {};

  this.transport = transport;

  if (core === undefined) {
    this.core = new MHB();
  } else {
    this.core = core;
  }
  // initial assignment
  this.engine = this.core;

  this.uuid = this.core.uuid; // We inherit core's UUID.

  var that = this;

  // sender emits... logic shouldn't go here
  var toCore = function(method, data) {
    that.core.emit('toCore', method, data)
  }
  var toEngine = function(method, data) {
    that.engine.emit('input', method, data);
  }
  var toTransport = function(method, data) {
    that.transport.emit('input', method, data);
  }

  // notice the origin....
  var toClient = function(origin, method, data) {
    var message = {
      target: [origin, method],
      data:   data
    };
    that.emit('output', message);
  }

  // input logic
  // default cast for ALL unknown methods is to emit to the client.  This allows
  // us to debug
  var fromCore = function(method, data) {
    switch (method) {
      case 'data':
        toTransport('data', data);
        break;
      default:
        toClient('core', 'log', ['Session::fromCore(): Obsolete pathway. method = '+method, 2]);
    }
  }

  var fromEngine = function(method, data) {
    // If this is the place we are going to store state, than this is the place it has to
    //   be acted upon.
    switch (method) {
      case 'client':
        if (data.message === 'SELF_DESCRIBE') {
          swapEngine(data.args[0], data.args[1]) // ?? Need to inspect JSONbuff
        }
        //toClient('engine', method, data)
        break;
      case 'sync':
        // TODO: This is wrong. Don't store state information in the interface_spec.
        if (!that.interface_spec.adjuncts.engine.schema.state['sessionEstablished'].value) {
          // If there was not a session established before, then continue the setup phase...
          toEngine('SELF_DESCRIBE', {});
        }
        break;
      case 'transport':
        toTransport('connected', false);
        break;
      case 'config':
        if (_has(that.interface_spec.adjuncts, 'engine')) {
          _defaultsDeep(that.interface_spec.adjuncts.engine, _cloneDeep(data));
        } else {
          that.interface_spec.adjuncts.engine = _cloneDeep(data);
        }
        break;
      case 'log': // passthrough
      default:
        toClient('engine', method, data);
        break;
    }

    if (_has(that.interface_spec.adjuncts, ['engine', 'schema.', 'outputs', method, 'state']) && data !== undefined) {
      that.interface_spec.adjuncts.engine.schema.state[that.interface_spec.adjuncts.engine.schema.outputs[method].state].value = data;
    }
    else {
      // didn't find a state to update...
    }
  }

  var fromTransport = function(message) {
    var method = message.target[0];;
    var data = message.data;
    switch (method) {
      case 'data':
        toCore('data', data)
        break;
      case 'connected':
        toClient('transport', 'log', ['Connection change: ' + data, 4]);
        toCore('connected', data);
        break;
      case 'config':
        if (_has(that.interface_spec.adjuncts, 'transport')) {
          _defaultsDeep(that.interface_spec.adjuncts.transport, _cloneDeep(data));
        } else {
          that.interface_spec.adjuncts.transport = _cloneDeep(data);
        }
        break;
      case 'log': // passthrough
      default:
        toClient('transport', method, data)
        break;
    }
    // updates the state value based on the "outputs" definition.
    if (_has(that.interface_spec.adjuncts, ['transport', 'outputs', method, 'state']) && data !==
      undefined) {
      that.interface_spec.adjuncts.transport.state[that.interface_spec.adjuncts.transport.outputs[method].state].value =
        data;
    } else {
      // didn't find a state to update...
    }
  }

  // this is essentially our inbound API. May want to expand this a bit?
  // For example: add some custom methods that translate in to others
  // IE: emit('macro', 'sendBufferDataToDevice', whatever)
  // result: toCore('data', whatever)
  // Current approach assumes client knows about dest and method architecture.
  var fromClient = function(message) {
    if (message.target.length > 1) {
      var adj_target = message.target.shift();
      //if (that.hasOwnProperty(adj_target)) {
      if (adj_target === 'transport') {
        toTransport(message.target.shift(), message.data);
      }
      else if (adj_target === 'engine') {
        toEngine(message.target.shift(), message.data);
      }
      //}
    }
    else {
      var method = message.target.shift();
      switch (method) {
        case '_adjunctDef':
          toClient('session', '_adjunctDef', this.interface_spec);
          break;
        default:
          toClient('session', 'log', ['No method named ' + method + ' in fromClient().', 2]);
          break;
      }
    }
  };


  // special case functions

  var swapEngine = function(name, version) {
    var engineConfig;
    for (var i = 0; i < engines.length; i++) {
      engineConfig = engines[i].interface_spec;
      if (name === engineConfig.schema.describe.identity) {
        that.engine.removeListener('fromEngine', fromEngine);
        that.engine = new engines[i].init(that.engine)
        that.engine.on('fromEngine', fromEngine);
        toClient('session', 'log', ['Found and attached engine for "' + name + '"', 4]);
        // double check this later...
        toEngine('config');
        break;
      }
    }
    toClient('session', 'log', ['No version found in self-describe.', 2])
  };

  // instantiates local config, passes in the session config and requests
  // other configs
  this.interface_spec = _cloneDeep(interface_spec);

  // CONNECTED LISTENERS

  //fromCore is ALWAYS the initial listener...
  this.core.on('fromCore', fromCore);

  // standard listeners
  this.on('input', fromClient);
  this.transport.on('output', fromTransport);

  // needs to be removed and reset to the new Engine when changing...
  this.engine.on('output', fromEngine);

  // instantiation emits (AFTER LISTENERS!!!)
  toEngine('config');
  toTransport('config');
}


inherits(session, ee);

/**
 * Return a UUID identifying the session.
 * The core is what actually represents the state of the session, and thus
 *   it is the source of the unique identifier.
 *
 * @return {string} The UUID for this session.
 */
session.prototype.getUUID = function() {
  return this.core.uuid;
}


// EXPOSED SESSION FACTORY

/**
 * Constructor information for mSession
 *
 * @class {object} This is the empty generator class
 */
function mSession() {
  this.core = MHB;
}

/**
 * Adds an "mEngine" to the engine search array
 *
 * @param  {function} engine This requires an UNINSTANTIATED mEngine function
 */
mSession.prototype.addEngine = function(engine) {
  engines.push(engine);
}

/**
 * Replaces the MHB default core (not reccomended)
 *
 * @param  {object} core This requires an INSTANTIATED mCore
 */
mSession.prototype.replaceCore = function(core) {
  this.core = core;
  this.uuid = this.core.uuid;
}

/**
 * This returns a new session object with the given transport
 *
 * @param  {object} transport Requires a "new-ed" mTransport
 * @return {object} Returns an "newed" session object
 */
mSession.prototype.init = function(transport) {
  return new session(transport);
}


module.exports = mSession;
