var socket = io.connect('http://192.168.230.1:5000');

socket.on('pong', function (data) {
    console.log("pong");
});

socket.on('udp_update', function(data) {
  console.log(data);
  $("#log_data").append("<div>" + data + "</div>");
});

socket.on('serial_update', function(data) {
  console.log(data);
  $("#log_data").append("<div>" + data + "</div>");
});




$(document).ready(function() {
    $("#hello").click(function(){
        socket.emit('ping', { duration: 2 });
    }); 
});

