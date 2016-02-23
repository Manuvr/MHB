/*
* mCore is the first engine attached to a session, and is responsible for
*/

/*jslint node: true */
'use strict'

// REQUIRES

var ee = require('events').EventEmitter;
var inherits = require('util').inherits;
var inspect = require('util').inspect;

var _forOwn = require('lodash').forOwn;
var _has = require('lodash').has;
var _cloneDeep = require('lodash').cloneDeep;
var _get = require('lodash').get
var _set = require('lodash').set
var _merge = require('lodash').merge
//var _ = require('lodash');

var msgHandler = function() {
  ee.call(this);

  var self = this;
  var passTarget = undefined;

  this.getIntSpec = function() {
    var tempObj = _cloneDeep(self.interface_spec);
    // top level of interface_spec (schema, taps, adjuncts, type)
    _forOwn(tempObj, function(val, key, obj) {
      //
      if(key === "taps" || key === "destruct" || key === "construct") {
        delete obj[key];
      } else if (key === "schema") {
        _forOwn(val.messages, function (v2, k2, o2) {
          if(v2.hasOwnProperty("input_func")){
            delete obj.schema.messages[k2].input_func
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

  this.getMetaIntSpec = function() {
    var tempObj = _cloneDeep(self.interface_spec);
    // top level of interface_spec (schema, taps, adjuncts, type)
    var tempPassAdj = false;
    if(_has(tempObj, ["adjuncts", passTarget])) {
      tempPassAdj = tempObj.adjuncts[passTarget].instance.getMetaIntSpec()
    }

    _forOwn(tempObj, function(val, key, obj) {
      if(key === "taps" || key === "destruct" || key === "construct") {
        delete obj[key];
      } else if (key === "schema") {
        _forOwn(val.messages, function (v2, k2, o2) {
          if(v2.hasOwnProperty("input_func")){
            delete obj.schema.messages[k2].input_func
          }
        })
      }
    })
    tempObj.hidden = false;
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

        if(_get(self.interface_spec, ["schema", "messages", msg.target[0], "input"]) === true){
          self.interface_spec.schema.messages[msg.target[0]].input_func(self, msg.data);
        } else {

          if(msg.target[0] === 'destruct') {
            _forOwn(self.interface_spec.adjuncts, function(value, key, objects){
              self.removeAdjunct(key, true);
            })

            if(_has(self.interface_spec, destruct)) {
              self.interface_spec.destruct();
            }
            self.removeAllListeners('input');

          } else {
            if(passTarget !== undefined && msg.hasOwnProperty("meta")){
              self.interface_spec.adjuncts[passTarget].instance.emit('input', msg);
            }
            new Error("Don't have an action for this")
          }
        }
      } else {
        // this is not meant for us...
        if(_has(self.interface_spec, ["adjuncts", msg.target[msg.target.length - 1]])){
          // attach on meta property to be forwarded up
          if(self.interface_spec.adjuncts[msg.target[msg.target.length - 1]].hasOwnProperty("meta")){
            msg.meta = true;
          }
          self.interface_spec.adjuncts[msg.target.pop()].instance.emit('input', msg);

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
        //self.interface_spec.adjuncts[name].instance.removeAllListeners('output');
        self.addAdjunct(name, self.interface_spec.adjuncts[name].instance);
      } else {
        // check for taps
        if(_has(self.interface_spec, ["taps", self.interface_spec.adjuncts[name].type, msg.target[0]])) {
          // checks the adjunct functions and if it returns false, it blocks the message from emitting.
          if(self.interface_spec.taps[self.interface_spec.adjuncts[name].type][msg.target[0]](self, msg, name) === true) {
            // unshift the childs adjuncts name relative to YOUR represenation of it...
            if(self.interface_spec.adjuncts[name].hasOwnProperty("_alias")){
              self.sendToOutput({ target: [msg.target[0], self.interface_spec.adjuncts[name]._alias], data: msg.data })
            }
            msg.target.push(name)
            if(_get(self.interface_spec.adjuncts[name], ["hide_msg"]) === true){
              // not sending because hide_msg was specified... this may be dangerous
            } else {
              self.sendToOutput(msg);
            }
          } else {
            // this means that "return" was FALSE or blank and we didn't want to emit on our output
          }
        } else {
          // If we don't have an action, we emit it out lower anyway
          if(self.interface_spec.adjuncts[name].hasOwnProperty("_alias")){
            self.sendToOutput({ target: [msg.target[0], self.interface_spec.adjuncts[name]._alias], data: msg.data })
          }
          msg.target.push(name)
          if(_get(self.interface_spec.adjuncts[name], ["hide_msg"]) === true){
            // not sending because hide_msg was specified... this may be dangerous
          } else {
            self.sendToOutput(msg);
          }
        }
      }
    } else {
      new Error("Target is not an array")
    }
  }

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

    // TODO: NEED TO CHANGE THE OUTPUT BEHAVIOR SO IT RETURNS ARRAY ORDERS OF THE
    // APPROPRIATE ARGUMENTS THAT ARE BEING "SET" WITH VALUES.
    // if(outMsg.target[0] !== "log" && outMsg.target[0] !== "_adjunctUpdate" && outMsg.target[0] && "_adjunctUpdate")
    // _set(self.interface_spec, ["schema", "messages", outMsg.target[0], "args", 5 , "value"], outMsg.data);

    self.emit('output', outMsg)
  }

  // primarily for client use
  this.send = this.sendToOutput;

  // 2 arguments means you have a message, 3 arguments means you're passing a target and data
  this.sendToAdjunct = function(name, msgOrTarget, _data) {

    if(_data === undefined){
      if(self.interface_spec.adjuncts[name].hasOwnProperty("meta")) {
        msgOrTarget.meta = true;
      }
      self.interface_spec.adjuncts[name].instance.emit('input', msgOrTarget)
    } else {
      if(!Array.isArray(msgOrTarget)) {
        msgOrTarget = [msgOrTarget]
      }
      var sendObj = {target: msgOrTarget, data: _data }
      if(self.interface_spec.adjuncts[name].hasOwnProperty("meta")) {
        sendObj.meta = true;
      }
      self.interface_spec.adjuncts[name].instance.emit('input', sendObj)
    }
  }

  // TODO: it may be advantageous to store the "instances" outside of the intSpec...

  this.addAdjunct = function(name, inst, _pass) {

    if(_pass) {
      passTarget = name;
    }

    //console.log(self.interface_spec.type +" addAdjunct: " + name + "");
    if(!self.interface_spec.hasOwnProperty("adjuncts")) {
      self.interface_spec.adjuncts = {};
    }
    if(!self.interface_spec.adjuncts.hasOwnProperty(name)) {
      self.interface_spec.adjuncts[name] = {};
    }

    if(self.interface_spec.adjuncts.hasOwnProperty(name) && self.interface_spec.adjuncts[name].hasOwnProperty("lis")){
      self.interface_spec.adjuncts[name].instance.removeListener('output', self.interface_spec.adjuncts[name].lis)
    }

    self.interface_spec.adjuncts[name].instance = inst;

    self.interface_spec.adjuncts[name].type = self.interface_spec.adjuncts[name].instance.interface_spec.type; // UGLY.  See above.

    // reference to listener function so we can remove it later if needed.
    self.interface_spec.adjuncts[name].lis = function(msg) { adjunctReceive(name, msg) };
    self.interface_spec.adjuncts[name].instance.on('output', self.interface_spec.adjuncts[name].lis)

    self.send('_adjunctUpdate', {})
  }

  this.addMetaAdj = function(name, targetAdj) {
    //console.log(self.interface_spec.type +" addAdjunct: " + name + "");
    if(!self.interface_spec.hasOwnProperty("adjuncts")) {
      self.interface_spec.adjuncts = {};
    }
    if(!self.interface_spec.adjuncts.hasOwnProperty(name)) {
      self.interface_spec.adjuncts[name] = {};
    }
    self.interface_spec.adjuncts[targetAdj]._alias = name
    self.interface_spec.adjuncts[name].meta = targetAdj;
    self.interface_spec.adjuncts[name].instance = self.interface_spec.adjuncts[targetAdj].instance;

    self.send('_adjunctUpdate', {})
  }

  this.getAdjunctType = function(key) {
    return _get(self.interface_spec, ['adjuncts', key, 'instance', 'interface_spec' ,'type']);
  }

  this.getAdjunctName = function(key) {
    return _get(self.interface_spec, ['adjuncts', key, 'instance', 'interface_spec' ,'name']);
  }

  this.init = function(){
    if(_has(self.interface_spec, ["construct"])) {
      self.interface_spec.construct();
    }
    // listening on our own input and binding scope to receive
    self.on('input', receive.bind(self))
  }

  this.removeAdjunct = function(name, isNested) {
      self.sendToAdjunct(name, ['destruct'], true)
      self.interface_spec.adjuncts[name].instance.removeListener('output', self.interface_spec.adjuncts[name].lis)
      delete self.interface_spec.adjuncts[name];
      if(isNested === undefined) {
        self.send('_adjunctUpdate', {})
      }
  };

  this.removeMetaAdj = function(name, targetAdj) {
    delete self.interface_spec.adjuncts[targetAdj]._alias
    delete self.interface_spec.adjuncts[name].meta
    delete self.interface_spec.adjuncts[name].instance
    delete self.interface_spec.adjuncts[name]
    self.send('_adjunctUpdate', {})
  }

  this.passAdjunct = function(name) {
    var ref = self.interface_spec.adjuncts[name].instance
    self.removeAdjunctListener(name);
    delete self.interface_spec.adjuncts[name]
    self.send('_adjunctUpdate', {})
    return ref;
  }

  this.hideAdjunct = function(name, value, hide_msg) {
    self.interface_spec.adjuncts[name].instance.interface_spec.hidden = value;
    self.interface_spec.adjuncts[name].hide_msg = hide_msg;
    self.send('_adjunctUpdate', {})
  }

  this.removeAdjunctListener = function(name) {
    self.interface_spec.adjuncts[name].instance.removeListener('output', self.interface_spec.adjuncts[name].lis)
    self.send('_adjunctUpdate', {})
  }



  // not sure about this... but okay
  this.init();

}
inherits(msgHandler, ee);

module.exports = msgHandler;
