'use strict';

var assert = require('assert');
var suites = [];
var running = false;

var suite = function (name) {
    assert(!running);
    var tests = [];

    suites.push({
        'name': name,
        'callback': function () {
            var mocha = require('mocha');
            tests.forEach(function (args) {
                mocha.test(args.name, args.callback);
            });
        }
    });

    var test = function (name, callback) {
        assert(!running);
        tests.push({
            'name': name,
            'callback': callback
        });
    };

    return test;
};

var test = suite('misc');
test.suite = suite;

test.runAll = function () {
    running = true;
    var mocha = require('mocha');
    suites.forEach(function (args) {
        mocha.suite(args.name, args.callback);
    });
};

module.exports = test;
