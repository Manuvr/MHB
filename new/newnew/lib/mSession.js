'use strict'

var mCore = require('./MHB.js')

function session(transport) {
  var that = this;
  this.engine = new core();

  this.transport = transport;

  var toParse = function(arg) {
    that.engine.emit('toParse', buffer);
  }

  this.transport.on('fromTransport', this.toParse)

  //example for assigning a new "engine"...
  this.engine.on('version', function(nameAndVersion) {
    for (var i = 0; i < that.engines.length; i++) {
      if (nameAndVersion.name === that.engines[i].config.name &&
        nameAndVersion.version === that.engines[i].config.version) {
        that.engine = that.engines[i].init(that.engine)
      }
    }
  });
}

// EXPOSED FUNCTION
function mSession() {
  this.init();
}
util.inherits(mSession, ee);

mConnector.prototype.init = function() {
  this.engines = [];
}

// sample public method
mConnector.prototype.addEngine = function(engine) {
  this.engines.push(engine);
}

mConnector.prototype.addCore = function(core) {
  this.core = core;
}

mConnector.prototype.addTransport = function(transport) {
  return new session(transport);
}

module.exports = mSession;
