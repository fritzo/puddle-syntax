'use strict';

var _ = require('lodash');
var pattern = require('./pattern');
var compiler = require('./compiler');

var CURSOR = compiler.fragments.church.CURSOR;

var insertCursor = function (term, address) {
    if (address.length === 0) {
        return CURSOR(term);
    } else {
        var result = term.slice(0);
        var pos = address[0];
        address = address.slice(1);
        result[pos] = insertCursor(term[pos], address);
        return result;
    }
};

var removeCursor = (function () {
    var x = pattern.variable('x');
    var array = pattern.variable('array', _.isArray);
    var string = pattern.variable('string');

    var t = pattern.match(
        CURSOR(x), function (match) {
            return match.x;
        },
        array, function (match, address) {
            var array = match.array;
            for (var i = 1; i < array.length; ++i) {
                var item = t(array[i], address);
                if (item !== null) {
                    array = array.slice(0);
                    array[i] = item;
                    address.push(i);
                    return array;
                }
            }
            return null;
        },
        string, function () {
            return null;
        }
    );

    return function (term) {
        var address = [];
        var result = t(term, address);
        address.reverse();
        return {
            address: address,
            term: result,
        };
    };
})();

module.exports = {
    insertCursor: insertCursor,
    removeCursor: removeCursor,
};
