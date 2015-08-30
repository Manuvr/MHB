/*
 * This is to become the transport test directory.
 *
 */
'use strict'

//TODO: There is probably a better means of reading this from the package.json....
var packageJSON = require('./package.json');

var util = require('util');
var logo = require('./manuvrLogo');

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

var Table = require('cli-table');


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
  var table = new Table({
      head: [chalk.white.bold('Name'), chalk.white.bold('Session'), chalk.white.bold('Transport'), chalk.white.bold('Engine')],
      chars: {'top':'─','top-mid':'┬','top-left':'┌','top-right':'┐','bottom':'─','bottom-mid':'┴','bottom-left':'└','bottom-right':'┘','left':'│','left-mid':'├','mid':'─','mid-mid':'┼','right':'│','right-mid':'┤','middle':'│'},
      style: {'padding-left': 0, 'padding-right': 0}
  });
  
  for (var ses in sessions) {
    if (sessions.hasOwnProperty(ses)) {
      var sesObj = sessions[ses];

      var inner_table_style = { chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
         , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
         , 'left': ' ' , 'left-mid': '─' , 'mid': '─' , 'mid-mid': '┼'
         , 'right': ' ' , 'right-mid': '─' , 'middle': '│' },
         style: {'padding-left': 0, 'padding-right': 0}
      };
      var table_ses = new Table(inner_table_style);
      var table_eng = new Table(inner_table_style);
      var table_trn = new Table(inner_table_style);

      for (var key in sesObj) {
        if (sesObj.hasOwnProperty(key) && sesObj[key]) {
          table_ses.push([key.toString(), sesObj[key].toString()]);
        }
      }
      
      for (var key in sesObj.engine) {
        if (sesObj.engine.hasOwnProperty(key) && sesObj.engine[key]) {
          table_eng.push([key.toString(), sesObj.engine[key].toString()]);
        }
      }
      
      for (var key in sesObj.transport) {
        if (sesObj.transport.hasOwnProperty(key) && sesObj.transport[key]) {
          table_trn.push([key.toString(), sesObj.transport[key].toString()]);
        }
      }

      table.push([chalk.green(ses), chalk.white(table_ses.toString()), chalk.gray(table_trn.toString()), chalk.gray(table_eng.toString())]);
    }
  }
  console.log(table.toString() + '\n');
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
        case 'troll':
          logo();
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
