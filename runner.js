'use strict';

// this is where the Express app would live
var mSession = require('./lib/mSession.js'); // session factory
var mEngine = require('./lib/mEngine.js'); //  DHB
var mTransport = require('./lib/bluetooth.js'); // bluetooth

var sessionGenerator = new mSession();

sessionGenerator.addEngine(mEngine); // pass in the uninstantiated function
var session = sessionGenerator.init(new mTransport());

session.on('toClient', function(origin, type, data) {
  console.log(
    "from:" + origin + "/n" +
    "type:" + type + "/n" +
    "data:" + data
  );
})


session.transport.on('toTransport', function(type, data) {
  console.log(type + ": " + JSON.stringify(data));
})
