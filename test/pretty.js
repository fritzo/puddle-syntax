'use strict';

var _ = require('underscore');
var assert = require('assert');
var mocha = require('mocha');
var datasets = require('./lib/datasets');
var pretty = require('../lib/pretty');

mocha.test('pretty is one-to-one', function () {
    var seen = {};
    datasets.codes.forEach(function (code) {
        var result = pretty(code);
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
