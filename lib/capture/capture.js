var io = require('socket.io');

var socket = io.connect('http://localhost:4000');

socket.on('getIP', function(data) {
  console.log('boop', data);
});


