'use strict'

/**
 * Cause the message with the given parameters to be written to the log.
 *
 * @event mCore#log
 * @type {object}
 * @property {string}   body       The readable data comprising the log.
 * @property {number}  [verbosity] Follows *nix syslog conventions. If not supplied, defaults to 7.
 */

/**
 * Relays the config for this module to anyone listening that cares to use it.
 *
 * @event mCore#config
 * @type {object}
 */

/**
 * Sends the given buffer to the transport (via mSession). The transport will
 *   then make its best-effort to deliver it.
 *
 * @event mCore#data
 * @type {Buffer}
 */

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var uuid = require('node-uuid');

var _merge = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');

var receiver = require('./mCore/receiver.js');
var messageParser = require('./mCore/messageParser.js');
var mFlags = require('./mCore/messageFlags.js');
var mLegend = require('./mCore/messageLegend.js');
var types = require('./mCore/types.js');
var parseAction = require('./mCore/messageAction.js').parseAct;
var buildAction = require('./mCore/messageAction.js').buildAct;
var dialogQueues = require('./mCore/messageAction.js').queues;
var messageBuilder = require('./mCore/messageBuilder.js')

/** This is the default config for mCore. */
var interface_spec = {
  schema: {
    describe: {
      'mtu': 16777215,  // Largest-possible MTU for the protocol.
      'pVersion': "0.0.1",
      'identity': "MHB",
      'fVersion': '1.5.4',
      'hVersion': '0',
      'extDetail': ''
    },
    state: {
      'syncd': {
        type: 'boolean',
        value: false
      },
      'sessionEstablished': {
        type: 'boolean',
        value: false
      },
      'remoteAddress': {
        type: 'string',
        value: ''
      }
    },
    inputs: {
      'scan': [
        {
          label: 'Scan',
          type: 'boolean'
        }
      ],
      'connect': [
        {
          label: 'Connect',
          type: 'boolean'
        }
      ]
    },
    outputs: {
      'syncd': {
        type: 'boolean',
        state: 'syncd'
      },
      'sessionEstablished': {
        type: 'boolean',
        state: 'sessionEstablished'
      },
      'scanResult': {
        type: 'array',
        label: ['Address']
      },
      'remoteAddress': {
        type: 'string',
        label: 'Remote Address',
        state: 'remoteAddress'
      },
      'log': 'log'
    }
  },
  adjuncts: {
  }
};



// mEngine Factory function
function mCore() {
  ee.call(this);
  var that = this;
  this.interface_spec = interface_spec;
  this.parent = this; // freaky way of doing a chained assignment from session
  this.uuid = uuid.v4();
  this.timer;

  this.syncCount = 0;

  this.queues = new dialogQueues();

  that.receiver = new receiver();

  var sendSync = function() {
    if (that.syncCount < 25) {
      that.timer = setInterval(function() {
        //that.receiver.parser.write(SYNC_PACKET_DEF);
        fromCore('data', SYNC_PACKET_DEF);
        that.syncCount++;
      }, 500)
    } else {
      clearInterval(that.timer);
      //fromEngine('');
      fromEngine('log', ['This used to be a blank emit. Interval cleared.', 7]);
    }
  }

  that.receiver.ee.on('syncInSync', function() {
    fromEngine('log', ['Received sync packet, sending back...', 6]);
    //sendSync();
  });

  that.receiver.ee.on('outOfSync', function(outOfSync, reason) {
    if (outOfSync) {
      fromCore('data', SYNC_PACKET_DEF);
      fromEngine('syncd', false);
      fromEngine('log', ['Became desync\'d because ' + reason + '.', 6]);
    } else {
      // We do not want to "fromEngine('syncd', true);" at this point, because
      //   we still need to go through our KA cycle.
      clearInterval(that.timer);
      that.syncCount = 0;
      // Start sending KA
      var ka_message = {
        "messageId": 8,
        "messageDef": 'KA',
        "flag": 0,
        "args": []
      };
      buildAction.bind(that)(ka_message);

      // We must have just become sync'd.
      fromEngine('log', ['Became sync\'d and sent a KA.', 6]);
    }
  });

  that.buildBuffer = messageBuilder;

  that.mLegend = _clonedeep(mLegend);
  that.types = types;

  that.messageParser = new messageParser(this.mLegend, mFlags)

  that.outMsgQueue = [];

  /**
   * We are mCore. We are therefore the last Engine prior to the transport.
   * If we see this instruction come from the session's direction, we need
   *   to error-check and ensure that all of the required fields are present.
   *   If anything is missing, we should fill-in MHB's defaults.
  */
  var buildSelfDescription = function(desc_from_stack) {
    // TODO: Convert this function to use a semantic legend when that feature is ready.
    //         that way, we don't need to codify the order here.
    var arg_types = {
      'mtu': 'number',
      'pVersion': 'string',
      'identity': 'string',
      'fVersion': 'string',
      'hVersion': 'string',
      'extDetail':'string'
    };
    var d_keys = Object.keys(config.describe);
    var nu_args = [];

    for (var d_key in d_keys) {
      nu_args.push(
        (desc_from_stack.hasOwnProperty(d_key) && (typeof desc_from_stack[d_key] == arg_types[d_key])) ?
          desc_from_stack[d_key] : config.describe[d_key]
      );
    }
    return {
      "messageId": 7,
      "messageDef": 'SELF_DESCRIBE',
      "flag": 0x0004,
      "args": nu_args
    };
  };


  /**
  *
  * @fires mCore#log
  * @fires mCore#config
  */
  var fromEngine = function(method, data) {  that.emit('output', method, data);  }

  /**
  *
  * @fires mCore#data
  */
  var fromCore = function(method, data) {    that.emit('fromCore', method, data);    }

  // Inputs from session
  var toEngine = function(method, data) {
    switch (method) {
      case 'send':
        // build new
        data.flag = that.mLegend[data.messageId].flag;
        buildAction.bind(that)(data);
        break;
      case 'badsync':
        // Initiate a malformed sync packet. We notice the desync first.
        fromEngine('log', [
          'Sending bad data via transport. Trying to initiate a desync....',
          4
        ]);
        fromCore('data', new Buffer(45));
        break;
      case 'registerLegend':
        _merge(that.mLegend, data);
        break;
      case 'SELF_DESCRIBE':   // Build and send a SELF_DESCRIBE message.
        buildAction.bind(that)(buildSelfDecription(data));
        break;
      case 'config':
        fromEngine('config', interface_spec);
        break;
      default:
        fromEngine('log', ['Not a valid input: ' + method, 2]);
        break;
    }
  };

  // Inputs from Transport
  var toCore = function(method, data) {
    switch (method) {
      case 'data':
        if (Buffer.isBuffer(data)) {
          that.receiver.parser.write(data);  // Pass buffer data into the parser.
        }
        else {
          // Invalid method.
          fromEngine('log', ['Not a valid method for transport-directed "data": '+ typeof data, 2]);
        }
        break;
      case 'connected':
        fromEngine('log', ['AM I CONNECTED? ' + data, 5]);
        if (data) {
          sendSync()
        }
        break;
      case 'syncd':
        fromEngine('log', ['AM I SYNCD? ' + data, 5]);
        //This is required to set local state in the session
        fromEngine('syncd', data)
        break;
      default:
        fromEngine('log', ['Not a valid input toCore: ' + method, 2]);
        break;
    }
  }

  // input listeners
  that.on('input', toEngine);
  that.on('toCore', toCore);

  // INTERNAL Dialog callback signals.
  that.on('doneParsing', fromEngine);
  that.on('doneBuilding', fromCore);

  that.receiver.parser.on('readable', function() {
    var jsonBuff;
    while (jsonBuff = that.receiver.parser.read()) {
      // Try to extract meaning from the parsed packet.
      if (that.messageParser.parse(jsonBuff)) {
        // If the message and its arguments all parsed ok, act on it...
        parseAction.bind(that)(jsonBuff);
      } else {
        fromEngine('log', [
          'Transport returned a packet, but parse failed:\n ' +
          jsonBuff.strigify(), 3
        ]);
      }
    }
  });
};
inherits(mCore, ee);

module.exports = mCore;
