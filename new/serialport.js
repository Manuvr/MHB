var EventEmitter = require('events').EventEmitter;
var SerialPort = require('serialport');
var _ = require('lodash');


var ee = new EventEmitter();

var serial = {};

var portOpen = false;

var conn = function(portName) {
	serial =  new SerialPort.SerialPort(portName, {
		baudrate: 115200,
		parser: SerialPort.parsers.raw
	});

	serial.on("open", function () {
		portOpen = true;
		ee.emit("serialConnected", 1);
		console.log('Connected via serial.');

		serial.on("data", function(data) {
			console.log('data received: ' + data);
			ee.emit("serialData", data);
		});

		serial.on("close", function(data) {
			console.log('Serial Connection Closed.');
			resetSerialState();
		});

		serial.on("error", function(data){
			console.log("Serial error: " + data);
			ee.emit("serialError", data)
		});

	});
};

var resetSerialState = function() {
	ee.emit('serialConnected', 0);
	serial = {};
	portOpen = false;
};


var dhbSerial = function(options) {

	if (!(this instanceof dhbSerial)) { return new dhbSerial(); }

	if (!options) {
		options = {};
	}

	this.ee = ee;

	// talk about callback hell... this needs cleaning
	this.scanAndConnect = function() {
		if(portOpen){
			console.log("Serial already connected!");
		} else {
			var oldList = [];
			var newList = [];

			SerialPort.list(function (err, ports) {
				if(ports) {
					ports.forEach(function (port) {
						oldList.push(port.comName);
					});
					console.log("Plug in your device within 5 seconds");

					setTimeout(function () {
						SerialPort.list(function (err, ports) {
							if (err) {
								console.log(err);
							}
							else {
								ports.forEach(function (port) {
									newList.push(port.comName);
								});
								newList = _.difference(newList, oldList);
								if (newList.length > 1) {
									console.log("More than one serial port changed.  Connection Failed.");
									resetSerialState();
								}
								else if (newList.length < 1) {
									console.log("No new serial ports detected.  Connection Failed.");
									resetSerialState();
								} else {
									console.log("Connecting to found device...");
									conn(newList[0]);
								}
							}
						});
					}, 5000);
				} else {
					console.log("No Ports Found.");
					resetSerialState();
				}

			});
		}
	};

	this.connect = function(portName) {
		if(portOpen){
			console.log("Already connected!")
		} else {
			console.log("Connecting to " + portName);
			conn(portName);
		}
	};

	this.getList = function(){
		var tempList = [];
		SerialPort.list(function (err, ports) {
			ports.forEach(function(port) {
				tempList.push(port.comName);
			});
			ee.emit('serialList', tempList);
		});
	};

	this.close = function() {
		if(portOpen) {
			serial.close(function(error){
				if(error) {
					console.log(error);
				} else {
					console.log("Serial Connection Closed.");
					resetSerialState();
				}
			})
		} else {
			console.log("No serial port open.")
			resetSerialState();
		}
	};

	this.write = function(buff) {
		if(portOpen) {
			serial.write(function(error){
				if(error) {
					console.log(error);
				} else {
					console.log("Sent data via serial...");
				}
			})
		} else {
			console.log("No serial port open.");
			resetSerialState();
		}
	}

};


module.exports = dhbSerial;
