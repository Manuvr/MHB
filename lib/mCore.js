'use strict'

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
var messageBuilder = require('./mCore/messageBuilder.js')
var messageHandler = require('./messageHandler.js');
var stateMachina   = require('./mCore/stateMachina.js');


// mEngine Factory function
function mCore(transport) {
  ee.call(this);
  var that = this;

  that.receiver = new receiver();
  that.buildBuffer = messageBuilder;
  that.mLegend = _clonedeep(mLegend);
  that.types = types;
  that.messageParser = new messageParser(this.mLegend, mFlags)

  var stateMachinePass = {
    on: function(msg, callback){
      that.on(msg, callback);
    },
    emit:  function(msg, data){
      that.emit(msg, data);
    },
    legend: that.mLegend,
    flags: mFlags,
    types: types,
    build: that.buildBuffer
  }

  that.sM = new stateMachina(stateMachinePass)

  that.receiver.ee.on('sync', function(selfSync) {
    that.sM.markSync(selfSync);
  });

  /**
   * We are mCore. We are therefore the last Engine prior to the transport.
   * If we see this instruction come from the session's direction, we need
   *   to error-check and ensure that all of the required fields are present.
   *   If anything is missing, we should fill-in MHB's defaults.
  */
  // this.buildSelfDescription = function(desc_from_stack, intSpec) {
  //   // TODO: Convert this function to use a semantic legend when that feature is ready.
  //   //         that way, we don't need to codify the order here.
  //   var arg_types = {
  //     'mtu': 'number',
  //     'pVersion': 'string',
  //     'identity': 'string',
  //     'fVersion': 'string',
  //     'hVersion': 'string',
  //     'extDetail':'string'
  //   };
  //   var d_keys = Object.keys(intSpec.schema.describe);
  //   var nu_args = [];
  //
  //   for (var d_key in d_keys) {
  //     nu_args.push(
  //       (desc_from_stack.hasOwnProperty(d_key) && (typeof desc_from_stack[d_key] == arg_types[d_key])) ?
  //         desc_from_stack[d_key] : intSpec.schema.describe[d_key]
  //     );
  //   }
  //   return {
  //     "messageId": 7,
  //     "messageDef": 'SELF_DESCRIBE',
  //     "flag": 0x0004,
  //     "args": nu_args
  //   };
  // };


  var fromEngine = function(data) {
    that.send((data.hasOwnProperty("messageDef") && data.messageDef ? data.messageDef : 'msg'), data);
  }

  var fromCore = function(data) {
    that.mH.sendToAdjunct('transport', ['data'], data);
  }


  // INTERNAL Dialog callback signals.
  that.on('doneParsing', fromEngine);
  that.on('doneBuilding', fromCore);

  that.receiver.parser.on('readable', function() {
    var jsonBuff;
    while (jsonBuff = that.receiver.parser.read()) {
      // Try to extract meaning from the parsed packet.
      if (that.messageParser.parse(jsonBuff)) {
        // If the message and its arguments all parsed ok, act on it...
        that.sM.transIn(jsonBuff);
      } else {
        that.send('log', {
          body:      'Transport returned a packet, but parse failed:\n ' + jsonBuff.strigify(),
          verbosity: 3
        });
      }
    }
  });

  this.interface_spec = {
    type: 'mEngine',
    name: 'mCore',  // How we present ourselves to the client.
    schema: {
      describe: {
        'mtu': 16777215,  // Largest-possible MTU for the protocol.
        'pVersion': "0.0.1",
        'identity': "MHB",
        'fVersion': '1.5.4',
        'hVersion': '0',
        'extDetail': ''
      },
      inputs: {
        'send_msg': {
          label: "Send High-level Message",
          args: [ { label: 'Message Name', type: 'string' } ],
          func: function(me, data) {
            // Convert message into a buffer to send it.
            if(!data.flag){
              data.flag = me.mLegend[data.messageId].flag;
            }
            that.sM.clientIn(data)
          },
          hidden: false
        },
        'registerLegend': {
          args: [ { label: 'Legister Regend', type: 'object' } ],
          func: function(me, data) {
            _merge(me.mLegend, data);
          },
          hidden: false
        }
        //,
        // 'SELF_DESCRIBE': {
        //   label: "Send Self-description",
        //   args: [ { label: 'Message', type: 'object' } ],
        //   func: function(me, data) {
        //     buildAction.bind(me)(me.buildSelfDescription(data, me.interface_spec));
        //   },
        //   hidden: false
        // }
      },
      outputs: {
        'unhandledMsg': {
          type: 'object',
          value: {}
        },
        'syncd': {
          type: 'boolean',
          value: false
        },
        'SELF_DESCRIBE': {
          type: 'object',
          value: {}
        },
        'sessionEstablished': {
          type: 'boolean',
          value: false
        },
        'request_engine': {
          type: 'string',
          value: "",
          hidden: true
        }
      }
    },
    adjuncts: {
    },
    taps: {
      "mTransport" : {
        "data" : function(me, msg, adjunctID) {
          if (Buffer.isBuffer(msg.data)) {
            that.receiver.parser.write(msg.data);  // Pass buffer data into the parser.
          }
          else {
            // Invalid
            me.send('log', {
              body:      'Transport-originated data was not a buffer?? It was: '+ typeof msg.data,
              verbosity: 2
            });
          }
          return false; // don't want this going to the client
        },
        "connected" : function(me, msg, adjunctID){
          //me.mH.sendToAdjunct("engine", ['connected'], msg.data);
          that.sM.markConnected(msg.data)
          return true;
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct("transport", transport, true);
};
inherits(mCore, ee);

module.exports = mCore;
