var messageHandler = require('./messageHandler')
var mHub = require('./mHub')

var util = require('util');
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var window = function() {
  ee.call(this);
  var that = this;

  this.interface_spec = {
    schema: {
      state: {
        'toggleDevTools': {
          label: 'Dev tools Open',
          type: 'boolean',
          value:  false
        }
      },
      inputs: {
        'quit': {
          label: "Quit",
          args: [ { label: '?', type: 'boolean' } ],
          func: function(me, data) {
            // me.QuitFunction(data);
            // me.mH.sendToAdjunct()
          }
        },
        'toggleDevTools': {
          label: "Toggle Dev Tools",
          args: [{ label: 'OpenTools', type: 'boolean' } ],
          func: function(me, data) {

          }
        },
        'test' : {
          label: "derp",
          args: [ { label: "Something", type: "boolean"}],
          func: function(me, data){
            console.log("Got this in test: " + util.inspect(data))
            console.log("Current Adj: " + util.inspect(Object.keys(me.interface_spec.adjuncts)));
            me.mH.sendToOutput({target:["log"], data: "I'm data!"});
          }
        }
      },
      outputs: {
        'toggleDevTools': {
          label: 'Dev tools Open',
          type: 'boolean',
          state: 'toggleDevTools'
        }
      }
    },
    adjuncts: {
      // "mHub1": {
      //   aInstance: someVar,
      //   type: "mHub",
      //   schema: {},
      //   adjuncts: {}
      // }
    },
    adjunctOutputTap: {
      "mHub": {
        "data": function(me, msg, adjunctID){
          me.someFunction(msg.data);
          return false; // don't emit
        }
      }

    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);

}

inherits(window, ee);


var testWindow = new window();
var window2 = new window();

testWindow.on('output', function(msg){
  console.log("listening: " + util.inspect(msg))
})

testWindow.emit('input', {target:["test"], data: "herpa"})



testWindow.mH.addAdjunct("window1", window2)

testWindow.emit('input', {target:["test"], data: "mohammed jihad"})

testWindow.emit('input', {target:["window1", "test"], data: "after"})
