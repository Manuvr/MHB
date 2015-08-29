/*
 * This is to become the transport test directory.
 *
 */
'use strict'

//TODO: There is probably a better means of reading this from the package.json....
var packageJSON = require('./package.json');

var util = require('util');

var memwatch = require('memwatch-next');

memwatch.on('leak', function(info) {
  console.log("memwatch: " + info)
});

memwatch.on('stats', function(stats) {
  console.log("stats: " + stats)
});

/****************************************************************************************************
 * We are using chalk for console formatting.                                                        *
 ****************************************************************************************************/

var chalk = require('chalk');
// Let's take some some time to setup some CLI styles.
var error = chalk.bold.red;



/****************************************************************************************************
 * This is junk related to prompt.                                                                   *
 ****************************************************************************************************/
var prompt = require('prompt');
prompt.message = '';
prompt.delimiter = '';


/****************************************************************************************************
 * Let's bring in the MHB stuff...                                                                   *
 ****************************************************************************************************/
var mSession = require('./lib/mSession.js'); // session factory
var mEngine = require('./lib/mEngine.js'); //  DHB
var BTTransport = require('./lib/bluetooth.js'); // bluetooth
var LBTransport = require('./lib/loopback.js'); // bluetooth

var lb = new LBTransport();

var transports = {};
transports.bt_transport = BTTransport;


var sessionGenerator = new mSession();

var sessions = {};
sessions.bt_session = sessionGenerator.init(new BTTransport());
//var lb_session = sessionGenerator.init(new LBTransport());



// By passing in the transports, we are returned sessions. When a session is successfully
//   setup, the actor variable will become a reference to the specific kind of manuvrable
//   that connected to the given transport.
sessions.actor0 = sessionGenerator.init(lb.transport0);
sessions.actor1 = sessionGenerator.init(lb.transport1);


// Now, for each session that we have, we should dd or toClient listener.

sessions.bt_session.on('toClient', function(origin, type, data) {
  console.log(
    chalk.gray.bold("from:" + origin + "\n\t" +
      "type:" + type + "\n\t" +
      "data:" + JSON.stringify(data, {
        depth: 3
      })
    ));
})

sessions.actor0.on('toClient', function(origin, type, data) {
  console.log(
    chalk.gray.bold("from:" + origin + "\n\t" +
      "type:" + type + "\n\t" +
      "data:" + util.inspect(data)
    ));
})

sessions.actor1.on('toClient', function(origin, type, data) {
  console.log(
    chalk.gray.bold("from:" + origin + "\n\t" +
      "type:" + type + "\n\t" +
      "data:" + util.inspect(data)
    ));
})


/****************************************************************************************************
 * Functions that just print things.                                                                 *
 ****************************************************************************************************/

/*
 *
 */
function listSessions() {
  for (var ses in sessions) {
    if (sessions.hasOwnProperty(ses)) {
      console.log(chalk.green.bold(ses) + chalk.gray(sessions[ses].toString()));
    }
  }
}


/*
 *
 */
function listTransports() {
  for (var ses in sessions) {
    if (sessions.hasOwnProperty(ses)) {
      console.log(chalk.green.bold('NAME OF TRANSPORT') + chalk.gray(
        'Some data about the transport factory.'));
    }
  }
}


/*
 *
 */
function printUsage() {
  console.log(chalk.white(
    "MHB Debug Console\n========================================================================"
  ));
  console.log(chalk.cyan('msglegend    ') + chalk.gray(
    'Display the message legend.'));
  console.log(chalk.cyan('nodestack    ') + chalk.gray('Dump the stack-trace.'));
  console.log(chalk.cyan('quit         ') + chalk.gray(
    'Cleanup and exit the program.'));
}

/*
 *	PrObLeM???
 */
function troll() {
  console.log("\n");
  console.log(chalk.white(
    "777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "777777777777777777777777777777777............................................7777777777777777777777"
  ));
  console.log(chalk.white(
    "7777777777777777777777777................7777777777777777777777777777777777.....7777777777777777777"
  ));
  console.log(chalk.white(
    "7777777777777777777...........7777777777.....777777777777777..7777777777777777...777777777777777777"
  ));
  console.log(chalk.white(
    "77777777777777777....77777777777777777777777777777777777777777777..7777777777777...7777777777777777"
  ));
  console.log(chalk.white(
    "77777777777777....7777.77......777777777777...77777777777777..777777.777777777777...777777777777777"
  ));
  console.log(chalk.white(
    "777777777777....7777777777777777777777777777777777777777777777777..7777.7777777777...77777777777777"
  ));
  console.log(chalk.white(
    "77777777777...777777777777.....77777777777777777777.7777777777...777.7777.777777777...7777777777777"
  ));
  console.log(chalk.white(
    "7777777777..77777777777.7777777777777777777777777.7777777777777777..777.7777.7777777...777777777777"
  ));
  console.log(chalk.white(
    "7777777777..777777777.777777777777.7777777777777777777777777777777777.77.7777.7777777..777777777777"
  ));
  console.log(chalk.white(
    "7777777777..77777777.77777777777777777777777777777777777777777777777777.77.77777777777..77777777777"
  ));
  console.log(chalk.white(
    "777777777..777777777777777777777777777777777777777777..............7777777777777777777...7777777777"
  ));
  console.log(chalk.white(
    "77777777...777777777777........7777777777777777777.....777............77777777777777777...777777777"
  ));
  console.log(chalk.white(
    "7777....77777777777..............7777777777777....777777........77...777777777777777777...777777777"
  ));
  console.log(chalk.white(
    "777...777.....7...7...............77777777777...77777.................7777.7777........7....7777777"
  ));
  console.log(chalk.white(
    "77..777.777777777777777777.............7777777.........77777777777..777.777777777777777777...777777"
  ));
  console.log(chalk.white(
    "7..77.777..777777777777777777777....77777777777.....777777...77777777777777..........7777777..77777"
  ));
  console.log(chalk.white(
    "7..7.77.777......7777777777777777..7777777777777777777777777....7777777......777777....7777.7..7777"
  ));
  console.log(chalk.white(
    "7...77777..........7777.777777777..777777777777777777777777777...........77777..77777...777.77...77"
  ));
  console.log(chalk.white(
    "7...77777.7777777........77777777..7777777777777777777777777777777777777777777..777777..777.77...77"
  ));
  console.log(chalk.white(
    "7...77.7777777..77....77777777....77777777777777777777777777777777777777777.....7777777..77.777..77"
  ));
  console.log(chalk.white(
    "7..7777.777777..77777777777....7777777777777777........7777777777777777.....777......77..77.777..77"
  ));
  console.log(chalk.white(
    "7....777..77....7777777777.....77777777777777777777..77777777777777......77777...7...7...77.77...77"
  ));
  console.log(chalk.white(
    "77..7..77777....7777777..77.....777777777.......777..7777777777.......77777777..777777..777777...77"
  ));
  console.log(chalk.white(
    "77...7777.77..7...777.77777777...77777777777777.7...777777........7..7777777....77777..777.77...777"
  ));
  console.log(chalk.white(
    "777...77777.........777777777777......777777777777777........777777..7777......777777777..77..77777"
  ));
  console.log(chalk.white(
    "7777...7777..7..7......77777777777...77777777777........7777777777...7........7777777.77777...77777"
  ));
  console.log(chalk.white(
    "77777..7777....77..77........77777777..............77..7777777777.......77...7777777777.....7777777"
  ));
  console.log(chalk.white(
    "77777..7777....77..7777....................7777777777..777777........7777...777777777777...77777777"
  ));
  console.log(chalk.white(
    "77777..7777....77..777...7777777..7777777..7777777777...7.........7..777...77777777777...7777777777"
  ));
  console.log(chalk.white(
    "77777..7777........777..77777777..7777777..777777777...........7777..77...77777777777...77777777777"
  ));
  console.log(chalk.white(
    "77777..7777.................................................7777777......777777777777..777777777777"
  ));
  console.log(chalk.white(
    "77777..7777...........................................7..77777777777...7777777777777...777777777777"
  ));
  console.log(chalk.white(
    "77777..77777....................................7777777..777777777...77777777777777...7777777777777"
  ));
  console.log(chalk.white(
    "77777..77777..7...........................7..7777777777...77777....777777777777777...77777777777777"
  ));
  console.log(chalk.white(
    "77777..777777..7..77..777..77777...77777777..77777777777..777....777777777777777...7777777777777777"
  ));
  console.log(chalk.white(
    "77777..777777......7...777..77777..77777777..777777777777......7777777777777777...77777777777777777"
  ));
  console.log(chalk.white(
    "77777..7777777....777...77...7777..77777777..777777777......7777777.77777.777...7777777777777777777"
  ));
  console.log(chalk.white(
    "77777..777777777.........77..7777...7777777..77.........77777777.77777..777....77777777777777777777"
  ));
  console.log(chalk.white(
    "77777..77777777777777...............................777777777..7777..7777....7777777777777777777777"
  ));
  console.log(chalk.white(
    "7777...77777777.777777777777777777777777777777777777777777.77777..7777.....777777777777777777777777"
  ));
  console.log(chalk.white(
    "7777..7777777777.777777777777777777777777777777777777..777777.77777.....777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7777..777777777777.777777777777777777777777777777..777777..77777.....777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "77..77777..77777777...77777777777..........777777..7777777......77777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7..777777777.7777777777777777777777777...777777777777.....77777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7...7777777777...............777777777777777777777.....77777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7...777777777777777777777777777777777777777777.....777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "77...77777777777777777777777777777777777..7.....777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "777....7777777777777777777777777777..........777777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7777.....7777777777777777777.........77777777777777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "7777777........................77777777777777777777777777777777777777777777777777777777777777777777"
  ));
  console.log(chalk.white(
    "777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777777"
  ));
}

var sampleObject = {
  "messageId": 8,
  "flag": 0,
  "args": []
}

function promptUserForDirective() {
  console.log(chalk.white(packageJSON.name + '  v' + packageJSON.version));
  prompt.get([{
    name: 'directive',
    description: 'Directive> '.cyan
  }], function(prompt_err, result) {
    if (prompt_err) {
      console.log(error('\nno. die. ' + prompt_err));
      process.exit(1);
    } else {
      switch (result.directive) {
        case 'slist': // Print a list of instantiated sessions.
          listSessions();
          break;
        case 'tlist': // Print a list of instantiated transports.
          listTransports();
          break;
        case 'test': // Print a list of instantiated transports.
          console.log(util.inspect(sampleObject));
          sessions.actor0.emit('fromClient', 'engine', 'send', sampleObject);
          break;
        case 'desync0': // Print a list of instantiated transports.
          sessions.actor0.emit('fromClient', 'engine', 'badsync', '');
          break;
        case 'desync1': // Print a list of instantiated transports.
          sessions.actor1.emit('fromClient', 'engine', 'badsync', '');
          break;
        case 'troll':
          troll();
          break;
        case 'history': // Print a history of our directives.
          break;
        case 'nodestack': // Tell node to print a trace of this process.
          console.trace();
          break;
        case 'quit': // Return 0 for no-error-on-exit.
        case 'exit':
          process.exit();
          break;
        default: // Show user help and usage info.
          console.log(result);
          printUsage();
          break;
      }
    }

    console.log("\n");
    promptUserForDirective();
  });
}



/****************************************************************************************************
 * Execution begins below this block.                                                                *
 ****************************************************************************************************/

prompt.start(); // Start prompt running.


// Kick off the interaction by prompting the user.
promptUserForDirective();
