/**
 * Mutable abstract syntax trees with crosslinks for constant time traversal.
 *
 * example tree node:
 *   {
 *     name: 'VAR',
 *     varName: term[1],  // optional, only VAR nodes have this field
 *     below: [],
 *     above: null
 *   };
 */
'use strict';

var _ = require('underscore');
var assert = require('./assert');
var compiler = require('./compiler');
var test = require('./test').suite('tree');

var loadSymbol = {};
var dumpSymbol = {};

var load = function (term) {
    if (_.isString(term)) {
        return loadSymbol[term]();
    } else {
        return loadSymbol[term[0]](term);
    }
};

var dump = function (node) {
    return dumpSymbol[node.name](node);
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
        dumpSymbol[name] = function (node) {
            return node.name;
        };
    } else {
        var arity = symbol.arity;
        loadSymbol[name] = function (term) {
            assert(term !== undefined);
            assert.equal(term.length, 1 + arity, name);
            var node = {
                name: name,
                below: [],
                above: null
            };
            for (var i = 1; i <= arity; ++i) {
                var below = load(term[i]);
                node.below.push(below);
                below.above = node;
            }
            return node;
        };
        dumpSymbol[name] = function (node) {
            var below = node.below;
            var term = [node.name];
            for (var i = 0; i < arity; ++i) {
                term.push(dump(below[i]));
            }
            return term;
        };
    }
});

// special case: VAR
loadSymbol.VAR = function (term) {
    return {
        name: 'VAR',
        varName: term[1],
        below: [],
        above: null
    };
};
dumpSymbol.VAR = function (node) {
    return ['VAR', node.varName];
};

test('load, dump', function () {
    var examples = [
        'VAR x',
        'QUOTE APP LAMBDA CURSOR VAR x VAR x HOLE',
        'LETREC VAR i LAMBDA VAR x VAR x APP VAR i VAR i'
    ];
    for (var i = 0; i < examples.length; ++i) {
        var lineno = 1 + i;
        var string = examples[i];
        var term = compiler.load(string);
        var node = load(term);
        var term2 = dump(node);
        assert.equal(term2, term, 'Example ' + lineno);
    }
});

var getRoot = function (node) {
    while (node.above !== null) {
        node = node.above;
    }
    return node;
};

var pushPatternVars = function (patt, vars) {
    switch (patt.name) {
        case 'VAR':
            vars.push(patt.varName);
            break;

        case 'QUOTE':
            pushPatternVars(patt.below[0], vars);
            break;

        default:
            break;
    }
};

var getLocals = function (node) {
    var result = [];
    for (var above = node; above !== null; above = above.above) {
        if (above.name === 'LAMBDA' || above.name === 'LETREC') {
            var patt = above.below[0];
            pushPatternVars(patt, result);
        }
    }
    return result;
};

var getVarsBelow = function (node, vars) {
    if (node.name === 'VAR') {
        vars[node.varName] = null;
    } else {
        var below = node.below;
        for (var i = 0; i < below.length; ++i) {
            getVarsBelow(below[i], vars);
        }
    }
};

var getVarsAround = function (node) {
    var vars = {};
    var root = getRoot(node);
    getVarsBelow(root, vars);
    return vars;
};

var getFresh = function (node) {
    var avoid = getVarsAround(node);
    for (var i = 0; true; ++i) {
        var name = compiler.enumerateFresh(i);
        if (!_.has(avoid, name)) {
            return name;
        }
    }
};

// TODO add tests

module.exports = {
    load: load,
    dump: dump,
    getRoot: getRoot,
    getLocals: getLocals,
    getFresh: getFresh,
};
