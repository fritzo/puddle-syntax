'use strict';

module.exports = function (string) {
    return function (args) {
        return string.replace(/{(\d+)}/g, function (match, pos) { 
            return args[pos];
        });
    };
};
