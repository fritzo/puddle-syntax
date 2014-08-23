'use strict';

var test = require('./test');
var assert = require('assert');

var template = function (string) {
    return function (args) {
        return string.replace(/{(\d+)}/g, function (match, pos) { 
            return args[pos];
        });
    };
};

test('template', function () {
    var t = template('test {0} test {1} test {0} test');
    assert.equal(t(['a', 'b']), 'test a test b test a test');
});

module.exports = template;
