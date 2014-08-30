'use strict';

var _ = require('lodash');
var mocha = require('mocha');
var assert = require('../lib/assert');
var basis = require('../lib/basis');

mocha.suite('basis', function () {

    mocha.test('is normalized', function () {
        var total = 0;
        _.forEach(basis, function (symbols) {
            _.forEach(symbols, function (weight) {
                total += weight;
            });
        });
        assert.close(total, 1.0);
    });
});
