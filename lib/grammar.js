'use strict';

var _ = require('lodash');
var stats = require('./stats');
var compiler = require('./compiler');
var fragments = require('./fragments');
var basis = require('./basis');

var DEFAULT_MAX_DEPTH = 5;

var atoms = [];
var symbols = [];
var atomProbs = [];
var symbolProbs = [];

_.each(basis, function (symbolsOfArity, arity) {
    _.each(symbolsOfArity, function (prob, token) {
        var symbol = fragments.combinators[token];
        symbols.push(symbol);
        symbolProbs.push(prob);
        if (arity === 'NULLARY') {
            atoms.push(symbol);
            atomProbs.push(prob);
        }
    });
});

var sortPair = function (items, probs) {
    var size = items.length;
    var i;
    var item;
    for (i = 0; i < size; ++i) {
        items[i] = [items[i], probs[i]];
    }
    items.sort(function (x, y) {
        return y[1] - x[1];
    });
    for (i = 0; i < size; ++i) {
        item = items[i];
        probs[i] = item[1];
        items[i] = item[0];
    }
};

sortPair(atoms, atomProbs);
sortPair(symbols, symbolProbs);

stats.normalize(atomProbs);
stats.normalize(symbolProbs);

var sampleTerm = function (maxDepth) {
    maxDepth = maxDepth || DEFAULT_MAX_DEPTH;
    var symbol;
    if (maxDepth > 1) {
        symbol = stats.sampleDiscrete(symbols, symbolProbs);
    } else {
        symbol = stats.sampleDiscrete(atoms, atomProbs);
    }
    if (_.isString(symbol)) {
        return symbol;
    } else {
        var args = [];
        for (var i = 0; i < symbol.arity; ++i) {
            args.push(sampleTerm(maxDepth - 1));
        }
        return symbol.apply(null, args);
    }
};

var sampleCode = _.compose(
        compiler.dump,
        compiler.load, compiler.dump,  // HACK simplify
        compiler.load, compiler.dump,  // HACK simplify
        sampleTerm);
 
module.exports = {
    sampleCode: sampleCode,
    sampleTerm: sampleTerm,
};
