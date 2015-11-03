'use strict'

var ee   = require('events').EventEmitter;
var fs   = require('fs');
var util = require('util');
var mSession = require('./mSession.js'); // session factory
var _forOwn  = require('lodash').forOwn;
var _get = require('lodash').get;
var _merge = require('lodash.merge');
var _clonedeep = require('lodash.clonedeep');
var inherits = require('util').inherits;

// This is the version information for MHB.
var packageJSON = require('../package.json');
var messageHandler = require('./messageHandler.js');

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

  this.engines = {};

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
    
    that.send('log', {origin: origin, body: body, verbosity: verbosity, dt: new Date().getTime()/1000});
  };


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
            var efact_name = items[i];
            that.engines[efact_name] = temp_req;
            loaded++;
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
            var tfact_name = items[i];
            that.mH.addAdjunct(tfact_name, temp_req.init());
            loaded++;
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
  if (that.client_config.logPath) {
    fs.exists(that.client_config.logPath,
      function(exists) {
        if (exists) {
          openLogFile(that.client_config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
        }
        else {
          fs.mkdir(that.client_config.logPath,
            function(err) {
              if (err) {
                console.log(err+'\nLog directory (' + that.client_config.logPath + ') does not exist and could not be created. Logging disabled.');
              }
              else {
                openLogFile(that.client_config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
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
      _forOwn(that.interface_spec.adjuncts,
        function(val, key, obj){
          if (that.mH.getAdjunctType(key) === 'mTransport') {
            xport_worker = val.instance.getWorker();
          }
        }
      );
      if (!xport_worker) {
        if (callback) callback('The named transport cannot be found.');
        that.log('mHub', 'The named transport cannot be found.', 3);
        return;
      }
    }
    else {
      if (xport.interface_spec.type !== 'mTransport') {
        if (callback) callback('The passed-in object was not of type mTransport.');
        that.log('mHub', 'The passed-in object was not of type mTransport.', 3);
        return;
      }
      xport_worker = xport
    }

    if (name != undefined && name !== '') {
      if (!that.interface_spec.adjuncts.hasOwnProperty(name)) {
        that.mH.addAdjunct(name, new mSession(xport_worker));
        //toSession(name, {target: ['_adjunctDef'], data: {}});
        that.log('mHub', 'Created a nes session named "'+name+'".', 4);
        if (callback) callback(false);  // Return no error.
      }
      else {
        if (callback) callback('An adjunct by that name already exists.');
        that.log('mHub', 'An adjunct by that name already exists.', 3);
      }
    }
    else {
      if (callback) callback('The provided session name is invalid.');
      that.log('mHub', 'The provided session name is invalid.', 3);
    }
  }


  /**
  * The client code (whatever that might be) calls this when it has fully loaded and stable.
  * This is the point at which we start executing any stored user instructions, notifying
  *   the client of our own state, etc...
  */
  this.clientReady = function() {
    // We should tell the front-end what transports we know of.
    that.send({
      target: ['_adjunctUpdate'],
      data:   that.interface_spec
    });
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
    type: 'mHub',
    schema: {
      state: {
        'userEnginePath': {
          type: 'string',
          value: './userEngines/'
        }
      },
      inputs: {
        'quit': {
          label: "Quit",
          args: [ { label: '?', type: 'boolean' } ],
          func: function(me, data) {
            me.quit();
          },
          hidden: true
        },
        'newSession': {
          label: "Create Session",
          args: [{ label: 'Transport Name', type: 'string' },
                 { label: 'Session Name', type: 'string' }],
          func: function(me, data) {
            me.buildNewSession(data.shift(), data.shift(),
              function(err) {
                if (err) {
                  me.log('mHub', 'Failed to add a new session because '+err, 3);
                }
                else {
                  // Broadcast the new session name back to the client.
                }
              }
            );
          }
        },
        'assignEngine': {
          label: "Assign Engine",
          args: [{ label: 'Session Name', type: 'string' },
                 { label: 'Engine Name', type: 'string' }],
          func: function(me, data) {
            var xprtObj = false;
            if (me.interface_spec.adjuncts[data[1]]) {
              xprtObj = me.interface_spec.adjuncts[data[1]].instance;
              that.mH.sendToAdjunct(data[0], ['assign'], xprtObj);
            }
          }
        }
      },
      outputs: {
        'log': {
          type: 'array',
          label: 'Log'
        }
      }
    },
    taps: {
      "mEngine": {
        "SELF_DESCRIBE": function(me, msg, adjunctID){
          var engineConfig = false;
          var name = msg.data.args[0];

          // TODO: Would be nice to have a function like getAllAdjuctsOfType()...
          for (var eng in me.engines) {
            if (eng.schema.type === 'mEngine') {
              //TODO: the following simplistic check makes version-control in engines
              //        harder than it should be.
              engineConfig = eng.self_description;
              if (name === engineConfig.identity) {
                // Pass the factory method into the session so it can instance it.
                me.interface_spec.adjuncts[adjunctID].addEngine(eng.init, msg.data.args[1]);
              }
            }
          }
          return false; // don't emit
        },
        "log": function(me, msg, adjunctID){
          msg.target.push(adjunctID);
          me.log(msg.target.toString(), msg.data[0], msg.data[1]);
          return true; // Pass through to client.
        }
      },
      "mTransport": {
        "log": function(me, msg, adjunctID){
          msg.target.push(adjunctID);
          me.log(msg.target.toString(), msg.data[0], msg.data[1]);
          return true; // Pass through to client.
        },
        "connected": function(me, msg, adjunctID){
          me.buildNewSession(msg.data, 'NewSession'+Math.random().toString().slice(2, 6));
          me.log(msg.target.toString(), 'Got a connected broadcast from '+adjunctID, 7);
          return false;
        },
      },
      "mSession": {
        "log": function(me, msg, adjunctID){
          msg.target.push(adjunctID);
          me.log(msg.target.toString(), msg.data[0], msg.data[1]);
          return true; // Pass through to client.
        }
      }
    },
    adjuncts: {
    }
  };

  // instantiate handler
  this.mH = new messageHandler(this.interface_spec, this);
  loadTransports(__dirname+'/transports/');
  loadEngines(__dirname+'/engines/');
}


inherits(mHub, ee);

module.exports = mHub;
