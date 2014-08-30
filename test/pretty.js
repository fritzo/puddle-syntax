'use strict';

var _ = require('lodash');
var mocha = require('mocha');
var assert = require('../lib/assert');
var compiler = require('../lib/compiler');
var pretty = require('../lib/pretty');
var datasets = require('./lib/datasets');

mocha.suite('pretty', function () {

    mocha.test('on simple examples', function () {
        var examples = [
            ['LAMBDA VAR a VAR a', '\\ a a'],
            ['APP APP VAR a VAR b VAR c', 'a b c'],
            ['APP VAR a APP VAR b VAR c', 'a (b c)']
        ];
        assert.forward(_.compose(pretty, compiler.parse), examples);
    });

    mocha.test('is one-to-one on churchTerms', function () {
        assert.injects(pretty, datasets.churchTerms);
    });
});
