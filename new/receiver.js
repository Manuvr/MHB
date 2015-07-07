'use strict';

var Dissolve = require('dissolve');

var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

// variables
var syncPacket = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');
var maxLength = 32000;

var waitingForSync = false;

// helpers
var bufferCompare = function (a, b) {
	if (!Buffer.isBuffer(a)) { return undefined; }
	if (!Buffer.isBuffer(b)) { return undefined; }
	if (typeof a.equals === 'function') { return a.equals(b); }
	if (a.length !== b.length) {
		return false;
	}
	for (var i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) { return false; }
	}
	return true;
};

var initSync = function() {
    ee.emit('sendSync');
};

var syncMode = function(flag){
	if(flag){
		waitingForSync = true;
		console.log('OUT OF SYNC');
		// add code here for the reset command
	}
  waitingForSync = false;
  console.log('BACK IN SYNC');
};

// evaluates the checkSum field
var dataCheck = function(jsonBuff){
	var buffSum = 0;
	if(undefined === jsonBuff.raw){
		return false;
	}
	for(var i = 0; i < jsonBuff.raw.length; i++){
		buffSum += jsonBuff.raw.readUInt8(i);
	}
	buffSum += 0x55;
	buffSum %= 256;
	if(jsonBuff.checkSum === buffSum){
		return true;
	} else {
		console.log('ERROR! Supplied checksum: ' + jsonBuff.checkSum + ' Calculated: ' + buffSum);
		return false;
	}
};

// this will be exposed
function Receiver() {

	this.connected = false;

}

Receiver.prototype.parser = Dissolve().loop(function(end) {
		if(waitingForSync){
			this.uint8('wait')
				.tap(function(){
					if(this.vars.wait === 0x55){
						this.buffer('check', 4)
							.tap(function(){
								if(bufferCompare(this.vars.check, syncPacket)){
									syncMode(false);
								}
							});
					}
          this.vars = {};
				});
		} else {
			this.uint32le('check')
				.tap(function () {
					this.vars.totalLength = this.vars.check & 0x00FFFFFF;
					this.vars.checkSum = this.vars.check >>> 24;
					delete this.vars.check;
						if (this.vars.totalLength > 4) {
							if (this.vars.totalLength >= maxLength) {
								console.log('Something is WAY too big; dropping to sync mode...');
								syncMode(true);
							} else {
								this.buffer('raw', this.vars.totalLength - 4);
							}
						} else if (this.vars.totalLength === 4) {
							if (this.vars.checkSum === 0x55) {
								console.log('Received sync packet, sending back...');
								// Send sync back to ManuvrOS
								// We need to work this out... shouldn't be automatic
                initSync();
							} else {
								syncMode(true);
							}
						} else {
              console.log('INVALID PACKET');
						}
				})
				.tap(function () {
					if (this.vars.checkSum !== 0x55 && !waitingForSync) {
						// emits 'readable'
						if(dataCheck(this.vars)) {
							this.vars.uniqueId = this.vars.raw.readUInt16LE(0);
							this.vars.messageId = this.vars.raw.readUInt16LE(2);
							this.vars.raw = this.vars.raw.slice(4);
							this.push(this.vars);
						} else {
							syncMode(true);
						}
					}
					this.vars = {};
				});
		}
});

Receiver.prototype.resetParser = function() {
	waitingForSync = 0;
};

Receiver.prototype.events = ee;

module.exports = Receiver;
