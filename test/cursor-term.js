'use strict';

var mocha = require('mocha');
var assert = require('../lib/assert');
var compiler = require('../lib/compiler');
var cursorTerm = require('../lib/cursor-term');

mocha.suite('cursor-term', function () {

    var CURSOR = compiler.fragments.church.CURSOR;
    var APP = compiler.fragments.church.APP;
    var VAR = compiler.fragments.church.VAR;
    var x = VAR('x');
    var y = VAR('y');

    var examples = [
        [CURSOR(x), {term: x, address: []}],
        [CURSOR(APP(x, y)), {term: APP(x, y), address: []}],
        [APP(CURSOR(x), y), {term: APP(x, y), address: [1]}],
        [APP(x, CURSOR(y)), {term: APP(x, y), address: [2]}],
    ];

    mocha.test('insertCursor', function () {
        var fun = function (args) {
            return cursorTerm.insertCursor(args.term, args.address);
        };
        assert.backward(fun, examples);
    });

    mocha.test('removeCursor', function () {
        assert.forward(cursorTerm.removeCursor, examples);
    });
});
