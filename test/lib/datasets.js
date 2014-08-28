'use strict';

var stats = require('../../lib/stats');
var grammar = require('../../lib/grammar');
var _ = require('underscore');
var compiler = require('../../lib/compiler');
var tree = require('../../lib/tree');

var SAMPLE_COUNT = 1000;

var codes = stats.sampleUnique(grammar.sampleCode, SAMPLE_COUNT);
var terms = _.map(codes, compiler.load);
//var lines = _.map(codes, compiler.loadLine);
var nodes = _.map(terms, tree.load);

module.exports = {
    codes: codes,
    terms: terms,
    //lines: lines,
    nodes: nodes,
};
