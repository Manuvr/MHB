var _ = require('lodash');
var robot = require('robotjs');
var CBuffer = require('CBuffer');
gestureRingBuffer = new CBuffer(500);

// Static Gesture Class
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
    this.action(events);
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
  },
  setModeWindow: function(events) {
    console.log('setmode window action fire');
    events.emit('setMode', 'windows');
  },
  setModeRoot: function(events) {
    console.log('setmode root action fire');
    events.emit('setMode', 'root');
  },
  dynamicTest: function() {
    console.log('dynamic hit');
    // pass in patterns that make up the dynamic gesture
    checkDynamic();
  }

}

// TODO: break this out into separate gestures lib
var rootCollection = {

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
  windowMode: new StaticGesture({
    name: 'window-mode',
    leniency: 100,
    lockout: 50,
    action: gestureActions.setModeWindow,
    pattern:
      {
        DP_1: {
          gyro: { z: -200  }
        },
        DP_2: {
          gyro: { y: -300  }
        }
    }
  }),
  rootMode: new StaticGesture({
    name: 'root-mode',
    leniency: 100,
    lockout: 50,
    action: gestureActions.setModeRoot,
    pattern:
      {
        DP_2: {
          gyro: { y: 200  }
        },
        PP_3: {
          gyro: { y: 200  }
        },
        DP_4: {
          gyro: { y: 200  }
        },
        PP_5: {
          gyro: { y: 200  }
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
  // testing dynamic. middle finder down
  dynamicTest: new StaticGesture({
    name: 'dynamic-test',
    leniency: 50,
    lockout: 500,
    action: gestureActions.dynamicTest,
    pattern:
      {
        DP_3: {
          gyro: { y: 100  }
        }
    }
  })
}

var windowCollection = {

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

var watchRootGestures = function(frame, events) {
  for (gesture in rootCollection) {
    rootCollection[gesture].checkGesture(frame, events);
  }
}
var watchWindowGestures = function(frame, events) {
  for (gesture in windowCollection) {
    windowCollection[gesture].checkGesture(frame, events);
  }
}

var checkDynamic = function(patterns) {
  console.log('checking dynamic');
  // TODO: scan through array of static gestures pulled from folder?
  // check against global gesture ring buffer when needed.
  // create global state machine to see when frame should be checked
  // based on timeout
}

var gestures = function(frame, events, mode) {

  gestureRingBuffer.push(frame);

  console.log(gestureRingBuffer);

  switch (mode) {
    case 'root': 
      watchRootGestures(frame, events);
      break;
    case 'windows':
      watchWindowGestures(frame, events);
      break;
    default:
      console.log('Invalid mode passed to gestures.');

  }


}




module.exports = gestures;
