'use strict';

var compiler = require('../lib/compiler');
var mocha = require('mocha');
var assert = require('../lib/assert');
var datasets = require('./lib/datasets');

mocha.suite('serialize', function () {

    mocha.test('print;parse = id', function () {
        var examples = [
            'VAR x',
            'QUOTE APP LAMBDA CURSOR VAR x VAR x HOLE',
            'LETREC VAR i LAMBDA VAR x VAR x APP VAR i VAR i',
        ];
        assert.inverses(compiler.parse, compiler.print, examples);
    });

    mocha.test('works on datasets.codes', function () {
        assert.inverses(compiler.parse, compiler.print, datasets.codes);
    });

    mocha.test('works on datasets.curryTerms', function () {
        assert.inverses(compiler.print, compiler.parse, datasets.curryTerms);
    });

    mocha.test('works on datasets.churchTerms', function () {
        assert.inverses(compiler.print, compiler.parse, datasets.churchTerms);
    });
});
