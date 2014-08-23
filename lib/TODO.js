'use strict';

/** @constructor */
var TodoException = function (message) {
    this.message = message || '(unfinished code)';
};

TodoException.prototype.toString = function () {
    return 'TODO: ' + this.message;
};

var TODO = function (message) {
    throw new TodoException(message);
};

module.exports = TODO;
