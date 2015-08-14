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

  //
  var fromCore = function(type, data) {
    switch (type) {
      case 'data':
        this.transport.emit('toTransport', 'data', data)
        break;
    }
  }

  var toCore = function(type, data) {
    this.engine.parent.emit('toCore', type, data)
  }

  var toTransport = function(type, data) {
    this.transport.emit('toTransport', type, data);
  }

  var fromTransport = function(type, data) {

  }

  var toBuild = function(type, data) {
    this.engine.emit('build', arg);
  }

  // From CORE directly to transport
  this.engine.parent.on('toTransport', toTransport);

  // From TRANSPORT
  this.transport.on('fromTransport', toCore);

  // from Engine
  this.engine.on('fromParse', fromParse);
  this.on('build', toBuild);

  // from CLIENT
  this.on('toTransport', toTransport)

  // from CORE
  this.engine.parent.on('fromCore', fromCore);

  //Listener
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
