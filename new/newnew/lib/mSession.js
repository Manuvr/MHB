'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var MHB = require('./MHB.js')

function session(transport, engines) {
  var that = this;
  this.engine = new MHB();

  this.transport = transport;

  var toParse = function(arg) {
    that.engine.parent.emit('toParse', buffer);
  }

  this.transport.on('fromTransport', toParse)

  //example for assigning a new "engine"...
  this.engine.on('SELF_DESCRIBE', function(nameAndVersion) {
    for (var i = 0; i < that.engines.length; i++) {
      if (nameAndVersion.name === that.engines[i].config.name &&
        nameAndVersion.version === that.engines[i].config.version) {
        that.engine = engines[i].init(that.engine)
        break;
      }
    }
  });
}

// EXPOSED FUNCTION
function mSession() {
  ee.call(this);
  this.engines = []
}

util.inherits(mSession, ee);

// sample public method
mSession.prototype.addEngine = function(engine) {
  this.engines.push(engine);
}

mSession.prototype.addCore = function(core) {
  this.core = core;
}

mSession.prototype.connectTransport = function(transport) {
  return new session(transport, this.engines);
}

module.exports = mSession;
