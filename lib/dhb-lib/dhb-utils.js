var fs = require('fs');

var recordFile = function(data, opts) {
  var opts = opts || {};
  var file = opts.file || 'manuvr-recorded.log';

  fs.appendFile(file, JSON.stringify(data), function(err) {
      if(err) throw err;
  });
}

var utils = {
  recordFile: recordFile
}

module.exports = utils;
