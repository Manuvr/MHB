var session = require('./lib/mSession_refactor.js')

var derp = new session();
var herp = new session();
derp.addAdjunct("lowerSession", herp);

derp.on('output', function(msg) {
  console.log(msg.target + " : " + msg.data);
})

herp.send("sessionEstablished")
derp.emit("input", {target:["sessionEstablished"], data: {}})




//// NOTES

var router = function(){
  var bluetooth  = require('./lib/transport/bluetooth.js').init()
  var registry =  new session();

  var client = new EventEmitter();
  client.on('input', function(msg){
    console.log(msg.target + " // " + msg.data)
  })

  var route1 = route_beaconRegistry(bluetooth, beacon, client);

  if(null) {
    route1.remove()
  }

}

var route_beaconRegistry = function(bluetooth, beacon, clientSess) {
  var blueDef = [];
  var beacDef = [];

  var blueF = function(msg) {
    var ret = false;
    if(blueDef.length){
      blueDef.forEach(function(v, i, a) {
        if(v[0] === msg.target[0]){
          ret = true;
          v.forEach(function(vv, ii, aa){
            if(ii > 0) { v[i]() }
          })
        }
      })
    }

    if(!ret){
      switch(msg.target[0]) {
        case "scanResult":

          //beacDef.push(['ack', 10000, function(){}])

          beacon.emit('input', {
            target: ["scanResult", "metaSchema"],
            data: data
          })

        default:
          client.emit('output', {
            target: ["log"],
            data: msg
          })

      }
    }
  }

  var beacF = function(msg) {
    if(blueDef.length){
      // loop through deferrals, and if found, exectute and return
    } else {
      switch(msg.target[0]) {
        case "scanResult":

        default:

      }
    }
  }

  bluetooth.on('output', blueF)
  beacon.on('output', beacF)

  this.remove = function(){
    beaconSess.removeListener('output', beacF)
    registrySess.removeListener('output', regF)
  }

}

//hub.emit(["listen", "tcp.js"], [true, local_ip, 8008]);

