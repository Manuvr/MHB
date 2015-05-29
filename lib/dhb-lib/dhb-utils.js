var fs = require('fs');
var JSONStream = require('JSONStream');

var recordFile = function(data, opts) {
  //TODO: write to a folder, name based on time stamp unless name specified.
  var opts = opts || {};
  var now = Date.now();
  var file = opts.file || './recordings/manuvr-recorded.json';

  fs.appendFile(file, JSON.stringify(data), function(err) {
      if(err) throw err;
  });
}

var processFile = function(evt, opts) {

  //TODO: option for setting frame rate in the ui
  var opts = opts || {};
  var filePath = './recordings/' + opts.file;
  var framerate = opts.framerate || 50;
  var period = (1/framerate) * 1000;

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

var getRecordings = function(callback) {
  fs.readdir('./recordings', function(err, files) {
    callback(JSON.stringify(files));
  });
}

var utils = {
  recordFile: recordFile,
  processFile: processFile,
  getRecordings: getRecordings
  
}

module.exports = utils;
