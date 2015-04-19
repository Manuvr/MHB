// node modules
//var util = require('util');

// had to change this... forked on github, but moved the library to ./lib/
var Dissolve = require('dissolve');
var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

// variables
var syncPacket = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');
var maxLength = 32000;
var warningLength = 10000;
var waitingForSync = 0;
var timer = true;

// helpers
var bufferCompare = function (a, b) {
	if (!Buffer.isBuffer(a)) return undefined;
	if (!Buffer.isBuffer(b)) return undefined;
	if (typeof a.equals === 'function') return a.equals(b);
	if (a.length !== b.length) {
		return false;
	}
	for (var i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
};

var sync = function(flag){
	if(flag){
		waitingForSync = 1;
		console.log("OUT OF SYNC");
		// add code here for the reset command
	} else {
		waitingForSync = 0;
		console.log("BACK IN SYNC");
		// this will set us back
	}
};

// evaluates the checkSum field
var dataCheck = function(jsonBuff){
	var buffSum = 0;
	if(undefined === jsonBuff.raw){
		return 0;
	}
	if(jsonBuff.checkSum === 0x55){
		console.log("Sync got in here somehow?");
		return 1;
	}
	for(var i = 0; i < jsonBuff.raw.length; i++){
		buffSum += jsonBuff.raw.readUInt8(i);
	}
	buffSum += 0x55;
	buffSum %= 256;
	if(jsonBuff.checkSum === buffSum){
		return 1;
	} else {
		console.log("ERROR! Supplied checksum: " + jsonBuff.checkSum + " Calculated: " + buffSum);
		return 0;
	}
};

// this will be exposed
function dhbParser(config) {

	//if (!(this instanceof dhbParser)) return new dhbParser(config);

	//EventEmitter.call(this);

	this.config = config;
	this.connected = false;

	this.parser = Dissolve().loop(function(end) {
		if(waitingForSync === 1 ){
			this.uint8("wait")
				.tap(function(){
					if(this.vars.wait === 0x55){
						this.buffer("check", 4)
							.tap(function(){
								if(bufferCompare(this.vars.check, syncPacket)){
									sync(0);
								}
								this.vars = {};
							});
						this.vars = {};
					} else {
						this.vars = {};
					}
				})
		} else {
			this.uint32le("temp")
				.tap(function () {
					this.vars.totalLength   = this.vars.temp & 0x00FFFFFF;
					this.vars.checkSum      = this.vars.temp >>> 24;
					delete this.vars.temp;
						if (this.vars.totalLength > 4) {
							if (this.vars.totalLength >= warningLength && this.vars.totalLength < maxLength) {
								console.log("I'm getting a big packet of " + this.vars.totalLength + " bytes");
								this.buffer("raw", this.vars.totalLength - 4)
							} else if (this.vars.totalLength >= maxLength) {
								console.log("Something is WAY too big; dropping to sync mode...");
								sync(1);
							} else {
								this.buffer("raw", this.vars.totalLength - 4)
							}
						} else if (this.vars.totalLength == 4) {
							if (this.vars.checkSum === 0x55) {
								console.log("Received sync packet, sending back...");
								// Send sync back to ManuvrOS
								ee.emit('sendSync');
							} else {
								sync(1);
							}
						} else {
						  console.log("INVALID PACKET");
						}
				})
				.tap(function () {
					if (this.vars.checkSum != 0x55 && waitingForSync === 0) {
						// emits 'readable'
						if(dataCheck(this.vars) === 1) {
							this.vars.uniqueId = this.vars.raw.readUInt16LE(0);
							this.vars.messageId = this.vars.raw.readUInt16LE(2);
							this.vars.raw = this.vars.raw.slice(4);
							this.push(this.vars);
						} else {
							sync(1);
						}
					}
					// clear the variables
					this.vars = {};
				})
		}
	});

}

var parse = new dhbParser();

module.exports = {
	parser : parse.parser,
	events : ee
};
