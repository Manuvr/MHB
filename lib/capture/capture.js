var gestures = require('./gestures');

module.exports = function(events) {
  var imuframe = null;

  events.on('gloveModel', function(gm) {
      console.log('got the model');
      imuframe = gm.IMU_set;
      watchGesture(imuframe);
  });
  events.on('testEmit', function(gm) {
      console.log('got the test emit');
  });

  function watchGesture(frame) {
    gestures.checkPalmDrop(frame);

  }
}
