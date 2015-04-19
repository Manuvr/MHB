var models = module.exports = {
	gloveModel: {
		UUID       : 0,
		handedness : 0,
		type       : 0,  // kmap or IMUs... dictates types
		legend     : [], // this will contain assignment data to determine what values are "on"
		timestamp  : 0,
		ready      : 0,
		powerMode  : 0,
		baro       : 0,
		version    : 0,
		versionPro : 0,
		IMU_set    : {
			CARPALS    : {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			METACARPALS: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			},
			PP_1       : {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			IP_1       : {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			DP_1       : {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			},

			PP_2: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			IP_2: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			DP_2: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			},
			PP_3: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp: 0
			},
			IP_3: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp: 0
			},
			DP_3: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			},
			PP_4: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			IP_4: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			DP_4: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			},
			PP_5: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			IP_5: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0
			},
			DP_5: {
				quat : {w: 1, x: 0, y: 0, z: 0},
				acc  : {x: 0, y: 0, z: 0},
				gyro : {x: 0, y: 0, z: 0},
				mag  : {x: 0, y: 0, z: 0},
				temp : 0,
				LED  : 0,
				LED_l: 0
			}
		}
	},

  	//These are the final codes for ManuvrOS. These should be the only things hard-coded, as they
 	 //represent the minimum-supported API for discovery of everything else.
  // TODO: change command to message to represent two way communication
  //TODO: match on def instead of index
	commands: {

    // Reserved codes. These must be fully-supported, and never changed.
    // We reserve the first 32 integers for protocol-level functions.
    0:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_UNDEFINED'}, // This is the invalid-in-use default code. 
  
    // Protocol-support codes. In order to have a device that can negotiate with other devices,
    //   these codes must be fully-implemented.  
    1:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_REPLY'}, // This reply is for success-case.
    2:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_REPLY_RETRY'}, // This reply asks for a reply of the given Unique ID.
    3:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_REPLY_FAIL'},   
    4:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_SESS_ESTABLISHED'}, // Session established.
    5:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_SESS_HANGUP'}, // Session hangup.
    6:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_SESS_AUTH_CHALLENGE'}, // A code for challenge-response authentication.

    7:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_SELF_DESCRIBE'}, // No args? Asking for this data. One arg: Providing it.
    // Field order: 4 required null-terminated strings, two optional.
    // uint32:     MTU                (in terms of bytes)
    // String:     Protocol version   (IE: "0.0.1")
    // String:     Firmware version   (IE: "1.5.4")
    // String:     Hardware version   (IE: "4")
    // String:     Device class       (User-defined)
    // String:     Extended detail    (User-defined)
    
    10:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_LEGEND_TYPES'}, // No args? Asking for this legend. One arg: Legend provided. 
    11:{ flag: 0, argForms: {}, def: 'MANUVR_MSG_LEGEND_MESSAGES'}, // No args? Asking for this legend. One arg: Legend provided.
    1542:{ flag: 0, argForms: {
      '952': [
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12,
          22, 18, 18, 18, 12]
    }, def: 'GLOVE_MODEL'} // No args? Asking for this legend. One arg: Legend provided.
  },

/* TODO: remove this section.
 * Should not be needed any longer with above commands
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
		65535: { flag: 0, argForms: {}, def: 'COUNTERPARTY_REPLY' }
	},
*/
	argRef: {
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
		18    :   { len: 12,val: function(buff){return { x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8) } }},    // Vector3 formats
		19    :   { len: 6, val: function(buff){return { x:  buff.readInt16LE(0), y: buff.readInt16LE(2), z: buff.readInt16LE(4) } }},
		20    :   { len: 6, val: function(buff){return { x: buff.readUInt16LE(0), y: buff.readUInt16LE(2), z: buff.readUInt16LE(4) } }},
		21    :   { len: 0, val: function(buff){return buff}}, // MAP
		22    :   { len: 16, val: function(buff){return { w: buff.readFloatLE(0), x: buff.readFloatLE(4), y: buff.readFloatLE(8), z: buff.readFloatLE(12) } }}, // Vector4 (quat)
		0xFE  :   null  // REPLY?
	},
	outCommand: {},

	// This tells us what is coming over
	// [
	// CARPALS_quat, CARPALS_acc, CARPALS_gyro, CARPALS_mag, CARPALS_temp, CARPALS_LED, CARPALS_LEDl,
	// METACARPALS_quat, METACARPALS_acc, METACARPALS_gyro, METACARPALS_mag, METACARPALS_temp, METACARPALS_LED, METACARPALS_LEDl,
	// PP_1_quat, PP_1_acc, PP_1_gyro, PP_1_mag, PP_1_temp,
	// IP_1_quat, IP_1_acc, IP_1_gyro, IP_1_mag, IP_1_temp,
	// DP_1_quat, DP_1_acc, DP_1_gyro, DP_1_mag, DP_1_temp,
	// PP_2_quat, PP_2_acc, PP_2_gyro, PP_2_mag, PP_2_temp,
	// IP_2_quat, IP_2_acc, IP_2_gyro, IP_2_mag, IP_2_temp,
	// DP_2_quat, DP_2_acc, DP_2_gyro, DP_2_mag, DP_2_temp,
	// PP_3_quat, PP_3_acc, PP_3_gyro, PP_3_mag, PP_3_temp,
	// IP_3_quat, IP_3_acc, IP_3_gyro, IP_3_mag, IP_3_temp,
	// DP_3_quat, DP_3_acc, DP_3_gyro, DP_3_mag, DP_3_temp,
	// PP_4_quat, PP_4_acc, PP_4_gyro, PP_4_mag, PP_4_temp,
	// IP_4_quat, IP_4_acc, IP_4_gyro, IP_4_mag, IP_4_temp,
	// DP_4_quat, DP_4_acc, DP_4_gyro, DP_4_mag, DP_4_temp,
	// PP_5_quat, PP_5_acc, PP_5_gyro, PP_5_mag, PP_5_temp,
	// IP_5_quat, IP_5_acc, IP_5_gyro, IP_5_mag, IP_5_temp,
	// DP_5_quat, DP_5_acc, DP_5_gyro, DP_5_mag, DP_5_temp
	// ]
  //
  bones: [
    'CARPALS', 'METACARPALS', 'PP_1', 'IP_1', 'DP_1', 
    'PP_2', 'IP_2', 'DP_2', 'PP_3', 'IP_3', 'DP_3', 
    'PP_4', 'IP_4', 'DP_4', 'PP_5', 'IP_5', 'DP_5'],

  measures: ['quat', 'acc', 'gyro', 'mag', 'temp'],

	legendMap: [
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1,
		1, 1, 1, 1, 1
	]
}
