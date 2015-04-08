// Definition list for taps.


// Callback functions to run. These should be moved
// into separate files after concept validated
function tap_IP1() {
  console.log('you got a tap on IP_1');
}



// Define tap with related callback
var definedTaps: {
  IP_1: tap_IP1,
  IP_2: tap_IP2,
  IP_3: tap_IP3
}

module.exports = definedTaps;
