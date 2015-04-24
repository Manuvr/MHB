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
  	// TODO: match on def instead of index
	commands: {

		// Reserved codes. These must be fully-supported, and never changed.
		// We reserve the first 32 integers for protocol-level functions.
		// We need to write "zero arg" cases, as currently there isn't an "undefined" arg case for
		// anything with 1 or more arguments... Also, we need to get argument types for ALL commands that may
		// want them, as the glove will overwrite this object with it's own legend...
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
		//

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
		}, def: 'GLOVE_MODEL'},
		//JUST FOR TESTING THE ARG THINGY
		40964:
		{   flag: 0,
			argForms:
				{   '1': [ 6 ],
					'2': [ 6, 6 ],
					'3': [ 6, 6, 6 ],
					'4': [ 6, 6, 6, 6 ],
					'5': [ 6, 6, 6, 6, 6 ],
					'6': [ 6, 6, 6, 6, 6, 6 ]
				},
			def: 'LED_DIGITS_OFF'
		}

     // No args? Asking for this legend. One arg: Legend provided.
  	},

	/*
		argRef is meant to contain the building and parsing information relative to each "type" that the glove
		will send as arguments.
			key: represents the "type code" sent over in commands.{command code}.argForms.{length}[{array position}]

			len: the number of bytes to parse for each "type"
			build: the command to take the value provided and convert it to a buffer of the "type"
				NOTE: I tried doing a "function(value){ return new Buffer(1).writeUInt8(parseInt(value)); }
					  This doesn't appear to work, as Buffer is not streamable.  We likely should do this
					  with streams instead, or use "concentrate" by deoxxa or "node-stream-buffer" by samcday
			val: the command to parse a buffer of bytes in to whatever variable or object type is agreed upon
	*/


	argRef: {
		0     :   { type: "DO NOT USE", len: 0},
		1     :   { type: "Int8"					, len: 1,  build: function(value){ var e = new Buffer(8); e.writeInt8(parseInt(value), 0); return e }		, val: function(buff){return buff.readInt8(0)}},
		2     :   { type: "Int16"					, len: 2,  build: function(value){ var e = new Buffer(2); e.writeInt16LE(parseInt(value), 0); return e }	, val: function(buff){return buff.readInt16LE(0)}},
		3     :   { type: "Int32"					, len: 4,  build: function(value){ var e = new Buffer(4); e.writeInt32LE(parseInt(value), 0); return e }	, val: function(buff){return buff.readInt32LE(0)}},
		4     :   { type: "Int64  (Not working)"	, len: 8,  build: function(value){ return undefined }								, val: function(buff){return (buff.readInt32LE(0) + (buff.readInt32LE(4)  << 8))}},
		5     :   { type: "Int128 (Not working)"	, len: 16, build: function(value){ return undefined }								, val: function(buff){return 0}},
		6     :   { type: "UInt8"					, len: 1,  build: function(value){ var e = new Buffer(1); e.writeUInt8(parseInt(value), 0); return e }		, val: function(buff){return buff.readUInt8(0)}} ,
		7     :   { type: "UInt16"					, len: 2,  build: function(value){ var e = new Buffer(2); e.writeUInt16LE(parseInt(value), 0); return e }	, val: function(buff){return buff.readUInt16LE(0)}},
		8     :   { type: "UInt32"					, len: 4,  build: function(value){ var e = new Buffer(4); e.writeUInt32LE(parseInt(value), 0); return e }	, val: function(buff){return buff.readUInt32LE(0)}},
		9     :   { type: "UInt64  (Not working)"	, len: 8,  build: function(value){ return undefined }								, val: function(buff){return 0}}, // unsigned 64bit int
		10    :   { type: "UInt128 (Not working)"	, len: 16, build: function(value){ return undefined }								, val: function(buff){return 0}}, // unsigned 128bit int
		11    :   { type: "Boolean (Int8)"			, len: 1,  build: function(value){ var e = new Buffer(1); e.writeInt8(parseInt(value), 0); return e }		, val: function(buff){return buff.readInt8(0)}}, // boolean
		12    :   { type: "Float   (32 bit)"		, len: 4,  build: function(value){ var e = new Buffer(4); e.writeFloatLE(parseInt(value), 0); return e }	, val: function(buff){return buff.readFloatLE(0)}},
		13    :   { type: "Double  (64 bit)"		, len: 8,  build: function(value){ var e = new Buffer(8); e.writeDoubleLE(parseInt(value), 0); return e }	, val: function(buff){return buff.readDoubleLE(0)}},
		14    :   { type: "String  (ascii)"			, len: 0,  build: function(value){ var e = new Buffer(value + "\0", 'ascii'); return e; }		, val: function(buff){return buff.toString('ascii')}}   ,
		15    :   { type: "BinBlob (Buffer)"		, len: 0,  build: function(value){ return value }									, val: function(buff){return buff}} ,   // binary blob
		16    :   { type: "Audio   (Not working)"	, len: 0,  build: function(value){ return undefined }								, val: function(buff){return 0}} ,   // AUDIO
		17    :   { type: "Image   (Not working)"	, len: 0,  build: function(value){ return undefined }								, val: function(buff){return 0}},    // IMAGE
		18    :   { type: "Vector3 (Float)"			, len: 12, build: function(value){ var e = new Buffer(12); e.writeFloatLE(value.x, 0).writeFloatLE(value.y, 4).writeFloatLE(value.z, 8); return e; }		, val: function(buff){return { x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8) } }},    // Vector3 formats
		19    :   { type: "Vector3 (Int16)"			, len: 6,  build: function(value){ var e = new Buffer(6); e.writeInt16LE(value.x, 0).writeInt16LE(value.y, 2).writeInt16LE(value.z, 4); return e }		, val: function(buff){return { x:  buff.readInt16LE(0), y: buff.readInt16LE(2), z: buff.readInt16LE(4) } }},
		20    :   { type: "Vector3 (UInt16)"		, len: 6,  build: function(value){ var e = new Buffer(6); e.writeUInt16LE(value.x, 0).writeUInt16LE(value.y, 2).writeUInt16LE(value.z, 4); return e }		, val: function(buff){return { x: buff.readUInt16LE(0), y: buff.readUInt16LE(2), z: buff.readUInt16LE(4) } }},
		21    :   { type: "Map     (Not Working)"	, len: 0,  build: function(value){ return undefined }								, val: function(buff){return buff}}, // MAP
		22    :   { type: "Vector4 (Float)"			, len: 16, build: function(value){ var e = new Buffer(16); e.writeFloatLE(value.x, 0).writeFloatLE(value.y, 4).writeFloatLE(value.z, 8).writeFloatLE(value.w, 12); return e }	, val: function(buff){return {  x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8), w: buff.readFloatLE(12) } }}, // Vector4 (quat)
		175   :   { type: "StringB (ascii)"			, len: 0,  build: function(value){ var e = new Buffer(value + "\0", 'ascii'); return e; }		, val: function(buff){return buff.toString('ascii')}}   ,
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
