/*
* messageHandler is the means by which our components communicate with one-another.
*   Each class that wishes to be connected to other classes in a general way should
*   inherit this class.
*/

/*jslint node: true */
'use strict'

// template for DHB middle-man interaction
var inherits       = require('util').inherits;
var ee             = require('events').EventEmitter;

var _merge         = require('lodash').merge;
var _clonedeep     = require('lodash').cloneDeep;

var receiver       = require('./mCore/receiver.js');
var messageParser  = require('./mCore/messageParser.js');
var mFlags         = require('./mCore/messageFlags.js');
var mLegend        = require('./mCore/messageLegend.js');
var types          = require('./mCore/types.js');
var messageBuilder = require('./mCore/messageBuilder.js')
var messageHandler = require('./messageHandler.js');
var stateMachina   = require('./mCore/stateMachina.js');

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

// mEngine Factory function
function mCore(transport) {
  ee.call(this);
  var that = this;

  that.receiver = new receiver();
  that.buildBuffer = messageBuilder;
  that.mLegend = _clonedeep(mLegend);
  that.types = types;
  that.messageParser = new messageParser(this.mLegend, types)

  this.engineDefinitions = [];

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
    build: that.buildBuffer,
    engDefs: that.engineDefinitions
  }

  that.sM = new stateMachina(stateMachinePass)

  that.receiver.ee.on('sync', function(selfSync) {
    console.log("Received Sync from receiver: " + selfSync)
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
  //     "messageName": 'SELF_DESCRIBE',
  //     "flag": 0x0004,
  //     "args": nu_args
  //   };
  // };


  var fromEngine = function(data) {
    that.send(((data.hasOwnProperty("messageName") && data.messageName) ? data.messageName : 'msg'), data);
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
        console.log(JSON.stringify(jsonBuff, null, 2));
        that.sM.transIn(jsonBuff);
      } else {
        that.send('log', {
          body:      'Transport returned a packet, but parse failed:\n ' + JSON.stringify(jsonBuff),
          verbosity: 3
        });
      }
    }
  });


  var buildHLMessage = function(name, args, _uniqueId) {
    for (var key in that.mLegend) {
      if (that.mLegend[key].name === name) {
        var msgObj = {
          messageId:    key,
          messageName:  name,
          uniqueId:     _uniqueId ? _uniqueId : undefined,
          flag:         that.mLegend[key].flag,
          args:         args ? args : []
        }
        return msgObj;
      }
    }
  };

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
        'extDetail': '',
        'serialNum': 0,
        'devFlags': 0
      },
      inputs: {
        'selfDescribe': {
          label: "Send self-description",
          args: [],
          func: function(me, data) {
            // Convert message into a buffer to send it.
            var ver = that.engineDefinitions[that.engineDefinitions.length - 1];
            var tmpArr = [ver.mtu, ver.devFlags, ver.pVersion, ver.identity, ver.fVersion]
            if('hVersion' in ver) {
              tmpArr.push(ver.hVersion)
              if('serialNum' in ver) {
                tmpArr.push(ver.serialNum)
                if('extDet' in ver) {
                  tmpArr.push(ver.extDet)
                }
              }
            }
            that.sM.clientIn(buildHLMessage(
              'SELF_DESCRIBE',
              tmpArr
            ));
          },
          hidden: false
        },
        'send_msg': {
          label: "Send High-level Message",
          args: [ { label: 'Message Name', type: 'string' } ],
          func: function(me, data) {
            // Convert message into a buffer to send it.
            that.sM.clientIn(buildHLMessage(
              data.name,
              data.args     ? data.args : false,
              data.uniqueId ? data.uniqueId : false
            ));
          },
          hidden: false
        },
        'registerEngine': {
          args: [ { label: 'Register Engine', type: 'object' } ],
          func: function(me, data) {
            _merge(me.mLegend, data.legend);
            me.engineDefinitions.push(data.definition)
            // emit def and engine to transport when this happens
          },
          hidden: true
        }
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
        'selfDescribe': {
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
      'names': {
      },
      'types': {
        "mTransport" : {
          "data" : function(me, msg, adjunctID) {
            if (Buffer.isBuffer(msg.data)) {
              console.log("mTransport-data-log ");
              for (var hurlog of msg.data) {
                console.log(hurlog);
              }
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
            console.log("got connected msg")
            that.sM.markConnected(msg.data)
            return true;
          }
        }
      }
    }
  };

  this.engineDefinitions.push(this.interface_spec.schema.describe)
  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct("transport", transport, true);
};
inherits(mCore, ee);

module.exports = mCore;
