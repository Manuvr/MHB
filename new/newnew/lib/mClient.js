'use strict';

// this is where the Express app would live
var mSession = require('./mSession.js'); // session factory
var mCore = require('./mCore.js'); // MHB
var mEngine = require('./mEngine.js'); //  DHB
var bluetooth = require('./mTransport.js'); // bluetooth

var manuvrFactory = new mSession();

manuvrFactory.addEngine(mEngine);
manuvrFactory.replaceCore(mCore);

var glove = manuvrFactory.init(bluetooth);

glove.on('toClient', function(args) {
  console.log(args)
})

glove.emit('', 'connect');
glove.emit('toParse')
