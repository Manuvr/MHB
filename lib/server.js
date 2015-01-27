'use strict'
var path = require('path');
var glove = require('../app.js');
var defs = require('../lib/defs.js');

var express = require('express');
var app = express();
app.use(express.static(path.join(__dirname, '../' , 'app')));

// Set up router.
var router = express.Router();

// Middleware for all requests.
router.use(function(req,res, next) {
    //console.log('api working...');
    next(); // move to next routes
});

// Routes.
router.get('/', function(req, res) {
    res.json({ message:'api is up' });
});

//router.get('/sendTestData', function(req, res) {
router.get('/sendTestData/:mode/:messageId/:args', function(req, res) {
    console.log(req.params.messageId);
    console.log('arg' + req.params.args);
    sendTest(defs.outCommand[req.params.messageId], req.params.mode, req.params.args);
    res.json({ message: 'test data sent' });
});

router.get('/commands', function(req, res) {
    res.json(defs.outCommand);
});

router.get('/gloveModel', function(req, res) {
    res.json(defs.gloveModel);
});

router.get('/updateGloveModel', function(req, res) {
    updateGloveModel();
    res.json(defs.gloveModel);
});

router.get('/updateGloveModelFakeData', function(req, res) {
    fakeGloveModel();
});

router.get('/sendSync/:mode', function(req, res){
    sendSync(req.params.mode);
    res.json({ message: 'sync packet sent'})
})

router.get('/testLegend', function(req, res){
    glove.parser.write(glove.testLegend);
    res.json({ message: 'legend packet sent'})
})

router.get('/connectBT', function(req, res){
    glove.connectBT();
    res.json({ message: 'connecting to BT'})
})

router.get('/disconnectBT', function(req, res){
    glove.disconnectBT();
    res.json({ message: 'disconnecting from BT'})
})

app.use('/api', router);
var server = app.listen(4000);

// Set up socket.io
var io = require('socket.io').listen(server);

console.log('Express running');

// Run the glove, pass in socket.io reference
defs(io);
glove(io, defs);


// Testing glove.
//glove.parser.write(new Buffer([0x06, 0x00, 0x00, 0xfc, 0xa5, 0x01, 0x01, 0x00]));


// Helper functions.
var sendTest = function(messageId, dest, args) {
    var uniqueId = Math.floor((Math.random() * 1000) + 1);
    if (args == 0) {
        argBuffObj = undefined;
    }
    else {
        var argBuffObj = new Buffer(args, "hex");
    }
    console.log(argBuffObj);
    var msg = glove.builder(messageId, uniqueId, argBuffObj);

    if (dest === "host") {
        glove.parser.write(msg);
    } else if (dest === "glove") {
        if (glove.btSerial !== undefined) {
            glove.btSerial.write(msg, function(err, bytesWritten) {
                if (err) console.log(err);
                console.log("sent " + bytesWritten + " to the BT connection");
            });
        }
    }
};

var sendSync = function(dest) {
    var argBuffObj = undefined;
    var msg = glove.syncPacket;

    if (dest === "host") {
        glove.parser.write(msg);
    } else if (dest === "glove") {
        if (glove.btSerial !== undefined) {
            glove.btSerial.write(msg, function(err, bytesWritten) {
                if (err) console.log(err);
                console.log("sync packet sent to glove");
            });
        }
    }
};

function fakeGloveModel() {
    // generate fake data 
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
    var fakeJsonBuff = {
        args : args
    };
    defs.execute_IMU_MAP_STATE(fakeJsonBuff); 

    setTimeout(fakeGloveModel, 50);
};

