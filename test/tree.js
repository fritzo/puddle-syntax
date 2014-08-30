'use strict';

var _ = require('lodash');
var mocha = require('mocha');
var compiler = require('../lib/compiler');
var assert = require('../lib/assert');
var tree = require('../lib/tree');
var datasets = require('./lib/datasets');

mocha.suite('tree', function () {

    mocha.test('load;dump on simple examples', function () {
        var examples = [
            'VAR x',
            'QUOTE APP LAMBDA CURSOR VAR x VAR x HOLE',
            'LETREC VAR i LAMBDA VAR x VAR x APP VAR i VAR i'
        ];
        assert.inverses(tree.load, tree.dump, _.map(examples, compiler.load));
    });

    mocha.test('load;dump on datasets.terms', function () {
        assert.inverses(tree.load, tree.dump, datasets.terms);
    });
});
