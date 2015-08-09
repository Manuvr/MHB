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

  var fromParse = function(arg) {
    this.emit('message', arg)
  }

  var toTransport = function(arg) {
    this.transport.emit('data', arg)
  }

  var toBuild = function(arg) {
    this.engine.emit('build', arg);
  }

  this.engine.parent.on('toTransport', toTransport);

  this.transport.on('fromTransport', toParse);
  this.engine.on('fromParse', fromParse);
  this.on('build', toBuild);

  //example for assigning a new "engine"...
  this.engine.on('SELF_DESCRIBE', function(nameAndVersion) {
    var engineConfig;
    for (var i = 0; i < that.engines.length; i++) {
      engineConfig = that.engines[i].getConfig();
      if (nameAndVersion.name === engineConfig.name &&
        nameAndVersion.version === engineConfig.version) {
        that.engine = new engines[i](that.engine)
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
