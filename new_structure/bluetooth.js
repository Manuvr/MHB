var EventEmitter = require('events').EventEmitter;
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

var ee = new EventEmitter();

btSerial.on('found', function(address, name) {
	console.log("Found '" + name + "' Bluetooth device at " + address);
	ee.emit('btListAdd', address, name);
});

btSerial.on('data', function(buffer) {
	console.log("Getting some BT data...");
	console.log(buffer);
	parser.write(buffer);
});

btSerial.on('close', function(){
	console.log("Lost BT connection. :(");
	btSerial.close();
})

var dhbBT = function(options){

	if (!(this instanceof dhbBT)) { return new dhbBT(); }

	if (!options) {
		options = {};
	}

	this.scan = function() {
		console.log("Scanning for BT connections...");
		btSerial.inquire();
	};

	this.ee = ee;

	this.connect = function(address){
		btSerial.findSerialPortChannel(address, function(channel) {
			btSerial.connect(address, channel, function() {
				console.log("Connected on channel " + channel + ".");
			}, function () {
				console.log("Connection failed");
			});
		}, function() {
			console.log("No Bluetooth devices found");
		})
	};

	this.disconnect  = function() {
		console.log("Closing BT connection...");
		btSerial.close();
	};

};

module.exports = dhbBT;