var dhb = require('../lib/dhb-lib/dhb.js')();

var sendTest = function(messageId, args) {
    var uniqueId = Math.floor((Math.random() * 1000) + 1);
	  var argBuffObj;
    if (args == 0) {
        argBuffObj = undefined;
    }
    else {
        argBuffObj = new Buffer(args, 'hex');
    }
    var msg = dhb.build(messageId, uniqueId, argBuffObj);
    dhb.sendToHost(msg);
};

module.exports = {
  sendTest: sendTest
}
