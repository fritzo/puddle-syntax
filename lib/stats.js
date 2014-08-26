'use strict';

var _ = require('underscore');
var assert = require('assert');
var debug = require('debug')('puddle-syntax:stats');

var sum = function (samples) {
    var total = 0;
    for (var i = 0; i < samples.length; ++i) {
        total += samples[i];
    }
    return total;
};

var mean = function (samples) {
    return sum(samples) / samples.length;
};

var normalize = function (probs) {
    var scale = 1 / sum(probs);
    for (var i = 0; i < probs.length; ++i) {
        probs[i] = scale * probs[i];
    }
};

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

var sampleUnif01 = _.bind(Math.random, Math);

var sampleInt = function (max) {
    return Math.floor(Math.random() * (max + 1));
};

var sampleUnifChoice = function (array) {
    assert(array.length > 0, 'Cannot sample from empty array');
    return array[sampleInt(array.length - 1)];
};

var sampleDiscrete = function (values, probs) {
    var attempts = 10;
    for (var i = 0; i < attempts; ++i) {
        var dart = -Math.random();
        for (var pos = 0; pos < probs.length; ++pos) {
            dart += probs[pos];
            if (dart > 0) {
                return values[pos];
            }
        }
    }
    throw new Error('sampleDiscrete imprecision');
};

module.exports = {
    sum: sum,
    mean: mean,
    normalize: normalize,
    iid: iid,
    sampleUnique: sampleUnique,
    sampleUnif01: sampleUnif01,
    sampleUnifChoice: sampleUnifChoice,
    sampleDiscrete: sampleDiscrete,
};
