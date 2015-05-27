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
  //TODO: option for setting frame rate in the ui
  var opts = opts || {};
  var framerate = 50 || opts.framerate;
  var period = (1/framerate) * 1000;
  var filePath = './manuvr-recorded.log';

  var source = fs.createReadStream(filePath, {encoding: 'utf8'})
  var parser = JSONStream.parse();
  source.pipe(parser);

  parser.on('data', function(data) {
    evt.emit('gloveModel', data);
    parser.pause();
    setTimeout(function(){
      parser.resume();
    }, period);
  });
}

var utils = {
  recordFile: recordFile,
  processFile: processFile
  
}

module.exports = utils;
