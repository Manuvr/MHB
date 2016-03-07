'use strict'

var inherits = require('util').inherits;
var util = require('util');
var ee = require('events').EventEmitter;
var messageHandler = require('../messageHandler.js');
var bt = require('bluetooth-serial-port');
var noble = require('noble');


// EXPOSED OBJECT / CONSTRUCTOR
function mTransport(addr) {
  ee.call(this);

  // set scope for private methods
  var that = this;


  this.device = new bt.BluetoothSerialPort();

  // From local EE to Device functions
  this.toTransport = function(method, data) {
    switch (method) {
      case 'connect':
        if (data !== connect_state) {
          that.device = new bt.BluetoothSerialPort();
          connect_state = data;
          that.send('connected', data);
        }
        break;
      case 'data':
        that.send('log', ['Transport received data: '+data.toString(), 6]);
      default:
        that.send(method, data);
        break;
    }
  }

  this.interface_spec = {
    type: 'mTransport',
    name: 'BluetoothSerial',
    schema: {
      inputs: {
        'data': {
          label: "Data",
          args: [ { label: 'Data', type: 'buffer' }],
          func: function(me, data) {
            that.device.write(data, function(err, bytesWritten) {
              if (err) me.send('log', [err, 2]);
            });
          },
          hidden: false
        },
        'connect': {
          label: "Connect",
          args: [ { label: 'Connect', type: 'boolean' },
                  { label: 'Address', type: 'string' } ],
          func: function(me, data) {
            me.emit('lb_spawn_complement');
            me.emit('counterParty', 'connect', data);
          },
          hidden: false
        }
      },
      outputs: {
        'connected': {
          type: 'boolean',
          value: false
        },
        'listening': {
          type: 'boolean',
          value: true
        },
        'localAddress': {
          label: 'Local Address',
          type: 'string',
          value: ''
        },
        'remoteAddress': {
          label: 'Remote Address',
          type: 'string',
          value: ''
        }
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
};

var ioDelay = 5;

// EXPOSED OBJECT / CONSTRUCTOR
function mTransportFactory() {
  ee.call(this);

  // set scope for private methods
  var that = this;

  that.devices_nearby = {};

  // will depend on transport library....
  // Used to get a transport instance (the thing that
  //   actually moves data and represents a connection).
  this.getWorker = function() {
    var nu_loop = new mTransport(Math.random().toString());
    return nu_loop;
  };

  this.interface_spec = {
    type: 'mTransportFactory',
    name: 'BluetoothSerialFactory',
    schema: {
      inputs: {
        'scan': {
          label: "Scan",
          args: [ { label: 'Scan', type: 'boolean' } ],
          func: function(me, data) {
            that.device.inquire();
          },
          hidden: false
        },
        'connect' : {
          label: "Connect",
          args: [ { label: 'Remote Address', type: 'string' },
                  { label: 'Port', type: 'number' } ],
          func: function(me, data) {
            if (data.shift()) {
              var mac_address = data.shift();
              that.device.findSerialPortChannel(mac_address, function(channel) {
                btSerial.connect(mac_address, channel, function() {
                  //connected
                  that.emit('fromTransport', 'connected', true);
                  that.emit('fromTransport', 'remoteAddress', mac_address.toString()+ ' ' + channel);
                }, function() {
                  //failed, but channel acquired
                  that.emit('fromTransport', 'connected', false);
                });
              }, function() {
                //failed, and no channel acquired
                that.emit('fromTransport', 'connected', false);
              });
            }
            else {
              // False means we disconnect.
              that.device.close();
            }
          },
          hidden: false
        },
        'listen' : {
          label: "Listen",
          args: [ { label: 'Listen', type: 'boolean' },
                  { label: 'Local Address', type: 'string' },
                  { label: 'Port', type: 'number' } ],
          func: function(me, data) {
          },
          hidden: false
        }
      },
      outputs: {
        'listening': {
          type: 'boolean',
          value: true
        },
        'scanResult': {
          label: ['Address'],
          type: 'array',
          value: []
        },
        'connected': {
          // NOTE: Unlink the instance 'connected', the factory returns the instanced
          //         transport as it's data. Also... no state.
          label: 'Instanced Transport',
          type: 'object'
        }
      }
    },
    adjuncts: {
    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);

  /*****************************************************************************
  * The functions below are callbacks that are for nobel's use.
  *****************************************************************************/

  that.noteNewRSSI = function(p_id, err, rssi) {
    if (err) {
      // It's possible that the device isn't nearby anymore.
      console.log("RSSI UPDATE FAILURE ("+p_id+"): " + err);
      delete that.devices_nearby[p_id];
    }
    else {
      console.log('RSSI UPDATE: ' + p_id + '   ' + rssi);
      that.devices_nearby[p_id].rssi = rssi;
    }
  }

  noble.on('discover',
    function(peripheral) {
      var scanResult = {
        id:           peripheral.id,
        address:      peripheral.address,
        addressType:  peripheral.addressType,
        connectable:  peripheral.connectable,
        state:        peripheral.state,
        rssi:         peripheral.rssi,
        service:      peripheral.advertisement
      };
      that.send('scanResult', scanResult);

      if (!that.devices_nearby[peripheral.id]) {
        var p_id = peripheral.id.toString();
        peripheral.once('rssiUpdate', function(rssi){
          that.noteNewRSSI(p_id, false, rssi);
        });
        that.devices_nearby[p_id] = scanResult;
      }
      else {
      }
      peripheral.updateRssi(
        function(err, rssi) {
          if (err) console.log(err);
          that.noteNewRSSI(p_id, err, rssi);
        }
      );

      that.send('log', {
        body: 'BT scan found ' + peripheral.address + ' RSSI ' + peripheral.rssi,
        verbosity: 5
      });
    }
  );

  noble.on('scanStart',
    function() {
      that.send('log', {
        body: 'BT scan started.',
        verbosity: 5
      });
    }
  );

  noble.on('scanStop',
    function() {
      that.send('log', {
          body: 'BT scan stopped.',
          verbosity: 6
      });
    }
  );

  noble.on('stateChange',
    function(state) {
      that.send('log', {
          body: 'BLE adapter is now in state ' + state,
          verbosity: 5
      });
      switch (state) {
        case 'poweredOn':
          noble.startScanning(); // any service UUID, no duplicates
          break;
        case 'poweredOff':
          break;
      }
    }
  );
};

inherits(mTransport, ee);
inherits(mTransportFactory, ee);

module.exports = {
  init: function() {
    return new mTransportFactory();
  }
};
