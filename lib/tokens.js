'use strict';

var _ = require('underscore');
var assert = require('./assert');
var test = require('./test').suite('tokens');

var matcher = function (re) {
    return function (token) {
        return !!(_.isString(token) && token.match(re));
    };
};

var isToken = matcher(/^[^\d\W]\w*(\.[^\d\W]\w*)*$/);
var isKeyword = matcher(/^[A-Z]+$/);
var isLocal = matcher(/^[a-z][a-z0-9]*$/);
var isGlobal = matcher(/^[^\d\W]\w*(\.[^\d\W]\w*)+$/);

test('isToken', function () {
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
    assert.forward(isToken, examples);
});

test('isKeyword', function () {
    var examples = [
        ['asdf', false],
        ['ASDF', true],
        ['ASDF.ASDF', false],
        ['a123', false],
        ['A123', false]
    ];
    assert.forward(isKeyword, examples);

    examples.forEach(function (pair) {
        pair[1] = true;
    });
    assert.forward(isToken, examples);
});

test('isLocal', function () {
    var examples = [
        ['asdf', true],
        ['ASDF', false],
        ['asdf.asdf', false],
        ['a123', true],
        ['A123', false]
    ];
    assert.forward(isLocal, examples);

    examples.forEach(function (pair) {
        pair[1] = true;
    });
    assert.forward(isToken, examples);
});

test('isGlobal', function () {
    var examples = [
        ['asdf', false],
        ['ASDF', false],
        ['mod.asdf', true],
        ['mod.mod.mod.mod.mod.asdf', true],
        ['mod.asdf123', true],
        ['MOD.ASDF', true],
    ];
    assert.forward(isGlobal, examples);

    examples.forEach(function (pair) {
        pair[1] = true;
    });
    assert.forward(isToken, examples);
});

var getFreeVariables = function (code) {
    var free = {};
    code.split(/\s+/).forEach(function (token) {
        assert(isToken(token), 'invalid token: ' + token);
        if (!isKeyword(token)) {
            assert(isGlobal(token), 'invalid global: ' + token);
            free[token] = null;
        }
    });
    return free;
};

test('no-free-variables', function () {
    var code = 'APP J I';
    var free = {};
    assert.equal(getFreeVariables(code), free);
});

test('one-free-variables', function () {
    var code = 'APP CI types.div';
    var free = {'types.div': null};
    assert.equal(getFreeVariables(code), free);
});

test('many-free-variables', function () {
    var code = 'APP APP P COMP types.div types.semi types.div';
    var free = {'types.div': null, 'types.semi': null};
    assert.equal(getFreeVariables(code), free);
});

module.exports = {
    isToken: isToken,
    isKeyword: isKeyword,
    isLocal: isLocal,
    isGlobal: isGlobal,
    getFreeVariables: getFreeVariables,
};
