'use strict';

// quat: x, y z = between 0 and 1, between 0 and 1
// acc : force in micro g's
// gyro: degrees per second
// mag : micro tesla's

var commands = {
  //These are the final codes for ManuvrOS. These should be the only things hard-coded, as they
  //represent the minimum-supported API for discovery of everything else.
  // TODO: change command to message to represent two way communication
  // TODO: match on def instead of index

  // Reserved codes. These must be fully-supported, and never changed.
  // We reserve the first 32 integers for protocol-level functions.
  // We need to write "zero arg" cases, as currently there isn't an "undefined" arg case for
  // anything with 1 or more arguments... Also, we need to get argument types for ALL commands that may
  // want them, as the glove will overwrite this object with it's own legend...
  0:{ flag: 0, argForms: {}, def: 'UNDEFINED'}, // This is the invalid-in-use default code.

  // Protocol-support codes. In order to have a device that can negotiate with other devices,
  //   these codes must be fully-implemented.
  1:{ flag: 0, argForms: {}, def: 'REPLY'}, // This reply is for success-case.
  2:{ flag: 0, argForms: {}, def: 'REPLY_RETRY'}, // This reply asks for a reply of the given Unique ID.
  3:{ flag: 0, argForms: {}, def: 'REPLY_FAIL'},
  4:{ flag: 0, argForms: {}, def: 'SESS_ESTABLISHED'}, // Session established.
  5:{ flag: 0, argForms: {}, def: 'SESS_HANGUP'}, // Session hangup.
  6:{ flag: 0, argForms: {}, def: 'SESS_AUTH_CHALLENGE'}, // A code for challenge-response authentication.

  // No args? Asking for this data. One arg: Providing it.
  // Field order: 1 uint32, 4 required null-terminated strings, 1 optional.
  // uint32:     MTU                (in terms of bytes)
  // String:     Protocol version   (IE: "0.0.1")
  // String:     Identity           (IE: "Digitabulum") Generally the name of the Manuvrable.
  // String:     Firmware version   (IE: "1.5.4")
  // String:     Hardware version   (IE: "4")
  // String:     Extended detail    (User-defined)
  7: { flag: 0,
    argForms:
      { '1': [ 8, 14, 14, 14, 14, 14 ],
        '2': [ 8, 14, 14, 14, 14, 14, 14 ]
      },
    def: 'SELF_DESCRIBE'
  },
  
  8:{ flag: 0, argForms: {}, def: 'KA'}, // No args.

  10:{ flag: 0, argForms: {}, def: 'LEGEND_TYPES'},   // No args? Asking for this legend. One arg: Legend provided.
  11:{ flag: 0, argForms: {}, def: 'LEGEND_MESSAGES'} // No args? Asking for this legend. One arg: Legend provided.
};

module.exports = commands;
