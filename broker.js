var _ = require('lodash');
var mHub = require('./lib/mHub.js');

// need to remove config requirement
var config = {
  nothing: "here"
};

var hub = new mHub(config);

// bounce from here
hub.on('output', function(message) {
    // message.target = array
    // message.data = ???
    if(
      message.target[0] !== "_adjunctUpdate" &&
      message.target[0] !== "_adjunctDef" &&
      message.target[0] !== "log"
    ) {
      console.log("Log or Def: " + message.data)
    } else {
      console.log(
        "Bouncing message [" + message.target.join(", ") + "] :"
        + JSON.stringify(message.data)
      )
      hub.emit([message.target, "deacon", "mHub"], message.data)
    }

});
