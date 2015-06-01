var _ = require('lodash');
var robot = require('robotjs');

function StaticGesture(name, leniency, action, pattern) {
  this.name = name;
  this.pattern = pattern;
  this.leniency = leniency;
  this.action = action;
}

StaticGesture.prototype.checkGesture = function(frame) {
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
    return true;
  }
  else { return false; }
}

//TODO: break this out into seperate actions lib
var gestureActions = {

  palmDrop: function() {
    console.log('palmDrop action fire');
    robot.keyToggle('tab', true, 'command');
    robot.keyToggle('command', false);
    robot.keyToggle('tab', false, 'command');
  }

}

// TODO: break this out into separate gestures lib
var gestureCollection = {

  palmDrop: new StaticGesture('palm-drop', 0.1, gestureActions.palmDrop,  
    { 
      CARPALS: {
        acc: { z: -1.6  }
      },
      METACARPALS: {
        acc: { z: -1.6 }
      }
    }
  )
}

var watchStaticGestures = function(frame) {
  for (gesture in gestureCollection) {
    gestureCollection[gesture].checkGesture(frame);
  }
}

var gestures = function(frame) {

  var capturedGesture = watchStaticGestures(frame);

  return capturedGesture;

}




module.exports = gestures;
