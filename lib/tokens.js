'use strict';

var _ = require('lodash');
var assert = require('assert');

var matcher = function (re) {
    return function (token) {
        return !!(_.isString(token) && token.match(re));
    };
};

var isToken = matcher(/^[^\d\W]\w*(\.[^\d\W]\w*)*$/);
var isKeyword = matcher(/^[A-Z]+$/);
var isLocal = matcher(/^[a-z][a-z0-9]*$/);
var isGlobal = matcher(/^[^\d\W]\w*(\.[^\d\W]\w*)+$/);

var getFreeVariables = function (code) {
    var free = {};
    code.split(/\s+/).forEach(function (token) {
        assert(isToken(token), 'invalid token: ' + token);
        if (!isKeyword(token)) {
            assert(isGlobal(token), 'invalid global: ' + token);
            free[token] = null;
        }
    });
    return free;
};

module.exports = {
    isToken: isToken,
    isKeyword: isKeyword,
    isLocal: isLocal,
    isGlobal: isGlobal,
    getFreeVariables: getFreeVariables,
};
