'use strict';

var _ = require('lodash');
var assert = require('assert');

/**
 * @constructor
 * @param {string}
 * @param {(function (?): boolean)=}
 */
var Variable = function Variable (name, constraint) {
    this.name = name;
    this.constraint = (constraint !== undefined) ? constraint : null;
};

Variable.prototype.toString = function () {
    return 'Variable(' + this.name + ')';
};

var variable = function (name, constraint) {
    return new Variable(name, constraint);
};

var isVariable = function (thing) {
    return !!(thing && thing.constructor === Variable);
};

var isPattern = (function () {
    var isPattern = function (patt, avoid) {
        if (isVariable(patt)) {
            if (_.has(avoid, patt.name)) {
                return false;
            } else {
                avoid[patt.name] = null;
                return true;
            }
        } else if (_.isString(patt)) {
            return true;
        } else if (_.isArray(patt)) {
            for (var i = 0; i < patt.length; ++i) {
                if (!isPattern(patt[i], avoid)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };
    return function (patt) {
        return isPattern(patt, {});
    };
})();

var unify = function (patt, struct, matched, allowBacktracking) {
    if (isVariable(patt)) {
        if (patt.constraint === null || patt.constraint(struct)) {
            if (allowBacktracking) {
                matched = _.extend({}, matched);
            }
            matched[patt.name] = struct;
            return matched;
        }
    } else if (_.isArray(patt) && _.isArray(struct)) {
        if (patt.length === struct.length) {
            for (var i = 0; i < struct.length; ++i) {
                matched = unify(patt[i], struct[i], matched);
                if (matched === undefined) {
                    return;
                }
            }
            return matched;
        }
    } else if (patt === struct) {
        return matched;
    }
};

var match = function () {
    // check statically
    assert(arguments.length % 2 === 0, 'bad pattern,handler list');
    var lineCount = arguments.length / 2;
    var patts = [];
    var handlers = [];
    for (var line = 0; line < lineCount; ++line) {
        var patt = arguments[2 * line];
        var handler = arguments[2 * line + 1];
        assert(
            isPattern(patt),
            'bad pattern at line ' + line + ':\n  ' + patt);
        assert(_.isFunction(handler), 'bad handler at line ' + line);
        patts.push(patt);
        handlers.push(handler);
    }
    // run optimized
    var slice = Array.prototype.slice;
    return function (struct) {
        for (var line = 0; line < lineCount; ++line) {
            var matched = unify(patts[line], struct, {});
            if (matched !== undefined) {
                var args = slice.call(arguments);
                args[0] = matched;
                var result = handlers[line].apply(null, args);
                if (result !== undefined) {
                    return result;
                }
            }
        }
        throw new Error('Unmatched Expression:\n  ' + JSON.stringify(struct));
    };
};

module.exports = {
    isVariable: isVariable,
    isPattern: isPattern,
    variable: variable,
    unify: function (patt, struct) {
        assert(isPattern(patt), 'bad pattern: ' + patt);
        return unify(patt, struct, {});
    },
    match: match
};
