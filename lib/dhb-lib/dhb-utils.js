var fs = require('fs');
var path = require('path');

var recordFile = function(data, opts) {
  //TODO: write to a folder, name based on time stamp unless name specified.
  var opts = opts || {};
  var file = opts.file || 'manuvr-recorded.log';

  fs.appendFile(file, JSON.stringify(data), function(err) {
      if(err) throw err;
  });
}

var processFile = function(data, opts) {
  //TODO: read recorded file, emit data event into dhb parser.
  var opts = opts || {};
  var filePath = path.join(__dirname, 'manuvr-recorded.log');

  fs.readFile(filePath, {encoding: 'utf-8'}, function(err, data) {
    if (!err) {
      console.log('process data: ' + data);
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(data);
      response.end();
    }
    else {
      console.log(err);
    }
  });
}

var utils = {
  recordFile: recordFile,
  processFile: processFile
  
}

module.exports = utils;
