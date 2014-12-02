var app = require('http').createServer(handler);
var url= require('url');
var fs = require('fs');
var io = require('socket.io').listen(app);
var Dissolve = require('dissolve');
var Concentrate = require('concentrate');
var serialport = require("serialport");
var dgram = require("dgram");

// lib
var defs = require("./lib/defs.js");

//var enum = require("enum");

var jsonbuff = [];

var SP = serialport.SerialPort;
var serialPort = new SP("/dev/ttyACM0",
	{
		baudrate: 115200,
		parser: serialport.parsers.readline("\n")
	}, false);

// NODE byte

var udp_socket = dgram.createSocket('udp4');


var parser = Dissolve().loop(function(end) {
    var data_i = 0;

    this.uint16be("command")
        .uint16be("commandId")
        .uint16be("totalLength")
        .uint8be("argCount")
        .loop("args", function(end) {
            if (data_i++ === this.vars.argCount) {
                return end(true);
            }
            var arg_i = 0;

            this.uint8be("argType")
                .uint8be("argLen")
                .tap(function() {
                    switch(this.vars.argType) {
                        case    0x01:       this.sint8("arg");                              break;
                        case    0x02:       this.sint16be("arg");                           break;
                        case    0x03:       this.sint32be("arg");                           break;
                        case    0x04:       this.sint64be("arg");                           break;
                        case    0x05:       // sint128be
                        case    0x06:       this.uint8("arg");                              break;
                        case    0x07:       this.uint16be("arg");                           break;
                        case    0x08:       this.uint32be("arg");                           break;
                        case    0x09:       this.uint64be("arg");                           break;
                        case    0x10:       // uint128be
                        case    0x11:       this.uint8("arg");                              break;
                        case    0x12:       this.floatbe("arg");                            break;
                        case    0x13:       this.doublebe("arg");                           break;
                        case    0x14:       this.string("arg", this.vars.argLen);           break;
                        case    0x15:       // binary buffer
                        case    0x16:       // audio
                        case    0x17:       // image
                        case    0x18:       this.floatbe("x").floatbe("y").floatbe("z");    break;
                        case    0x19:       this.sint16be("x").sint16be("y").sint16be("z"); break;
                        case    0x20:       this.uint16be("x").uint16be("y").uint16be("z"); break;
                        case    0x21:       // pointer type (never see)
                        case    0xFE:       // reply
                        case    0xFF:       // THROW THIS AWAY
                             default:       this.buffer("arg", this.vars.argLen);           break;
                    }
                });
                //.loop( function(end) {
                //if (arg_i++ === this.vars.argLen) {
                //    return end(true);
                //}
                //
                //this.tap(function(){
                //    this.buffer("arg", arg_Len)
                //}
                //});
        })
        .uint8be("checkSum")
        .tap(function() {
            this.push(this.vars);
            this.vars = Object.create(null);
        });
});

var processParser = function(JSONbinary) {

    defs.in[JSONbinary.command].runIt(JSONbinary);

    return 0;
};

parser.on("readable", function() {
    var e;
    while (e = parser.read()) {

        //console.log(JSON.stringify(e, null, 2));
        //io.sockets.emit(JSON.stringify(e, null, 2));
        //console.log(e);
        processParser(e);
        jsonbuff.push(e);
    }
});


serialPort.open(function (error) {
  if ( error ) {
    console.log('failed to open: '+error);
  } else {
    console.log('open');
    serialPort.on('data', function(data) {
      console.log('data received: ' + data);
      parser.write(data);
      io.sockets.emit('serial_update', data);
    });
    //serialPort.write("ls\n", function(err, results) {
    //  console.log('err ' + err);
    //  console.log('results ' + results);
    //});
  }
});

// Http handler function
function handler (req, res) {
    
    // Using URL to parse the requested URL
    var path = url.parse(req.url).pathname;
    
    // Managing the root route
    if (path == '/') {
        index = fs.readFile(__dirname+'/public/index.html', 
            function(error,data) {
                
                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load index.html");
                }
                
                res.writeHead(200,{'Content-Type': 'text/html'});
                res.end(data);
            });

    // Managing the route for the javascript files
    } else if( /\.(js)$/.test(path) ) {
        index = fs.readFile(__dirname+'/public'+path, 
            function(error,data) {
                
                if (error) {
                    res.writeHead(500);
                    return res.end("Error: unable to load " + path);
                }
                
                res.writeHead(200,{'Content-Type': 'text/plain'});
                res.end(data);
            });
    } else {
        res.writeHead(404);
        res.end("Error: 404 - File not found.");
    }
    
}


// Web Socket Connection
io.sockets.on('connection', function (socket) {
    
  // If we recieved a command from a client to start watering lets do so
  socket.on('ping', function(data) {
      console.log("ping");
      
      delay = data["duration"];
      
      // Set a timer for when we should stop watering
      setTimeout(function(){
          socket.emit("pong");
      }, delay * 1);
      
  });

});

udp_socket.on('message', function(content, rinfo) {
	console.log('UDP byte ', content, ' from ', rinfo.address, rinfo.port, ' JSON or rinfo ', JSON.stringify(rinfo));
	io.sockets.emit('udp_update', content.toString("utf8", 0, rinfo.size));
});



// CONCENTRATE STUFF

var c = Concentrate();

c.on("end", function() {
    //run some function to say we successfully sent it... or start a listener for the response?
    console.log("ended");
});

c.on("readable", function() {
    var e;
    while (e = c.read()) {
        console.log(e);
        //spit "e" out to the streamer
    }
});

// ghetto incrementor
var counter = 0;
var randomID = function(){
    return counter++;
};

//assemble a "subscribe" message
c.uint16be(defs.out.SESS_SUBCRIBE)           //command
    .uint16be(randomID())                                //commandID
    .uint16be(12)                               //totalLength
    .uint8(1)                                 //argCount
    .uint8(0x07)                                 //argType
    .uint8(2)                                 //argLen
    .uint16le(defs.out.LED_WRIST_ON)             // (specific) command code to subscribe to
    .uint8(0)                                  //checkSum?
    .flush().end();                             // what is this doing?

// CONCENTRATE END






// test case for when serial isn't working...
parser.write(new Buffer([0xa0, 0x03, 0x4f, 0xe3, 0x00, 0x0e, 0x01, 0x08, 0x04, 0xea, 0x20, 0x67, 0x00, 0xb6, 0x03, 0x01, 0xf9, 0x5c, 0x00, 0x0b, 0x01, 0x06, 0x01, 0x07, 0xc8, 0xa0, 0x03, 0xad, 0x7d, 0x00, 0x08, 0x00, 0x2a ]));



// Listens and binds
app.listen(5000);
udp_socket.bind(1900);
