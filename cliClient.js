/*
 * This is the command-line client for Manuvr. It's functionality is limited,
 *   but it ought to be enough to demonstrate what a client is expected to do
 *   and how it can be done. It is also expected that this client will serve
 *   as a sort of test-bench for developing Manuvrables (either hardware devices
 *   or pure software modules).
 * It is also possible that someone might wish to run MHB as a service on a
 *   small computer to act as a connection point for other Manuvrables, but without
 *   the need of an API. In that case, this client can be run with the headless
 *   setting via forever or monit, thereby filling all the roles of a client without 
 *   any kind of a breakout.
 *
 * For most purposes, we imagine our electron or API clients will find more usage.
 */
'use strict'

var util = require('util');
// var memwatch = require('memwatch-next');
//
// memwatch.on('leak', function(info) {
//   console.log("memwatch: " + info)
// });
//
// memwatch.on('stats', function(stats) {
//   console.log("stats: " + stats)
// });



/****************************************************************************************************
* This is the configuration for this client and some meta-awareness.                                *
****************************************************************************************************/
var packageJSON = require('./package.json');
var fs = require('fs');

/** This object stores our presently-active config. This config is the default.
 *  It may be clobbered by loadConfig().
 */
var config = {
  writtenByVersion:    packageJSON.version,
  verbosity:           7,
  logPath:             './logs/'
};

/****************************************************************************************************
* Small utility functions...                                                                        *
****************************************************************************************************/
function isFunction(fxn) {
  return (typeof fxn === 'function');
}

function isObject(fxn) {
  return (typeof fxn === 'object');
}



/****************************************************************************************************
* We are using chalk and cli-table for console formatting.                                          *
****************************************************************************************************/
var Table = require('cli-table');
var chalk = require('chalk');
// Let's take some some time to setup some CLI styles.
var error = chalk.bold.red;

var INNER_TABLE_STYLE = {
  chars: {
    'top': '',
    'top-mid': '',
    'top-left': '',
    'top-right': '',
    'bottom': '',
    'bottom-mid': '',
    'bottom-left': '',
    'bottom-right': '',
    'left': ' ',
    'left-mid': '─',
    'mid': '─',
    'mid-mid': '┼',
    'right': ' ',
    'right-mid': '─',
    'middle': '│'
  },
  style: {
    'padding-left': 0,
    'padding-right': 0
  }
};

var MIMIMAL_TABLE_STYLE = {
    chars: {
      'top': '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      'bottom': '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      'left': '',
      'left-mid': '',
      'mid': '',
      'mid-mid': '',
      'right': '',
      'right-mid': '',
      'middle': ' '
    },
    style: {
      'padding-left': 0,
      'padding-right': 0
    }
  };


/**
 * This function instantiates a table with the given header and style. Prevents redundant code.
 *
 * @param   {array}  header     An array of strings to use as a table header.
 * @returns {Table}
 */
var issueOuterTable = function(header) {
  var table = new Table({
    head: header,
    chars: {
      'top': '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      'bottom': '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      'left': '│',
      'left-mid': '├',
      'mid': '─',
      'mid-mid': '┼',
      'right': '│',
      'right-mid': '┤',
      'middle': '│'
    },
    style: {
      'padding-left': 0,
      'padding-right': 0
    }
  });
  return table;
}


/*
 * Extends the given input string to a fixed length by padding it with character.
 */
function extendToFixedLength(input, length, character) {
  while (input.length < length) {
    input += character;
  }
  return input;
}


/**
 * Save the current config, if it is dirty.
 *
 * @param   {callback}  callback  The function to call when the operation is finished.
 */
function saveConfig(callback) {
  if (config.dirty) {
    delete config.dirty;
    config.writtenByVersion = packageJSON.version;
    if (!callback) {
      callback = function(err) {
        if (err) {
          config.dirty = true;
          console.log(error('Error saving configuration: ') + err);
        } else {
          console.log('Config was saved.');
        }
      }
    }

    fs.writeFile('./config.json', JSON.stringify(config), callback);
  } else {
    // If we don't need to save, fire the callback with no error condition.
    if (callback) callback(false);
  }
}


/**
 * Tries to load a conf file from the given path, or the default path if no path
 *   is provided. If config load fails, function will populate config with a default
 *   and mark it dirty.
 *
 * @param   {string}  path  The filesystem path where the log directory is located.
 */
function loadConfig(path) {
  if (!path) {
    path = './config.json';
  }
  
  try {
    fs.existsSync(path, fs.R_OK);
    var data = fs.readFileSync(path, 'ascii');
    if (data) {
      var temp_config = JSON.parse(data);
      config = temp_config;
    }
    else {
      console.log(error('The config file '+path+' seems to be empty. Using config defaults...'));
      config.dirty = true;
    }
  }
  catch (err) {
    console.log(error('We experienced an while trying to load config from '+path+'. Error was '+err+'\nUsing config defaults...'));
    config.dirty = true;
  }

  // Now we should setup logging if we need it...
  if (config.logPath) {
    fs.exists(config.logPath,
      function(exists) {
        if (exists) {
          openLogFile(config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
        }
        else {
          fs.mkdir(config.logPath,
            function(err) {
              if (err) {
                console.log('Log directory (' + config.logPath + ') does not exist and could not be created. Logging disabled.');
              }
              else {
                openLogFile(config.logPath + 'mhb-' + Math.floor(new Date() / 1000) + '.log');
              }
            }
          );
        }
      }
    );
  }
}


// Load configuration.
loadConfig();


/****************************************************************************************************
* This is junk related to prompt.                                                                   *
****************************************************************************************************/
var prompt = require('prompt');
prompt.message = '';
prompt.delimiter = '';

// These are state-tracking variables for our modal CLI.
var cli_mode = [];
var session_in_use = '';


/****************************************************************************************************
 * Let's bring in the MHB stuff...                                                                   *
 ****************************************************************************************************/
var mHub = require('./lib/mHub.js');
var hub  = new mHub(config);;


/**
 * This function is where all toClient callbacks are funneled to (if they are not
 *   specifically handled elsewhere). Common client broadcasts should probably be handled here.
 *   
 * @param   {string}  ses     The name of the session that emitted the event.
 * @param   {string}  origin  The component of the session that emitted the event.
 * @param   {string}  method  The method being emitted.
 * @param   {object}  data    An object containing the arguments to the method.
 */
//function toClientAggregation(ses, origin, method, data) {
//  var ses_obj = sessions[ses];
//  switch (method) {
//    case 'log': // Client is getting a log from somewhere.
//      if (data[1] && data[1] <= config.verbosity) {
//        console.log(chalk.cyan.bold((Date.now()/1000).toString()+'\t'+ses) + chalk.yellow(' (' + origin + "):\t") + chalk.gray(data[0])+"\n");
//      }
//      if (current_log_file) {
//        // Write to the log file if we have one open.
//        fs.writeSync(current_log_file, new Date() + '\t' + ses_obj.getUUID() + ' (' +
//          origin + "):\t" + data[0] + '\n');
//      }
//      break;
//    case 'config':
//      // A session is telling us that it experienced a configuration change.
//      showSessionConfig(ses, data);
//      break;
//    default:
//      {
//        var table = issueOuterTable([chalk.white.bold('Source'), chalk.white.bold('Method'), chalk.white.bold('Arguments')]);
//        table.push([chalk.cyan.bold(ses+'->'+origin), chalk.gray.bold(method), chalk.gray(util.inspect(data, {depth: 10}))]);
//        console.log(table.toString());
//      }
//      break;
//  }
//}


hub.on('fromHub', function(payload) {
    switch (payload.origin) {
      case 'session':
        //origin, method, data, name, module
        break;
      case 'transport':
        //origin, method, data, name
        break;
      case 'hub':
        //origin, method, data
        break;
      default:
        console.log(error('Unknown origin: ' + payload.origin));
        break;
    }
  console.log('PLACEHOLDER: ' + util.inspect(payload));
});

/****************************************************************************************************
* Functions that just print things.                                                                 *
****************************************************************************************************/
var logo = require('./manuvrLogo'); // This is the Manuvr logo.


/**
 * Print the given configuration object, along with its subcomponents.
 *
 * @param   {string}  ses     The name of the session that emitted the event.
 * @param   {object}  sconf   The data the session exports.
 */
//function showSessionConfig(ses, sconf) {
//  var column_names = [''];
//  var sub_tables   = [];
//  
//  for (var unit in sconf) {
//    var table_ses = new Table(INNER_TABLE_STYLE);
//    column_names.push(chalk.white.bold(unit));
//    var table_ses = new Table(INNER_TABLE_STYLE);
//    for (var key in sconf[unit]) {
//      var table_rh_side = '';
//      if (sconf[unit].hasOwnProperty(key)) {
//        if (isObject(sconf[unit][key])) {
//          var table_obj = new Table(INNER_TABLE_STYLE);
//          for (var okey in sconf[unit][key]) {
//            table_obj.push([okey.toString(), util.inspect(sconf[unit][key][okey])]);
//          }
//          table_rh_side = table_obj.toString();
//        }
//        else {
//          table_rh_side = sconf[unit][key].toString();
//        }
//        table_ses.push([key.toString(), table_rh_side]);
//      }
//    }
//    sub_tables.push(table_ses.toString());
//  }
//
//  var final_array = [];
//  final_array.push(chalk.green(ses));
//  while (sub_tables.length > 0) {
//    final_array.push(chalk.gray(sub_tables.shift()));
//  }
//  
//  var table = issueOuterTable(column_names);
//  
//  table.push(final_array);
//  console.log(table.toString() + '\n');
//}


/**
 * Print a listing of instantiated sessions.
 *
 * @param   {string}  [filter]  If we only want to print a single session, name it here.
 */
function listSessions(filter) {
  var table = issueOuterTable([chalk.white.bold('Name'), chalk.white.bold('Session'), chalk.white.bold('Transport'), chalk.white.bold('Engine')]);
  for (var ses in sessions) {
    if (sessions.hasOwnProperty(ses)) {
      if ((0 === filter.length) || (-1 != filter.indexOf(ses))) {
        var sesObj = sessions[ses];

        var table_ses = new Table(INNER_TABLE_STYLE);
        var table_eng = new Table(INNER_TABLE_STYLE);
        var table_trn = new Table(INNER_TABLE_STYLE);

        for (var key in sesObj) {
          if (sesObj.hasOwnProperty(key) && sesObj[key] && (key !== '_events')) {
            // Only show the things that are part of this object, that are defined, and are not _events.
            if ((key !== 'engine') && (key !== 'transport')) {
              // We itemive the keys above separately.
              if ((config.verbosity >= 6) || !isFunction(sesObj[key])) {
                table_ses.push([key.toString(), sesObj[key].toString()]);
              }
            }
          }
        }

        for (var key in sesObj.engine) {
          if (sesObj.engine.hasOwnProperty(key) && sesObj.engine[key] && (key !==
              '_events')) {
            if ((key !== 'uuid')) {
              // We conceive of uuid as belonging to the session.
              if ((config.verbosity >= 6) || !isFunction(sesObj.engine[key])) {
                table_eng.push([key.toString(), sesObj.engine[key].toString()]);
              }
            }
          }
        }

        for (var key in sesObj.transport) {
          if (sesObj.transport.hasOwnProperty(key) && sesObj.transport[key] &&
            (key !== '_events')) {
            if ((config.verbosity >= 6) || !isFunction(sesObj[key])) {
              table_trn.push([key.toString(), sesObj.transport[key].toString()]);
            }
          }
        }

        table.push([chalk.green(ses), chalk.white(table_ses.toString()), chalk.gray(
          table_trn.toString()), chalk.gray(table_eng.toString())]);
      }
    }
  }
  console.log(table.toString() + '\n');
}


/**
 * Print our currently-active configuration to the console.
 *
 * @param {string} [s_key]   A specific key the user wants to see.
 */
function dumpConfiguration(s_key) {
  var table = new Table({
    chars: {
      'top': '',
      'top-mid': '',
      'top-left': '',
      'top-right': '',
      'bottom': '',
      'bottom-mid': '',
      'bottom-left': '',
      'bottom-right': '',
      'left': '',
      'left-mid': '',
      'mid': '',
      'mid-mid': '',
      'right': '',
      'right-mid': '',
      'middle': ' '
    },
    style: {
      'padding-left': 0,
      'padding-right': 0
    }
  });

  for (var key in config) {
    if (config.hasOwnProperty(key) && config[key] && (key !== 'dirty')) {
      if ((!s_key ^ (s_key == key))) {
        table.push([chalk.cyan(key), chalk.white(config[key].toString())]);
      }
    }
  }

  console.log(chalk.white.bold(extendToFixedLength("==< MHB Config (" + (config
      .dirty ? chalk.red.bold('dirty') : chalk.green.bold('saved')) +
    ') >', 128, '=')) + "\n" + table.toString() + '\n');
}



/**
 * Print inline help.
 */
function printUsage(current_mode) {
  var table = new Table(MIMIMAL_TABLE_STYLE);

  console.log(chalk.white.bold(extendToFixedLength("==< MHB Debug Console   v" + packageJSON.version + ' >', 128, '=')));

  // These are mode-specific commands.
  switch (current_mode) {
    case 'session':
      table.push([chalk.magenta('connect'), chalk.white('[address]'), chalk.grey(
        'Connect to a given counterparty with optional address.')]);
      table.push([chalk.magenta('disconnect'), chalk.white(''), chalk.grey(
        'Disconnect from counterparty.')]);
      break;
    default:
      //table.push([chalk.white(''), chalk.gray()]);
      table.push([chalk.magenta('(s)ession'), chalk.white('[name]'), chalk.grey(
        'If no name is provided, lists all instantiated sessions. Otherwise, lists the named session.'
      )]);
      table.push([chalk.magenta('(u)se'), chalk.white('name'), chalk.grey(
        'Changes to the session modal under the given name.')]);
      table.push([chalk.magenta('(c)onfig'), chalk.white(''), chalk.grey(
        'Show the current configuration.')]);
      break;
  }

  // These are globally-accessable commands.
  table.push([chalk.magenta('(v)erbosity'), chalk.white('[0-7]'), chalk.grey(
    'Print or change the console\'s verbosity.')]);
  table.push([chalk.magenta('saveconfig'), chalk.white(''), chalk.grey(
    'Save the configuration (dirty or not).')]);
  table.push([chalk.magenta('(m)anuvr'), chalk.white(''), chalk.grey(
    'Our logo is so awesome...')]);
  table.push([chalk.magenta('(h)elp'), chalk.white(''), chalk.grey('This.')]);
  table.push([chalk.magenta('(q)uit'), chalk.white(''), chalk.grey(
    'Cleanup and exit the program.')]);

  console.log(table.toString());
  console.log(chalk.white(
    '\nTo back out from an active mode, strike <Enter>. When done from the root of the modal tree, this will print this help text.'
  ));
}


var sampleObject = {
  "messageId": 8,
  "flag": 0,
  "args": []
}



/**
 * This fxn does the cleanup required to exit gracefully, and then ends the process.
 * This function does not return.
 */
function quit(exit_code) {
  // Write a config file if the conf is dirty.
  saveConfig(function(err) {
    if (exit_code) {
      console.log('Exiting with reason: ' + exit_code);
    }
    
    if (err) {
      console.log(error('Failed to save config prior to exit. Changes will be lost.'));
    }
    
    hub.quit(function() {
      process.exit(); // An hero...
    });
  });
}


// We should bind to some things in the process, so we can clean up.
process.on('SIGHUP',  function() { quit('SIGHUP');  });
process.on('SIGINT',  function() { quit('SIGINT');  });
process.on('SIGQUIT', function() { quit('SIGQUIT'); });
process.on('SIGABRT', function() { quit('SIGABRT'); });
process.on('SIGTERM', function() { quit('SIGTERM'); });


/**
 * This is here to help with commands that require a session. Allows us to use a
 *   previously-specified session, versus forcing the user to specify it each time.
 *
 * @param   {string} cmd     The command to run.
 * @param   {array}  [args]  If we only want to print a single session, name it here.
 * @param   {array}  [data]  If we only want to print a single session, name it here.
 */
function runSessionCommand(cmd, args, data) {
  if (session_in_use && (args.length == 0)) {
    sessions[session_in_use].emit('fromClient', 'session', cmd, (data ? data : null));
  } 
  else if (args.length > 0) {
    var ses = args.shift();
    if (!sessions.hasOwnProperty(ses)) {
      console.log(error('Session \'' + ses + '\' was not found.'));
    } 
    else {
      sessions[ses].emit('fromClient', 'session', cmd, (data ? data : null));
    }
  } 
  else {
    console.log(error('You need to specify a session inline or with \'use\'.'));
  }
}


/**
 * The prompt and user-input handling function.
 */
function promptUserForDirective() {
  var exit_in_progress = false;
  var cli_mode_string = '';

  for (var i = 0; i < cli_mode.length; i++) {
    cli_mode_string += cli_mode[i] + ' ';
  }
  cli_mode_string.trim();

  prompt.get([{
    name: 'directive',
    description: (cli_mode_string.length > 0 ? cli_mode_string + '>' :
      'ManuvrHostBridge> ').magenta
  }], function(prompt_err, result) {
    if (prompt_err) {
      exit_in_progress = true;
      quit();
    } 
    else {
      var args = result.directive.toString().split(' ');
      var directive = args.shift();

      switch (directive) {
        case 'session': // Print a list of instantiated sessions.
        case 's':
          listSessions(args);
          break;
        case 'use': // User is indicating that ve wants to use the named session.
        case 'u':   // No argument un-uses the current session.
          {
            var list_sessions_brief = false;
            if (0 == args.length) {
              if (session_in_use) {
                cli_mode.pop();
                if (0 == cli_mode.length) {
                  prompt.message = '';
                  session_in_use = '';
                }
                break;
              }
              else {
                console.log(error(
                  'There exists more than one session. You must therefore name it explicitly.'
                ));
                list_sessions_brief = true;
              }
            } else {
              if (1 < args.length) {
                console.log(error(
                  '\'use\' only accepts one argument (the name of an extant session).'
                ));
                list_sessions_brief = true;
              } else {
                var ses = args.shift();
                if (!sessions.hasOwnProperty(ses)) {
                  console.log(error('There is not a session named \'' + ses +
                    '\'.'));
                  list_sessions_brief = true;
                } else {
                  session_in_use = ses;
                  prompt.message = chalk.green('(' + ses + ') ');
                  if (cli_mode.indexOf('session') == -1) {
                    cli_mode.push('session');
                  }
                  console.log('Now using session ' + chalk.green(
                    session_in_use) + '.');
                }
              }
            }

            if (list_sessions_brief) {
              for (ses in sessions) {
                if (sessions.hasOwnProperty(ses)) {
                  console.log(chalk.green(ses));
                }
              }
            }
          }
          break;
        case 'verbosity': // Set or print the current log verbosity.
        case 'v':
          if (args.length > 0) {
            config.verbosity = args[0];
          }
          console.log('Console verbosity is presently ' + chalk.green(
            config.verbosity) + '.');
          break;
        case 'c':
          switch (args.length) {
            case 0:
              dumpConfiguration();
              break;
            case 1:
              dumpConfiguration(args.shift());
              break;
            default:
              {
                // This will be construed as the user setting a conf key.
                var k = args.shift();
                var v = args.shift();
                if (config.hasOwnProperty(k) && config[k] === v) {
                  console.log('Config key ' + k + ' already has the value ' + v + '.');
                }
                else {
                  config[k] = v;
                  config.dirty = true;
                }
              }
              break;
          }
          break;
        case 'saveconfig': // Force-Save the current configuration.
          config.dirty = true;
          saveConfig();
          break;
        case 'test': //
          console.log(util.inspect(sampleObject));
          sessions.actor0.emit('fromClient', 'engine', 'send', sampleObject);
          break;
        case 'desync0': // Print a list of instantiated transports.
          sessions.actor0.emit('fromClient', 'engine', 'badsync', '');
          break;
        case 'desync1': // Print a list of instantiated transports.
          sessions.actor1.emit('fromClient', 'engine', 'badsync', '');
          break;
        case 'manuvr':
        case 'm':
          logo();
          break;
        case 'history': // Print a history of our directives.
          break;
        case 'quit': // Return 0 for no-error-on-exit.
        case 'exit':
        case 'q':
          exit_in_progress = true;
          quit();
          break;
        case '':
          if ('' !== session_in_use) {
            runSessionCommand('getLiveConfig', [session_in_use]);
          }
          else {
            printUsage();
          }
          break;
        case 'help':
        case 'h':
          printUsage(cli_mode.length ? cli_mode[0] : '');
          break;
        default:  // Pass directive to the session.
          if ('' !== session_in_use) {
            var target_module = 'session';
            if (args.length > 0) {
              if ((directive == 'engine') || (directive == 'transport')) {
                target_module = directive;
                directive = args.shift();
              }
            }
            sessions[session_in_use].emit('fromClient', target_module, directive, (args.length > 0 ? args : null));
          }
          else {
            printUsage();
          }
          break;
      }
    }

    console.log("\n");
    if (!exit_in_progress) {
      promptUserForDirective();
    }
  });
}



/****************************************************************************************************
* Execution begins below this block.                                                                *
****************************************************************************************************/

console.log(chalk.white(packageJSON.name + '  v' + packageJSON.version));
prompt.start(); // Start prompt running.

hub.clientReady();   // Start MHB churning.


// Kick off the interaction by prompting the user.
promptUserForDirective();

