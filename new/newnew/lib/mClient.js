'use strict';

/* Reference pattern
// require our dependencies
var mSession = require('./mSession.js'); // session factory
var mCore = require('./mCore.js'); // MHB... this comes as part of the mSession
var mEngine = require('./mEngine.js'); //  DHB
var bluetooth = require('./mTransport.js'); // bluetooth

var manuvrFactory = new mSession();

manuvrFactory.addEngine(mEngine);
manuvrFactory.replaceCore(mCore); // totally optional... but works.

var glove = manuvrFactory.init(bluetooth);

glove.on('toClient', function(origin, type, data) {
  console.log(origin + "(" + type + "): " + data)
  
*/


// Require our dependencies
var mSession     = require('./mSession.js'); // session factory
var mCore        = require('./mCore.js');    // MHB... this comes as part of the mSession

// These are the dependencies that are up to the user's use-case. We need at least these
// two things....
//   1) A transport to move bytes around.
//   2) A driver that responds to a Manuvrable that we expect to interact with.
var lbConnection = require('./loopbackTransport.js'); // The loop-back transport.
var mEngine      = require('./debugEngine.js');       // The specific manuvrable "driver".


// Construct our session manager. It is responsible for pairing engines with transports
var manuvrFactory = new mSession();

// We need to inform the session factory about a type of manuvrable it may encounter.
// In this case, it will be the Debug engine.
manuvrFactory.addEngine(mEngine);

// For demo purposes, we're going to cross-connect two instances of the Debug engine.
// This will create a pair of entangled transports.
var lb = new lbConnection();

// By passing in the transports, we are returned sessions. When a session is successfully
//   setup, the actor variable will become a reference to the specific kind of manuvrable
//   that connected to the given transport.
var actor0 = manuvrFactory.init(lb.transport0);
var actor1 = manuvrFactory.init(lb.transport1);



actor0.on('toClient', function(origin, type, data) {
  console.log('Actor0: ' + origin + "(" + type + "): " + data);
});

actor1.on('toClient', function(origin, type, data) {
  console.log('Actor1: ' + origin + "(" + type + "): " + data);
});


