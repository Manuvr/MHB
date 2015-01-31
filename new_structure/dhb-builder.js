var int24 = require('int24');

var syncPacket = Buffer([0x04, 0x00, 0x00, 0x55], 'hex');

var builder = function(messageID, uniqueID, argBuffObj){
	//  Binary Model:
	//  uint24le        uint8       uint16le    uint16le    (buffer)
	//  totalLength     checkSum    uniqueID    messageId    raw
	//  total bytes   uID to end

	if(messageID !== 0xFFFF){
		// add something to the listener array if we're not sending a reply
	}

	if(!messageID || !uniqueID){
		console.log("Malformed builder: mID: " + messageID + " uID: " + uniqueID);
		console.log("Feeding a sync packet!");
		return (syncPacket);
	}

	var buffSum = 0;
	var checkBuf;
	var headBuf = new Buffer(4);
	var midBuf = new Buffer(4);

	if(undefined !== argBuffObj && argBuffObj.length){
		int24.writeUInt24LE(headBuf, 0, argBuffObj.length + 8);
		midBuf.writeUInt16LE(uniqueID, 0);
		midBuf.writeUInt16LE(messageID,2);
		checkBuf = Buffer.concat([midBuf, argBuffObj]);
	} else {
		int24.writeUInt24LE(headBuf, 0, 8);
		checkBuf = new Buffer(4);
		checkBuf.writeUInt16LE(uniqueID, 0);
		checkBuf.writeUInt16LE(messageID,2);
	}

	// calculate the checksum, and then add them together
	for(var i = 0; i < checkBuf.length; i++){
		buffSum += checkBuf.readUInt8(i);
	}
	buffSum += 0x55;
	buffSum %= 256;
	headBuf.writeUInt8(buffSum, 3);

	return Buffer.concat([headBuf, checkBuf])

};

module.exports = builder;