'use strict'

// REQUIRES
var inherits = require('util').inherits;
var inspect = require('util').inspect;
var ee = require('events').EventEmitter;

var _forOwn = require('lodash').forOwn;
var _has = require('lodash').has;
var _cloneDeep = require('lodash').cloneDeep;
var _get = require('lodash').get
var _set = require('lodash').set
var _merge = require('lodash').merge
//var _ = require('lodash');

var msgHandler = function(_intSpec, _parentThis) {

  var self = this
  var parentThis = _parentThis

  parentThis.intSpec = _intSpec // UGLY.   But needed a DEFINITE reference...

  this.intSpec = _intSpec
  this.passTarget = undefined

  parentThis.getIntSpec = function() {
    var tempObj = _cloneDeep(self.intSpec);
    // top level of interface_spec (schema, taps, adjuncts, type)
    _forOwn(tempObj, function(val, key, obj) {
      //
      if(key === "taps" || key === "destruct" || key === "construct") {
        delete obj[key];
      } else if (key === "schema") {
        _forOwn(val.inputs, function (v2, k2, o2) {
          if(v2.hasOwnProperty("func")){
            delete obj.schema.inputs[k2].func
          }
        })
      } else if(key === "adjuncts") {
        _forOwn(val, function (v2, k2, o2) {
          if(obj.adjuncts[k2].hasOwnProperty("meta")) {
            obj.adjuncts[k2] = obj.adjuncts[k2].instance.getMetaIntSpec();
          } else {
            obj.adjuncts[k2] = obj.adjuncts[k2].instance.getIntSpec();
          }
        })
      }
    })
    return tempObj
  }

  parentThis.getMetaIntSpec = function() {
    var tempObj = _cloneDeep(self.intSpec);
    // top level of interface_spec (schema, taps, adjuncts, type)
    var tempPassAdj = false;
    if(_has(tempObj, ["adjuncts", self.passTarget])) {
      tempPassAdj = tempObj.adjuncts[self.passTarget].instance.getMetaIntSpec()
    }

    _forOwn(tempObj, function(val, key, obj) {
      if(key === "taps" || key === "destruct" || key === "construct") {
        delete obj[key];
      } else if (key === "schema") {
        _forOwn(val.inputs, function (v2, k2, o2) {
          if(v2.hasOwnProperty("func")){
            delete obj.schema.inputs[k2].func
          }
        })
      }
    })

    if(tempPassAdj) { tempObj = _merge({}, tempPassAdj, tempObj) }
    delete tempObj.adjuncts;

    return tempObj
  }

  // receive is bound to "this" when it is called via the listener... so feel free to use "this"
  var receive = function(msg) {
    // check if target is an array or is empty
    if(Array.isArray(msg.target) && msg.target.length > 0) {
      if(msg.target.length === 1){
        //this is for us:

        if(_has(self.intSpec, ["schema", "inputs", msg.target[0]])){
          self.intSpec.schema.inputs[msg.target[0]].func(parentThis, msg.data);
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
            if(self.passTarget !== undefined && msg.hasOwnProperty("meta")){
              self.intSpec.adjuncts[self.passTarget].instance.emit('input', msg);
            }
            new Error("Don't have an action for this")
          }
        }
      } else {
        // this is not meant for us...
        if(_has(self.intSpec, ["adjuncts", msg.target[msg.target.length - 1]])){
          // attach on meta property to be forwarded up
          if(self.intSpec.adjuncts[msg.target[msg.target.length - 1]].hasOwnProperty("meta")){
            msg.meta = true;
          }
          self.intSpec.adjuncts[msg.target.pop()].instance.emit('input', msg);

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
        if(_has(self.intSpec, ["taps", self.intSpec.adjuncts[name].type, msg.target[0]])) {
          // checks the adjunct functions and if it returns false, it blocks the message from emitting.
          if(self.intSpec.taps[self.intSpec.adjuncts[name].type][msg.target[0]](parentThis, msg, name) === true) {
            // unshift the childs adjuncts name relative to YOUR represenation of it...
            if(self.intSpec.adjuncts[name].hasOwnProperty("_alias")){
              self.sendToOutput({ target: [msg.target[0], self.intSpec.adjuncts[name]._alias], data: msg.data })
            }
            msg.target.push(name)
            self.sendToOutput(msg);
          } else {
            // this means that "return" was FALSE or blank and we didn't want to emit on our output
          }
        } else {
          // If we don't have an action, we emit it out lower anyway
          if(self.intSpec.adjuncts[name].hasOwnProperty("_alias")){
            self.sendToOutput({ target: [msg.target[0], self.intSpec.adjuncts[name]._alias], data: msg.data })
          }
          msg.target.push(name)
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
    var outMsg = {}
    if(_data === undefined){
      if(typeof msgOrTarget === "string"){
        outMsg = { target: [msgOrTarget], data: _data }
      } else if(Array.isArray(msgOrTarget)) {
        outMsg = { target: msgOrTarget, data: _data }
      } else {
        outMsg = msgOrTarget;
      }
    } else {
      if (!Array.isArray(msgOrTarget) ) {
        msgOrTarget = [msgOrTarget];
      }
      outMsg = {target: msgOrTarget, data: _data }
    }

    // set local state for when adjuncts get blown away
    var outState = _get(self.intSpec, ["schema", "outputs", outMsg.target[0], "state"]);
    if(outState !== undefined  && _has(self.intSpec, ["schema", "state", outState])){
      _set(self.intSpec, ["schema", "state", outState, "value"], outMsg.data);
    }

    parentThis.emit('output', outMsg)
  }

  // primarily for client use
  parentThis.send = this.sendToOutput;

  // 2 arguments means you have a message, 3 arguments means you're passing a target and data
  this.sendToAdjunct = function(name, msgOrTarget, _data) {

    if(_data === undefined){
      if(self.intSpec.adjuncts[name].hasOwnProperty("meta")) {
        msgOrTarget.meta = true;
      }
      self.intSpec.adjuncts[name].instance.emit('input', msgOrTarget)
    } else {
      if(!Array.isArray(msgOrTarget)) {
        msgOrTarget = [msgOrTarget]
      }
      var sendObj = {target: msgOrTarget, data: _data }
      if(self.intSpec.adjuncts[name].hasOwnProperty("meta")) {
        sendObj.meta = true;
      }
      self.intSpec.adjuncts[name].instance.emit('input', sendObj)
    }
  }

  // TODO: it may be advantageous to store the "instances" outside of the intSpec...

  this.addAdjunct = function(name, inst, _pass) {

    if(_pass) {
      self.passTarget = name;
    }

    //console.log(parentThis.interface_spec.type +" addAdjunct: " + name + "");
    if(!self.intSpec.hasOwnProperty("adjuncts")) {
      self.intSpec.adjuncts = {};
    }
    if(!self.intSpec.adjuncts.hasOwnProperty(name)) {
      self.intSpec.adjuncts[name] = {};
    }

    if(self.intSpec.adjuncts.hasOwnProperty(name) && self.intSpec.adjuncts[name].hasOwnProperty("lis")){
      self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
    }

    self.intSpec.adjuncts[name].instance = inst;

    self.intSpec.adjuncts[name].type = self.intSpec.adjuncts[name].instance.intSpec.type; // UGLY.  See above.

    // reference to listener function so we can remove it later if needed.
    self.intSpec.adjuncts[name].lis = function(msg) { adjunctReceive(name, msg) };
    self.intSpec.adjuncts[name].instance.on('output', self.intSpec.adjuncts[name].lis)

    parentThis.send('_adjunctUpdate', {})
  }

  this.addMetaAdj = function(name, targetAdj) {
    //console.log(parentThis.interface_spec.type +" addAdjunct: " + name + "");
    if(!self.intSpec.hasOwnProperty("adjuncts")) {
      self.intSpec.adjuncts = {};
    }
    if(!self.intSpec.adjuncts.hasOwnProperty(name)) {
      self.intSpec.adjuncts[name] = {};
    }
    self.intSpec.adjuncts[targetAdj]._alias = name
    self.intSpec.adjuncts[name].meta = targetAdj;
    self.intSpec.adjuncts[name].instance = self.intSpec.adjuncts[targetAdj].instance;

    parentThis.send('_adjunctUpdate', {})
  }

  this.getAdjunctType = function(key) {
    return _get(self.intSpec, ['adjuncts', key, 'instance', 'interface_spec' ,'type']);
  }

  this.getAdjunctName = function(key) {
    return _get(self.intSpec, ['adjuncts', key, 'instance', 'interface_spec' ,'name']);
  }

  this.init = function(){
    if(_has(self.intSpec, ["construct"])) {
      self.intSpec.construct();
    }
    // listening on our own input and binding scope to receive
    parentThis.on('input', receive.bind(self))
  }

  this.removeAdjunct = function(name, isNested) {
      self.sendToAdjunct(name, ['destruct'], true)
      self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
      delete self.intSpec.adjuncts[name];
      if(isNested === undefined) {
        parentThis.send('_adjunctUpdate', {})
      }
  };

  this.passAdjunct = function(name) {
    var ref = self.intSpec.adjuncts[name].instance
    self.removeAdjunctListener(name);
    delete self.intSpec.adjuncts[name]
    parentThis.send('_adjunctUpdate', {})
    return ref;
  }

  this.removeAdjunctListener = function(name) {
    self.intSpec.adjuncts[name].instance.removeListener('output', self.intSpec.adjuncts[name].lis)
  }



  // not sure about this... but okay
  this.init();

}

module.exports = msgHandler;
