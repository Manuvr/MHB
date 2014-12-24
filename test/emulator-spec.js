var expect = require("chai").expect;
var defs = require("../lib/defs.js")();

describe("get commands", function() {
    it("should always load glove commands for emulator", function() {
        var commands = defs.outCommand;
        expect(Object.keys(commands).length).to.be.at.least(1); 
    });
});
