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

  var toParse = function(type, arg) {
    switch (type) {
      case 'data':
        that.engine.parent.emit('toParse', buffer);
        break;
      default:

    }
  }

  var fromParse = function(arg) {
    this.emit('message', arg)
  }

  var toTransport = function(type, data) {
    //this.transport.emit('data', data)
    this.transport.emit('toTransport', type, data);
  }

  var toBuild = function(arg) {
    this.engine.emit('build', arg);
  }

  // From CORE directly to transport
  this.engine.parent.on('toTransport', toTransport);

  // From TRANSPORT to Parse
  this.transport.on('fromTransport', toParse);

  this.engine.on('fromParse', fromParse);
  this.on('build', toBuild);

  this.on('toTransport', toTransport)

  //example for assigning a new "engine"...
  this.engine.on('SELF_DESCRIBE', function(nameAndVersion) {
    var engineConfig;
    for (var i = 0; i < engines.length; i++) {
      engineConfig = engines[i].getConfig();
      if (nameAndVersion.name === engineConfig.name &&
        nameAndVersion.version === engineConfig.version) {
        that.engine = new engines[i](that.engine)
        break;
      }
    }
  });
}
util.inherits(session, ee);


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
