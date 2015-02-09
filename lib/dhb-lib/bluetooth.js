var EventEmitter = require('events').EventEmitter;
var btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

var ee = new EventEmitter();

var connected = false;

btSerial.on('found', function(address, name) {
	console.log("Found '" + name + "' Bluetooth device at " + address);
	ee.emit('btListAdd', address, name);
});

btSerial.on('data', function(buffer) {
	console.log("Getting some BT data...");
	console.log(buffer);
	ee.emit('btData', buffer);
});

btSerial.on('close', function(){
	console.log("Lost BT connection. :(");
	ee.emit('btClosed');
	btSerial.close();
	connected = false;
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
		console.log("Attempting to connect to " + address)
		btSerial.findSerialPortChannel(address, function(channel) {
			btSerial.connect(address, channel, function() {
				console.log("Connected on channel " + channel + ".");
				connected = true;
			}, function () {
				console.log("Connection failed, but a channel was acquired");
			});
		}, function() {
			console.log("Connection failed, and no channel was acquired");
		})
	};

	this.disconnect  = function() {
		console.log("Closing BT connection...");
		btSerial.close();
		connected = false;
	};

	this.write = function(buffer) {
		if(connected){
			btSerial.write(buffer, function(err, bytesWritten) {
					if (err) console.log(err);
					console.log("Sent " + bytesWritten + " bytes to the glove.");
			});
		} else {
			console.log("Not connected!");
		}
	}

};

module.exports = dhbBT;