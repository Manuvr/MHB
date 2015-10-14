'use strict'

// REQUIRES
var inherits = require('util').inherits;
var ee = require('events').EventEmitter;

var _forOwn = require('lodash').forOwn;
var _has = require('lodash').has;
var _cloneDeep = require('lodash').cloneDeep;
var _ = require('lodash');

// From SO: http://stackoverflow.com/questions/14275467/deep-clone-without-some-fields

function deepOmit(sourceObj, callback, thisArg) {
    var destObj, i, shouldOmit, newValue;

    if (_.isUndefined(sourceObj)) {
        return undefined;
    }
    callback = thisArg ? _.bind(callback, thisArg) : callback;

    if (_.isPlainObject(sourceObj)) {
        destObj = {};
        _.forOwn(sourceObj, function(value, key) {
            newValue = deepOmit(value, callback);
            shouldOmit = callback(newValue, key);
            if (!shouldOmit) {
                destObj[key] = newValue;
            }
        });
    } else if (_.isArray(sourceObj)) {
        destObj = [];
        for (i = 0; i <sourceObj.length; i++) {
            newValue = deepOmit(sourceObj[i], callback);
            shouldOmit = callback(newValue, i);
            if (!shouldOmit) {
                destObj.push(newValue);
            }
        }
    } else {
        return sourceObj;
    }

    return destObj;
}

var msgHandler = function(_intSpec, _parentThis) {

  var self = this
  var parentThis = _parentThis
  this.intSpec = _intSpec


  parentThis.getIntSpec = function() {
    var tempObj = _cloneDeep(self.intSpec);
    return deepOmit(tempObj, function(val, key){
      return  key === "func" ||
              key === "taps" ||
              key === "instance"
    });
  }

  // receive is bound to "this" when it is called via the listener... so feel free to use "this"
  var receive = function(msg) {
    // check if target is an array or is empty
    if(Array.isArray(msg.target) && msg.target.length > 0) {
      if(msg.target.length === 1){
        //this is for us:

        if(_has(self.intSpec, ["schema", "inputs", msg.target[0]])){
          self.intSpec.schema.inputs[msg.target[0]].func(parentThis, msg.data)
        } else {
          new Error("Don't have an action for this")
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
    if(Array.isArray(msg.target)) {

      // check if it's a built-in message
      if(msg.target[0] === '_adjunctUpdate') {
        //self.intSpec.adjuncts[name].instance.removeAllListeners('output');
        self.addAdjunct(name, self.intSpec.adjuncts[name].instance);
      } else {
        // check for taps
        if(_has(self.intSpec, ["taps", self.intSpec.adjuncts[name].type, msg.target[msg.target.length - 1]])) {
          // checks the adjunct functions and if it returns false, it blocks the message from emitting.
          if(self.intSpec.tap[self.intSpec.adjuncts[name].type][msg.target[msg.target.length - 1]](parentThis, msg, name) === true) {
            // unshift the childs adjuncts name relative to YOUR represenation of it...
            msg.target.unshift(name)
            self.sendToOutput(msg);
          } else  {
            // this means that "return" was FALSE and we didn't want to emit on our output
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
  // this.removeListeners = function() {
  //   // TODO: send message to adjuncts to remove their own listeners...
  //   _forOwn(self.adjuncts, function(value, key, object){
  //     value.instance.removeListener('output', adjunctReceive.bind(self, key))
  //   })
  // };

  this.sendToOutput = function(msgOrTarget, _data) {
    if (!Array.isArray(msgOrTarget)) {
      msgOrTarget = [msgOrTarget];
    }

    if(_data === undefined){
      parentThis.emit('output', msgOrTarget)
    } else {
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
      self.intSpec.adjuncts[name].instance.emit('input', {target: msgOrTarget, data: _data })
    }
  }

  this.addAdjunct = function(name, inst) {
    self.intSpec.adjuncts[name] = inst.getIntSpec();
    self.intSpec.adjuncts[name].instance = inst;
    
    var temp = adjunctReceive.bind(self, name);
    
    // emit a "destruct" command to propagate and remove all child listeners...
    //self.intSpec.adjuncts[name].instance.removeListener('output', temp)
    self.intSpec.adjuncts[name].instance.removeAllListeners('output')
    
    self.intSpec.adjuncts[name].instance.on('output', temp)
    console.log('('+name+').addAdjunct: ' + self.intSpec.adjuncts[name].instance.listenerCount('output'));
    parentThis.send('_adjunctUpdate', {})
  }

  this.init = function(){

    // listening on our own input and binding scope to receive
    parentThis.on('input', receive.bind(self))

  }

  // not sure about this... but okay
  this.init();

}
module.exports = msgHandler;
