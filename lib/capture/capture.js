var gestures = require('./gestures');

module.exports = function(events) {
  
  // LOOK FOR GESTURE EVENTS 
  var imuframe = null;

  events.on('gloveModel', function(gm) {
      imuframe = gm.IMU_set;
      watchGesture(imuframe);
  });

  events.on('IMU_TAP', function(tap) {
    console.log('got a tap: ', tap);
    //watchTap(tap);
  });
  
  events.on('IMU_DOUBLE_TAP', function(tap) {
    console.log('got a double tap: ', tap);
    //watchTap(tap);
  });

  // TAKE ACTION ON GESUTRE EVENTS
  function watchTap(tap) {
    taps.checkDefinedTaps(tap);
  }

  function watchGesture(frame) {
    var capturedGesture = gestures(frame);
  }
}
