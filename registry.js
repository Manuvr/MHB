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

  this.restLog = function(body){
    that.send('log', {
        body: "Response Body: " + JSON.stringify(body) ,
        verbosity: 7
      })
  }

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
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "New Manufacturer: " + body.data.id + " :: " + body.data.name,
                    verbosity: 5
                  })
                me.send("mfgId", body.data.id)
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
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "New Owner: " + body.data.id + " :: " + body.data.name,
                    verbosity: 5
                  })
                me.send("ownerId", body.data.id)
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
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "New Model: " + body.data.id + " :: " + body.data.name,
                    verbosity: 5
                  })
                me.send("modelId", body.data.id)
              }
            })
          }
        },
        'makeThing': {
          label: "MFG: Make Thing",
          args: [{ label: 'Name: ', type: 'string' },
                {label: "Model ID: ", type: 'string'},
                {label: 'Session Target:', type:"string"}],
          func: function(me, data) {
            request.post({
              url: addr + "things/",
              json: true,
              body: {
                "name": data[0],
                "modelId": data[1]
              },
            }, function(err, res, body){
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "New Thing: " + body.data.id + " :: " + body.data.name,
                    verbosity: 5
                  })
                me.send("thingId", [data[2], body.data.id])
              }
            })
          }
        },
        'claimThing': {
          label: "OWNER: Claim Thing",
          args: [{ label: 'Thing ID', type: 'string' }, {label: 'Owner ID', type:"string"}, {label: 'Session Target:', type:"string"}],
          func: function(me, data) {
            request.put({
              url: addr + "things/" + data[0] + "/claim",
              json: true,
              body: {
                "id": data[1]
              },
            }, function(err, res, body){
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "Thing " + body.data.id + " claimed for owner " + body.data.owner.id,
                    verbosity: 5
                  })
                me.send("claimed", [data[2], body.data.owner.id])
              }
            })
          }
        },
        'queryThing': {
          label: "END-USER: Query Thing",
          args: [{ label: 'Thing ID', type: 'string' }],
          func: function(me, data) {
            request.get({
              url: addr + "things/" + data[0]
            }, function(err, res, body){
              if(err || body.status === "ERROR"){
                me.restLog(body)
                me.send('log', {
                    body: "Error: " + body.errorCode,
                    verbosity: 5
                  })
              } else {
                me.restLog(body)
                me.send('log', {
                    body: "Thing queried: " + JSON.stringify(body),
                    verbosity: 5
                  })
                me.send("queried", body)
              }
            })
          }
        }
      },
      outputs: {
        'newMfgId' : {
          label: 'Mfg. ID:',
          type: 'string',
          value: "",
          hidden: false
        },
        'newOwnerId' : {
          label: 'Owner ID:',
          type: 'string',
          value: "",
          hidden: false
        },
        'newModelId' : {
          label: 'Model ID:',
          type: 'string',
          value: "",
          hidden: false
        },
        'thingId' : {
          label: 'Thing ID:',
          type: 'array',
          value: [],
          hidden: false
        },
        'claimed' : {
          label: 'Claimed: ',
          type: 'array',
          value: [],
          hidden: false
        },
        'queried' : {
          label: 'Query Data: ',
          type: 'object',
          value: "",
          hidden: false
        },
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
