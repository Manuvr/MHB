/*
* mSession is the abstract representation of a connection to a Manuvrable.
*/

/*jslint node: true */
'use strict'

var inherits = require('util').inherits;
var ee = require('events').EventEmitter;
var messageHandler = require('./lib/messageHandler.js');

var request = require('request');

function registry() {
  ee.call(this);

  var that = this;

  var addr = "http://iotreg-env.us-west-2.elasticbeanstalk.com/";

  this.sessionEstablished = false;

  this.interface_spec = {
    type: 'mSession',
    schema: {
      inputs: {
        'makeMfg': {
          label: "CSR: Make Manufacturer",
          args: [{ label: 'name', type: 'string' }],
          func: function(me, data) {
            request.post({
              url: addr + "manufacturers/",
              json: true,
              body: {
                "name": data[0]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Manufacturer Created",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        },
        'makeOwner': {
          label: "CSR: Make Owner",
          args: [{ label: 'name', type: 'string' }],
          func: function(me, data) {
            request.post({
              url: addr + "owners/",
              json: true,
              body: {
                "name": data[0]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Owner Created",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        },
        'makeModel': {
          label: "CSR: Make Model",
          args: [{ label: 'Mfg ID', type: 'string' }, {label: "Model Name", type: "string"}],
          func: function(me, data) {
            request.post({
              url: addr + "manufacturers/" + data[0] + "/models",
              json: true,
              body: {
                "name": data[1]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Model Created",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        },
        'makeThing': {
          label: "MFG: Make Thing",
          args: [{ label: 'modelID', type: 'string' }],
          func: function(me, data) {
            request.post({
              url: addr + "things/",
              json: true,
              body: {
                "modelId": data[0]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Thing Created",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        },
        'claimThing': {
          label: "OWNER: Claim Thing",
          args: [{ label: 'Thing ID', type: 'string' }, {label: 'Password', type:"string"}],
          func: function(me, data) {
            request.put({
              url: addr + "things/" + data[0] + "/claim",
              json: true,
              body: {
                "password": data[1]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Thing Claimed",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        },
        'queryThing': {
          label: "END-USER: Query Thing",
          args: [{ label: 'Thing ID', type: 'string' }],
          func: function(me, data) {
            request.get({
              url: addr + "things/" + data[0],
              json: true,
              body: {
                "thingId": data[0]
              },
            }, function(err, res, body){
              if(!err){
              me.send('log', {
                  body: "Thing Identified",
                  verbosity: 5
                })
                console.log(JSON.stringify(body))
              }
            })
          }
        }
      },
      outputs: {
        'thingId' : {
          label: 'ID Returned:',
          type: 'string',
          value: "",
          hidden: false
        }
      }
    },
    adjuncts:{
    },
    taps: {
      'names': {
      },
      'types': {
      }
    }
  };

  this.mH = new messageHandler(this.interface_spec, this);
}
inherits(registry, ee);


module.exports = registry;
