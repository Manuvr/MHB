var app = require('http').createServer(handler);
var url= require('url');
var fs = require('fs');
var io = require('socket.io').listen(app);
var Dissolve = require('dissolve');
var Concentrate = require('concentrate');
var serialport = require("serialport");
var dgram = require("dgram");
//var enum = require("enum");


// stick our interpretation functions here for now
var runItDefault = function(goods, def){console.log("hi from " + def + "\n" + JSON.stringify(goods, null, 2))};

// Don't worry, we're going to change these default runIt's
var in_def = {
    0xFFFF : { def: "REPLY_FROM_HOST                   " , runIt: function(goods){runItDefault(goods, this.def) }},   // This denotes that the packet that follows is a reply.
    0x0000 : { def: "UNDEFINED                         " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x0001 : { def: "SYS_BOOT_COMPLETED                " , runIt: function(goods){runItDefault(goods, this.def) }},   // Raised when bootstrap is finished.
    0x0002 : { def: "SYS_BOOTLOADER                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // Reboots into the STM32F4 bootloader.
    0x0003 : { def: "SYS_REBOOT                        " , runIt: function(goods){runItDefault(goods, this.def) }},   // Reboots into THIS program.
    0x0004 : { def: "SYS_SHUTDOWN                      " , runIt: function(goods){runItDefault(goods, this.def) }},   // Raised when the system is pending complete shutdown.
    0x0005 : { def: "SYS_PREALLOCATION                 " , runIt: function(goods){runItDefault(goods, this.def) }},   // Any classes that do preallocation should listen for this.
    0x0006 : { def: "SYS_ADVERTISE_SRVC                " , runIt: function(goods){runItDefault(goods, this.def) }},   // A system service might feel the need to advertise it's arrival.
    0x0007 : { def: "SYS_RETRACT_SRVC                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // A system service sends this to tell others to stop using it.
    0x0100 : { def: "SYS_DATETIME_CHANGED              " , runIt: function(goods){runItDefault(goods, this.def) }},   // Raised when the system time changes.
    0x0101 : { def: "SYS_SET_DATETIME                  " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x0102 : { def: "SYS_REPORT_DATETIME               " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x0200 : { def: "SYS_POWER_MODE_0                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // The system wants to enter power mode 0 (full-throttle).
    0x0201 : { def: "SYS_POWER_MODE_1                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // The system wants to enter power mode 1 (general-use).
    0x0202 : { def: "SYS_POWER_MODE_2                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // The system wants to enter power mode 2 (idle).
    0x0203 : { def: "SYS_POWER_MODE_3                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // The system wants to enter power mode 3 (sleep).
    0x0300 : { def: "SYS_ISSUE_LOG_ITEM                " , runIt: function(goods){runItDefault(goods, this.def) }},   // Classes emit this to get their log data saved/sent.
    0x0301 : { def: "SYS_LOG_VERBOSITY                 " , runIt: function(goods){runItDefault(goods, this.def) }},   // This tells client classes to adjust their log verbosity.
    0x0400 : { def: "SCHED_ENABLE_BY_PID               " , runIt: function(goods){runItDefault(goods, this.def) }},   // The given PID is being enabled.
    0x0401 : { def: "SCHED_DISABLE_BY_PID              " , runIt: function(goods){runItDefault(goods, this.def) }},   // The given PID is being disabled.
    0x0402 : { def: "SCHED_PROFILER_START              " , runIt: function(goods){runItDefault(goods, this.def) }},   // We want to profile the given PID.
    0x0403 : { def: "SCHED_PROFILER_STOP               " , runIt: function(goods){runItDefault(goods, this.def) }},   // We want to stop profiling the given PID.
    0x0404 : { def: "SCHED_PROFILER_DUMP               " , runIt: function(goods){runItDefault(goods, this.def) }},   // Dump the profiler data for all PIDs (no args) or given PIDs.
    0x0405 : { def: "SCHED_DUMP_META                   " , runIt: function(goods){runItDefault(goods, this.def) }},   // Tell the Scheduler to dump its meta metrics.
    0x0406 : { def: "SCHED_DUMP_SCHEDULES              " , runIt: function(goods){runItDefault(goods, this.def) }},   // Tell the Scheduler to dump schedules.
    0x0407 : { def: "SCHED_WIPE_PROFILER               " , runIt: function(goods){runItDefault(goods, this.def) }},   // Tell the Scheduler to wipe its profiler data. Pass PIDs to be selective.
    0x0408 : { def: "SCHED_DEFERRED_EVENT              " , runIt: function(goods){runItDefault(goods, this.def) }},   // Tell the Scheduler to broadcast the attached Event so many ms into the future.
    0x0409 : { def: "SCHED_DEFINE                      " , runIt: function(goods){runItDefault(goods, this.def) }},   // Define a new Schedule. Implies a return code. Careful...
    0x040A : { def: "SCHED_DELETE                      " , runIt: function(goods){runItDefault(goods, this.def) }},   // Deletes an existing.
    0x1000 : { def: "BT_CONNECTION_LOST                " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x1001 : { def: "BT_CONNECTION_GAINED              " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x1002 : { def: "BT_PREALLOCATATION                " , runIt: function(goods){runItDefault(goods, this.def) }},   // The RN42 class consumed its spare memory.
    0x1003 : { def: "BT_QUEUE_READY                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // There is action possible in the bluetooth queue.
    0x1004 : { def: "BT_RX_BUF_NOT_EMPTY               " , runIt: function(goods){runItDefault(goods, this.def) }},   // The host sent us data without indication of an end.
    0x1005 : { def: "BT_ENTERED_CMD_MODE               " , runIt: function(goods){runItDefault(goods, this.def) }},   // The module entered command mode.
    0x1006 : { def: "BT_EXITED_CMD_MODE                " , runIt: function(goods){runItDefault(goods, this.def) }},   // The module exited command mode.
    0x2000 : { def: "I2C_QUEUE_READY                   " , runIt: function(goods){runItDefault(goods, this.def) }},   // The i2c queue is ready for attention.
    0x2099 : { def: "I2C_DUMP_DEBUG                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // Debug dump for i2c.
    0x3000 : { def: "RNG_BUFFER_EMPTY                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // The RNG couldn't keep up with our entropy demands.
    0x3002 : { def: "INTERRUPTS_MASKED                 " , runIt: function(goods){runItDefault(goods, this.def) }},   // Anything that depends on interrupts is now broken.
    0x4000 : { def: "IMU_IRQ_RAISED                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // IRQ asserted by CPLD.
    0x4001 : { def: "IMU_DIRTY                         " , runIt: function(goods){runItDefault(goods, this.def) }},   // An IMU has pending data.
    0x4002 : { def: "IMU_MAP_REQUEST                   " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x4003 : { def: "INIT_IMUS                         " , runIt: function(goods){runItDefault(goods, this.def) }},   // Signal to build the IMUs.
    0x4004 : { def: "INIT_KMAP                         " , runIt: function(goods){runItDefault(goods, this.def) }},   // Signal to build the k-map.
    0x5000 : { def: "SENSOR_INA219                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // The current sensor has something to say.
    0x5001 : { def: "UNDEFINEDULUM_MSG_SENSOR_ISL29033 " , runIt: function(goods){runItDefault(goods, this.def) }},   // The light sensor has something to say.
    0x5002 : { def: "SENSOR_LPS331                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // The baro sensor has something to say.
    0x5003 : { def: "SENSOR_SI7021                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // The humidity sensor has something to say.
    0x5004 : { def: "SENSOR_TMP006                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // The thermopile has something to say.
    0x6000 : { def: "KMAP_PENDING_FRAME                " , runIt: function(goods){runItDefault(goods, this.def) }},   // The K-Map has a completed frame waiting.
    0x6001 : { def: "KMAP_USER_CHANGED                 " , runIt: function(goods){runItDefault(goods, this.def) }},   // The K-Map has detected a user change.
    0x6002 : { def: "KMAP_BIOMETRIC_MATCH              " , runIt: function(goods){runItDefault(goods, this.def) }},   // The K-Map has biometrically validated the current user.
    0x6003 : { def: "KMAP_BIOMETRIC_NULL               " , runIt: function(goods){runItDefault(goods, this.def) }},   // The K-Map has lost a biometric fix on the current user.
    0x8000 : { def: "OLED_DIRTY_FRAME_BUF              " , runIt: function(goods){runItDefault(goods, this.def) }},   // Something changed the framebuffer and we need to redraw.
    0x9001 : { def: "COM_HOST_AUTH                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // Something changed the framebuffer and we need to redraw.
    0xA000 : { def: "GPIO_VIBRATE_0                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class wants to trigger vibrator 0.
    0xA001 : { def: "GPIO_VIBRATE_1                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class wants to trigger vibrator 1.
    0xA002 : { def: "LED_WRIST_OFF                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class is wanting to turn the wrist LED off.
    0xA003 : { def: "LED_WRIST_ON                      " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class is wanting to turn the wrist LED on.
    0xA004 : { def: "LED_DIGITS_FULL_OFF               " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class is wanting to turn the digit LEDs off.
    0xA005 : { def: "LED_DIGITS_FULL_ON                " , runIt: function(goods){runItDefault(goods, this.def) }},   // Some class is wanting to turn the digit LEDs on.
    0xB000 : { def: "SD_EJECTED                        " , runIt: function(goods){runItDefault(goods, this.def) }},   // The SD card was just ejected.
    0xB001 : { def: "SD_INSERTED                       " , runIt: function(goods){runItDefault(goods, this.def) }},   // An SD card was inserted.
    0xE000 : { def: "SESS_ESTABLISHED                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // Session established.
    0xE001 : { def: "SESS_HANGUP                       " , runIt: function(goods){runItDefault(goods, this.def) }},   // Session hangup.
    0xE002 : { def: "SESS_AUTH_CHALLENGE               " , runIt: function(goods){runItDefault(goods, this.def) }},   // A code for challenge-response authentication.
    0xE003 : { def: "SESS_SUBCRIBE                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // Used to subscribe this session to other events.
    0xE004 : { def: "SESS_UNSUBCRIBE                   " , runIt: function(goods){runItDefault(goods, this.def) }},   // Used to unsubscribe this session from other events.
    0xE005 : { def: "SESS_DUMP_DEBUG                   " , runIt: function(goods){runItDefault(goods, this.def) }}   // Cause the XenoSession to dump its debug data.
}

// dat duplicate code doe
var out_def = {
    REPLY_FROM_HOST             : 0xFFFF,   // This denotes that the packet that follows is a reply.
    UNDEFINED                   : 0x0000,   //
    SYS_BOOT_COMPLETED          : 0x0001,   // Raised when bootstrap is finished.
    SYS_BOOTLOADER              : 0x0002,   // Reboots into the STM32F4 bootloader.
    SYS_REBOOT                  : 0x0003,   // Reboots into THIS program.
    SYS_SHUTDOWN                : 0x0004,   // Raised when the system is pending complete shutdown.
    SYS_PREALLOCATION           : 0x0005,   // Any classes that do preallocation should listen for this.
    SYS_ADVERTISE_SRVC          : 0x0006,   // A system service might feel the need to advertise it's arrival.
    SYS_RETRACT_SRVC            : 0x0007,   // A system service sends this to tell others to stop using it.
    SYS_DATETIME_CHANGED        : 0x0100,   // Raised when the system time changes.
    SYS_SET_DATETIME            : 0x0101,   //
    SYS_REPORT_DATETIME         : 0x0102,   //
    SYS_POWER_MODE_0            : 0x0200,   // The system wants to enter power mode 0 (full-throttle).
    SYS_POWER_MODE_1            : 0x0201,   // The system wants to enter power mode 1 (general-use).
    SYS_POWER_MODE_2            : 0x0202,   // The system wants to enter power mode 2 (idle).
    SYS_POWER_MODE_3            : 0x0203,   // The system wants to enter power mode 3 (sleep).
    SYS_ISSUE_LOG_ITEM          : 0x0300,   // Classes emit this to get their log data saved/sent.
    SYS_LOG_VERBOSITY           : 0x0301,   // This tells client classes to adjust their log verbosity.
    SCHED_ENABLE_BY_PID         : 0x0400,   // The given PID is being enabled.
    SCHED_DISABLE_BY_PID        : 0x0401,   // The given PID is being disabled.
    SCHED_PROFILER_START        : 0x0402,   // We want to profile the given PID.
    SCHED_PROFILER_STOP         : 0x0403,   // We want to stop profiling the given PID.
    SCHED_PROFILER_DUMP         : 0x0404,   // Dump the profiler data for all PIDs (no args) or given PIDs.
    SCHED_DUMP_META             : 0x0405,   // Tell the Scheduler to dump its meta metrics.
    SCHED_DUMP_SCHEDULES        : 0x0406,   // Tell the Scheduler to dump schedules.
    SCHED_WIPE_PROFILER         : 0x0407,   // Tell the Scheduler to wipe its profiler data. Pass PIDs to be selective.
    SCHED_DEFERRED_EVENT        : 0x0408,   // Tell the Scheduler to broadcast the attached Event so many ms into the future.
    SCHED_DEFINE                : 0x0409,   // Define a new Schedule. Implies a return code. Careful...
    SCHED_DELETE                : 0x040A,   // Deletes an existing.
    BT_CONNECTION_LOST          : 0x1000,   //
    BT_CONNECTION_GAINED        : 0x1001,   //
    BT_PREALLOCATATION          : 0x1002,   // The RN42 class consumed its spare memory.
    BT_QUEUE_READY              : 0x1003,   // There is action possible in the bluetooth queue.
    BT_RX_BUF_NOT_EMPTY         : 0x1004,   // The host sent us data without indication of an end.
    BT_ENTERED_CMD_MODE         : 0x1005,   // The module entered command mode.
    BT_EXITED_CMD_MODE          : 0x1006,   // The module exited command mode.
    I2C_QUEUE_READY             : 0x2000,   // The i2c queue is ready for attention.
    I2C_DUMP_DEBUG              : 0x2099,   // Debug dump for i2c.
    RNG_BUFFER_EMPTY            : 0x3000,   // The RNG couldn't keep up with our entropy demands.
    INTERRUPTS_MASKED           : 0x3002,   // Anything that depends on interrupts is now broken.
    IMU_IRQ_RAISED              : 0x4000,   // IRQ asserted by CPLD.
    IMU_DIRTY                   : 0x4001,   // An IMU has pending data.
    IMU_MAP_REQUEST             : 0x4002,   //
    INIT_IMUS                   : 0x4003,   // Signal to build the IMUs.
    INIT_KMAP                   : 0x4004,   // Signal to build the k-map.
    SENSOR_INA219               : 0x5000,   // The current sensor has something to say.
    UNDEFINEDULUM_MSG_SENSOR_ISL: 0x5001,   // The light sensor has something to say.
    SENSOR_LPS331               : 0x5002,   // The baro sensor has something to say.
    SENSOR_SI7021               : 0x5003,   // The humidity sensor has something to say.
    SENSOR_TMP006               : 0x5004,   // The thermopile has something to say.
    KMAP_PENDING_FRAME          : 0x6000,   // The K-Map has a completed frame waiting.
    KMAP_USER_CHANGED           : 0x6001,   // The K-Map has detected a user change.
    KMAP_BIOMETRIC_MATCH        : 0x6002,   // The K-Map has biometrically validated the current user.
    KMAP_BIOMETRIC_NULL         : 0x6003,   // The K-Map has lost a biometric fix on the current user.
    OLED_DIRTY_FRAME_BUF        : 0x8000,   // Something changed the framebuffer and we need to redraw.
    COM_HOST_AUTH               : 0x9001,   // Something changed the framebuffer and we need to redraw.
    GPIO_VIBRATE_0              : 0xA000,   // Some class wants to trigger vibrator 0.
    GPIO_VIBRATE_1              : 0xA001,   // Some class wants to trigger vibrator 1.
    LED_WRIST_OFF               : 0xA002,   // Some class is wanting to turn the wrist LED off.
    LED_WRIST_ON                : 0xA003,   // Some class is wanting to turn the wrist LED on.
    LED_DIGITS_FULL_OFF         : 0xA004,   // Some class is wanting to turn the digit LEDs off.
    LED_DIGITS_FULL_ON          : 0xA005,   // Some class is wanting to turn the digit LEDs on.
    SD_EJECTED                  : 0xB000,   // The SD card was just ejected.
    SD_INSERTED                 : 0xB001,   // An SD card was inserted.
    SESS_ESTABLISHED            : 0xE000,   // Session established.
    SESS_HANGUP                 : 0xE001,   // Session hangup.
    SESS_AUTH_CHALLENGE         : 0xE002,   // A code for challenge-response authentication.
    SESS_SUBCRIBE               : 0xE003,   // Used to subscribe this session to other events.
    SESS_UNSUBCRIBE             : 0xE004,   // Used to unsubscribe this session from other events.
    SESS_DUMP_DEBUG             : 0xE005   // Cause the XenoSession to dump its debug data.
};


var jsonbuff = [];

var SP = serialport.SerialPort;
var serialPort = new SP("/dev/ttyACM0",
	{
		baudrate: 115200,
		parser: serialport.parsers.readline("\n")
	}, false);

// NODE byte

var udp_socket = dgram.createSocket('udp4');


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
                //.loop( function(end) {
                //if (arg_i++ === this.vars.argLen) {
                //    return end(true);
                //}
                //
                //this.tap(function(){
                //    this.buffer("arg", arg_Len)
                //}
                //});
        })
        .uint8be("checkSum")
        .tap(function() {
            this.push(this.vars);
            this.vars = Object.create(null);
        });
});

var processParser = function(JSONbinary) {

    in_def[JSONbinary.command].runIt(JSONbinary);

    return 0;
};

parser.on("readable", function() {
    var e;
    while (e = parser.read()) {

        //console.log(JSON.stringify(e, null, 2));
        //io.sockets.emit(JSON.stringify(e, null, 2));
        //console.log(e);
        processParser(e);
        jsonbuff.push(e);
    }
});


serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: '+error);
  } else {
    console.log('open');
    serialPort.on('data', function(data) {
      console.log('data received: ' + data);
      parser.write(data);
      io.sockets.emit('serial_update', data);
    });
    //serialPort.write("ls\n", function(err, results) {
    //  console.log('err ' + err);
    //  console.log('results ' + results);
    //});
  }
});

// Http handler function
function handler (req, res) {
    
    // Using URL to parse the requested URL
    var path = url.parse(req.url).pathname;
    
    // Managing the root route
    if (path == '/') {
        index = fs.readFile(__dirname+'/public/index.html', 
            function(error,data) {
                
                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load index.html");
                }
                
                res.writeHead(200,{'Content-Type': 'text/html'});
                res.end(data);
            });

    // Managing the route for the javascript files
    } else if( /\.(js)$/.test(path) ) {
        index = fs.readFile(__dirname+'/public'+path, 
            function(error,data) {
                
                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load " + path);
                }
                
                res.writeHead(200,{'Content-Type': 'text/plain'});
                res.end(data);
            });
    } else {
        res.writeHead(404);
        res.end("Error: 404 - File not found.");
    }
    
}


// Web Socket Connection
io.sockets.on('connection', function (socket) {
    
  // If we recieved a command from a client to start watering lets do so
  socket.on('ping', function(data) {
      console.log("ping");
      
      delay = data["duration"];
      
      // Set a timer for when we should stop watering
      setTimeout(function(){
          socket.emit("pong");
      }, delay * 1);
      
  });

});

udp_socket.on('message', function(content, rinfo) {
	console.log('UDP byte ', content, ' from ', rinfo.address, rinfo.port, ' JSON or rinfo ', JSON.stringify(rinfo));
	io.sockets.emit('udp_update', content.toString("utf8", 0, rinfo.size));
});



// CONCENTRATE STUFF

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
    return counter++;
};

//assemble a "subscribe" message
c.uint16be(out_def.SESS_SUBCRIBE)           //command
    .uint16be(randomID())                                //commandID
    .uint16be(12)                               //totalLength
    .uint8(1)                                 //argCount
    .uint8(0x07)                                 //argType
    .uint8(2)                                 //argLen
    .uint16le(out_def.LED_WRIST_ON)             // (specific) command code to subscribe to
    .uint8(0)                                  //checkSum?
    .flush().end();                             // what is this doing?

// CONCENTRATE END






// test case for when serial isn't working...
parser.write(new Buffer([0xa0, 0x03, 0x4f, 0xe3, 0x00, 0x0e, 0x01, 0x08, 0x04, 0xea, 0x20, 0x67, 0x00, 0xb6, 0x03, 0x01, 0xf9, 0x5c, 0x00, 0x0b, 0x01, 0x06, 0x01, 0x07, 0xc8, 0xa0, 0x03, 0xad, 0x7d, 0x00, 0x08, 0x00, 0x2a ]));



// Listens and binds
app.listen(5000);
udp_socket.bind(1900);