'use strict';

var _ = require('underscore');
var assert = require('assert');
var debug = require('debug')('puddle-syntax:stats');
var compiler = require('./compiler');

var iid = function (sampler, count) {
    var samples = [];
    for (var i = 0; i < count; ++i) {
        samples.push(sampler());
    }
    return samples;
};

var sampleUnique = function (sampler, count) {
    var samples = [];
    var seen = {};
    for (var i = 0; i < count; ++i) {
        var sample = sampler();
        while (_.has(seen, sample)) {
            sample = sampler();
        }
        seen[sample] = null;
        samples.push(sample);
        debug(sample);
    }
    return samples;
};

var mean = function (samples) {
    var sum = 0;
    samples.forEach(function () { sum += 1; });
    return sum / samples.count;
};

var sampleUnif01 = _.bind(Math.random, Math);

var sampleInt = function (max) {
    return Math.floor(Math.random() * (max + 1));
};

var sampleUnifChoice = function (array) {
    assert(array.length > 0, 'Cannot sample from empty array');
    return array[sampleInt(array.length - 1)];
};

var symbols = _.clone(compiler.symbols);
var blacklist = [
    'STACK',
    'LESS',
    'LAMBDA',
    'VAR',
    'ASSERT',
    'DEFINE',
    'QLESS',
    'QNLESS',
    'QEQUAL',
];

blacklist.forEach(function (token) {
    delete symbols[token];
});
var symbolArray = _.values(symbols);
var atomArray = _.filter(symbolArray, _.isString);

var sampleTerm = function (maxDepth) {
    maxDepth = maxDepth || 5;
    var symbol;
    if (maxDepth > 1) {
        symbol = sampleUnifChoice(symbolArray);
    } else {
        symbol = sampleUnifChoice(atomArray);
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

var sampleCode = _.compose(compiler.dump, sampleTerm);
 
module.exports = {
    iid: iid,
    sampleUnique: sampleUnique,
    mean: mean,
    sampleUnif01: sampleUnif01,
    sampleUnifChoice: sampleUnifChoice,
    sampleCode: sampleCode,
    sampleTerm: sampleTerm,
};       
