'use strict';

var mocha = require('mocha');
var assert = require('../lib/assert');
var tokens = require('../lib/tokens');

mocha.suite('tokens', function () {

    mocha.test('tokens.isToken', function () {
        var examples = [
            ['()', false],
            ['', false],
            ['1', false],
            ['1a', false],
            ['1.1', false],
            ['1a', false],
            ['.', false],
            ['...', false]
        ];
        assert.forward(tokens.isToken, examples);
    });

    mocha.test('tokens.isKeyword', function () {
        var examples = [
            ['asdf', false],
            ['ASDF', true],
            ['ASDF.ASDF', false],
            ['a123', false],
            ['A123', false]
        ];
        assert.forward(tokens.isKeyword, examples);

        examples.forEach(function (pair) {
            pair[1] = true;
        });
        assert.forward(tokens.isToken, examples);
    });

    mocha.test('tokens.isLocal', function () {
        var examples = [
            ['asdf', true],
            ['ASDF', false],
            ['asdf.asdf', false],
            ['a123', true],
            ['A123', false]
        ];
        assert.forward(tokens.isLocal, examples);

        examples.forEach(function (pair) {
            pair[1] = true;
        });
        assert.forward(tokens.isToken, examples);
    });

    mocha.test('tokens.isGlobal', function () {
        var examples = [
            ['asdf', false],
            ['ASDF', false],
            ['mod.asdf', true],
            ['mod.mod.mod.mod.mod.asdf', true],
            ['mod.asdf123', true],
            ['MOD.ASDF', true],
        ];
        assert.forward(tokens.isGlobal, examples);

        examples.forEach(function (pair) {
            pair[1] = true;
        });
        assert.forward(tokens.isToken, examples);
    });

    mocha.test('no-free-variables', function () {
        var code = 'APP J I';
        var free = {};
        assert.equal(tokens.getFreeVariables(code), free);
    });

    mocha.test('one-free-variables', function () {
        var code = 'APP CI types.div';
        var free = {'types.div': null};
        assert.equal(tokens.getFreeVariables(code), free);
    });

    mocha.test('many-free-variables', function () {
        var code = 'APP APP P COMP types.div types.semi types.div';
        var free = {'types.div': null, 'types.semi': null};
        assert.equal(tokens.getFreeVariables(code), free);
    });
});
