/**
 * Mutable abstract syntax trees with crosslinks for constant time traversal.
 *
 * example tree node:
 *   {
 *     name: 'VAR',
 *     varName: flat[1],  // optional, only VAR nodes have this field
 *     below: [],
 *     above: null
 *   };
 */
'use strict';

var _ = require('underscore');
var assert = require('./assert');
var test = require('./test');
var compiler = require('./compiler');

var tree = {};

var loadSymbol = {};
var dumpSymbol = {};

var load = tree.load = function (flat) {
    if (_.isString(flat)) {
        return loadSymbol[flat]();
    } else {
        return loadSymbol[flat[0]](flat);
    }
};

var dump = tree.dump = function (indexed) {
    return dumpSymbol[indexed.name](indexed);
};

_.each(compiler.symbols, function (symbol, name) {
    if (_.isString(symbol)) {
        loadSymbol[name] = function () {
            return {
                name: name,
                below: [],
                above: null
            };
        };
        dumpSymbol[name] = function (indexed) {
            return indexed.name;
        };
    } else {
        var arity = symbol.arity;
        loadSymbol[name] = function (flat) {
            assert(flat !== undefined);
            assert.equal(flat.length, 1 + arity, name);
            var indexed = {
                name: name,
                below: [],
                above: null
            };
            for (var i = 1; i <= arity; ++i) {
                var below = load(flat[i]);
                indexed.below.push(below);
                below.above = indexed;
            }
            return indexed;
        };
        dumpSymbol[name] = function (indexed) {
            var below = indexed.below;
            var flat = [indexed.name];
            for (var i = 0; i < arity; ++i) {
                flat.push(dump(below[i]));
            }
            return flat;
        };
    }
});

// special case: VAR
loadSymbol.VAR = function (flat) {
    return {
        name: 'VAR',
        varName: flat[1],
        below: [],
        above: null
    };
};
dumpSymbol.VAR = function (indexed) {
    return ['VAR', indexed.varName];
};

test('tree.load, tree.dump', function () {
    var examples = [
        'VAR x',
        'QUOTE APP LAMBDA CURSOR VAR x VAR x HOLE',
        'LETREC VAR i LAMBDA VAR x VAR x APP VAR i VAR i'
    ];
    for (var i = 0; i < examples.length; ++i) {
        var lineno = 1 + i;
        var string = examples[i];
        var flat = compiler.load(string);
        var indexed = load(flat);
        var flat2 = dump(indexed);
        assert.equal(flat2, flat, 'Example ' + lineno);
    }
});

module.exports = tree;
