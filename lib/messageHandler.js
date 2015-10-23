'use strict'

// REQUIRES
var inherits = require('util').inherits;
var inspect = require('util').inspect;
var ee = require('events').EventEmitter;

var _forOwn = require('lodash').forOwn;
var _has = require('lodash').has;
var _cloneDeep = require('lodash').cloneDeep;
var _ = require('lodash');

var msgHandler = function(_intSpec, _parentThis) {

  var self = this
  var parentThis = _parentThis
  this.intSpec = _intSpec

  // this is a bit ugly... but it gets the jerb done.  Double check for cyclic references however
  parentThis.getIntSpec = function() {
    var tempObj = _cloneDeep(self.intSpec);
    // top level of interface_spec (schema, taps, adjuncts, type)
    _forOwn(tempObj, function(val, key, obj) {
      //
      if(key === "taps" || key === "destruct") {
        delete obj[key];
      } else if (key === "inputs") {
        _forOwn(key, function (v2, k2, o2) {
          if(k2.hasOwnProperty("func")){
            delete obj["inputs"][k2].func
          }
        })
      } else if(key === "adjuncts") {
        _forOwn(key, function (v2, k2, o2) {
          if(k2.hasOwnProperty("instance")){
            delete obj["adjuncts"][k2].instance
          }
          if(k2.hasOwnProperty("lis")){
            delete obj["adjuncts"][k2].lis
          }
        })
      }
    })
    return tempObj
  }

  // receive is bound to "this" when it is called via the listener... so feel free to use "this"
  var receive = function(msg) {
    // check if target is an array or is empty
    if(Array.isArray(msg.target) && msg.target.length > 0) {
      if(msg.target.length === 1){
        //this is for us:

        if(_has(self.intSpec, ["schema", "inputs", msg.target[0]])){
          //console.log("\"" + msg.target[0] + "\" being processed..." )
          self.intSpec.schema.inputs[msg.target[0]].func(parentThis, msg.data)
        } else {

          if(msg.target[0] === 'destruct') {
            _forOwn(self.intSpec.adjuncts, function(value, key, objects){
              self.removeAdjunct(key, true);
            })

            if(_has(self.intSpec, destruct)) {
              self.intSpec.destruct();
            }
            parentThis.removeAllListeners('input');

          } else {
            new Error("Don't have an action for this")
          }
        }
      } else {
        // this is not meant for us...
        if(_has(self.intSpec, ["adjuncts", msg.target[0]])){

          self.intSpec.adjuncts[msg.target.shift()].instance.emit('input', msg);
        } else {
          new Error("Don't have an appropriate adjunct to forward to")
        }
      }
    } else {
      new Error("Malformed target")
    }
  }

  // bound to "self" when called
  var adjunctReceive = function(name, msg) {
    // check for target validity
    //console.log("rec:" + JSON.stringify(msg) + " from " + name )
    if(Array.isArray(msg.target)) {

      // check if it's a built-in message
      if(msg.target[0] === '_adjunctUpdate') {
        //self.intSpec.adjuncts[name].instance.removeAllListeners('output');
        self.addAdjunct(name, self.intSpec.adjuncts[name].instance);
      } else {
        // check for taps
        if(_has(self.intSpec, ["taps", self.intSpec.adjuncts[name].type, msg.target[msg.target.length - 1]])) {
          // checks the adjunct functions and if it returns false, it blocks the message from emitting.
          if(self.intSpec.taps[self.intSpec.adjuncts[name].type][msg.target[msg.target.length - 1]](parentThis, msg, name) === true) {
            // unshift the childs adjuncts name relative to YOUR represenation of it...
            msg.target.unshift(name)
            self.sendToOutput(msg);
          } else  {
            // this means that "return" was FALSE or blank and we didn't want to emit on our output
          }
        } else {
          // If we don't have an action, we emit it out lower anyway
          msg.target.unshift(name)
          self.sendToOutput(msg);
        }
      }
    } else {
      new Error("Target is not an array")
    }
  }

  // TODO: Interface Def handler and "splitter"
  // // client functions
  // this.removeAllListeners = function() {
  //   // TODO: send message to adjuncts to remove their own listeners...
  //   _forOwn(self.adjuncts, function(value, key, object){
  //     value.instance.removeListener('output', adjunctReceive.bind(self, key))
  //   })
  // };

  this.sendToOutput = function(msgOrTarget, _data) {
    if(_data === undefined){
      parentThis.emit('output', msgOrTarget)
    } else {
      if (!Array.isArray(msgOrTarget) ) {
        msgOrTarget = [msgOrTarget];
      }
      parentThis.emit('output', {target: msgOrTarget, data: _data })
    }
  }

  // primarily for client use
  parentThis.send = this.sendToOutput;

  // 2 arguments means you have a message, 3 arguments means you're passing a target and data
  this.sendToAdjunct = function(name, msgOrTarget, _data) {
    if(_data === undefined){
      self.intSpec.adjuncts[name].instance.emit('input', msgOrTarget)
    } else {
      if(!Array.isArray(msgOrTarget)) {
        msgOrTarget = [msgOrTarget]
      }
      self.intSpec.adjuncts[name].instance.emit('input', {target: msgOrTarget, data: _data })
    }
  }

  // TODO: it may be advantageous to store the "instances" outside of the intSpec...

  this.addAdjunct = function(name, inst) {
    //console.log(parentThis.interface_spec.type +" addAdjunct: " + name + "");

    // check if this is replacing an old Adjunct; if so, remove the old listener
    if(self.intSpec.adjuncts.hasOwnProperty(name) && self.intSpec.adjuncts[name].hasOwnProperty("lis")){
      self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
    }

    self.intSpec.adjuncts[name] = inst.getIntSpec();
    self.intSpec.adjuncts[name].instance = inst;
    // reference to listener function so we can remove it later if needed.
    self.intSpec.adjuncts[name].lis = function(msg) { adjunctReceive(name, msg) };
    self.intSpec.adjuncts[name].instance.on('output', self.intSpec.adjuncts[name].lis)

    //console.log(parentThis.interface_spec.type +" addAdjunct: " + name + " - " + self.intSpec.adjuncts[name].instance.listenerCount('output') + " listener(s)");
    parentThis.send('_adjunctUpdate', {})
  }

  this.init = function(){
    // listening on our own input and binding scope to receive
    parentThis.on('input', receive.bind(self))
  }

  this.removeAdjunct = function(name, isNested) {
      self.sendToAdjunct(name, ['destruct'], true)
      self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
      self.intSpec.adjuncts.delete(name);
      if(isNested === undefined) {
        parentThis.send('_adjunctUpdate', {})
      }
  };

  this.removeAdjunctListener = function(name) {
    self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
  }

  // not sure about this... but okay
  this.init();

}

module.exports = msgHandler;
