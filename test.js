var _reg = require('./registry.js')

var registry = new _reg();

registry.on('output', function(msg) {
 console.log(msg.target + " : " + msg.data);
})


registry.emit("input", {target:["makeMfg"], data: ['Random MFG'] })
