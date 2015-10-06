'use strict'

// REQUIRES
var _forOwn = require('lodash').forOwn;
var _has = require('lodash').has;

// SAMPLES
//
// sampleAdjuncts:
//  "obj" is where we instantiate our adjuncts (anything that is a child in the intSpec Tree)
//
//  "actions" is our holder for all actions we want to intercept from adjuncts and act on
//    name each "output" from an adjunct to act on, and then take a "me" and "data".
//    "me" is the scope of whatever is instantiating messageHandler (parent scope)
//
//  usage:
//    ::: generate listeners and adjuncts
//    var io = new msgHandler(interface_spec, sampleAdjuncts, sampleActions, this);
//
//    ::: For
//    io.send({ target: ["log"], data: "Log something"})
//
//    io.adjunctSend("transport", { target: ["connect"], data: true})
//
//    The PARENT should unshift your name relative to what it has on file.
//
//
var sampleAdjuncts = {
  "transport": {
    "obj": new Transport(),
    "actions": {
      "data": function(me, data) {
        // do something
        return true; // if returns true, it will emit out of self... if not, it intercepts?
      }
    }
  },
  "engine": {
    "obj": new Engine(),
    "actions": {
      "log": function(me, data) {

        return true;
      }
    }
  }
};

// relative to your OWN intSpec "inputs"
var sampleActions = {
  "connect": function(me, data) {
    me.setSomething(arg)
  },
};

var interface_spec = {
  schema: {
    state: {
      'engine_stack': {
        type: 'array',
        value: []
      }
    },
    inputs: {
      'setClientConfig': [
        {
          label: 'setClientConfig',
          type: 'object'
        }
      ],
      'getLiveConfig': [
        {
          label: 'getLiveConfig',
          type: 'object'
        }
      ],
      'assign':[
        {
          label: 'Assign',
          type: 'object'
        }
      ]
    },
    outputs: {
      'config': {
        type: 'object',
        label: 'ConfigObj',
        state: 'remoteAddress'
      },
      'log': {
        type: 'array',
        label: 'Log'
        //state: 'remoteAddress'
      }
    }
  },
  adjuncts: {
    transport: {},
    engine: {}
  }
};

// TODO: remove "name".  the parent of the adjunct should append the "adjunct key", so local scope can be handled...

var msgHandler = function(_intSpec, _adjuncts, _actions, _parentThis) {

  var self = this
  var parentThis = _parentThis
  this.intSpec = _intSpec,
  this.adjuncts = _adjuncts,
  this.actions = _actions

  // receive is bound to "this" when it is called via the listener... so feel free to use "this"
  var receive = function(msg) {
    // check if target is an array or is empty
    if(Array.isArray(msg.target) && msg.target.length > 0) {
      if(msg.target.length === 1){
        //this is for us:
        if(self.actions.hasOwnProperty(msg.target[0])){
          self.actions[msg.target[0]](parentThis, msg.data)
        } else {
          new Error("Don't have an action for this")
        }
      } else {
        // this is not meant for us...
        if(self.adjuncts.hasOwnProperty(msg.target[0])){
          // kinda ugly with that shift.... or elegant? ;)
          self.adjuncts[msg.target[msg.target.shift()]].emit('input', msg);
        } else {
          new Error("Don't have an appropriate adjunct to forward to")
        }
      }
    } else {
      new Error("Malformed target")
    }
  }

  // bound to "self" when called
  var adjunctReceive = function(key, msg) {
    if(Array.isArray(msg.target) && _has(self.adjuncts, [key, "actions", msg.target[msg.target.length - 1]])) {
      // checks the adjunct functions and if it returns true, emits on itself.  if not, it stops
      if(self.adjuncts[key].actions[msg.target[msg.target.length - 1]](parentThis, msg)) {
          // unshift the childs adjuncts key relative to YOUR represenation of it...
          msg.target.unshift(key)
          self.output(msg);
      }
    } else {
      new Error("Target is not valid, or adjunct.actions function doesn't exist")
    }
  }

  // client functions
  this.removeListeners = function() {
    // TODO: send message to adjuncts to remove their own listeners...
    _forOwn(self.adjuncts, function(value, key, object){
      value.obj.removeListener('output', adjunctReceive.bind(self, key))
    })
  };

  this.output = function(msg) {
    parentThis.emit('output', msg)
  }

  this.adjunctSend = function(adjunct, msg) {
    self.adjuncts[adjunct].obj.emit(msg)
  }

  // listening on our own input and binding scope to receive
  parentThis.on('input', receive.bind(self))

  // stuff coming from our adjuncts
  _forOwn(self.adjuncts, function(value, key){
    value.obj.on('output', adjunctReceive.bind(self, key))
  })

}
