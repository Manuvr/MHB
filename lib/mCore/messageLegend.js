'use strict';

var messageFlags = require('./messageFlags.js');

/**
 * This is our default message legend. These message definitions are part of what
 *   make the protocol version what it is. These should be the only things hard-coded
 *   in mCore, as they represent the minimum-supported API for discovery of everything else.
 *
 * Implementation of these message codes is required to fully-support the protocol, but
 *   not all features must be implemented. In otherwords, a Manuvrable must be aware of
 *   these messages and their arguments, but is not obliged to heed them.
 *
 * These definitions are not sent over the wire when we exchange MESSAGE_LEGEND or
 *   LEGEND_SEMANTIC messages because their support, definition, and semantics are
 *   implied with the protocol version we supply (or are supplied).
 */
var messageLegend = {
  // TODO: match on name instead of index

  // TODO: We need to write "zero arg" cases, as currently there isn't an "undefined" arg case for
  // anything with 1 or more arguments... Also, we need to get argument types for ALL commands that may
  // want them.
  0: {
    /*
    * This is the invalid-in-use default message definition. It is explicly specified
    *   because it will be the default parse-case for any message that comes over the
    *   wire that cannot be mated to a definition. It allows downstream components to
    *   deal with failure-cases as appropriate.
    * Any arguments that would normally be parsed should be retained in the buffer for
    *   inspection by the downstream compoents.
    * If mCore ever emits this message, it means that someone wasn't careful about their
    *   versioning and change-tracking.
    */
    flag: 0,
    argForms: {},
    name: 'UNDEFINED'
  },

  1: {
    /*
    * This message code is sent to a counterparty only in response to a message that demanded
    *   an ACK, or where a reply was requested by convention. Generally, it is valid to ACK
    *   any message (even one where no ACK is expected). Any arguments attached to this message
    *   should be parsed according to the argument structure of the message that elicited it.
    * This message always terminates a dialog.
    * Please see the protocol documentation for more complete details.
    */
    flag: 0,
    argForms: {},
    name: 'REPLY'
  },

  2: {
    flag: 0,
    argForms: {},
    name: 'REPLY_RETRY'
  }, // This reply asks for a reply of the given Unique ID.

  3: {
    flag: 0,
    argForms: {},
    name: 'REPLY_FAIL'
  },

  4: {
    /*
    * This message code is sent as a result of successful session setup. Once it has been
    *   ACK'd, the party that sent SESS_ESTABLISHED is taken to have a valid session for
    *   the ACK'ing party until either a disconnection event (at either side), or a
    *   SESS_HANGUP message from either side.
    * Please see the protocol documentation for more complete details.
    */
    flag: 0x0004,
    argForms: {},
    name: 'SESS_ESTABLISHED'
  },

  5: {
    /*
    * Sending this message indicates that the sender considers the session terminated.
    * No ACK is demanded. It is expected that the sender will disconnect the transport
    *   immediately after it has sent this message.
    * An optional reason string may be sent as an argument.
    */
    flag: 0,
    argForms: {},
    name: 'SESS_HANGUP'
  },

  6: {
    /*
    * A code for challenge-response authentication. We are still formallizing specification
    *   for this message.
    */
    flag: 0x0004,
    argForms: {},
    name: 'SESS_AUTH_CHALLENGE'
  },

  7: {
    /*
    * This is the means by which a Manuvrable self-reports. It is important that this
    *   be done during session setup, as MHB will use this information to load an Engine
    *   capable of handling the firmware at the other side of the transport.
    * mCore will re-configure the transport after this message to never send or accept a
    *   message that exceeds the MTU of the smallest system in the link.
    *
    * 'No arguments' should be construed as a request for this data from the other side
    *   of the wire. One BINBLOB argument means that it is being provided.
    *
    * Field order:
    * uint32:     MTU                (in terms of bytes)
    * uint32:     Device Flags       (a bitmask field giving some indications of device capabilities)
    * String:     Protocol version   (IE: "0.0.1")
    * String:     Identity           (IE: "Digitabulum") Generally the name of the Manuvrable.
    * String:     Firmware version   (IE: "1.5.4")
    * String:     Hardware version   (IE: "4")
    * uint32:     Serial number      (This field is for devices that want to report a serial number)
    * String:     Extended detail    (User-defined)
    *
    */
    flag: 0x0004,
    argForms: {
      '1': [8, 8, 14, 14, 14],
      '2': [8, 8, 14, 14, 14, 14],
      '3': [8, 8, 14, 14, 14, 14, 8],
      '4': [8, 8, 14, 14, 14, 14, 8, 14]
    },
    name: 'SELF_DESCRIBE'
  },

  8: {
    /*
    * Keep-Alive is quad-purpose. It...
    * A) Provides a means for mCore (or an Engine) to keep the transport open if it
    *      has a proclivity for closing connections due to inactivity, and when this
    *      behavior is not managable in a better way.
    * B) Represents the last stage of sync that verifies to both parties that the
    *      transport is not only sync'd, but stable-enough to send messages.
    * C) Can be used to measure the latency of the transport by providing an
    *      identified message that has no consequences, but must be ACK'd.
    * D) Is used in cases where connect/disconnect events need to be emulated because
    *      a particular transport doesn't have a means of determining these
    *      conditions otherwise. An RS-232 comm port would be a good example of this.
    */
    flag: 0x0004,   //Too slow... :-( flag: messageFlags.DEMAND_ACK,
    argForms: {},
    name: 'KA'
  },

  10: {
    /*
    * This message conveys information about the types that the other side supports.
    * The goal is to not require tiny devices to support large or highly-specialized
    *   data types. The information in this message will convey a typecode, length, etc.
    * MHB (and Engines bolted onto it) are responsible for supporting these types.
    *
    * The parser for this message is native to mCore. 'No arguments' should be construed
    *   as a request for this data from the other side of the wire. One BINBLOB argument
    *   means that it is being provided.
    */
    flag: 0x0004,
    argForms: {},
    name: 'LEGEND_TYPES'
  },

  11: {
    /*
    * This message is the machine-readable API definition for communication between
    *   Manuvrables.
    *
    * The parser for this message is native to mCore. 'No arguments' should be construed
    *   as a request for this data from the other side of the wire. One BINBLOB argument
    *   means that it is being provided.
    */
    flag: 0x0004,
    argForms: {},
    name: 'LEGEND_MESSAGES'
  },

  12: {
    /*
    * Some systems have enough flash space to directly encode semantic lables for the
    *   arguments and messages that they provide. Supporting this message is mandatory
    *   for the protocol, but returning something is not.
    * If the Manuvrable at the other side of the transport either doesn't supply semantic
    *   lables, or the supplied data is incomplete, mCore will name them arbitrarily.
    *   Engines that are responsible for dealing with such devices are encouraged to clobber
    *   these default lables and replace them with something meaningful so that downstream
    *   components can build user-interfaces, and/or code against labled members rather than
    *   having to understand the order of any arguments to messages with the firmware.
    *
    * The parser for this message is native to mCore. 'No arguments' should be construed
    *   as a request for this data from the other side of the wire. One BINBLOB argument
    *   means that it is being provided.
    */
    flag: 0x0004,
    argForms: {},
    name: 'LEGEND_SEMANTIC'
  },

  13: {
    /*
    * This message is used to shuttle messages between Manuvrables that are not
    *   connected to the same system. It should behave in a manner similar to the
    *   APRS faculty for the same end.
    */
    flag: 0x0004,
    argForms: {},
    name: 'MSG_FORWARD'
  }
};

module.exports = messageLegend;
