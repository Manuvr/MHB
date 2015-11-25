'use strict'

var ee   = require('events').EventEmitter;
var fs   = require('fs');
var util = require('util');
var mSession = require('./mSession.js'); // session factory
var _forOwn  = require('lodash').forOwn;
var _get = require('lodash').get;
var _throttle = require('lodash').throttle;
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

  /*
  * Responsible for storing and/or propagating the log.
  */
  var logObj = function(logObj) {
    if (current_log_file) {
      // Write to the log file if we have one open.
      fs.writeSync(current_log_file, logObj.verbosity + '\t' + logObj.dt + '\t' +logObj.origin+ "\t" + logObj.body + '\n');
    }
    console.log(logObj.origin+ ":\t" + logObj.body);

    // This send is where the log leaves MHB. If there is a client that cares at the other
    //   side they will need to respond to this formatting. All of these fields will be populated.
    that.send('log', logObj);
  };

  /**
  * Normallizes the log. This is the end-point for all logging in the system. We may
  *   have shunted the same log off to the client via an emit, but it can be assumed
  *   that all logs should come to a head here.
  *
  * @param   {string}  origin      What module originated the log?
  * @param   {string}  body        The readable data comprising the log.
  * @param   {number}  [verbosity] Follows *nix syslog conventions. If not supplied, defaults to 7.
  */
  this.log = function(origin, body, verbosity) {
    logObj(
      {
        origin: origin.toString(),
        body: body,
        verbosity: verbosity ? verbosity : 7,
        dt: new Date().toTimeString()
      }
    );
  };

  /**
  * Given an optional path, loads any javascript files from it. This is our mechanism
  *   for dynmaically loading engines.
  *
  * @param   {string}  [path]  The filesystem path where engines can be found.
  */
  var loadEngines = function(path) {
    that.log('mHub', 'Loading engines from ' + path);
    fs.readdir(path, function(err, items) {
      var loaded = 0;
      if (err) {
        that.log('mHub', 'Failed to load engines because ' + err, 2);
      }
      else {
        for (var i = 0; i < items.length; i++) {
          if ('.js' == items[i].substr(items[i].length - 3).toLowerCase()) {
            that.log('mHub', 'Loading engine ' + path+items[i]);
            var temp_req = require(path+items[i]);
            var efact_name = items[i];
            that.engines[efact_name] = temp_req;
            loaded++;
          }
          else {
            that.log('mHub', 'Skipping non-JS file ' + items[i]);
          }
        }
        that.log('mHub', 'Loaded ' + loaded + ' engines.', 6);
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
    that.log('mHub', 'Loading transports from ' + path);
    fs.readdir(path, function(err, items) {
      var loaded = 0;
      if (err) {
        that.log('mHub', 'Failed to load transports because ' + err, 2);
      }
      else {
        for (var i = 0; i < items.length; i++) {
          if ('.js' == items[i].substr(items[i].length - 3).toLowerCase()) {
            that.log('mHub', 'Loading transport ' + path+items[i]);
            var temp_req = require(path+items[i]);
            var tfact_name = items[i];
            that.mH.addAdjunct(tfact_name, temp_req.init());
            loaded++;
          }
          else {
            that.log('mHub', 'Skipping non-JS file ' + items[i], 4);
          }
        }
        that.log('mHub', 'Loaded ' + loaded + ' transports.', 6);
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
  */
  this.buildNewSession = function(xport, name, callback) {
    var xport_worker = false;
    if (typeof xport === 'string') {
      if (that.interface_spec.adjuncts.hasOwnProperty(xport)) {
        if (that.mH.getAdjunctType(xport) === 'mTransportFactory') {
          var named_adj = that.interface_spec.adjuncts[xport];
          xport_worker = named_adj.instance.getWorker();
        }
        else {
          that.log('mHub', "'"+xport+"' names a  "+that.mH.getAdjunctType(named_adj)+", not an mTransportFactory.", 3);
        }
      }
      else {
        that.log('mHub', "There is no mTransportFactory named '"+xport+"'.", 3);
      }
      if (!xport_worker) {
        if (callback) callback('The named transport factory cannot be found.');
        that.log('mHub', 'The named transport factory cannot be found.', 3);
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
      inputs: {
        'quit': {
          label: "Quit",
          args: [ ],
          func: function(me, data) {
            me.quit();
          },
          hidden: true
        },
        'newSession': {
          label: "Create Session",
          args: [{ label: 'Transport Name', type: 'string', def: 'loopback.js' },
                 { label: 'Session Name', type: 'string', def: 'testSes' }],
          func: function(me, data) {
            me.buildNewSession(data.shift(), data.shift(),
              function(err) {
                if (err) {
                  me.log('mHub', 'Failed to add a new session because '+err, 3);
                }
              }
            );
          }
        },
        'assignEngine': {
          label: "Assign Engine",
          args: [{ label: 'Session Name', type: 'string', def: 'testSes' },
                 { label: 'Engine Name', type: 'string', def: 'debugEngine.js' }],
          func: function(me, data) {
            var sesObj  = _get(me.interface_spec.adjuncts, data[0], false);
            var nginObj = _get(me.engines,                 data[1], false);
            if (sesObj && nginObj) {
              sesObj = sesObj.instance;
              sesObj.assignEngine(nginObj);
            }
          }
        }
      },
      outputs: {
        'shutdownComplete': {
          // No state. Trying to implement callbackish behavior via our mH.
          type: 'boolean',
          value: false
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
          me.log(msg.target.toString()+',mHub', msg.data.body, msg.data.verbosity);
          return false;
        }
      },
      "mTransport": {
        "log": function(me, msg, adjunctID){
          msg.target.push(adjunctID);
          me.log(msg.target.toString()+',mHub', msg.data.body, msg.data.verbosity);
          return false;
        }
      },
      "mTransportFactory": {
        "log": function(me, msg, adjunctID){
          msg.target.push(adjunctID);
          me.log(msg.target.toString()+',mHub', msg.data.body, msg.data.verbosity);
          return false;
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
          me.log(msg.target.toString()+',mHub', msg.data.body, msg.data.verbosity);
          return false;
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
  if (that.client_config.hasOwnProperty('userEnginePaths')) {
    //TODO: Split apart provided string into paths and try to load engines from them.
    //loadEngines(__dirname+'/engines/');
  }
}


inherits(mHub, ee);

module.exports = mHub;
