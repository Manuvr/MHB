'use strict';

var Dissolve = require('dissolve');
var EventEmitter = require('events').EventEmitter;


/** This is the definition of a sync packet. */
var syncPacket = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

// helpers
var bufferCompare = function(a, b) {
  if (!Buffer.isBuffer(a)) {
    return undefined;
  }
  if (!Buffer.isBuffer(b)) {
    return undefined;
  }
  if (typeof a.equals === 'function') {
    return a.equals(b);
  }
  if (a.length !== b.length) {
    return false;
  }
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

/**
 * This is the exposed constructor for the Receiver class. It is the interface between
 *   mCore, and the transport's emitted data (by way of Dissolve).
 *
 * @constructor
 */
function Receiver() {
  this.ee = new EventEmitter();
  this.waitingForSync = true;
  this.connected = false;
  this.maxLength = 32000;
  this.parseTimeOut = 1500;
  this.timer = undefined;
  var that = this;

  var toggleSync = function(reason) {
    if (!reason) reason = 'reason not given';
    // We are waiting to see sync packets come over the wire.
    that.waitingForSync = !that.waitingForSync;

    // TODO: 11.16.15 - Seeing if this works...
      that.ee.emit('outOfSync', that.waitingForSync, reason);
  }


  // evaluates the checkSum field
  var dataCheck = function(jsonBuff) {
    var buffSum = 0;
    if (undefined === jsonBuff.raw) {
      return false;
    }
    for (var i = 0; i < jsonBuff.raw.length; i++) {
      buffSum += jsonBuff.raw.readUInt8(i);
    }
    buffSum += 0x55;
    buffSum %= 256;
    if (jsonBuff.checkSum === buffSum) {
      return true;
    } else {
      // Packet failed the checksum.
      toggleSync('checksum failure ('+buffSum+' versus '+jsonBuff.checkSum+')');
      return false;
    }
  };


  this.parser = Dissolve().loop(function(end) {
    if (that.timer) {
      clearTimeout(that.timer)
      that.timer = undefined;
    };

    if (that.waitingForSync) {
      this.uint8('wait')
        .tap(function() {
          if (this.vars.wait === 0x55) {
            this.buffer('check', 4)
              .tap(function() {
                if (bufferCompare(this.vars.check, syncPacket)) {
                  toggleSync();
                }
              });
          }
          this.vars = {};
        });
    } else {
      this.uint32le('check')
        .tap(function() {

          that.timer = setTimeout(function() {
            end()
          }, that.parseTimeOut);

          this.vars.totalLength = this.vars.check & 0x00FFFFFF;
          this.vars.checkSum = this.vars.check >>> 24;
          delete this.vars.check;
          if (this.vars.totalLength > 4) {
            if (this.vars.totalLength >= that.maxLength) {
              // An incoming packet exceeded our stated MTU.
              toggleSync('MTU exceeded');
            } else {
              this.buffer('raw', this.vars.totalLength - 4);
            }
          } else if (this.vars.totalLength === 4) {
            if (this.vars.checkSum === 0x55) {
              // Send sync back to ManuvrOS
              // We need to work this out... shouldn't be automatic
              that.ee.emit('syncInSync');
            } else {
              toggleSync('invalid sync packet');
            }
          } else {
            // Invalid packet.
            toggleSync('incomprehensible length ('+this.vars.totalLength+')');
          }
        })
        .tap(function() {
          if (this.vars.checkSum !== 0x55 && !that.waitingForSync) {
            // emits 'readable'
            if (dataCheck(this.vars)) {
              this.vars.uniqueId = this.vars.raw.readUInt16LE(0);
              this.vars.messageId = this.vars.raw.readUInt16LE(2);
              this.vars.raw = this.vars.raw.slice(4);
              this.push(this.vars);
            } else {
              that.waitingForSync = true;
            }
          }
          this.vars = {};
        });
    }
  });

}

module.exports = Receiver;
