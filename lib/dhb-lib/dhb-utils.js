var fs = require('fs');
var JSONStream = require('JSONStream');

var recordFile = function(data, opts) {
  //TODO: write to a folder, name based on time stamp unless name specified.
  var opts = opts || {};
  var file = opts.file || 'manuvr-recorded.log';

  fs.appendFile(file, JSON.stringify(data), function(err) {
      if(err) throw err;
  });
}

var processFile = function(evt, opts) {

  //TODO: set up ability to browse local files
  //TODO: add fps to playback
  var opts = opts || {};
  var filePath = './manuvr-recorded.log';

  var source = fs.createReadStream(filePath, {encoding: 'utf8'})
  var parser = JSONStream.parse();
  source.pipe(parser);

  parser.on('data', function(data) {
    console.log('gm obj: ', data);
    evt.emit('gloveModel', data);
  });
}

var utils = {
  recordFile: recordFile,
  processFile: processFile
  
}

module.exports = utils;
