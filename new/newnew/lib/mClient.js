'use strict';

// this is where the Express app would live
var mSession = require('./mSession.js'); // session factory
var mCore = require('./lib/mCore.js'); // MHB
var mEngine = require('./lib/mEngine.js'); //  DHB
var bluetooth = require('./lib/mTransport.js'); // bluetooth

var MHB = new mSession();

MHB.addEngine(mEngine);

var glove1 = MHB.connectTransport(bluetooth);

connector.on('message', function(arg) {
  console.log(arg);
})

newSession.send('okay', 'moar Data')
