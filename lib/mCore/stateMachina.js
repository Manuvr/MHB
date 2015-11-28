var Machina = require('machina');

var SYNC_PACKET_DEF = new Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

var ackMessage = function(uniqueId){
  return {
    "messageId":  1,
    "messageDef": 'REPLY',
    "uniqueId":   uniqueId,
    "flag":       0,
    "args":       []
  };
};

var kaMessage = function() {
  return {
    "uniqueId": generateUniqueId(),
    "messageId": 8,
    "messageDef": 'KA',
    "flag": 0,
    "args": []
  };
}

//These events can be sent into the state-machine:
// connected
// disconnected
// syncPacket
// kaPacketAck

var syncTimer    = false;
var syncInterval = false,


var syncState = new Machina.Fsm(
  namespace: "syncstate",
  initialize:  function() {
    this.syncLockout     = false;
    this.syncTimer       = false;
    this.disconnectTimer = false;
  },

  initialState: 'disconnected',

  states: {
    disconnected: {
      //syncPacket: function() {
      //  // If we get a sync-packet, we start casting.
      //},
      connected: 'noSync'
    },

    noSync: {
      // Start sending sync.
      _onEnter: function() {
        this.syncTimer = setInterval(function() {
          // TODO: Treads wants to fix this.
          parentScope.emit('doneBuilding', 'data', SYNC_PACKET_DEF);
        }, 100)
      }.

      syncPacket: {
        if (this.disconnectTimer) {
          clearTimeout(this.disconnectTimer);
          this.disconnectTimer = false;
        }
      },

      _onExit: function() {
      }
    },

    syncCasting: {
      syncPacket: function() {
         // We can understand the counterparty. Send a KA.
         //kaMessage();
         console.log('Sending a KA.');
      },
      _onExit: function() {
        if (this.syncTimer) {
          clearInterval(this.syncTimer);
          this.syncTimer = false;
        }
      }
    },

    waitingForKA: {
      _onEnter: function() {
        this.syncLockout = setTimeout(function() {
          // TODO: Treads wants to fix this.
          //parentScope.emit('doneBuilding', 'data', SYNC_PACKET_DEF);
          console.log('Sending a sync packet.');
        }, 100)
      }.

      kaACKd: function() {
        // Our KA was ack'd. We can proceed to a connected state.
        this.transition('connected');
      }
    },

    connected: {
      _onEnter: function() {
        if (this.syncLockout) {
          clearTimeout(this.syncLockout);
          this.syncLockout = false;
        }
      },

      _onExit: function() {
        // Send sync false to client
        // Set grace-timer for the session.
      }

      syncPacket: 'noSync', // The other side can't understand us.
      desync:     'noSync'       // We have declared ourselves "out of sync".
    }

  }
);
