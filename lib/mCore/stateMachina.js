var util = require('util')
var Machina = require('machina');

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

var generateUniqueId = function() {
  return (Math.random() * (65535 - 1) + 1) & 0xFFFF;
}

var ackMessage = function(uniqueId, args){
  return {
    "messageId":  1,
    "messageName": 'REPLY',
    "uniqueId":   uniqueId,
    "flag":       0,
    "args":       args ? args : []
  };
};

var kaMessage = function(uniqueId) {
  return {
    "uniqueId": uniqueId,
    "messageId": 8,
    "messageName": 'KA',
    "flag": 0x0004,
    "args": []
  };
}

// EXPORTED FUNCTION
function stateMachina(parent){

  var uuid = generateUniqueId().toString();


  var buildEmit = function(msgObj){
    parent.emit('doneBuilding', parent.build(parent.legend, parent.types, msgObj));
  }

  var parseEmit = function(msgObj){
    parent.emit('doneParsing', msgObj);
  }

 //  _____   ___  _  ___
 // / __\ \ / / \| |/ __|
 // \__ \\ V /| .` | (__
 // |___/ |_| |_|\_|\___|


  var syncState = new Machina.Fsm({
    namespace: "syncState" + uuid.substr(0, 3),
    initialState: 'uninitialized',
    states: {
      uninitialized: {
        "*": function(){
          if(this.syncTimer){
            clearTimeout(this.syncTimer);
          }
          this.deferUntilTransition()
          this.transition('noSync')
        }
      },
      noSync: {
        _onEnter: function() {
          this.emit('sendSync');
        },
        syncPacket: function() {
          this.emit('sendSync');
          this.transition('waitingForKA')
        }
      },
      waitingForKA: {
        _onEnter: function() {
          this.uniqueId = generateUniqueId();
          this.emit('sendSyncKA', this.uniqueId)
          this.syncTimer = setTimeout(function() {
            this.transition('noSync');
          }.bind(this), 500)
        },
        deSync: 'noSync',
        receivedReply: function(msgObj) {
          if(msgObj.uniqueId === this.uniqueId){
            this.handle('inSync');
          }
        },
        _onExit: function(){
          clearTimeout(this.syncTimer);
        }
      }
    }
  });

 //  ___ ___ ___ ___ ___ ___  _  _
 // / __| __/ __/ __|_ _/ _ \| \| |
 // \__ \ _|\__ \__ \| | (_) | .` |
 // |___/___|___/___/___\___/|_|\_|
 //

  var runningSession = new Machina.Fsm({
    namespace: "runningSession" + uuid.substr(0, 3),
    initialize: function(){
      this.ackPool = [];
      this.outQueue = [];
      this.requiresAck = function(msgObj){
        if(msgObj.flag & 0x0004){
          return true;
        } else {
          return false;
        }
      };

      this.ackPoolAdd = function(msgObj){
        msgObj.ackTimeout = setTimeout(function(){
          this.ackPool.map(function(cur, idx, arr){
            if(msgObj.uniqueId === cur.uniqueId) {
              console.log("Ack Pool Timeout on: " + arr.splice(idx, 1)[0].uniqueId)
            }
          }.bind(this))
          if(this.ackPool.length === 0){
            this.transition('processQueue')
          }
        }.bind(this), 1000)
        this.ackPool.push(msgObj);
      }.bind(this);

      this.ackPoolRemove = function(uniqueId){
        var ret = false;
        this.ackPool.forEach( function(cur, idx, arr){
          if(uniqueId === cur.uniqueId) {
            clearTimeout(cur.ackTimeout);
            delete cur.ackTimeout;
            ret = arr.splice(idx, 1)[0];
          }
        })
        return ret;
      }.bind(this);

      this.clearAck = function(){
        this.ackPool.reverse();
        this.ackPool.forEach( function(cur, idx, arr){
          clearTimeout(cur.ackTimeout);
          delete cur.ackTimeout;
          this.outQueue.unshift(arr.shift())
        }.bind(this))
      }.bind(this);
    },
    initialState: "normal",
    states:{
      normal:{
        "*": function(__machina, msgObj){
          this.emit('sendToTransport', msgObj);
          if(this.requiresAck(msgObj)){
            this.ackPoolAdd(msgObj);
            this.transition('outputBlocked');
          }
        },
        syncPacket: function(){
          // do nothing
        },
        receivedReply: function(msgObj){
          var cur = this.ackPoolRemove(msgObj.uniqueId)
          if(cur && "callback" in cur){
            cur.callback();
          }
          console.log("Shouldn't be here... received reply in normal state")
        }
      },
      outputBlocked:{
        "*": function(__machina, msgObj){
          this.outboundQueue.push(msgObj)
        },
        syncPacket: function(){
          // do nothing
        },
        msg_KA: function(msgObj){
          this.emit('sendToTransport', msgObj);
          this.ackPoolAdd(msgObj)
        },
        msg_REPLY: function(msgObj){
          this.emit('sendToTransport', msgObj);
        },
        receivedReply: function(msgObj){
          var cur = this.ackPoolRemove(msgObj.uniqueId)
          if(cur && "callback" in cur){
            cur.callback();
          }
          if(this.ackPool.length > 0){
            this.transition("processQueue")
          }
        }
      },
      processQueue: {
        "*": function(__machina, msgObj){
          this.outBoundQueue.push(msgObj)
        },
        msg_KA: function(msgObj){
          this.emit('sendToTransport', msgObj);
          this.ackPool.push(msgObj)
          this.transition('outputBlocked');
        },
        msg_REPLY: function(msgObj){
          this.emit('sendToTransport', msgObj);
        },
        syncPacket: function(){
          // do nothing
        },
        _onEnter: function(){
          while(outBoundQueue.length > 0){
            this.emit('sendToTransport', outBoundQueue[0]);
            if(this.requiresAck(outBoundQueue[0])){
              this.ackPool.push(outBoundQueue.shift());
              //blocked
              break;
            } else {
              outBoundQueue.shift();
            }
          }
          this.transition(outBoundQueue.length > 0 ? 'outputBlocked' : 'normal');
        }
      }
    }
  })


 //  __  __   _   ___ _____ ___ ___
 // |  \/  | /_\ / __|_   _| __| _ \
 // | |\/| |/ _ \\__ \ | | | _||   /
 // |_|  |_/_/ \_\___/ |_| |___|_|_\

  var masterState = new Machina.Fsm({
    namespace: "masterState" + uuid.substr(0, 3),
    initialize: function(){
      this.disconnectTimer = false;
    },

    initialState: "disconnected",

    states: {
      disconnected:{
        syncPacket: function() {
          this.deferUntilTransition()
          this.transition('establishSync')
        },
        connected: 'establishSync',
        _onExit: function() {
          this.disconnectTimer = setTimeout(function() {
            this.handle('disconnected');
          }.bind(this), 10000)
        }
      },
      establishSync:{
        _child: syncState,
        _onEnter: function(){
          this.handle('syncPacket')
        },
        disconnected: "disconnected",
        inSync: "sessionSetup",
        _onExit: function(){
          if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = false;
          }
        }
      },
      sessionSetup:{
        syncPacket: 'establishSync',
        deSync: 'establishSync',
        _onEnter: function(){
          this.transition('sessionEstablished')
        },
        disconnected: "disconnected"
      },
      sessionEstablished:{
        _child: runningSession,
        _onEnter: function(){
          console.log("session established")
        },
        deSync: 'establishSync',
        syncPacket: 'establishSync',
        disconnected: "disconnected"
      }
    }
  });

  // *** HANDLERS ***
  //  syncPacket
  //  connected
  //  disconnected
  //  kaReplyReceived
  //  receivedReply(msgObj)

  masterState.on('sendSyncKA', function(uniqueId){
    console.log("SENDING KA " + uniqueId)
    buildEmit(kaMessage(uniqueId));
  });

  masterState.on('sendSync', function(){
    console.log("SENDING SYNC")
    parent.emit('doneBuilding', SYNC_PACKET_DEF);

  });

  masterState.on('sendToTransport', function(msgObj){
    if (msgObj) {
      buildEmit(msgObj);
    }
    else {
      console.log("SM Says our msgObj was undefined.");
    }
  });

  var checkType = function(eventName, data){
    if(!data){
      return eventName + " (undefined)"
    } else {
      if(eventName === "handling" || eventName === "handled" || eventName === "nohandler"){
        return data.namespace + ":: " + eventName + " " + data.inputType
      } else if (eventName === "transition"){
        return data.namespace + ":: " + eventName + " from " + data.fromState + " to " + data.toState
      } else {
        return eventName + ": " + data
      }
    }
  }

  masterState.on("*", function (eventName, data){
    console.log(" ST: " + checkType(eventName, data));
  });

  this.markSync = function(selfSync){
    if(selfSync) {
      masterState.handle("syncPacket")
    } else {
      masterState.handle("deSync")
    }
  }

  this.markConnected = function(connected){
    if(connected) {
      masterState.handle("connected")
    } else {
      masterState.handle("disconnected")
    }
  }

  this.transIn = function(msgObj){
    switch(msgObj.messageName){
      case 'KA':
        buildEmit( ackMessage(msgObj.uniqueId) );
        parseEmit( msgObj );
        break;
      case 'REPLY':
        masterState.handle('receivedReply', msgObj)
        break;
      case 'REPLY_RETRY':
        // TODO: build retry / fail cases
        //masterState.handle('receivedReply', msgObj)
        break;
      case 'REPLY_FAIL':
        //masterState.handle('receivedReply', msgObj)
        break;
      case 'SELF_DESCRIBE':
        var outObj = {}
        outObj.messageName = msgObj.messageName;
        switch(msgObj.args.length){
          case 0:
            var ver = parent.engDefs[parent.engDefs.length - 1];
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
            buildEmit( ackMessage(msgObj.uniqueId, tmpArr ) )
            break;
          case 8:
            outObj.extDet = msgObj.args[7]
          case 7:
            outObj.serialNum = msgObj.args[6]
          case 6:
            outObj.hVersion = msgObj.args[5]
          case 5:
            outObj.mtu = msgObj.args[0],
            outObj.devFlags = msgObj.args[1],
            outObj.pVersion = msgObj.args[2],
            outObj.identity = msgObj.args[3],
            outObj.fVersion = msgObj.args[4]
          default:
            buildEmit( ackMessage(msgObj.uniqueId) );
            parseEmit( outObj )
        }
        break;
      default:
        parseEmit( msgObj );
        break;
    }
  }


  this.clientIn = function(msgObj){
    var test = ["messageId", "messageName", "flag", "args"]
    if (test.every(function(x) { return x in msgObj })) {
      if (!(("uniqueId" in msgObj) && (msgObj.uniqueId !== undefined))) {
        //  A | B  == !A & !B
        msgObj.uniqueId = generateUniqueId();
      }
      masterState.handle("msg_" + (msgObj.messageName !== undefined ? msgObj.messageName : "WUT"), msgObj);
    } else {
      console.log("Not a fully formed msgObj: " + JSON.stringify(msgObj, null, 2));
    }

  }

}

module.exports = stateMachina;
