var Dissolve = require('dissolve');
var Concentrate = require('concentrate');
var util = require('util');
var events = require("events");

// our libs
var defs = require("./lib/defs.js");

// Pre and post buffers
// these currently just accumulate, but we'll "process" them in a FIFO queue

// The parser will push the values it's converted from the Buffer here.
var jsonBuffArrayIn = [];

// We will insert readable JSON here to be sent to the glove.
var jsonBuffArrayOut = [];

// this waits for the replies before executing the relevant command; we don't start anything until a reply
// is received
var listenerArray = [];


var exec_in = function(jsonBuff){
    if(jsonBuff.messageId == defs.out.REPLY_FROM_HOST){
        defs.in[jsonBuff.messageId].runIt(jsonBuff);
    } else {
        defs.in[jsonBuff.messageId].runIt(jsonBuff);
        // change the jsonBuff in to a reply here
        //exec_out(jsonBuff);
    }
};

var exec_out = function(jsonBuff){

    if(jsonBuff.messageId == defs.out.REPLY_FROM_HOST){
        // just sending a reply
    } else
    {
        //run concentrate on jsonBuff here....

        //push to listener array
        listenerArray.push({
            commandID   :   jsonBuffIn.commandID,
            obj         :   jsonBuff
        })
    }
};


//
var EventEmitter = events.EventEmitter;
var ee = new EventEmitter();

var syncPacket = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');
var maxLength = 2^24;
var warningLength = 10000;
var waitingForSync = 0;

var bufferCompare = function (a, b) {
    if (!Buffer.isBuffer(a)) return undefined;
    if (!Buffer.isBuffer(b)) return undefined;
    if (typeof a.equals === 'function') return a.equals(b);
    if (a.length !== b.length) return false;

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
        console.log("Checksum is good!");
        return 1;
    } else {
        console.log("ERROR! Expected checksum: " + jsonBuff.checkSum + " Received: " + buffSum)
        return 0;
    }
};


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
                this.vars.totalLength   = this.vars.temp & 0x00FFFFFF;      // converting in to 24 bit integer
                this.vars.checkSum      = this.vars.temp >> 24;             // grabbing the checksum
                delete this.vars.temp;
                if (this.vars.totalLength > 4) {
                    if (this.vars.totalLength >= warningLength && this.vars.totalLength < maxLength) {
                        console.log("I'm getting a big packet of " + this.vars.totalLength + " bytes");
                        this.buffer("raw", this.vars.totalLength - 4)
                    } else if (this.vars.totalLength >= maxLength) {
                        console.log("Something is WAY too big; dropping to sync mode...");
                        //This will consume a lot of events....
                        //this.buffer("raw", this.vars.totalLength - 4)
                        sync(1);
                    } else {
                        this.buffer("raw", this.vars.totalLength - 4)
                    }
                } else {
                    if (this.vars.checkSum === 0x55) {
                        console.log("...sync...")
                    } else {
                        // something is very wrong...
                        sync(1);
                    }
                }
            })
            .tap(function () {
                if (this.vars.checkSum != 0x55 && waitingForSync === 0) {
                    this.push(this.vars);
                } else {
                    // got data, but couldn't push it
                }
                this.vars = Object.create(null);
            })
    };
});

ee.on("addedToBufferIn", function () {
    console.log("event has occured");
    if(null != jsonBuffArrayIn[0]) {
        exec_in(jsonBuffArrayIn[0]);
        jsonBuffArrayIn.shift();
    }
});


parser.on("readable", function() {
    var e;
    while (e = parser.read()) {
        if(dataCheck(e) === 1) {
            //this is UGLY...
            //e.data = new rawParser(e.totalLength, e);
            e.uniqueId = e.raw.readUInt16LE(0);
            e.messageId = e.raw.readUInt16LE(2);
            e.raw = e.raw.slice(4);
            jsonBuffArrayIn.push(e);
            ee.emit("addedToBufferIn");
        } else {
            sync(0);
        }
    }
});

module.exports.parser = parser;


// Test case for the parser
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(new Buffer([0x22, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(new Buffer([0x08, 0x00, 0x00, 0x22, 0x20, 0x0a, 0x03, 0xa0]));
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);
parser.write(syncPacket);


// BLUETOOTH COPYPASTA


var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();
COMMENTED FOR TESTING CLIENT
btSerial.on('found', function(address, name) {
    console.log("Found SPP BT connection...")
    btSerial.findSerialPortChannel(address, function(channel) {
        btSerial.connect(address, channel, function() {
            console.log('Connected on address: ' + address + " @ channel: " + channel);

            setTimeout(function(){
                btSerial.write(syncPacket, function(err, bytesWritten) {
                    if (err) console.log(err);
                });
            }, 10000);

            btSerial.on('data', function(buffer) {
                console.log("Getting some BT data...");
                parser.write(buffer);
            });
        }, function () {
            console.log("Can't connect");
        });
        //console.log("BT closing?")
        // close the connection when you're ready
        //btSerial.close();
    }, function() {
        console.log("Didn't find anything");
    });
});

function tryInquire() {
    console.log("Scanning for bluetooth connections.\n(This is blocking, so be patient!))");
}

// tryInquire();

// mainloop... convert this to a Node Eventloop later
//
//var shutDown = 0;
//var runCount = 0;
//
//while(!shutDown) {
//
//    runCount++;
//}