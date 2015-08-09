'use strict';

// this is where the Express app would live
var mSession = require('./lib/mSession.js'); // session factory
var mCore = require('./lib/mCore.js'); // MHB
var mEngine = require('./lib/mEngine.js'); //  DHB
var mTransport = require('./lib/mTransport.js'); // bluetooth

var sessionMaster = new mSession();

sessionMaster.addCore(new mCore());
sessionMaster.addEngine(new mEngine());
sessionMaster.addTransport(new mTransport());

connector.on('message', function(arg) {
  console.log(arg);
})

newSession.send('okay', 'moar Data')
