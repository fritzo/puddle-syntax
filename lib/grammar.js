'use strict';

var _ = require('underscore');
var stats = require('./stats');
var compiler = require('./compiler');
var basis = require('./basis');

var atoms = [];
var symbols = [];
var atomProbs = [];
var symbolProbs = [];

_.each(basis, function (symbolsOfArity, arity) {
    _.each(symbolsOfArity, function (prob, token) {
        var symbol = compiler.fragments.combinators[token];
        symbols.push(symbol);
        symbolProbs.push(prob);
        if (arity === 'NULLARY') {
            atoms.push(symbol);
            atomProbs.push(prob);
        }
    });
});

stats.normalize(atomProbs);
stats.normalize(symbolProbs);

var sampleTerm = function (maxDepth) {
    maxDepth = maxDepth || 5;
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
