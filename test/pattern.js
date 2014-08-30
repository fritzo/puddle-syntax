'use strict';

var _ = require('lodash');
var mocha = require('mocha');
var assert = require('../lib/assert');
var pattern = require('../lib/pattern');

var variable = pattern.variable;
var isVariable = pattern.isVariable;
var isPattern = pattern.isPattern;
var match = pattern.match;

mocha.suite('pattern', function () {

    mocha.test('isVariable', function () {
        var examples = [
            [variable('a'), true],
            ['asdf', false],
            [{}, false],
            [[], false],
            [undefined, false]
        ];
        examples.forEach(function (pair) {
            var thing = pair[0];
            assert(
                isVariable(thing) === pair[1],
                'isVariable failed on ' + thing);
        });
    });

    mocha.test('isPattern', function () {
        var examples = [
            [variable('a'), true],
            ['asdf', true],
            [{}, false],
            [[['asdf', variable('x')], variable('y')], true],
            [[variable('x'), variable('x')], false],
            [undefined, false]
        ];
        assert.forward(isPattern, examples);
    });

    mocha.test('match', function () {
        var x = variable('x');
        var y = variable('y');
        var z = variable('z');
        var string = variable('string', _.isString);
        var array = variable('array', _.isArray);

        var t = match(
            ['APP', 'I', x], function (match) {
                var tx = t(match.x);
                return tx;
            },
            ['APP', ['APP', 'K', x], y], function (match) {
                var tx = t(match.x);
                return tx;
            },
            ['APP', ['APP', ['APP', 'B', x], y], z], function (match) {
                var xyz = ['APP', match.x, ['APP', match.y, match.z]];
                return t(xyz);
            },
            ['APP', x, y], function (match) {
                var tx = t(match.x);
                var ty = t(match.y);
                return ['APP', tx, ty];
            },
            ['typed:', string], function () {
                return 'string';
            },
            ['typed:', array], function () {
                return 'array';
            },
            x, function (match) {
                return match.x;
            }
        );

        var examples = [
            [['APP', 'I', 'a'], 'a'],
            [['APP', ['APP', 'K', 'a'], 'b'], 'a'],
            [['typed:', 'test'], 'string'],
            [['typed:', []], 'array']
        ];
        assert.forward(t, examples);
    });
});
