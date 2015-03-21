var gestures = require('./gestures');

module.exports = function(events) {
  var imuframe = null;

  events.on('gloveModel', function(gm) {
      console.log('got the model');
      imuframe = gm.IMU_set;
      watchGesture(imuframe);
  });

  function watchGesture(frame) {
    gestures.checkPalmDrop(frame);

  }
}
