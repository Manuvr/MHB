'use strict';

var Dissolve = require('dissolve');
var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

// variables
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
    console.log('ERROR! Supplied checksum: ' + jsonBuff.checkSum +
      ' Calculated: ' + buffSum);
    return false;
  }
};

// this will be exposed
function Receiver() {
  this.ee = ee;
  this.waitingForSync = true;
  this.connected = false;
  this.maxLength = 32000;
  this.parseTimeOut = 1500;
  this.timer = undefined;
  var that = this;

  var toggleSync = function() {
    // send a sync packet
      that.waitingForSync = !that.waitingForSync;
      ee.emit('outOfSync', that.waitingForSync);
  }

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
                  console.log('back in sync!!')
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
              console.log(
                'Something is WAY too big; dropping to sync mode...');
              toggleSync();
            } else {
              this.buffer('raw', this.vars.totalLength - 4);
            }
          } else if (this.vars.totalLength === 4) {
            if (this.vars.checkSum === 0x55) {
              console.log('Received sync packet, sending back...');
              // Send sync back to ManuvrOS
              // We need to work this out... shouldn't be automatic
              ee.emit('syncInSync');
            } else {
              toggleSync();
            }
          } else {
            console.log('INVALID PACKET');
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
