'use strict';

// EXAMPLE SETUP FOR MHB
// Used here for testing a fake message passing through
// builder and parser

var mhb = require('./mhb')();

(function fakeRandomGloveModel() {
  // Generate random hex string
  // 680 + (4 floats * 17 * 4 bytes per float = 272) + 8
  // 952
  // TODO: Set up for ranges (acc +-4g, mag +- 2gauss, gyro +-245 degrees)
  var uniqueId = Math.floor((Math.random() * 1000) + 1);
  var messageId = 1542;
  var numberFloats = 238;
  var randomNum;
  var buffers = [];
  for (var i = 0; i < numberFloats; i++) {
    var randomBuffer = new Buffer(4);
    randomNum = Math.random();
    randomBuffer.writeFloatLE(randomNum, 0);
    buffers[i] = randomBuffer;
  }
  var totalBuffer = Buffer.concat(buffers);
  var msg = mhb.build(messageId, uniqueId, totalBuffer);
  mhb.sendToHost(msg);
})();

