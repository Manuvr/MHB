
var teo = require('teoria');
var midi = require('midi');

// Set up a new output.
var output = new midi.output();

output.openVirtualPort("NODE MIDI")

// Format for MIDI messages
// [program, note, velocity]
// see this for docs:
// http://www.midi.org/techspecs/midimessages.php

// Send a MIDI message.
var note = 60;
var timer = 0;

setInterval(function () {

	if(timer > 3){
		note = 60;
		timer = 0;
	}

	var tNote = teo.note.fromKey(note);

	console.log("note on");
	output.sendMessage([144, tNote.key() , 90]);
	console.log(tNote.key());
	output.sendMessage([144, teo.interval(tNote, 'M3').key() , 90]);
	console.log(teo.interval(tNote, 'M3').key());

	setTimeout(function() {
		console.log("note off");
		output.sendMessage([176, 123, 0]);
	}, 100)

	if(note < 90) {
		note = teo.interval(tNote, 'M3').key();
	} else {
		note = 60;
	}
	timer += 1;

}, 150);

// Close the port when done.
output.closePort();