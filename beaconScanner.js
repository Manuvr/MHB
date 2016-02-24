var _blueooth = require('./lib/transports/bluetooth');
var _mHub = require('./lib/transports/mHub');

var router = function(){
  var bluetooth  = new _blueooth();
  var mHub =  new _mHub();

  var client = new EventEmitter();

  client.on('input', function(msg){
    console.log(msg.target + " // " + JSON.stringify(msg.data))
  })

  var route1 = route_beaconRegistry(bluetooth, beacon, client);

  if(null) {
    route1.remove()
  }

}

var route_beaconScanner = function(bluetooth, beacon, clientSess) {
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
