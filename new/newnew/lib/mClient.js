'use strict';

// this is where the Express app would live
var mSession = require('./mSession.js'); // session factory
var mCore = require('./lib/mCore.js'); // MHB
var mEngine = require('./lib/mEngine.js'); //  DHB
var bluetooth = require('./lib/mTransport.js'); // bluetooth

var MHB = new mSession();

MHB.addEngine(mEngine);

var glove1 = MHB.connectTransport(bluetooth);

glove1.emit('build', 'something')
