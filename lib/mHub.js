'use strict'

/**#@+
 * @type {object}
 * @property {string}  origin      The class that is sending the message.
 * @property {string}  method      The API method within the target.
 * @property {string}  [module]    The target module (if appropriate).
 * @property {string}  [identity]  An identifier to target a specific module.
 * @property {string}  [arguments] Optional arguments to the given method.
*/

/**
 * Cause the message to be sent to the client.
 *
 * @event mHub#toClient
 */

/**
 * Cause the message to be sent to a session.
 *
 * @event mHub#toSession
 */

/**
 * Cause the message to be sent to a transport.
 *
 * @event mHub#toTransport
 */

/**#@-*/

var ee   = require('events').EventEmitter;
var fs   = require('fs');
var util = require('util');
var sessionGenerator = require('./mSession.js'); // session factory
var _merge = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');
var inherits = require('util').inherits;

// This is the version information for MHB.
var packageJSON = require('../package.json');

/** If we have an open log file, this will be a file-descriptor. */
var current_log_file = false;


/** This is the default config for mHub. */
var interface_spec = {
  schema: {
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
  },
  members: {
    sessions: {
    },
    transportFactories: {
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
  this.interface_spec = _clonedeep(interface_spec);
  this.interface_spec = _merge(this.interface_spec, cli_config);

  /**
  * Writes to the log. This is the end-point for all logging in the system. We may
  *   have shunted the same log off to the client via an emit, but it can be assumed
  *   that all logs should come to a head here.
  *
  * @param   {string}  origin      What module originated the log?
  * @param   {string}  body        The readable data comprising the log.
  * @param   {number}  [verbosity] Follows *nix syslog conventions. If not supplied, defaults to 7.
  */
  this.log = function(origin, body, verbosity) {
    var v = verbosity ? verbosity : 7;
    console.log(origin+ ":\t" + body);
    if (current_log_file) {
      // Write to the log file if we have one open.
      fs.writeSync(current_log_file, new Date() + '  (' +origin+ "):\t" + body + '\n');
    }
  };

  /** We track transport factories with this object. */
  this.transports = {};

  /** We track instantiated sessions with this object. */
  this.sessions = {};

  /** We track engine factories with this object. */
  this.engines = {};

  /**
  * Sends an emit to the client. That piece of software can then do the needful as it
  *   sees appropriate.
  *
  * @param   {object}  message     An object containing the message to be sent to the client.
  * @fires mHub#toClient
  */
  this.toClient = function(message) {    that.emit('toClient', message);   };

  
  /**
  * Given an optional path, loads any javascript files from it. This is our mechanism
  *   for dynmaically loading engines.
  *
  * @param   {string}  [path]  The filesystem path where engines can be found.
  */
  var loadEngines = function(path) {
    var return_value = {};
    that.toClient( 
      {
        origin: 'hub',
        method: 'engineList',
        data:   Object.keys(that.engines)
      }
    );
    return return_value;
  };
  
  /**
  * Given an optional path, loads any javascript files from it. This is our mechanism
  *   for dynmaically loading transports.
  *
  * @param   {string}  [path]  The filesystem path where transports can be found.
  */
  var loadTransports = function(path) {
    that.log('hub', 'Loading transports from ' + path);
    fs.readdir(path, function(err, items) {
      var loaded = 0;
      if (err) {
        that.log('hub', 'Failed to load transports because ' + err);
      }
      else {
        for (var i = 0; i < items.length; i++) {
          if ('.js' == items[i].substr(items[i].length - 3).toLowerCase()) {
            that.log('hub', 'Loading transport ' + path+items[i]);
            var temp_req = require(path+items[i]);
            that.transports[items[i]] = temp_req.init();
            that.interface_spec.members.transportFactories[items[i]] = temp_req.IFSpec;
            loaded++;
          }
          else {
            that.log('hub', 'Skipping non-JS file ' + items[i]);
          }
        }
        
        if (loaded > 0) {
          that.toClient(
            {    
              origin: 'hub',
              method: 'transportList',
              data:   Object.keys(that.interface_spec.members.transportFactories)
            }
          );
        }
        that.log('hub', 'Loaded ' + loaded + ' transports.');
      }
    });
  };

  var mSession = new sessionGenerator();

  loadTransports(__dirname+'/transports/');
  loadEngines();
  
  // Now we should setup logging if we need it...
  if (that.interface_spec.logPath) {
    fs.exists(that.interface_spec.logPath,
      function(exists) {
        if (exists) {
          openLogFile(that.interface_spec.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
        }
        else {
          fs.mkdir(that.interface_spec.logPath,
            function(err) {
              if (err) {
                console.log(err+'\nLog directory (' + that.interface_spec.logPath + ') does not exist and could not be created. Logging disabled.');
              }
              else {
                openLogFile(that.interface_spec.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
              }
            }
          );
        }
      }
    );
  }

  // Add any requested engines to the SessionGenerator...
  mSession.addEngine(debugEngine);

  /**
  * This is called either by the client or internally to create a new session of the given
  *   name attached to the specified transport.
  *
  * @param   {string}    xport      The name of a transport.
  * @param   {string}    name       The desired name of the session to be created.
  * @param   {function} [callback]  A function to callback when the session is created.
  * @fires mHub#toClient
  */
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
                  that.interface_spec.sessions[name] = data;
                  // TODO: Now we need to broadcast the change.
                  break;
                case 'log':
                  that.log(origin, data[0], (data.length > 1 ? data[1] : 7));
                  break;
                default:
                  break;
              }
              that.toClient({
                origin: 'session',
                method: method,
                name:   name,
                data:   data
              });
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
    that.toClient(
      {
        origin: 'hub',
        method: 'sessionList',
        data:   Object.keys(that.sessions)
      }
    );
    
    for (var t_name in that.transports) {
      console.log(t_name+'   '+that.transports[t_name].toString());
    }
  };
  
  
  /**
  * This is used by the client to send a message directed at a specific transport.
  *
  * @param   {object}  message     An object containing the message to be sent to the transport.
  * @fires mHub#toTransport
  */
  this.toTransport = function(message) {
    switch (message.method) {
      case 'listen':
        break;
      default:
        that.log('mHub', 'No method named ' + message.method + ' in toTransport().', 2);
        break;
    }
  };

  /**
  * This is used by the client to send a message directed at a specific transport.
  *
  * @param   {object}  message     An object containing the message to be sent to the session.
  * @fires mHub#toSession
  */
  this.toSession = function(message) {
    switch (message.method) {
      case 'assignEngine':
        break;
      default:
        that.log('mHub', 'No method named ' + message.method + ' in toSession().', 2);
        break;
    }
  };

  /**
  * This is used by the client to send a message directly to us (the hub).
  *
  * @param   {object}  message     An object containing the message to be sent to the session.
  */
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


  /**
  * This is used by the client to instruct MHB to shut down.
  *
  * @param   {function} [callback] The function to be called when we have finished our own cleanup.
  */
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
