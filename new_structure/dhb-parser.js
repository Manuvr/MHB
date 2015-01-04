// node modules
var util = require('util');
var events = require('events');
var Readable = require('stream').Readable;

// npm modules
var Dissolve = require('dissolve');

// variables
var syncPacket = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');
var maxLength = 32000;
var warningLength = 10000;
var waitingForSync = 0;

var rs = new Readable;


// helpers
var bufferCompare = function (a, b) {
	if (!Buffer.isBuffer(a)) return undefined;
	if (!Buffer.isBuffer(b)) return undefined;
	if (typeof a.equals === 'function') return a.equals(b);
	if (a.length !== b.length) {
		return false
	}
	for (var i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) return false;
	}
	return true;
};

var sync = function(flag){
	waitingForSync = flag;
	if(waitingForSync === 1){
		console.log("OUT OF SYNC...");
		//send reset command here
	} else {
		console.log("BACK IN SYNC!");
	}
}

var dataCheck = function(jsonBuff){
	var buffSum = 0;
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
		console.log("ERROR! Expected checksum: " + jsonBuff.checkSum + " Received: " + buffSum);
		return 0;
	}
};

// initial parser stream
var parser = Dissolve().loop(function(end) {
	if(waitingForSync === 1 ){
		this.uint8("wait")
			.tap(function(){
				if(this.vars.wait === 0x55){
					this.buffer("check", 4)
						.tap(function(){
							if(bufferCompare(this.vars.check, syncPacket)){
								sync(0);
							}
							this.vars = Object.create(null);
						})
					this.vars = Object.create(null);
				} else {
					this.vars = Object.create(null);
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
				} else {
					if (this.vars.checkSum === 0x55) {
						console.log("sync...")
					} else {
						sync(1);
					}
				}
			})
			.tap(function () {
				if (this.vars.checkSum != 0x55 && waitingForSync === 0) {
					// emits 'readable'
					this.push(this.vars);
				} else {
					// got data, but couldn't push it
				}
				this.vars = Object.create(null);
			})
	}
});

parser.on("readable", function() {
	var e;
	while (e = parser.read()) {
		if(dataCheck(e) === 1) {
			e.uniqueId = e.raw.readUInt16LE(0);
			e.messageId = e.raw.readUInt16LE(2);
			e.raw = e.raw.slice(4);
			//ee.emit("addedToBufferIn");
			rs.push(e);
		} else {
			sync(1);
		}
	}
});

module.exports.write = parser.write();
module.exports.rs = rs.pipe
