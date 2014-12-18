
var defs = function(io) {

// stick our interpretation functions here for now
// changing pattern to use function from app.js instead of function in inCommand
var runItDefault = function(goods, def){
    var responseMessage = JSON.stringify(goods, null, 2);
    console.log("parsed command: " + def + "\n" + responseMessage);
};
var runIt = function(jsonBuffer) {
    var responseMessage = JSON.stringify(jsonBuffer);
    var holdObj = {
        name : inCommand[jsonBuffer.messageId].def,
        totalLength : jsonBuffer.totalLength,
        checkSum : jsonBuffer.checkSum,
        uniqueId : jsonBuffer.uniqueId,
        messageId : jsonBuffer.messageId,
        raw : jsonBuffer.raw
    }
    console.log("parsed command: " + holdObj.name + "\n" + responseMessage);
    io.sockets.emit('message_update', holdObj);
};


var argParser = function(jsonBuff) {

    var handler = staticCommand[jsonBuff.messageID];

    // check to see if the buffer is emtpy
    if([] !== jsonBuff.raw && jsonBuff.raw.length !== 0){
        // instantiate an output object
        var outObj =  {};
        outObj["def"] = handler.def;
        var iStart = 0;
        var argArrPos = 0;

        for(var i = 0; i < jsonBuff.raw.length; i++){

            // check for the first 0x00 you can find
            if(jsonBuff.raw.readUInt8(i) === 0x00){

                //if you find a second 0x00 in a row, you're done: return the object
                if(jsonBuff.raw.readUInt8(i + 1) === 0x00){
                    return outObj;
                } else {





                    argRef[handler.argForm[argArrPos]].val(
                        jsonBuff.raw.slice(iStart, i)
                    )



                    iStart = i;

                }
            }
        }



    } else {
        // I'm an empty array!

    }
    return outObj;
}


// Thinking on this...
// perhaps we should have an argument configuration
var staticCommand = {
    0x0000 : { def: "UNDEFINED" },
    0x0014 : { def: "VERSION_PROTOCOL", argForm: [0x08, 0, 0] },
    0x0013 : { def: "VERSION_FIRMWARE", argForm: [0x14, 0, 0] },
    0xFFFF : { def: "COUNTERPARTY_REPLY" },
    0xE000 : { def: "SESSION_ESTABLISH" },
    0xE001 : { def: "SESSION_HANGUP" },
    0x0011 : { def: "LEGEND_MESSAGES",  argForm: [1,0 ]},

    0x5555 : { def: "DIGIT_LED_LEVEL", argForm: [6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 0, 6, 6, 6, 0, 6, 6, 0, 6, 0, 0] }
}


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
var outCommand = {
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

var argRef = {
    0x01    :   { len: 1, val: function(buff){return buff.readInt8()}}    ,
    0x02    :   null     ,
    0x03    :   null      ,
    0x04    :   null     ,
    0x05    :   null    ,
    0x06    :   { len: 1, val: function(buff){return buff.readUInt8()}} ,
    0x07    :   null     ,
    0x08    :   null     ,
    0x09    :   null     ,
    0x10    :   null    ,
    0x11    :   null      ,
    0x12    :   null      ,
    0x13    :   null     ,
    0x14    :   { len: 0, exec: function(buff){return buff.toString()}}   ,
    0x15    :   null ,
    0x16    :   null        ,
    0x17    :   null        ,
    0x18    :   null   ,
    0x19    :   null  ,
    0x20    :   null  ,
    0x21    :   null  ,
    0xFE    :   null        ,
    0xFF    :   null
};

var arg = {
    a_sint8       :   0x01,
    a_sint16le    :   0x02,
    a_sin32le     :   0x03,
    a_sint64le    :   0x04,
    a_sint128le   :   0x05,
    a_uint8       :   0x06,
    a_uint16le    :   0x07,
    a_uint32le    :   0x08,
    a_uint64le    :   0x09,
    a_uint128le   :   0x10,
    a_boolean     :   0x11, // this is actually a uint8, but it will be used as a boolean
    a_floatle     :   0x12,
    a_doublele    :   0x13,
    a_stringType  :   0x14,
    a_binaryBuffer:   0x15,
    a_audio       :   0x16,
    a_image       :   0x17,
    a_floatbeXYZ  :   0x18,
    a_sint16leXYZ :   0x19,
    a_uint16leXYZ :   0x20,
    a_pointerType :   0x21,
    a_reply       :   0xFE,
    a_tossThis    :   0xFF
};

var gloveModel = {
    UID         :   0,
    handedness  :   0,
    type        :   0,  // kmap or IMUs... dictates types
    legend      :   {}, // this will contain assignment data to determine what values are "on"
    timestamp   :   0,
    ready       :   0,
    powerMode   :   0,
    baro        :   0,
    version     :   0,
    versionPro  :   0,
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
};

return {
    inCommand: inCommand,
    outCommand: outCommand,
    arg: arg,
    gloveModel: gloveModel,
    runIt: runIt
};

}

module.exports = defs; 
