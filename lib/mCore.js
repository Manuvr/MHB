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
var inherits       = require('util').inherits;
var ee             = require('events').EventEmitter;

var _merge         = require('lodash.merge');
var _clonedeep     = require('lodash.clonedeep');

var receiver       = require('./mCore/receiver.js');
var messageParser  = require('./mCore/messageParser.js');
var mFlags         = require('./mCore/messageFlags.js');
var mLegend        = require('./mCore/messageLegend.js');
var types          = require('./mCore/types.js');
var parseAction    = require('./mCore/messageAction.js').parseAct;
var buildAction    = require('./mCore/messageAction.js').buildAct;
var dialogQueues   = require('./mCore/messageAction.js').queues;
var messageBuilder = require('./mCore/messageBuilder.js')

var messageHandler = require('./messageHandler.js');



// mEngine Factory function
function mCore() {
  ee.call(this);
  var that = this;
  this.parent = this; // freaky way of doing a chained assignment from session
  this.timer;

  this.syncCount = 0;

  this.queues = new dialogQueues();

  that.receiver = new receiver();

  this.sendSync = function() {
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
  this.buildSelfDescription = function(desc_from_stack, intSpec) {
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
    var d_keys = Object.keys(intSpec.schema.describe);
    var nu_args = [];

    for (var d_key in d_keys) {
      nu_args.push(
        (desc_from_stack.hasOwnProperty(d_key) && (typeof desc_from_stack[d_key] == arg_types[d_key])) ?
          desc_from_stack[d_key] : intSpec.schema.describe[d_key]
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
  var fromEngine = function(method, data) {
    that.send(method, data);
  }

  /**
  *
  * @fires mCore#data
  */
  var fromCore = function(method, data) {    that.emit('fromCore', method, data);    }

  // Inputs from Transport. Can only be data.
  var toCore = function(data) {
    if (Buffer.isBuffer(data)) {
      that.receiver.parser.write(data);  // Pass buffer data into the parser.
    }
    else {
      // Invalid method.
      fromEngine('log', ['Transport-originated data was not a buffer?? It was: '+ typeof data, 2]);
    }
  };


  // input listeners
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

  this.interface_spec = {
    schema: {
      type: 'mEngine',
      name: 'mCore',  // How we present ourselves to the client.
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
        'downstreamEngineName': {
          type: 'string',
          value: ''
        },
        'remoteAddress': {
          type: 'string',
          value: ''
        }
      },
      inputs: {
        'syncd': {
          label: "Initiate Sync",
          args: [ { label: 'Syncd', type: 'boolean' } ],
          func: function(me, data) {
            fromEngine('log', ['AM I SYNCD? ' + data, 5]);
            me.emit('outOfSync', data.shift(), data.shift());
          },
          hidden: true
        },
        'send_msg': {
          label: "Send High-level Message",
          args: [ { label: 'Syncd', type: 'boolean' } ],
          func: function(me, data) {
            // Convert message into a buffer to send it.
            data.flag = me.mLegend[data.messageId].flag;
            buildAction.bind(me)(data);
          },
          hidden: true
        },
        'registerLegend': {
          args: [ { label: 'Legister Regend', type: 'object' } ],
          func: function(me, data) {
            _merge(me.mLegend, data);
          },
          hidden: true
        },
        'SELF_DESCRIBE': {
          label: "Send Self-description",
          args: [ { label: 'Message', type: 'object' } ],
          func: function(me, data) {
            buildAction.bind(me)(me.buildSelfDescription(data, me.interface_spec));
          },
          hidden: true
        },
        'connected': {
          label: "Initiate Sync",
          args: [ { label: 'Syncd', type: 'boolean' } ],
          func: function(me, data) {
            fromEngine('log', ['AM I CONNECTED? ' + data, 5]);
            if (data) {
              me.sendSync()
            }
         },
         hidden: true
        }
      },
      outputs: {
        'unhandledMsg': {
          type: 'object'
        },
        'syncd': {
          type: 'boolean',
          state: 'syncd'
        },
        'SELF_DESCRIBE': {
          type: 'object'
        },
        'sessionEstablished': {
          type: 'boolean',
          state: 'sessionEstablished'
        },
        'request_engine': {
          type: 'string',
          state: 'downstreamEngineName'
        },
        'scanResult': {
          type: 'array',
          label: ['Address']
        },
        'remoteAddress': {
          type: 'string',
          label: 'Remote Address',
          state: 'remoteAddress'
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
};
inherits(mCore, ee);

module.exports = mCore;
