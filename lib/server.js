'use strict'
var path = require('path');
var dhb = require('./dhb-lib/dhb.js')();
//var glove = require('../app.js');
//var defs = require('../lib/defs.js');

var myIP = getIP();
console.log('Connecting on:', myIP);

var express = require('express');
var app = express();

app.use(express.static(path.join(__dirname, '../' , 'app')));

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

router.get('/sendTestData/:mode/:messageId/:args', function(req, res) {
    console.log(req.params.messageId + " " + req.params.mode + " " + req.params.args);
    sendTest(dhb.models.outCommand[req.params.messageId], req.params.mode, req.params.args);
    res.json({ message: 'test data sent' });
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

console.log('Express running');

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

var sendTest = function(messageId, dest, args) {
    var uniqueId = Math.floor((Math.random() * 1000) + 1);
	var argBuffObj;
	console.log(args);
    if (args == 0) {
        argBuffObj = undefined;
    }
    else {
        argBuffObj = new Buffer(args, 'hex');
    }
    console.log(argBuffObj);
    var msg = dhb.build(messageId, uniqueId, argBuffObj);
    console.log(msg);
    if (dest === "host") {
        dhb.sendToHost(msg);
    } else if (dest === "glove") {
		    dhb.sendToGlove(msg);
    }
};

var sendSync = function(dest) {
    var argBuffObj = undefined;
    var msg = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

    if (dest === "host") {
        dhb.sendToHost(msg);
    } else if (dest === "glove") {
		dhb.sendToGlove(msg)
    }
};

// This will break.
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

