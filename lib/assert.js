'use strict';

var _ = require('underscore');

var TOL = 1e-8;

/** @constructor */
var AssertException = function (message) {
    this.message = message || '(unspecified)';
};

AssertException.prototype.toString = function () {
    return 'Assertion Failed: ' + this.message;
};

var assert = function (condition, message) {
    if (!condition) {
        throw new AssertException(message);
    }
};

assert.Exception = AssertException;

assert.equal = function (actual, expected, message) {
    assert(_.isEqual(actual, expected),
        (message || '') +
        '\n  actual = ' + JSON.stringify(actual) +
        '\n  expected = ' + JSON.stringify(expected));
};

assert.close = function (x, y, message, tol) {
    message = message || 'Not close:';
    tol = tol || TOL;
    assert.equal(typeof x, typeof y);
    if (_.isNumber(x)) {
        assert(Math.abs(x - y) < tol,
            message +
            '\n  actual = ' + JSON.stringify(x) +
            '\n  expected = ' + JSON.stringify(y));
    } else if (_.isArray(x)) {
        assert.equal(x.length, y.length, message + ' lengths differ', tol);
        _.each(x, function (actual, pos) {
            var expected = y[pos];
            assert.close(actual, expected, message + ' [' + pos + ']', tol);
        });
    } else if (_.isObject(x)) {
        assert.equal(_.keys(x).sort(), _.keys(y).sort(), ' keys differ', tol);
        _.each(x, function (actual, key) {
            var expected = y[key];
            assert.close(actual, expected, message + ' [' + key + ']');
        });
    } else {
        assert.equal(x, y, message);
    }
};

assert.forward = function (fwd, pairs) {
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(fwd(pair[0]), pair[1]);
        } catch (e) {
            e.message += '\nforward example ' + (1 + lineno);
            throw e;
        }
    });
};

assert.backward = function (bwd, pairs) {
    pairs.forEach(function (pair, lineno) {
        try {
            assert.equal(bwd(pair[1]), pair[0]);
        } catch (e) {
            e.message += '\nbackward example ' + (1 + lineno);
            throw e;
        }
    });
};

assert.inverses = function (fwd, bwd, items) {
    items.forEach(function (item, lineno) {
        try {
            assert.equal(bwd(fwd(item)), item);
        } catch (e) {
            e.message += '\ninverses example ' + (1 + lineno);
            throw e;
        }
    });
};

module.exports = assert;
