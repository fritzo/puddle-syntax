'use strict';

var _ = require('underscore');
var compiler = require('./compiler');

var arborist = {};

arborist.getRoot = function (indexed) {
    while (indexed.above !== null) {
        indexed = indexed.above;
    }
    return indexed;
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

arborist.getBoundAbove = function (term) {
    var result = [];
    for (var above = term; above !== null; above = above.above) {
        if (above.name === 'LAMBDA' || above.name === 'LETREC') {
            var patt = above.below[0];
            pushPatternVars(patt, result);
        }
    }
    return result;
};

arborist.getVars = (function () {
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
    return function (node) {
        var vars = {};
        var root = arborist.getRoot(node);
        getVarsBelow(root, vars);
        return vars;
    };
})();

arborist.getFresh = function (node) {
    var avoid = arborist.getVars(node);
    for (var i = 0; true; ++i) {
        var name = compiler.enumerateFresh(i);
        if (!_.has(avoid, name)) {
            return name;
        }
    }
};

module.exports = arborist;
