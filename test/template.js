'use strict';

var mocha = require('mocha');
var assert = require('assert');
var template = require('../lib/template');

mocha.suite('template', function () {
    mocha.test('simple example', function () {
        var t = template('test {0} test {1} test {0} test');
        assert.equal(t(['a', 'b']), 'test a test b test a test');
    });
});
