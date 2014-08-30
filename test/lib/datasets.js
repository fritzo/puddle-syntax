'use strict';

var stats = require('../../lib/stats');
var grammar = require('../../lib/grammar');
var _ = require('lodash');
var compiler = require('../../lib/compiler');
var tree = require('../../lib/tree');

var SAMPLE_COUNT = 1000;

var codes = stats.sampleUnique(grammar.sampleCode, SAMPLE_COUNT);
var curryTerms = _.map(codes, compiler.parse);
var churchTerms = _.map(codes, compiler.load);
var nodes = _.map(churchTerms, tree.load);

module.exports = {
    codes: codes,
    curryTerms: curryTerms,
    churchTerms: churchTerms,
    nodes: nodes,
};
