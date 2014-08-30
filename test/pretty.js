'use strict';

var _ = require('lodash');
var assert = require('assert');
var mocha = require('mocha');
var compiler = require('../lib/compiler');
var pretty = require('../lib/pretty');
var datasets = require('./lib/datasets');

mocha.suite('pretty', function () {
    mocha.test('is one-to-one', function () {
        var seen = {};
        datasets.codes.forEach(function (code) {
            var term = compiler.load(code);
            var result = pretty(term);
            assert(
                !_.has(seen, result),
                'pretty conflict:' +
                '\n  ' + seen[result] +
                '\n  ' + code +
                '\nboth map to ' +
                '\n  ' + result);
            seen[result] = code;
        });
    });
});
