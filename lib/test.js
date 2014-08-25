'use strict';

var assert = require('assert');

var suites = [];
var running = false;

var suite = function (name) {
    assert(!running, 'Suite started after runAll: ' + name);
    var tests = [];

    suites.push({
        'name': name,
        'callback': function (mocha) {
            tests.forEach(function (args) {
                mocha.test(args.name, args.callback);
            });
        }
    });

    var test = function (name, callback) {
        assert(!running, 'Test started after runAll: ' + name);
        tests.push({
            'name': name,
            'callback': callback
        });
    };

    return test;
};

var test = suite('misc');
test.suite = suite;

test.runAll = function (mocha) {
    running = true;
    suites.forEach(function (args) {
        mocha.suite(args.name, function () {
            args.callback(mocha);
        });
    });
};

module.exports = test;
