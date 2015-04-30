var gestures = require('./gestures');

module.exports = function(events) {
  
  // LOOK FOR GESTURE EVENTS 
  var imuframe = null;

  /* -- TODO: Set up for gestures
  events.on('gloveModel', function(gm) {
      console.log('got the model');
      imuframe = gm.IMU_set;
      watchGesture(imuframe);
  });
 */

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
    //TODO: do not look for single gestures. Check for any
    //gesture.
    gestures.checkPalmDrop(frame);

  }
}
