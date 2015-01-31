
var defs = function(io) {

var util = require('util')

// stick our interpretation functions here for now
// changing pattern to use function from app.js instead of function in inCommand
var runItDefault = function(goods, def){
    var responseMessage = JSON.stringify(goods, null, 2);
    console.log("parsed command: " + def + "\n" + responseMessage);
};
 
var runIt = function(jsonBuffer) {

    // runs the arg parser on our object
    if(commands[jsonBuffer.messageId].def === "LEGEND_MESSAGES"){
        console.log("PARSING LEGEND_MESSAGES... HOLD ON TO YO BUTTS");
        legendParser(jsonBuffer);
        outCommand = buildOutCommands(commands);
        //console.log(buildOutCommands(commands));
        io.sockets.emit('outCommand', outCommand);
        console.log(util.inspect(commands, {depth:null}))

    } else {
        console.log("attempting to parse arguments from raw....")
        jsonBuffer  = argParser(jsonBuffer);
        executeCommand(jsonBuffer);
        var responseMessage = JSON.stringify(jsonBuffer);
        var holdObj = {
            name : commands[jsonBuffer.messageId].def,
            totalLength : jsonBuffer.totalLength,
            checkSum : jsonBuffer.checkSum,
            uniqueId : jsonBuffer.uniqueId,
            messageId : jsonBuffer.messageId,
            raw : jsonBuffer.raw,
            args : jsonBuffer.args
        }
        //console.log("parsed command: " + holdObj.name + "\n" + responseMessage);
        io.sockets.emit('message_update', holdObj);
    }
};

var execute_GENERIC = function (jsonBuff) {
   // set up for generic command 
};

var execute_IMU_MAP_STATE = function(jsonBuff) {
    gm = gloveModel.IMU_set;
    var set = 0;
    var countSets = 0;
    var argObj = jsonBuff.args;      
    console.log(argObj); 
    if(Object.keys(argObj).length === 68) {
        var argObjSub = Object.keys(argObj[Object.keys(argObj)[0]]);
        for (var b = 0; b < Object.keys(gm).length; b++) {
            var imuBase = Object.keys(gm)[b];
            var imuBaseProperties = Object.keys(gm[imuBase]);
            for (f = 0; f < imuBaseProperties.length; f++) {
                    imuBaseReading = imuBaseProperties[f];
                    
                    // deal with error not being included yet
                    if (f < 10) {
                        if (set % 4 === 3) {
                            gm[imuBase][imuBaseReading] = argObj[set];
                        }
                        else {
                            gm[imuBase][imuBaseReading] = argObj[set][argObjSub[countSets]];
                        }

                        // bump counter every 3 readings
                        if (countSets++ % 3  === 2) {
                            set++;
                            countSets = 0;
                        }
                    }
            }
        }
    }
    else {
        console.log("ArgObj not properly sized.");
        return;
    }
    console.log(gm);
    io.sockets.emit('glove_update', gloveModel);
}

var executeCommand = function (jsonBuff) {
    if (commandCallbacks[jsonBuff.messageId].callback != undefined) {
        commandCallbacks[jsonBuff.messageId].callback(jsonBuff);
    }
    else {
        execute_GENERIC(jsonBuff);
    }

};

var legendParser = function(jsonBuff){
    var zeroScanner;
    var zeroLoc;
    var startLoc;
    var i = 0;
    var tempObj = {};
    var parseArr = [];
    var doubleZero;
    var argSize;
    var isDynamic;

    while(i < jsonBuff.raw.length) {
        // this should run once per command sent
        doubleZero = 0;
        tempObj[jsonBuff.raw.readUInt16LE(i)] = {};
        tempObj[jsonBuff.raw.readUInt16LE(i)].flag = jsonBuff.raw.readUInt16LE(i + 2);
        tempObj[jsonBuff.raw.readUInt16LE(i)].argForms = {};
        zeroScanner = i + 4;
        zeroLoc = 0;


        // scan for the zero, and assign the string before it to the label
        while(zeroLoc === 0){
            if(jsonBuff.raw.readUInt8(zeroScanner) === 0x00) {
                zeroLoc = zeroScanner;
            } else {
                zeroScanner++;
            }
        }
        tempObj[jsonBuff.raw.readUInt16LE(i)].def = jsonBuff.raw.toString('ascii', i + 4, zeroLoc);

        // start parsing command type order arrays
        if(jsonBuff.raw.readUInt8(zeroLoc + 1) !== 0x00) {
            while (doubleZero === 0) {
                startLoc = zeroLoc + 1;
                zeroScanner = startLoc;
                zeroLoc = 0;
                argSize = 0;
                isDynamic = 0;

                while (zeroLoc === 0) {
                    if (jsonBuff.raw.readUInt8(zeroScanner) === 0) {
                        zeroLoc = zeroScanner;
                    } else {
                        zeroScanner++;
                    }
                }
                if (jsonBuff.raw.readUInt8(zeroLoc + 1) === 0x00) {
                    doubleZero = 1;
                }

                while (startLoc < zeroLoc) {
                    if (!argRef.hasOwnProperty(jsonBuff.raw.readUInt8(startLoc))) {
                        isDynamic = 1;
                    } else if (argRef[jsonBuff.raw.readUInt8(startLoc)].len === 0) {
                        isDynamic = 1;
                    } else {
                        argSize += argRef[jsonBuff.raw.readUInt8(startLoc)].len;
                    }
                    parseArr.push(jsonBuff.raw.readUInt8(startLoc));
                    startLoc++
                }
                if (isDynamic || argSize === 0) {
                    tempObj[jsonBuff.raw.readUInt16LE(i)].argForms[0] = parseArr;
                } else {
                    tempObj[jsonBuff.raw.readUInt16LE(i)].argForms[argSize] = parseArr;
                }
                parseArr = [];
            }
        }
        i = zeroLoc + 2;
    }
    commands = tempObj;
    console.log("YOU WILL GO TO SPACE TODAY. LEGEND COMMANDS INSERTED SUCCESSFULLY.");
}

var argParser = function(jsonBuff) {
    //console.log(jsonBuff.raw);
    if( commands.hasOwnProperty(jsonBuff.messageId)) {
        var handler = commands[jsonBuff.messageId];

        // check to see if the buffer is empty
        if ([] !== jsonBuff.raw && jsonBuff.raw.length !== 0) {
            // instantiate an output object
            var outObj = {};
            var buffLen = jsonBuff.raw.length;
            //console.log(buffLen);
            var i = 0;
            var parseType;
            var argNum = 0; // assigned property names in outObj

            if (undefined === handler.argForms[buffLen]) {
                if (handler.argForms[0] === undefined) {
                    // length is wrong and no dynamic length type exists
                    console.log("No valid parsing patterns");
                    jsonBuff.args = {};
                    return jsonBuff;
                } else {
                    // assuming a dynamic length arg type
                    while (i < buffLen) {
                        parseType = argRef[handler.argForms[0][argNum]];
                        if (parseType.len === 0) {
                            outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, buffLen));
                            i = buffLen;
                        } else {
                            outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, i + parseType.len));
                            i += parseType.len
                        }
                        argNum++;
                    }
                }
            } else {
                // assuming a fixed length arg type
                while (i < buffLen) {
                    parseType = argRef[handler.argForms[buffLen][argNum]];
                    console.log("i : " + i + " buffLen: " + buffLen);
                    console.log(parseType);
                    outObj[argNum] = parseType.val(jsonBuff.raw.slice(i, i + parseType.len));
                    argNum++;
                    i += parseType.len

                }
            }
            jsonBuff.args = outObj;
        } else {
            // I'm an empty array!
            console.log("No args present");
            jsonBuff.args = {};
            return jsonBuff;
        }
    } else {
        console.log("I don't have a command for this messageID. (no arguments will be parsed) - " +
               jsonBuff.messageId);
    }
    return jsonBuff;
}

// Map for host internal command actions
var commandCallbacks = {
    1: {     },
    2: {     },
    3: {     },
    4: {     },
    5: {     }, 
    16: {    },
    17: {    },
    18: {    },
    19: {    },
    20: {    },
    256: {   },
    257: {   },
    258: {   },
    512: {   },
    768: {   },   
    769: {   },   
    1024: {  },
    1025: {  },
    1026: {  },
    1027: {  },
    1028: {  },
    1029: {  },
    1030: {  },
    1031: {  },
    1032: {  },
    1281: {  },
    4096: {  },
    4097: {  },
    4099: {  },
    4100: {  },
    4101: {  },
    4102: {  },
    8192: {  },
    8345: {  },
    12288: { },
    12290: { },
    16384: { },
    16385: { },
    16386: { },
    16387: { },
    16388: { },
    20480: { },
    20736: { },
    20992: { },
    21248: { },
    21504: { },
    24576: { },
    24577: { },
    24578: { },
    24579: { },
    32768: { },
    40960: { },
    40961: { },
    40962: { }, 
    40963: { },     
    40964: { },
    40965: { },
    40966: { },
    40967: { },
    40968: { }, 
    45056: { }, 
    45057: { }, 
    57344: { }, 
    57345: { }, 
    57346: { }, 
    57347: { }, 
    57348: { }, 
    57349: { }, 
    57360: { }, 
    58401: { callback: execute_IMU_MAP_STATE },
    65533: { }, 
    65534: { }, 
    65535: { }  
}

// THESE ARE THE STATIC COMMANDS UNTIL LEGEND_MESSAGES IS PARSED, IN WHICH CASE THIS IS OVERWRITTEN
var oldCommands = {
    0x0000 : { def: "UNDEFINED", argForms: {} },
    0x0014 : { def: "VERSION_PROTOCOL", argForms: { 4 : [8]  } },
    0x0013 : { def: "VERSION_FIRMWARE", argForms: { 0 : [14] } },
    0xFFFF : { def: "COUNTERPARTY_REPLY", argForms: {} },
    0xE000 : { def: "SESSION_ESTABLISH", argForms: {} },
    0xE001 : { def: "SESSION_HANGUP", argForms: {} },
    0x0011 : { def: "LEGEND_MESSAGES",  argForms: { 0 : [15] }},
    0xFFFE : { def: "PARSE_FAILURE", argForms: {}},
    0xFFFD : { def: "REPLY_RETRY", argForms: {}},

    // example!!!
    0x5555 : { def: "DIGIT_LED_LEVEL",
        argForms: {
            6 : [6, 6, 6, 6, 6, 6],
            5 : [6, 6, 6, 6, 6],
            4 : [6, 6, 6, 6],
            3 : [6, 6, 6],
            2 : [6, 6],
            1 : [6]
        }
    }
}

var commands = {
    1: { flag: 0, argForms: {}, def: 'SYS_BOOT_COMPLETED', modelMap: '' },
    2: { flag: 0, argForms: {}, def: 'SYS_BOOTLOADER' },
    3: { flag: 0, argForms: {}, def: 'SYS_REBOOT' },
    4: { flag: 0, argForms: {}, def: 'SYS_SHUTDOWN' },
    5: { flag: 0, argForms: {}, def: 'SYS_PREALLOCATION' },
    16: { flag: 0, argForms: {}, def: 'LEGEND_TYPES' },
    17: { flag: 0, argForms: { '0': [ 15 ] }, def: 'LEGEND_MESSAGES' },
    18: { flag: 0, argForms: {}, def: 'LEGEND_MAP' },
    19: { flag: 0, argForms: { '0': [ 175 ] }, def: 'VERSION_FIRMWARE' },
    20: { flag: 0, argForms: { '4': [ 8 ] }, def: 'VERSION_PROTOCOL' },
    256: { flag: 0, argForms: {}, def: 'SYS_DATETIME_CHANGED' },
    257: { flag: 0, argForms: {}, def: 'SYS_SET_DATETIME' },
    258: { flag: 0, argForms: {}, def: 'SYS_REPORT_DATETIME' },
    512: { flag: 0, argForms: { '1': [ 6 ] }, def: 'SYS_POWER_MODE' },
    768:
    { flag: 0,
        argForms: { '0': [ 175 ] },
        def: 'SYS_ISSUE_LOG_ITEM' },
    769: { flag: 0, argForms: { '1': [ 6 ] }, def: 'SYS_LOG_VERBOSITY' },
    1024: { flag: 0, argForms: {}, def: 'SCHED_ENABLE_BY_PID' },
    1025: { flag: 0, argForms: {}, def: 'SCHED_DISABLE_BY_PID' },
    1026: { flag: 0, argForms: {}, def: 'SCHED_PROFILER_START' },
    1027: { flag: 0, argForms: {}, def: 'SCHED_PROFILER_STOP' },
    1028: { flag: 0, argForms: {}, def: 'SCHED_PROFILER_DUMP' },
    1029: { flag: 0, argForms: {}, def: 'SCHED_DUMP_META' },
    1030: { flag: 0, argForms: {}, def: 'SCHED_DUMP_SCHEDULES' },
    1031: { flag: 0, argForms: {}, def: 'SCHED_WIPE_PROFILER' },
    1032: { flag: 0, argForms: {}, def: 'SCHED_DEFERRED_EVENT' },
    1281: { flag: 0, argForms: {}, def: 'SPI_QUEUE_READY' },
    4096: { flag: 0, argForms: {}, def: 'BT_CONNECTION_LOST' },
    4097: { flag: 0, argForms: {}, def: 'BT_CONNECTION_GAINED' },
    4099: { flag: 0, argForms: {}, def: 'BT_QUEUE_READY' },
    4100: { flag: 0, argForms: {}, def: 'BT_RX_BUF_NOT_EMPTY' },
    4101: { flag: 0, argForms: {}, def: 'BT_ENTERED_CMD_MODE' },
    4102: { flag: 0, argForms: {}, def: 'BT_EXITED_CMD_MODE' },
    8192: { flag: 0, argForms: {}, def: 'I2C_QUEUE_READY' },
    8345: { flag: 0, argForms: {}, def: 'I2C_DUMP_DEBUG' },
    12288: { flag: 0, argForms: {}, def: 'RNG_BUFFER_EMPTY' },
    12290: { flag: 0, argForms: {}, def: 'INTERRUPTS_MASKED' },
    16384: { flag: 0, argForms: {}, def: 'IMU_IRQ_RAISED' },
    16385: { flag: 0, argForms: { '13': [ 6, 18 ] }, def: 'IMU_DIRTY' },
    16386: { flag: 0, argForms: {}, def: 'IMU_MAP_REQUEST' },
    16387: { flag: 0, argForms: {}, def: 'INIT_IMUS' },
    16388: { flag: 0, argForms: {}, def: 'INIT_KMAP' },
    20480: { flag: 0, argForms: {}, def: 'SENSOR_INA219' },
    20736: { flag: 0, argForms: {}, def: 'SENSOR_ISL29033' },
    20992: { flag: 0, argForms: {}, def: 'SENSOR_LPS331' },
    21248: { flag: 0, argForms: {}, def: 'SENSOR_SI7021' },
    21504: { flag: 0, argForms: {}, def: 'SENSOR_TMP006' },
    24576: { flag: 0, argForms: {}, def: 'KMAP_PENDING_FRAME' },
    24577: { flag: 0, argForms: {}, def: 'KMAP_USER_CHANGED' },
    24578: { flag: 0, argForms: {}, def: 'KMAP_BIOMETRIC_MATCH' },
    24579: { flag: 0, argForms: {}, def: 'KMAP_BIOMETRIC_NULL' },
    32768: { flag: 0, argForms: {}, def: 'OLED_DIRTY_FRAME_BUF' },
    40960:
    { flag: 0,
        argForms: { '2': [ 7 ], '3': [ 7, 6 ] },
        def: 'GPIO_VIBRATE_0' },
    40961:
    { flag: 0,
        argForms: { '2': [ 7 ], '3': [ 7, 6 ] },
        def: 'GPIO_VIBRATE_1' },
    40962: { flag: 0, argForms: {}, def: 'LED_WRIST_OFF' },
    40963: { flag: 0, argForms: {}, def: 'LED_WRIST_ON' },
    40964:
    { flag: 0,
        argForms:
        { '1': [ 6 ],
            '2': [ 6, 6 ],
            '3': [ 6, 6, 6 ],
            '4': [ 6, 6, 6, 6 ],
            '5': [ 6, 6, 6, 6, 6 ],
            '6': [ 6, 6, 6, 6, 6, 6 ] },
        def: 'LED_DIGITS_OFF' },
    40965:
    { flag: 0,
        argForms:
        { '1': [ 6 ],
            '2': [ 6, 6 ],
            '3': [ 6, 6, 6 ],
            '4': [ 6, 6, 6, 6 ],
            '5': [ 6, 6, 6, 6, 6 ],
            '6': [ 6, 6, 6, 6, 6, 6 ] },
        def: 'LED_DIGITS_ON' },
    40966:
    { flag: 0,
        argForms:
        { '7': [ 8, 2, 6 ],
            '8': [ 8, 2, 6, 6 ],
            '9': [ 8, 2, 6, 6, 6 ],
            '10': [ 8, 2, 6, 6, 6, 6 ],
            '11': [ 8, 2, 6, 6, 6, 6, 6 ],
            '12': [ 8, 2, 6, 6, 6, 6, 6, 6 ] },
        def: 'LED_PULSE' },
    40967:
    { flag: 0,
        argForms: { '1': [ 6 ], '5': [ 6, 8 ], '7': [ 6, 8, 2 ] },
        def: 'LED_DIGIT_LEVEL' },
    40968: { flag: 0, argForms: { '1': [ 6 ] }, def: 'LED_MODE' },
    45056: { flag: 0, argForms: {}, def: 'SD_EJECTED' },
    45057: { flag: 0, argForms: {}, def: 'SD_INSERTED' },
    57344: { flag: 0, argForms: {}, def: 'SESS_ESTABLISHED' },
    57345: { flag: 0, argForms: {}, def: 'SESS_HANGUP' },
    57346: { flag: 0, argForms: {}, def: 'SESS_AUTH_CHALLENGE' },
    57347: { flag: 0, argForms: {}, def: 'SESS_SUBCRIBE' },
    57348: { flag: 0, argForms: {}, def: 'SESS_UNSUBCRIBE' },
    57349: { flag: 0, argForms: {}, def: 'SESS_DUMP_DEBUG' },
    57360: { flag: 0, argForms: {}, def: 'SESS_ORIGINATE_MSG' },
    58401:
    { flag: 0,
        argForms: { '680': [18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12,
                            18, 18, 18, 12,
                            18, 18, 18, 12,
                            18, 18, 18, 12,
                            18, 18, 18, 12,
                            18, 18, 18, 12,
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12, 
                            18, 18, 18, 12]},
        def: 'IMU_MAP_STATE'},
    65533: { flag: 0, argForms: {}, def: 'REPLY_PARSE_FAIL' },
    65534: { flag: 0, argForms: {}, def: 'REPLY_RETRY' },
    65535: { flag: 0, argForms: {}, def: 'COUNTERPARTY_REPLY' } }


// Don't worry, we're going to change these default runIt's
var inCommand = {
    0xFFFF : { def: "REPLY_FROM_HOST                   " , runIt: function(goods){runItDefault(goods, this.def) }},   // This denotes that the packet that follows is a reply.
    0x0000 : { def: "UNDEFINED                         " , runIt: function(goods){runItDefault(goods, this.def) }},   //
    0x0001 : { def: "SYS_BOOT_COMPLETED                " , runIt: function(goods){runItDefault(goods, this.def) }},   // Raised when bootstrap is finished.
    0x0002 : { def: "SYS_BOOTLOADER                    " , runIt: function(goods){runItDefault(goods, this.def) }},   // Reboots into the STM32F4 bootloader.
    0x0003 : { def: "SYS_REBOOT                        " , runIt: function(goods){runItDefault(goods, this.def) }},   // Reboots into THIS program.
    0x0004 : { def: "SYS_SHUTDOWN                      " , runIt: function(goods){runItDefault(goods, this.def) }},   // Raised when the system is pending complete shutdown.
    0x0005 : { def: "SYS_PREALLOCATION                 " , runIt: function(goods){runItDefault(goods, this.def) }},   // Any classes that do preallocation should listen for this.
    0x0006 : { def: "SYS_ADVERTISE_SRVC                " , runIt: function(goods){runItDefault(goods, this.def) }},   // A system service might feel the need to advertise it's arrival.
    0x0007 : { def: "SYS_RETRACT_SRVC                  " , runIt: function(goods){runItDefault(goods, this.def) }},   // A system service sends this to tell others to stop using it.
    0x0011 : { def: "LEGEND_MESSAGES"                    , runIt: function(goods){runItDefault(goods, this.def) }},   // derp
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
    0x0500 : { def: "IMU_HIERARCHY                     " , runIt: function(goods){runItDefault(goods, this.def) }},   // Triggers the imu heiarchy from host side
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
var oldOutCommand = {
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

var buildOutCommands = function(obj){
    new_obj = {};
    for (var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            new_obj[obj[prop].def] = parseInt(prop);
        }
    }
    return new_obj;
};

var outCommand = buildOutCommands(commands);

var argRef = {
    0     :   { len: 0},
    1     :   { len: 1, val: function(buff){return buff.readInt8(0)}},
    2     :   { len: 2, val: function(buff){return buff.readInt16LE(0)}},
    3     :   { len: 4, val: function(buff){return buff.readInt32LE(0)}},
    4     :   { len: 8, val: function(buff){return (buff.readInt32LE(0) + (buff.readInt32LE(4)  << 8))}}, // this kind of works... but can't handle real 64bit ints
    5     :   { len: 16, val: function(buff){return 0}}, // 128bit int... not going to work
    6     :   { len: 1, val: function(buff){return buff.readUInt8(0)}} ,
    7     :   { len: 2, val: function(buff){return buff.readUInt16LE(0)}},
    8     :   { len: 4, val: function(buff){return buff.readUInt32LE(0)}},
    9     :   { len: 8, val: function(buff){return 0}}, // unsigned 64bit int
    10    :   { len: 16, val: function(buff){return 0}}, // unsigned 128bit int
    11    :   { len: 1, val: function(buff){return buff.readInt8(0)}}, // boolean
    12    :   { len: 4, val: function(buff){return buff.readFloatLE(0)}},
    13    :   { len: 8, val: function(buff){return buff.readDoubleLE(0)}},
    14    :   { len: 0, val: function(buff){return buff.toString('ascii')}}   ,
    15    :   { len: 0, val: function(buff){return buff}} ,   // binary blob
    16    :   { len: 0, val: function(buff){return 0}} ,   // AUDIO
    17    :   { len: 0, val: function(buff){return 0}},    // IMAGE
    18    :   { len: 12,val: function(buff){return {x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8)}}},    // Vector3 formats
    19    :   { len: 6, val: function(buff){return {x: buff.readInt16LE(0), y: buff.readInt16LE(2), z: buff.readInt16LE(4)}}},
    20    :   { len: 6, val: function(buff){return {x: buff.readUInt16LE(0), y: buff.readUInt16LE(2), z: buff.readUInt16LE(4)}}},
    21    :   { len: 0, val: function(buff){return buff}}, // MAP
    0xFE  :   null  // REPLY?
};

var arg = {
    a_sint8       :   01,
    a_sint16le    :   02,
    a_sin32le     :   03,
    a_sint64le    :   04,
    a_sint128le   :   05,
    a_uint8       :   06,
    a_uint16le    :   07,
    a_uint32le    :   08,
    a_uint64le    :   09,
    a_uint128le   :   10,
    a_boolean     :   11, // this is actually a uint8, but it will be used as a boolean
    a_floatle     :   12,
    a_doublele    :   13,
    a_stringType  :   14,
    a_binaryBuffer:   15,
    a_audio       :   16,
    a_image       :   17,
    a_floatbeXYZ  :   18,
    a_sint16leXYZ :   19,
    a_uint16leXYZ :   20,
    a_pointerType :   21,
    a_reply       :   0xFE,
    a_tossThis    :   0xFF
};

var gloveModel = {
    UID         :   0,
    handedness  :   0,
    type        :   0,  // kmap or IMUs... dictates types
    legend      :   [], // this will contain assignment data to determine what values are "on"
    timestamp   :   0,
    ready       :   0,
    powerMode   :   0,
    baro        :   0,
    version     :   0,
    versionPro  :   0,
    IMU_set     :
    {
            CARPALS   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            METACARPALS  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            },
            PP_1  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            IP_1   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            DP_1  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            },
        
        PP_2   :   {
            x       :   0,
            y       :   0,
            z       :   0,
            rx      :   0,
            ry      :   0,
            rz      :   0,
            mx		:   0,
            my		:   0,
            mz		:   0,
            temp    :   0,
            e_x		:   0,
            e_y		:   0,
            e_z		:   0,
            e_rx	:   0,
            e_ry	:   0,
            e_rz	:   0,
            e_mx	:   0,
            e_my	:   0,
            e_mz	:   0
        },
        IP_2   :   {
            x       :   0,
            y       :   0,
            z       :   0,
            rx      :   0,
            ry      :   0,
            rz      :   0,
            mx		:   0.1,
            my		:   0,
            mz		:   0,
            temp    :   0,
            e_x		:   0,
            e_y		:   0,
            e_z		:   0,
            e_rx	:   0,
            e_ry	:   0,
            e_rz	:   0,
            e_mx	:   0,
            e_my	:   0,
            e_mz	:   0
        },
            DP_2  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            },
            PP_3  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            IP_3   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            DP_3  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            },
            PP_4  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            IP_4   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            DP_4  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            },
            PP_5  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            IP_5   :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0
            },
            DP_5  :   {
                x       :   0,
                y       :   0,
                z       :   0,
                rx      :   0,
                ry      :   0,
                rz      :   0,
                mx		:   0,
                my		:   0,
                mz		:   0,
                temp    :   0,
                e_x		:   0,
                e_y		:   0,
                e_z		:   0,
                e_rx	:   0,
                e_ry	:   0,
                e_rz	:   0,
                e_mx	:   0,
                e_my	:   0,
                e_mz	:   0,
                LED     :   0,
                LED_l   :   0
            }
    }
};


//return {
//    inCommand: inCommand,
//    outCommand: outCommand,
//    arg: arg,
//    gloveModel: gloveModel,
//    runIt: runIt,
//    io: io
//};

    module.exports.inCommand = inCommand;
    module.exports.outCommand = outCommand;
    module.exports.arg = arg;
    module.exports.gloveModel = gloveModel;
    module.exports.runIt = runIt;
    module.exports.io = io;
    module.exports.execute_IMU_MAP_STATE = execute_IMU_MAP_STATE;

}

module.exports = defs;
