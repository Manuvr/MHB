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
    'userEnginePath': {
      type: 'string',
      value: './userEngines/'
    },
    'logPath': {
      type: 'string',
      value: './logs/'
    },
    'sessionList': {
      type: 'array',
      value: []
    },
    'engineList': {
      type: 'array',
      value: []
    },
    'transportList': {
      type: 'array',
      value: []
    }
  },
  input: {
    'quit': {
      label: 'Quit',
      type: 'boolean'
    },
    'newSession': {
      label: 'Create Session',
      type: 'string'
    },
    'assignEngine': {
      label: 'Assign Engine',
      type: 'object'
    }
  },
  output: {
    'config': {
      type: 'object',
      label: 'ConfigObj'
    },
    'log': {
      type: 'array',
      label: 'Log'
    },
    'sessionList': {
      type: 'array',
      label: 'Session list',
      state: 'sessionList'
    },
    'engineList': {
      type: 'array',
      label: 'Engine list',
      state: 'engineList'
    },
    'transportList': {
      type: 'array',
      label: 'Transport list',
      state: 'transportList'
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
        console.log('Failed to create log file (' + path + ') with error (' + err + '). Logging disabled.');
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

  var that = this;

  // This will allow the client to override default settings in MHB
  //   prior to any action taking place that would depend on it.
  this.config = _clonedeep(config);
  this.config = _merge(this.config, cli_config);

  this.log = function(component, body, verbosity) {
    console.log(component+ ":\t" + body);
    if (current_log_file) {
      // Write to the log file if we have one open.
      fs.writeSync(current_log_file, new Date() + '  (' +component+ "):\t" + body + '\n');
    }
  };

  this.transports = {};

  // We track engine factories with this object.
  this.engines = {};

  var loadEngines = function(path) {
    var return_value = {};
    return return_value;
  };
  
  var loadTransports = function(path) {
    fs.readdir(path, function(err, items) {
        if (err) {
          that.log('Failed to load transports because ' + err);
        }
        else {
          for (var i = 0; i < items.length; i++) {
            that.transports[items[i]] = require(path+items[i]);
          }
        }
    });
  };

  // We track instantiated sessions with this object.
  this.sessions = {};
  var mSession = new sessionGenerator();

  loadTransports(__dirname+'/transports/');
  loadEngines();
  
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
                console.log(err+'\nLog directory (' + that.config.logPath + ') does not exist and could not be created. Logging disabled.');
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


  /**
  * The client code (whatever that might be) calls this when it has fully loaded and stable.
  * This is the point at which we start executing any stored user instructions, notifying
  *   the client of our own state, etc...
  */
  this.clientReady = function() {
    // We should tell the front-end what transports we know of.
    that.emit('toClient', 
      {
        origin: 'hub',
        method: 'sessionList',
        data:   Object.keys(that.sessions)
      }
    );
    that.emit('toClient', 
      {
        origin: 'hub',
        method: 'engineList',
        data:   Object.keys(that.engines)
      }
    );
    that.emit('toClient', 
      {
        origin: 'hub',
        method: 'transportList',
        data:   Object.keys(that.transports)
      }
    );
  };
  
  
  // Things directed at a specific transport.
  this.toTransport = function(message) {
    switch (message.method) {
      case 'listen':
        break;
      default:
        that.log('mHub', 'No method named ' + message.method + ' in toTransport().', 2);
        break;
    }
  };

  // Things directed at a specific session.
  this.toSession = function(message) {
    switch (message.method) {
      case 'assignEngine':
        break;
      default:
        that.log('mHub', 'No method named ' + message.method + ' in toSession().', 2);
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
              that.log('mHub', 'Failed to add a new session because '+err, 3);
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
        that.log('mHub', 'No method named ' + message.method + ' in toHub().', 2);
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
