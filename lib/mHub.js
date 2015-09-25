var ee   = require('events').EventEmitter;
var fs   = require('fs');
var util = require('util');
var sessionGenerator = require('./mSession.js'); // session factory
var _merge = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');
var inherits = require('util').inherits;

// This is the version information for MHB.
var packageJSON = require('../package.json');

// These are transports that we support.
var LBTransport = require('./transports/loopback.js'); // loopback



/** If we have an open log file, this will be a file-descriptor. */
var current_log_file = false;


/** This is the default config for mHub. */
var config = {
  state: {
    'userEngines': {
      type: 'string',
      value: './userEngines'
    },
    'sessionList': {
      type: 'array',
      value: []
    },
    'transportList': {
      type: 'array',
      value: []
    }
  },
  input: {
    'assign': {
      label: 'Assign',
      type: 'object'
    }
  },
  output: {
    'config': {
      type: 'object',
      label: 'ConfigObj',
      state: 'remoteAddress'
    },
    'log': {
      type: 'array',
      label: 'Log'
    }
  }
};


/**
 * Open a new log file at the given path.
 *
 * @param   {string}  path  The filesystem path where the log directory is located.
 */
function openLogFile(path) {
  fs.open(path, 'ax',
    function(err, fd) {
      if (err) {
        console.log('Failed to create log file (' + path +
          ') with error (' + err + '). Logging disabled.');
      } else {
        current_log_file = fd;
      }
    }
  );
}

// TODO: Dynamicize this...
var debugEngine = require('./debugEngine.js'); // The MHB debug engine. (An example)

/*
* Client reference for us to emit to.
* TODO: Allow multiple?
*/
function mHub(cli_config) {
  ee.call(this);
  this.transports = {};

  // We track instantiated sessions with this object.
  this.sessions = {};
  var mSession = new sessionGenerator();
  
  // This will allow the client to override default settings in MHB
  //   prior to any action taking place that would depend on it.
  this.config = _clonedeep(config);
  this.config = _merge(this.config, cli_config);

  var that = this;

  // Now we should setup logging if we need it...
  if (that.config.logPath) {
    fs.exists(that.config.logPath,
      function(exists) {
        if (exists) {
          openLogFile(that.config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
        }
        else {
          fs.mkdir(that.config.logPath,
            function(err) {
              if (err) {
                console.log(error('Log directory (' + that.config.logPath + ') does not exist and could not be created. Logging disabled.'));
              }
              else {
                openLogFile(that.config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
              }
            }
          );
        }
      }
    );
  }

  // Add any requested engines to the SessionGenerator...
  mSession.addEngine(debugEngine);


  this.log = function(component, body, verbosity) {
    if (current_log_file) {
      // Write to the log file if we have one open.
      fs.writeSync(current_log_file, new Date() + '\t' + ses_obj.getUUID() + ' (' +
        origin + "):\t" + data[0] + '\n');
    }
  };

  // By passing in the transports, we are returned sessions. When a session is successfully
  //   setup, the actor variable will become a reference to the specific kind of manuvrable
  //   that connected to the given transport.
  this.buildNewSession = function(xport, name, callback) {
    if (that.transports.hasOwnProperty(xport)) {
      if (name != undefined && name !== '') {
        if (!that.sessions.hasOwnProperty(name)) {
          that.sessions[name] = mSession.init(that.transports[xport]);
          
          that.sessions[name].on('toClient', function(origin, method, data) {
              //console.log('BRDCAST TO RENDER '+ses +'(origin)'+origin+' '+ method);
              switch (method) {
                case 'config':
                  // A session is telling us that it experienced a configuration change.
                  //showSessionConfig(ses, data);
                  break;
                case 'log':
                  that.log(origin, data[0], (data.length > 1 ? data[1] : 7));
                  break;
                default:
                  break;
              }
              that.emit('toClient', {
                origin: 'session',
                method: method,
                name:   name,
                data:   data
              });
            }
          );
          that.config.sessionList.push(name);
          that.emit('toClient', 
            {
              origin: 'hub',
              method: 'newSession',
              name:   name,
              data:   that.sessions[name].config  // ?
            }
          );
          
          if (callback) callback(false);  // Return no error.
        }
        else {
          if (callback) callback('a session by that name already exists.');
        }
      }
      else {
        if (callback) callback('the provided session name is invalid.');
      }
    }
    else {
      if (callback) callback('the named transport cannot be found.');
    }
  }


  this.clientReady = function() {
    // We should tell the front-end what transports we know of.
    that.emit('fromHub', 
      {
        origin: 'hub',
        method: 'sessionList',
        data:   Object.keys(that.sessions)
      }
    );
    that.emit('fromHub', 
      {
        origin: 'hub',
        method: 'transportList',
        data:   Object.keys(that.transports)
      }
    );
  };
  
  
  // Things directed at a specific transport.
  this.toTransport = function(target, data) {
    switch (message.method) {
      case 'listen':
        break;
      default:
        console.log('No method named ' + message.method + ' in toTransport().');
        break;
    }
  };

  // Things directed at a specific session.
  this.toSession = function(target, data) {
    switch (message.method) {
      case 'assignEngine':
        break;
      default:
        console.log('No method named ' + message.method + ' in toSession().');
        break;
    }
  };

  // Things coming from the client.
  this.toHub = function(message) {
    switch (message.method) {
      case 'newSession':
        hub.buildNewSession(message.sessionName, message.transportName,
          function(err) {
            if (err) {
              console.log('Failed to add a new session because '+err);
            }
            else {
              // Broadcast the new session name back to the client.
            }
          }
        );
        break;
      case 'log':
        log('client', message.data.body, (message.data.verbosity) ? message.data.verbosity : 7);
        break;
      default:
        console.log('No method named ' + message.method + ' in toHub().');
        break;
    }
  };


  this.quit = function(callback) {
    if (current_log_file) {
      fs.close(current_log_file, function(err) {
        if (err) {
          if (callback) callback('Error closing log file: ' + err);
        }
        else {
          if (callback) callback(false);
        }
      });
    }
  };
}


inherits(mHub, ee);

module.exports = mHub;
