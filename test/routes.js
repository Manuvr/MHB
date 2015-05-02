// test/parse.js

var expect = require('chai').expect;
var sinon = require('sinon');


describe('Express General Routes', function() {
  describe('GET /', function() {

    it('should have working API', function() {
    });

  });

  describe('GET /sendTestData/:mode/:messageId/:args', function() {

  });

  describe('GET /commands', function() {

    it('should bring back commands from DHB models'), function() {
    };

  });

  describe('GET /gloveModel', function() {

    it('should bring back the glove model from DHB models'), function() {
    };

  });

  describe('GET /sendSync/:mode', function() {

    it('should send a sync packet'), function() {
    };

  });
});

describe('Express BT Routes', function() {

  describe('GET /scanBT', function() {

    it('should scan for BT', function() {

    });

  });

  describe('GET /connectBT/:address', function() {

  });

  describe('GET /disconnectBT', function() {

  });

});

