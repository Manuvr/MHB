'use strict';

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
})
