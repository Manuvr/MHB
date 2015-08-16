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


// require our dependencies
var mSession     = require('./mSession.js'); // session factory
var mCore        = require('./mCore.js'); // MHB... this comes as part of the mSession
var mEngine      = require('./mEngine.js'); //  DHB
var lbConnection = require('./loopbackTransport.js');

var lb = new lbConnection();

var manuvrFactory = new mSession();

manuvrFactory.addEngine(mEngine);

var actor0 = manuvrFactory.init(lb.transport0);
var actor1 = manuvrFactory.init(lb.transport1);

glove.on('toClient', function(origin, type, data) {
  console.log(origin + "(" + type + "): " + data);
})
