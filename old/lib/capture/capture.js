var gestures = require('./gestures');

module.exports = function(events) {
  
  // LOOK FOR GESTURE EVENTS 
  var imuframe = null;
  var debounceLockout = false;
  var gestureMode = 'root';
  var gesturesEnabled = false;

  events.on('debounce', function(lockout) {
    debounceLockout = true;
    setTimeout(function() {
      debounceLockout = false;
    }, lockout);
  });

  events.on('setMode', function(mode) {
    gestureMode = mode;
  });

  events.on('gloveModel', function(gm) {
    if (gesturesEnabled) {
      imuframe = gm.IMU_set;
      watchGesture(imuframe);
    }
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
    if(!debounceLockout) {
      //var capturedGesture = gestures(frame, events);
      gestures(frame, events, gestureMode);
    }
  }
}
