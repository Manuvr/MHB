'use strict'
var path = require('path');
var dhb = require('./dhb-lib/dhb.js')();
var logger = require('winston');
logger.level = 'debug';
//var glove = require('../app.js');
//var defs = require('../lib/defs.js');

logger.info('Running node.');
logger.debug('Logging in debug.');

var myIP = getIP();
var express = require('express');
var app = express();

app.use(express.static(path.join(__dirname, '../' , 'app')));

// temporary imu visuals
app.use('/imu', express.static('app/imu'));
app.use('/imu/textures', express.static('app/imu/textures'));
app.use('/imu/espruino', express.static('app/imu/espruino'));

var router = express.Router();
router.use(function(req,res, next) {
    next(); // move to next routes
});

// ****************
// /API ROUTES
// ****************

router.get('/', function(req, res) {
    res.json({ message: 'api is up' });
});

router.get('/sendTestData/:mode/:messageId/:argLen/:args', function(req, res) {
    //console.log(req.params.mode + " " + req.params.messageId + " " + req.params.argLen + " " + req.params.args);
    sendTest(req.params.messageId, req.params.mode, req.params.argLen, req.params.args, false);
    res.json({ message: 'test data sent' });
});

router.get('/sendManData/:mode/:messageId/:args', function(req, res) {
    //console.log(req.params.mode + " " + req.params.messageId + " " + req.params.argLen + " " + req.params.args);
    sendTest(req.params.messageId, req.params.mode, 0, req.params.args, true);
    res.json({ message: 'manual arg data sent' });
});

router.get('/commands', function(req, res) {
    res.json(dhb.models.outCommand);
});

router.get('/gloveModel', function(req, res) {
    res.json(dhb.models.gloveModel);
});

router.get('/updateGloveModelFakeData', function(req, res) {
    fakeGloveModel();
});

router.get('/sendSync/:mode', function(req, res){
    sendSync(req.params.mode);
    res.json({ message: 'sync packet sent'})
})

router.get('/sendMassSync/:mode', function(req, res){
    sendMassSync(req.params.mode);
    res.json({ message: 'sending 500 sync packets'})
})

router.get('/argRef', function(req, res){
    res.json(dhb.models.argRef);
})

//router.get('/testLegend', function(req, res){
//    dhb.write(dhb.testLegend);
//    res.json({ message: 'legend packet sent'})
//})

// ****************
// /API Bluetooth Routes
// ****************

router.get('/scanBT', function(req, res){
	dhb.bt.scan();
	res.json({ message: 'scanning for BT'})
});

router.get('/connectBT/:address', function(req, res){
    dhb.bt.connect(req.params.address);
    res.json({ message: 'connecting to BT'})
});

router.get('/disconnectBT', function(req, res){
    dhb.bt.disconnect();
    res.json({ message: 'disconnecting from BT'})
});

// ****************
// DHB listeners
// ****************

app.use('/api', router);
var server = app.listen(4000);

// Set up socket.io
var io = require('socket.io').listen(server);

logger.info('Express running.');

// Run the glove, pass in socket.io reference
dhb.events.on('btFound', function(address, name) {
  io.sockets.emit('btFound', address, name);
});

dhb.events.on('gloveModel', function(obj) {
  io.sockets.emit('glove_update', obj);
});

dhb.events.on('outCommand', function(obj) {
  io.sockets.emit('outCommand', obj);
});

dhb.events.on('genericMessage', function(obj, def) {
  io.sockets.emit('message_update', obj, def);
});

dhb.events.on('btConnection', function(status) {
	io.sockets.emit('bt_connection', status);
});


// Testing glove.
//glove.parser.write(new Buffer([0x06, 0x00, 0x00, 0xfc, 0xa5, 0x01, 0x01, 0x00]));

// ****************
// HELPER FUNCTIONS
// ****************

var sendTest = function(messageId, dest, argLen, args, manBytes) {
    var uniqueId = Math.floor((Math.random() * 1000) + 1);
	var argBuffObj;
    if(!manBytes) {

        if (argLen == -1) {
            argBuffObj = undefined;
        } else {
            var argForms = dhb.models.commands[messageId].argForms[argLen];
            if (argLen === 1) {
                argBuffObj = dhb.models.argRef[argForms[0]].build(args);
            } else {
                var argArray = args.split(',');
                var bufArray = [];
                for (var i = 0; i < argArray.length; i++) {
                    bufArray[i] = dhb.models.argRef[argForms[i]].build(argArray[i]);
                }
                argBuffObj = Buffer.concat(bufArray);
            }
        }
    } else {
        argBuffObj = args;
    }
    var msg = dhb.build(messageId, uniqueId, argBuffObj);
    if (dest === "host") {
        dhb.sendToHost(msg);
    } else if (dest === "glove") {
		    dhb.sendToGlove(msg);
    }
};

var sendSync = function(dest) {
    var msg = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

    if (dest === "host") {
        dhb.sendToHost(msg);
    } else if (dest === "glove") {
		dhb.sendToGlove(msg)
    }
};

var sendMassSync = function(dest) {
    var msg = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

    var myLoop = setInterval(function() {
        if (dest === "host") {
            dhb.sendToHost(msg);
        } else if (dest === "glove") {
            dhb.sendToGlove(msg)
        }

    }, 10);

    setTimeout(function(){
        clearInterval(myLoop);
    }, 2000)

};

// This will break now, because of quats and the new naming scheme for commands.  We need
// to re-write this to provide pseudo-accurate values!  I'll work on this as soon as I know what our bounds are.
function fakeGloveModel() {
    // generate fake data
	var uniqueId = Math.floor((Math.random() * 1000) + 1);

    var args = {};
    var time = Date.now();
    var fakeData = [Math.sin( time / 2000 ), Math.cos( time / 3000 ), Math.sin( time / 1000 )];
    var sets = 51;
    var reads = ['x', 'y', 'z'];
    for (var i = 0; i <= sets; i++) {
            args[i] = {};
        for (var j = 0; j < reads.length; j++) {
            args[i][reads[j]] = fakeData[j];
        }
    }

    dhb.sendToHost(dhb.build(58401, uniqueId, args));

    setTimeout(fakeGloveModel, 50);
};

function getIP() {
  var os = require('os');
  var ifaces = os.networkInterfaces();
  var myAddress;

  Object.keys(ifaces).forEach(function(ifname) {
    var alias = 0;
    ifaces[ifname].forEach(function(iface) {
      if('IPv4' !== iface.family || iface.internal !==false) {
        // skip over 127.0.0.1 and non ipv4
        return;
      }

      if(alias >= 1) {
        // multiple addresses
        console.log("Multiple Addresses?");
      } else {
        // one ipv4
        myAddress = iface.address;
      }
    });
  });

  return myAddress;
}

