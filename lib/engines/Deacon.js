'use strict'

// template for DHB middle-man interaction
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var merge = require('lodash.merge');
var messageHandler = require('../messageHandler.js');
var CryptoJS   = require("crypto-js");    // Hash and crypt
var fs         = require('fs');           // File i/o
const exec     = require('child_process').exec;


var _deacon_conf_file = './Deacon.conf';

var generateUniqueId = function() {
  return (Math.random() * (65535 - 1) + 1) & 0xFFFF;
}

var self_description = {
  // This is our self-description. It is how we present ourselves to
  //   the thing on the otherside of a transport.
  'mtu': 50000,
  'devFlags': 0,
  'pVersion': "0.0.1",
  'identity': "Deacon",
  //THIS IS NEW:
  'counter_identity' : "DeaconMgmt",
  'fVersion': '0.0.1',
  'hVersion': '0',
  'serialNum': 1198482374902,
  'extDetail': ''
};

var mLegend = {
  0x8000: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'CHANGE_NAME'
  },
  0x8001: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'CHANGE_URL'
  },
  0x8002: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'setCryptAlgo'
  },
  0x8003: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'takeOwnership'
  },
  0x8004: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'bless'
  },
  0x8005: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'setKey'
  },
  0x8006: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'setIV'
  },
  0x8007: {
    flag: 0x0000,
    argForms: {
      '1': [3]
    },
    name: 'setRotationInterval'
  },
  0x8008: {
    flag: 0x0000,
    argForms: {
      '1': [1]
    },
    name: 'CHANGE_TX_POWER'
  },
  0x8009: {
    flag: 0x0000,
    argForms: {
      '1': [14]
    },
    name: 'deviceSighted'
  }
};


/*
* TODO:
* This is called by mHub. It is passed an argument from SELF_DESCRIBE.
*   We are to decide if we handle it or not by returning a boolean.
*/
function handledByUs(slf_desc) {
}


// mEngine Factory function
function mEngine(parent) {
  ee.call(this);
  var that = this;

  that.esBeacon = require('eddystone-beacon');

  that.beaconConfig = {
    thingID:             0,
    ownerID:             0,
    cryptAlgo:           'AES128-ECB',
    cryptIV:             null,
    cryptKey:            null,
    rotationPeriod:      0,                            // In seconds
    UID:                 [],
    url:                 'http://www.neustar.biz',
    eddyOpts:  {
      name:          'Deacon',
      txPowerLevel:  -21,
      tlmCount:      2
    }
  };


  this.mLegend = mLegend;
  this.rotationInterval = false;


  this.rotateUID = function() {
    switch (this.beaconConfig.cryptAlgo) {
      case 'aes':
        // CryptoMAC
        break;
      case 'sha':
        // HashMAC
        break;
      default:
        // Unsure what to do here...
        break;
    }
  }


  // Emits to session
  var fromEngine = function(method, data) {
    that.send(method, data)
  }

  // Emits to parent
  var toParent = function(target, data) {
    that.mH.sendToAdjunct('parent', target, data);
  }

  /* Assumes big-endian. */
  var toWordArray = function(byte_array) {
    var word_array = [];
    var temp_word  = 0;
    var w          = 0;
    for (var i = 0; i < byte_array.length; i++) {
      temp_word += byte_array[i] << ((3-(i%4))*8);
      if (3 == i%4) {
        // This is the end of a word.
        word_array[w++] = temp_word;
        temp_word       = 0;
      }
    }
    return word_array;
  };

  /**
  * The hash and crypto deal with word arrays. But for sanity's sake, we sometimes
  *   need to access them byte-wise.
  * Assumes big-endian.
  * @return an array of bytes.
  */
  var toByteArray = function(word_array) {
    var byte_array = [];
    if (word_array.hasOwnProperty('length')) {
      for (var i = 0; i < word_array.length; i++) {
        byte_array[i*4+0] = 0x000000FF & (word_array[i] >> 24);
        byte_array[i*4+1] = 0x000000FF & (word_array[i] >> 16);
        byte_array[i*4+2] = 0x000000FF & (word_array[i] >> 8);
        byte_array[i*4+3] = 0x000000FF & (word_array[i]);
      }
    }
    else {
    }
    return byte_array;
  };

  // Returns true if the beacon has been blessed, and Tx should be enabeld.
  var validateBeaconConf = function() {
    if (null != that.beaconConfig.cryptKey) {
      if (null != that.beaconConfig.cryptIV) {
        if (0 < that.beaconConfig.ownerID) {
          if (0 < that.beaconConfig.thingID) {
            // Save beacon settings to conf file.
            return true;
          }
        }
      }
    }
    that.send('log', {
      body: 'validateBeaconConf() returns false. ' + JSON.stringify(that.beaconConfig),
      verbosity: 7
    });
    return false;
  };

  var reInitBeacon = function() {
    if (!validateBeaconConf()) {
      return false;
    }
    //that.esBeacon.stop();
    var temp_enc_uid = CryptoJS.AES.encrypt(
      that.beaconConfig.thingID.toString(),
      that.beaconConfig.cryptKey,
      {
        iv:      that.beaconConfig.cryptIV,
        mode:    CryptoJS.mode.ECB,
        padding: CryptoJS.pad.ZeroPadding
      }
    );

    that.beaconConfig.UID = temp_enc_uid.ciphertext.toString();

    that.send('log', {
      body: 'Valid beacon config. Beginning broadcasts...',
      verbosity: 7
    });

    if (that.beaconConfig.UID.length >= 16) {
      setTimeout(function() {
        that.esBeacon.advertiseUid(that.beaconConfig.UID.slice(0,20), that.beaconConfig.UID.slice(20), that.beaconConfig.eddyOpts);
        that.esBeacon.advertiseUrl(that.beaconConfig.url, that.beaconConfig.eddyOpts);
      }, 2000);

      // Save the conf so that we can start from scratch next time.
      var _conf_str = JSON.stringify(that.beaconConfig);
      fs.writeFile(_deacon_conf_file, _conf_str, 'utf8',
        function(err) {
          if (err) {
            that.send('log', {
              body: 'Failed to write to file: '+_deacon_conf_file+' because '+err,
              verbosity: 2
            });
          }
          else {
            that.send('log', {
              body: 'Wrote '+_conf_str.length+' bytes to '+_deacon_conf_file,
              verbosity: 7
            });
          }
        }
      );
      return true;
    }

    return false;
  };

  this.setName = function(data) {
    that.beaconConfig.eddyOpts.name = data.toString();
    reInitBeacon();
    that.send('log', {
      body: 'DEACON: Set name to ' + data,
      verbosity: 5
    });
  };

  this.setURL = function(data) {
    that.beaconConfig.url = data.toString();
    reInitBeacon();
    that.send('log', {
      body: 'DEACON: Set URL to ' + data,
      verbosity: 5
    });
  };

  this.setTxPower = function(data) {
    that.beaconConfig.eddyOpts.txPowerLevel = data;
    reInitBeacon();
    that.send('log', {
      body: 'DEACON: Set TxPower to ' + data,
      verbosity: 5
    });
  };

  this.setCryptAlgo = function(data) {
    //TODO: Presently unimplemented. AES-ECB only.
    that.send('log', {
      body: 'DEACON: setCryptAlgo is unimplemented.',
      verbosity: 3
    });
    reInitBeacon();
  }

  this.takeOwnership = function(data) {
    if (data && data > 0) {
      that.beaconConfig.ownerID = data;
      // This is temporarilly-permanent.
      that.beaconConfig.eddyOpts.name = 'Owner-'+data.toString();
      that.send('log', {
        body: 'DEACON: Ownership transferred to ownerID ' + data,
        verbosity: 5
      });
      reInitBeacon();
    }
  }

  this.bless = function(data) {
    // This should only be callable ONCE!
    if (0 > that.beaconConfig.thingID) {
      that.send('log', {
        body: 'Becaon can only be assigned a thingID once. Delete ' + _deacon_conf_file + ' and try again.',
        verbosity: 3
      });
      return;
    }
    else {
      // Beacon conf is not complete. Accept parameters...
      if (data && data > 0) {
        // If we have the required fields...
        that.beaconConfig.thingID = data;
        that.beaconConfig.url = 'http://tiny.cc/xbko9x/'+data.toString();
        that.send('log', {
          body: 'DEACON: thingID set to ' + data,
          verbosity: 5
        });
        reInitBeacon();
      }
    }
  }

  this.setIV = function(data) {
    //that.beaconConfig.cryptIV = data;
    // AES-ECB will do this anyway....
    that.beaconConfig.cryptIV = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');
    that.send('log', {
      body: 'DEACON: cryptIV/SALT set to ' + data,
      verbosity: 5
    });
    reInitBeacon();
  }

  this.setKey = function(data) {
    that.beaconConfig.cryptKey = CryptoJS.enc.Hex.parse(data);
    that.send('log', {
      body: 'DEACON: cryptKey set to ' + data,
      verbosity: 5
    });
    reInitBeacon();
  }


  this.interface_spec = {
    schema: {
      type: 'mEngine',
      name: 'Deacon',  // How we present ourselves to the client.
      describe: self_description,
      inputs: {
        'scanResult': {
          func: function(me, data) {
            // We do this to act as an "inverse beacon". The idea is to
            //   passively collect MAC addresses and relay them back to our
            //   counterparty.
            // TODO: We might have some sort of "debounce" on the data to prevent
            //   repeat sightings until the thing is not seen for some amount of time.
            me.send('deviceSighted', data[0]);
            return true
          },
          hidden: true
        }
      },
      outputs: {
        'deviceSighted': {
          label: ['MAC'],
          type: 'string',
          value: ''
        }
      }
    },
    taps: {
      'names': {
      },
      'types': {
        "mEngine": {
          "CHANGE_NAME" : function(me, msg, adjunctID){
            me.setName(msg.data.args[0].toString());
            return true;
          },
          "CHANGE_URL" : function(me, msg, adjunctID){
            me.setURL(msg.data.args[0].toString());
            return true;
          },
          "CHANGE_TX_POWER" : function(me, msg, adjunctID){
            me.setTxPower(parseInt(msg.data.args[0]));
            return true
          },
          "setCryptAlgo" : function(me, msg, adjunctID){
            me.setCryptAlgo(parseInt(msg.data.args[0]));
            return true;
          },
          "takeOwnership" : function(me, msg, adjunctID){
            me.takeOwnership(parseInt(msg.data.args[0]));
            return true;
          },
          "bless" : function(me, msg, adjunctID){
            me.bless(parseInt(msg.data.args[0]));
            return true;
          },
          "setKey" : function(me, msg, adjunctID){
            me.setKey(parseInt(msg.data.args[0]));
            return true;
          },
          "setIV" : function(me, msg, adjunctID){
            me.setIV(parseInt(msg.data.args[0]));
            return true;
          },
          "getID" : function(me, msg, adjunctID){
            toParent('send_msg', {
              name:  'getID',
              uniqueId: msg.uniqueId,
              args:     [that.beaconConfig.thingID]
            });
            return true;
          },
          "setRotationInterval" : function(me, msg, adjunctID) {
            return true;
          },
          "reboot" : function(me, msg, adjunctID) {
            return true;
          }
        }
      }
    },
    adjuncts:{
    }
  };

  if (fs.existsSync(_deacon_conf_file) && fs.lstatSync(_deacon_conf_file).isFile()) {
    var temp_conf = JSON.parse(fs.readFileSync(_deacon_conf_file));
    that.beaconConfig = temp_conf;
    reInitBeacon();
  }

  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct('parent', parent, true);
  toParent('registerEngine', { legend: this.mLegend, definition: self_description } );
};
inherits(mEngine, ee);

mEngine.prototype.getConfig = function() {
  return interface_spec;
}

module.exports = {
  init: mEngine,
  self_description: self_description,
  handledByUs:  handledByUs
}; //mEngine;
