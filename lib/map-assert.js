'use strict';

var assert = require('assert');
var _ = require('underscore');

exports.forward = function (fwd, pairs) {
    assert(_.isFunction(fwd), 'Expected fwd function, actual: ' + fwd);
    assert(_.isArray(pairs), 'Expected pairs array, actual: ' + pairs);
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(fwd(pair[0]), pair[1]);
        } catch (err) {
            err.message += '\nin forward example ' + (1 + lineno);
            throw err;
        }
    });
};

exports.backward = function (bwd, pairs) {
    assert(_.isFunction(bwd), 'Expected bwd function, actual: ' + bwd);
    assert(_.isArray(pairs), 'Expected pairs array, actual: ' + pairs);
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(bwd(pair[1]), pair[0]);
        } catch (err) {
            err.message += '\nin backward example ' + (1 + lineno);
            throw err;
        }
    });
};

exports.inverses = function (fwd, bwd, items) {
    assert(_.isFunction(fwd), 'Expected fwd function, actual: ' + fwd);
    assert(_.isFunction(bwd), 'Expected bwd function, actual: ' + bwd);
    assert(_.isArray(items), 'Expected items array, actual: ' + items);
    items.forEach(function (item, lineno) {
        try {
            assert.equal(bwd(fwd(item)), item);
        } catch (err) {
            err.message += '\nin inverses example ' + (1 + lineno);
            throw err;
        }
    });
};
