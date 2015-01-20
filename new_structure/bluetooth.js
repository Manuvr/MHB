btSerial = new (require('bluetooth-serial-port')).BluetoothSerialPort();

btSerial.on('found', function(address, name) {
	console.log("Found '" + name + "' Bluetooth device at " + address);

	btSerial.findSerialPortChannel(address, function(channel) {
		console.log("Found open channel: " + channel);
		btSerial.connect(address, channel, function() {
			console.log('Connected!");

			btSerial.on('data', function(buffer) {
				console.log("Getting some BT data...");
				console.log(buffer);
				parser.write(buffer);
			});
		}, function () {
			console.log("Connection failed");
		});
	}, function() {
		console.log("No Bluetooth devices found");
	});
});

var dhbBT = function(options){

	if (!(this instanceof dhbBT)) { return new dhbBT(); }

	if (!options) {
		options = {};
	}

	// declare "public" variables here or execute stuffs

}

// prototype functions

dhbBT.prototype.connect = function() {
	console.log("Scanning for bluetooth connections.\n(This is blocking, so be patient!))");
	btSerial.inquire();
}

dhbBT.prototype.disconnect = function() {
	console.log("Closing BT connection...");
	btSerial.close();
}

module.exports = dhbBT;