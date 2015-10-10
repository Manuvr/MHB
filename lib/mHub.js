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
var _forEach = require('lodash').forEach;
var _get = require('lodash').get;
var _merge = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');
var inherits = require('util').inherits;

// This is the version information for MHB.
var packageJSON = require('../package.json');
var messageHandler = require('lib/messageHandler');

/** If we have an open log file, this will be a file-descriptor. */
var current_log_file = false;


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

/*
* Client reference for us to emit to.
* TODO: Allow multiple?
*/
function mHub(cli_config) {
  ee.call(this);
  var that = this;

  // This will allow the client to override default settings in MHB
  //   prior to any action taking place that would depend on it.
  this.client_config  = _clonedeep(cli_config);

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
  this.transportFactories = {};

  /** We track instantiated sessions with this object. */
  this.sessions = {};
  var toSession = function(name, message) {
    that.sessions[name].emit('input', message);
  };

  /** We track engine factories with this object. */
  this.engines = {};

  /**
  * Sends an emit to the client. That piece of software can then do the needful as it
  *   sees appropriate.
  *
  * @param   {object}  message     An object containing the message to be sent to the client.
  * @fires mHub#toClient
  */
  this.toClient = function(message) {    that.emit('output', message);   };

  var mSession = new sessionGenerator();
  
  /**
  * Given an optional path, loads any javascript files from it. This is our mechanism
  *   for dynmaically loading engines.
  *
  * @param   {string}  [path]  The filesystem path where engines can be found.
  */
  var loadEngines = function(path) {
    that.log('hub', 'Loading engines from ' + path);
    fs.readdir(path, function(err, items) {
      var loaded = 0;
      if (err) {
        that.log('hub', 'Failed to load engines because ' + err);
      }
      else {
        for (var i = 0; i < items.length; i++) {
          if ('.js' == items[i].substr(items[i].length - 3).toLowerCase()) {
            that.log('hub', 'Loading engine ' + path+items[i]);
            var temp_req = require(path+items[i]);
            var efact_name = temp_req.config.schema.describe.identity;
            that.engines[efact_name] = temp_req;
            that.interface_spec.adjuncts.engines[efact_name] = temp_req.config;
            loaded++;
            
            // Add any loaded engines to the SessionGenerator...
            mSession.addEngine(that.engines[efact_name]);
            that.toClient({
              target: ['engines', efact_name, '_adjunctDef'],
              data:   that.interface_spec.adjuncts.engines[efact_name]
            });
          }
          else {
            that.log('hub', 'Skipping non-JS file ' + items[i]);
          }
        }
        that.log('hub', 'Loaded ' + loaded + ' engines.');
      }
    });
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
            var tfact_name = temp_req.IFSpec.schema.state.name.value;
            that.transportFactories[tfact_name] = temp_req.init();
            that.interface_spec.adjuncts.transportFactories[tfact_name] = temp_req.IFSpec;
            loaded++;
            
            // The hub needs to listen for things on all transport factories. We
            // remain listening for the life of the transport.
            that.transportFactories[tfact_name].on('output',
              function(message) {
                switch (message.target[0]) {
                  case 'connected':
                    // The transport factory got a connection. The data is the instance.
                    that.buildNewSession(xport, name, callback);
                    break;
                  default:
                    message.target.unshift('transportFactories', tfact_name);
                    that.toClient({
                      target: message.target,
                      data:   message.data
                    });
                    break;
                }
              }
            );
            
            that.toClient({
              target: ['transportFactories', tfact_name, '_adjunctDef'],
              data:   that.interface_spec.adjuncts.transportFactories[tfact_name]
            });
          }
          else {
            that.log('hub', 'Skipping non-JS file ' + items[i]);
          }
        }
        that.log('hub', 'Loaded ' + loaded + ' transports.');
      }
    });
  };


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
    var xport_worker = false;
    if (typeof xport === 'string') {
      if (that.transportFactories.hasOwnProperty(xport)) {
        xport_worker = that.transportFactories[xport].getWorker();
      }
      else {
        if (callback) callback('the named transport cannot be found.');
        return;
      }
    }
    else {
      xport_worker = xport
    }
    
    if (name != undefined && name !== '') {
      if (!that.sessions.hasOwnProperty(name)) {
        that.sessions[name] = mSession.init(xport_worker);
        
        that.sessions[name].on('output', function(message) {
            if (message.target[0] === 'session') {
              message.target.shift();
            }
            //console.log('BRDCAST TO RENDER '+ses +'(origin)'+origin+' '+ method);
            switch (message.target[message.target.length-1]) {
              case '_adjunctDef':
                // A session is telling us that it experienced a configuration change.
                //showSessionConfig(ses, data);
                that.interface_spec.adjuncts.sessions[name] = message.data;
                break;
              case 'log':
                that.log('mHub:session ('+name+')', message.data[0], (message.data.length > 1 ? message.data[1] : 7));
                break;
            }
            message.target.unshift('sessions', name);
            that.toClient({
              target: message.target,
              data:   message.data
            });
          }
        );
        toSession(name, {target: ['_adjunctDef'], data: {}});                  
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


  /**
  * The client code (whatever that might be) calls this when it has fully loaded and stable.
  * This is the point at which we start executing any stored user instructions, notifying
  *   the client of our own state, etc...
  */
  this.clientReady = function() {
    // We should tell the front-end what transports we know of.
    that.toClient({
      target: ['_adjunctDef'],
      data:   this.interface_spec
    });
    loadTransports(__dirname+'/transports/');
    loadEngines(__dirname+'/engines/');
  };
  
// I think we outgrew these....  
//  
//  /**
//  * This is used by the client to send a message directed at a specific transport.
//  *
//  * @param   {object}  message     An object containing the message to be sent to the transport.
//  * @fires mHub#toTransport
//  */
//  this.toTransport = function(message) {
//    switch (message.method) {
//      case 'listen':
//        break;
//      default:
//        that.log('mHub', 'No method named ' + message.method + ' in toTransport().', 2);
//        break;
//    }
//  };
//
//  /**
//  * This is used by the client to send a message directed at a specific transport.
//  *
//  * @param   {object}  message     An object containing the message to be sent to the session.
//  * @fires mHub#toSession
//  */
//  this.toSession = function(message) {
//    switch (message.method) {
//      case 'assignEngine':
//        break;
//      default:
//        that.log('mHub', 'No method named ' + message.method + ' in toSession().', 2);
//        break;
//    }
//  };

  /**
  * This is used by the client to send a message directly to us (the hub).
  *
  * @param   {object}  message     An object containing the message to be sent to the session.
  */
  this.toHub = function(message) {
    // At this point, we do type validation on 'input' method arguments. We need to
    //   cast them into their proper types and formats.
    if (message.data && message.data.length) {
      // First, we make sure we have data to operate on. If we do, procede to check it.
      var method = message.target[message.target.length-1];
      var tempArray = message.target.slice(0, message.target.length-1);
      if(message.target.length > 1) {
        tempArray.unshift('adjuncts');
        tempArray.push('schema', 'inputs', method);
      }
      else {
        tempArray.unshift('schema', 'inputs', method);
      }

      // TODO, re-code as map
      for (var i = 0; i < message.data.length; i++) {
        var datum = message.data[i];
        switch(_get(that.interface_spec, tempArray)[i].type) {
          case 'boolean':
            message.data[i] = Boolean(datum);
            break;
          case 'float':
            if (typeof datum == 'number') {
              message.data[i] = parseFloat(datum);
            }
            else {
              that.log('mHub', 'Argument to '+method+' must be a float, but '+datum+' was provided. Using zero...', 2);
              message.data[i] = 0;
            }
            break;
          case 'integer':
            if (typeof datum == 'number') {
              message.data[i] = parseInt(datum);
            }
            else {
              that.log('mHub', 'Argument to '+method+' must be an integer, but '+datum+' was provided. Using zero...', 2);
              message.data[i] = 0;
            }
            break;
          case 'number':
            if (typeof datum == 'number') {
              message.data[i] = Number(datum);
            }
            else {
              that.log('mHub', 'Argument to '+method+' must be a number, but '+datum+' was provided. Using zero...', 2);
              message.data[i] = 0;
            }
            break;
          case 'object':
          case 'string':
          default:
            message.data[i] = datum.toString();
            break;
        }
      }
    }
    
    if (message.target.length > 1) {
      var adj_target = message.target.shift();
      if (that.hasOwnProperty(adj_target)) {
        var identifier = message.target.shift();
        that[adj_target][identifier].emit('input', message);
      }
    }
    else {
      var method = message.target.shift();
      switch (method) {
        case 'newSession':
          that.buildNewSession(message.data.shift(), message.data.shift(),
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
          that.log('mHub', 'No method named ' + method + ' in toHub().', 2);
          break;
      }
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
    else {
      if (callback) callback(false);
    }
  };
  
  
  this.interface_spec = {
    schema: {
      state: {
        'toggleDevTools': {
          label: 'Dev tools Open',
          type: 'boolean',
          value:  false
        }
      },
      inputs: {
        'quit': {
          label: "Quit",
          args: [ { label: '?', type: 'boolean' } ],
          func: function(me, data) {
            quit();
          }
        },
        'toggleDevTools': {
          label: "Toggle Dev Tools",
          args: [{ label: 'OpenTools', type: 'boolean' } ],
          func: function(me, data) {
            var toggle;
            if (mainWindow.webContents.isDevToolsOpened()) {
              toggle = false;
              mainWindow.webContents.closeDevTools();
            }
            else {
              toggle = true;
              mainWindow.webContents.openDevTools({detach: true});
            }
            mainWindow.webContents.send('api', {
              target: ["window", "toggleDevTools"],
              data:   toggle
            })
          }
        },
        'ready' : {
          label: "ready",
          args: [ { label: "Ready", type: "boolean"}],
          func: function(me, data){
            mainWindow.webContents.send('api', {
                target: ["window", "_adjunctDef"],
                data:   me.getIntSpec()
            });
            console.log(util.inspect(me.getIntSpec()));
            // The react front-end is ready.
            hub.clientReady();
          },
          hidden: true
        },


        'test' : {
          label: "derp",
          args: [ { label: "Something", type: "boolean"}],
          func: function(me, data){
            console.log("Got this in test: " + util.inspect(data))
            console.log("Current Adj: " + util.inspect(Object.keys(me.interface_spec.adjuncts)));
            me.mH.sendToOutput({target:["log"], data: "I'm data!"});
          }
        }
      },
      outputs: {
        'toggleDevTools': {
          label: 'Dev tools Open',
          type: 'boolean',
          state: 'toggleDevTools'
        }
      }
    },
    adjuncts: {
      // "mHub1": {
      //   aInstance: someVar,
      //   type: "mHub",
      //   schema: {},
      //   adjuncts: {}
      // }
    },
    adjunctOutputTap: {
      "mHub": {
        "data": function(me, msg, adjunctID){
          me.someFunction(msg.data);
          return false; // don't emit
        }
      }

    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);
  this.mH.addAdjunct("mHub", new mHub(config));
}


inherits(mHub, ee);

module.exports = mHub;
