var _ = require('lodash');
var robot = require('robotjs');

function StaticGesture(opts) {
  this.name = opts.name;
  this.leniency = opts.leniency;
  this.lockout = opts.lockout;
  this.action = opts.action;
  this.pattern = opts.pattern;
}

StaticGesture.prototype.checkGesture = function(frame, events) {
  var leniency = this.leniency;
  var check = null;
  _.forIn(this.pattern, function(patternVectors, patternBone) {
    if(check === false) { return false; }
    _.forIn(patternVectors, function(patternScalars, patternVector) {
      if(check === false) { return false; }
      _.forIn(patternScalars, function(patternValue, patternScalar) {
        if(check === false) { return false; }
        frameRead = frame[patternBone][patternVector][patternScalar];
        if (Math.abs(frameRead - patternValue) < leniency) {
          check = true;
        }
        else {
          check = false;
        }
      });
    });
  });
  if (check === true) {
    this.action();
    events.emit('debounce', this.lockout);
    return true;
  }
  else { return false; }
}

//TODO: break this out into seperate actions lib
var gestureActions = {

  testGesture: function() {
    console.log('test gesture action fire');
  },
  thumbFlick: function() {
    console.log('thumbflick action fire');
    robot.keyToggle('tab', true, 'command');
    robot.keyToggle('command', false);
    robot.keyToggle('tab', false, 'command');
  },
  palmDrop: function() {
    console.log('palmDrop action fire');
    robot.keyToggle('tab', true, 'command');
    robot.keyToggle('command', false);
    robot.keyToggle('tab', false, 'command');
  }

}

// TODO: break this out into separate gestures lib
var gestureCollection = {

  testGesture: new StaticGesture({
    name: 'test-gesture',
    leniency: 0.1,
    lockout: 500,
    action: gestureActions.testGesture,
    pattern:
      { 
        CARPALS: {
          acc: { z: 0.9  }
        },
        PP_1: {
          gyro: { y: 0.4 }
        }
      }
  }),
  thumbFlick: new StaticGesture({
    name: 'thumb-flick',
    leniency: 100,
    lockout: 500,
    action: gestureActions.thumbFlick,
    pattern:
      {
        DP_1: {
          gyro: { y: 200  }
        }
    }
  }),
  palmDrop: new StaticGesture({
    name: 'palm-drop',
    leniency: 0.1,
    lockout: 500,
    action: gestureActions.palmDrop,
    pattern:
      {
        CARPALS: {
          acc: { z: -1.2  }
        },
        METACARPALS: {
          acc: { z: -1.2 }
        }
    }
  })
}

var watchStaticGestures = function(frame, events) {
  for (gesture in gestureCollection) {
    gestureCollection[gesture].checkGesture(frame, events);
  }
}

var gestures = function(frame, events) {

  var capturedGesture = watchStaticGestures(frame, events);

  return capturedGesture;

}




module.exports = gestures;
