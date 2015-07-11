'use strict';

var types = module.exports = {
  0: {
    name: 'DO NOT USE',
    len: 0
  },
  1: {
    name: 'Int8',
    len: 1,
    write: function(value){ var e = new Buffer(8); e.writeInt8(parseInt(value), 0); return e; },
    read: function(buff){ return buff.readInt8(0); }
  },
  2: {
    name: 'Int16',
    len: 2,
    write: function(value){ var e = new Buffer(2); e.writeInt16LE(parseInt(value), 0); return e; },
    read: function(buff){return buff.readInt16LE(0)}
  },
  3: { 
    name: 'Int32',
    len: 4,
    write: function(value){ var e = new Buffer(4); e.writeInt32LE(parseInt(value), 0); return e; },
    read: function(buff){return buff.readInt32LE(0)}
  },
  4: { 
    name: 'Int64',
    len: 8,  
    write: function(value){ return undefined }, 
    read: function(buff){return (buff.readInt32LE(0) + (buff.readInt32LE(4)  << 8))}
  },
  5: { name: 'Int128'	,
    len: 16,
    write: function(value){ return undefined },
    read: function(buff){return 0}
  },
  6:{ 
    name: 'UInt8',
    len: 1,
    write: function(value){ var e = new Buffer(1); e.writeUInt8(parseInt(value), 0); return e; },
    read: function(buff){return buff.readUInt8(0)}
  } ,
  7: {
    name: 'UInt16',
    len: 2,  write: function(value){ var e = new Buffer(2); e.writeUInt16LE(parseInt(value), 0); return e; },
    read: function(buff){return buff.readUInt16LE(0)}
  },
  8: {
    name: 'UInt32',
    len: 4, 
    write: function(value){ var e = new Buffer(4); e.writeUInt32LE(parseInt(value), 0); return e; },
    read: function(buff){return buff.readUInt32LE(0)}},
  9: {
    name: 'UInt64',
    len: 8,
    write: function(value){ return undefined },
    read: function(buff){return 0}
    },
  10: { name: 'UInt128'	, 
    len: 16, write: function(value){ return undefined },
    read: function(buff){return 0}
  },
  11: {
    name: 'Boolean(Int8)',
    len: 1,
    write: function(value){ var e = new Buffer(1); e.writeInt8(parseInt(value), 0); return e; },
    read: function(buff){return buff.readInt8(0)}
  },
  12: {
    name: 'Float(32 bit)',
    len: 4,  
    write: function(value){ var e = new Buffer(4); e.writeFloatLE(parseInt(value), 0); return e; },
      read: function(buff){return buff.readFloatLE(0)}
  },
  13: {
    name: 'Double(64 bit)', 
    len: 8,  
    write: function(value){ var e = new Buffer(8); e.writeDoubleLE(parseInt(value), 0); return e; },
      read: function(buff){return buff.readDoubleLE(0)}
  },
  14: {
    name: 'String(ascii)', 
    len: 0,  
    write: function(value){ var e = new Buffer(value + '\0', 'ascii'); return e; },
      read: function(buff){return buff.toString('ascii')}
  }   ,
  15: {
    name: 'BinBlob(Buffer)',
    len: 0,
    write: function(value){ return value; },
    read: function(buff){ return buff; }
  } ,   // binary blob
  16: { 
    name: 'Audio'	, 
    len: 0, 
    write: function(value){ return undefined; },
    read: function(buff){ return 0; }
  } ,   // AUDIO
  17: { 
    name: 'Image'	, 
    len: 0, 
    write: function(value){ return undefined; },
    read: function(buff){ return 0; }
  },    // IMAGE
  18: { 
    name: 'Vector3(Float)', 
    len: 12, 
    write: function(value){ var e = new Buffer(12); e.writeFloatLE(value.x, 0).writeFloatLE(value.y, 4).writeFloatLE(value.z, 8); return e; },
    read: function(buff){return { x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8) } }
  },    // Vector3 formats
  19: { 
    name: 'Vector3(Int16)',
    len: 6, 
    write: function(value){ var e = new Buffer(6); e.writeInt16LE(value.x, 0).writeInt16LE(value.y, 2).writeInt16LE(value.z, 4); return e; },
    read: function(buff){return { x: buff.readInt16LE(0), y: buff.readInt16LE(2), z: buff.readInt16LE(4) } }
  },
  20: {
    name: 'Vector3(UInt16)',
    len: 6,
    write: function(value){ var e = new Buffer(6); e.writeUInt16LE(value.x, 0).writeUInt16LE(value.y, 2).writeUInt16LE(value.z, 4); return e; },
    read: function(buff){return { x: buff.readUInt16LE(0), y: buff.readUInt16LE(2), z: buff.readUInt16LE(4) }}
  },
  21: {
    name: 'Map',
    len: 0,
    write: function(value){ return undefined; },
    read: function(buff){ return buff; }
  }, // MAP
  22: {
    name: 'Vector4(Float)',
    len: 16, write: function(value){ var e = new Buffer(16); e.writeFloatLE(value.x, 0).writeFloatLE(value.y, 4).writeFloatLE(value.z, 8).writeFloatLE(value.w, 12); return e}	,
    read: function(buff){return {  x: buff.readFloatLE(0), y: buff.readFloatLE(4), z: buff.readFloatLE(8), w: buff.readFloatLE(12) }}
  }, // Vector4 (quat)
  175: {
    name: 'StringB(ascii)',
    len: 0,
    write: function(value){ var e = new Buffer(value + '\0', 'ascii'); return e; },
    read: function(buff){ return buff.toString('ascii'); }
  },
  0xFE: null  // REPLY?
};

module.exports = types;
