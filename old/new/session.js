'use strict';

// This state machine needs to sit between the parsers input and output.

// Check for duplicate id in excecution`

var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

// Will deal with messages that can't be sent yet because of sync
var sessionBuffer = [];


var ackBuffer = [];


function Session() {
    // instantiate stuff here
    var sync = 0;




}