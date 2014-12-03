var io = require('socket.io')(80);
var serialport = require("serialport");
var Dissolve = require('dissolve');
var Concentrate = require('concentrate');

// our libs
var defs = require("./lib/defs.js");


// Pre and post buffers
// these currently just accumulate, but we'll "process" them in a FIFO queue

// The Dissolve parser will push the values it's converted from the Buffer here.  We will
// want to have another pass on these values to get "readable" information however...
var jsonBuffArrayIn = [];


// We will insert readable JSON here to be sent to the glove.
// A loop will pull the top array object out, convert it to a Buffer object using Concentrate,
// and ship it out over a serial port
var jsonBuffArrayOut = [];

// this waits for the replies before executing the relevant command
var listenerArray = [];


var exec_in = function(jsonBuff){
    if(jsonBuff.command == defs.out.REPLY_FROM_HOST){
        defs.in[jsonBuff.command].runIt(jsonBuff);
    } else {
        defs.in[jsonBuff.command].runIt(jsonBuff);
        // change the jsonBuff in to a reply here
        //exec_out(jsonBuff);
    }
}

var exec_out = function(jsonBuff){

    if(jsonBuff.command == defs.out.REPLY_FROM_HOST){
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
}

// the big one

var gloveModel = {
    UID         :   0,
    handedness  :   0,
    type        :   0,  // kmap or IMUs... dictates types
    legend      :   {}, // this will contain assignment data to determine what values are "on"
    timestamp   :   0,
    ready       :   0,
    powerMode   :   0,
    baro        :   0,
    IMU_set     :
        {
            wrist   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                temp    :   0
            },
            hand   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                temp    :   0,
                LED     :   0,
                LED_l   :   0
            },
            thumb   :   {
                first  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                second  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                third   :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0,
                    LED     :   0,
                    LED_l   :   0
                }
            },
            index   :   {   //
                first  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                second  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                third   :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0,
                    LED     :   0,
                    LED_l   :   0
                }
            },
            middle  :   {
                first  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                second  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                third   :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0,
                    LED     :   0,
                    LED_l   :   0
                }
            },
            ring    :   {
                first  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                second  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                third   :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0,
                    LED     :   0,
                    LED_l   :   0
                }
            },
            pinky   :   {
                first  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                second  :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0
                },
                third   :   {
                    x       :   0,
                    y       :   0,
                    z       :   0,
                    rx      :   0,
                    ry      :   0,
                    rz      :   0,
                    mx		:   0,
                    my		:   0,
                    mz		:   0,
                    e_x		:   0,
                    e_y		:   0,
                    e_z		:   0,
                    e_rx	:   0,
                    e_ry	:   0,
                    e_rz	:   0,
                    e_mx	:   0,
                    e_my	:   0,
                    e_mz	:   0,
                    temp    :   0,
                    LED     :   0,
                    LED_l   :   0
                }
            }
    }
}



//var SP = serialport.SerialPort;
//var serialPort = new SP("/dev/ttyACM0",
//	{
//		baudrate: 115200,
//		parser: serialport.parsers.readline("\n")
//	}, false);


var parser = Dissolve().loop(function(end) {
    var data_i = 0;
    this.uint16be("command")
        .uint16be("commandId")
        .uint16be("totalLength")
        .uint8be("argCount")
        .loop("args", function(end) {
            if (data_i++ === this.vars.argCount) {
                return end(true);
            }
            var arg_i = 0;

            this.uint8be("argType")
                .uint8be("argLen")
                .tap(function() {
                    switch(this.vars.argType) {
                        case    0x01:       this.sint8("arg");                              break;
                        case    0x02:       this.sint16be("arg");                           break;
                        case    0x03:       this.sint32be("arg");                           break;
                        case    0x04:       this.sint64be("arg");                           break;
                        case    0x05:       // sint128be
                        case    0x06:       this.uint8("arg");                              break;
                        case    0x07:       this.uint16be("arg");                           break;
                        case    0x08:       this.uint32be("arg");                           break;
                        case    0x09:       this.uint64be("arg");                           break;
                        case    0x10:       // uint128be
                        case    0x11:       this.uint8("arg");                              break;
                        case    0x12:       this.floatbe("arg");                            break;
                        case    0x13:       this.doublebe("arg");                           break;
                        case    0x14:       this.string("arg", this.vars.argLen);           break;
                        case    0x15:       // binary buffer
                        case    0x16:       // audio
                        case    0x17:       // image
                        case    0x18:       this.floatbe("x").floatbe("y").floatbe("z");    break;
                        case    0x19:       this.sint16be("x").sint16be("y").sint16be("z"); break;
                        case    0x20:       this.uint16be("x").uint16be("y").uint16be("z"); break;
                        case    0x21:       // pointer type (never see)
                        case    0xFE:       // reply
                        case    0xFF:       // THROW THIS AWAY
                             default:       this.buffer("arg", this.vars.argLen);           break;
                    }
                });
        })
        .uint8be("checkSum")
        .tap(function() {
            this.push(this.vars);
            this.vars = Object.create(null);
        });
});


parser.on("readable", function() {
    var e;
    while (e = parser.read()) {
        jsonBuffArrayIn.push(e);
    }
});

// SERIAL PORT ACTIONS

//serialPort.open(function (error) {
//  if ( error ) {
//    console.log('failed to open: '+error);
//  } else {
//    console.log('open');
//    serialPort.on('data', function(data) {
//      console.log('data received: ' + data);
//      parser.write(data);
//      io.sockets.emit('serial_update', data);
//    });
//    //serialPort.write("ls\n", function(err, results) {
//    //  console.log('err ' + err);
//    //  console.log('results ' + results);
//    //});
//  }
//});


// CONCENTRATE (SENDING BINARY)

var c = Concentrate();

c.on("end", function() {
    //run some function to say we successfully sent it... or start a listener for the response?
    console.log("ended");
});

c.on("readable", function() {
    var e;
    while (e = c.read()) {
        console.log(e);
        //spit "e" out to the streamer
    }
});

// ghetto incrementor
var counter = 0;
var randomID = function(){
    counter++
    return counter;
};

//assemble a "subscribe" message
c.uint16be(defs.out.SESS_SUBCRIBE)           // command
    .uint16be(randomID())                    // commandID
    .uint16be(12)                            // totalLength
    .uint8(1)                                // argCount
    .uint8(defs.arg.a_uint16be)              // argType
    .uint8(2)                                // argLen
    .uint16le(defs.out.LED_WRIST_ON)         // (specific) command code to subscribe to
    .uint8(0)                                // checkSum?
    .flush();                                // what is this doing?
c.uint16be(defs.out.SESS_SUBCRIBE)
    .uint16be(randomID())
    .uint16be(22)
    .uint8(1)
    .uint8(defs.arg.a_uint16be)
    .uint8(2)
    .uint16le(defs.out.LED_WRIST_OFF)
    .uint8(0)
    .flush();

// CONCENTRATE END



// test case for when serial isn't working...
parser.write(new Buffer([0xa0, 0x03, 0x4f, 0xe3, 0x00, 0x0e, 0x01, 0x08, 0x04, 0xea, 0x20, 0x67, 0x00, 0xb6, 0x03, 0x01, 0xf9, 0x5c, 0x00, 0x0b, 0x01, 0x06, 0x01, 0x07, 0xc8, 0xa0, 0x03, 0xad, 0x7d, 0x00, 0x08, 0x00, 0x2a ]));


// mainloop... convert this to a Node Eventloop later

shutDown = 0;

while(!shutDown) {
    if(null != jsonBuffArrayIn[0]) {
        exec_in(jsonBuffArrayIn[0]);
        jsonBuffArrayIn.shift();
    }
}