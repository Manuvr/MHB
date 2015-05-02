// test/parse.js

var expect = require('chai').expect;
var sinon = require('sinon');

var helpers = require('./helpers.js');
var dhb = require('../lib/dhb-lib/dhb.js');
var dhbEvents = dhb.events;


describe('DHB Parser', function() {

  describe('Event API', function() {
    // test event system
    it('should accept a DHB packet through event system', function() {

      var test = 'test';
      expect(test).to.be.a('string');

      //generate fake buffer

      //emit fake buffer
      //dhbEvents.emit('btData', buffer);
    });
  });

  describe('Parsing functionality', function() {

    it('should accept a DHB packet through the faking system', function() {

      helpers.sendTest(0, 0);
    });
  });
});

