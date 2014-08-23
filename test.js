'use strict';

var fs = require('fs');
var path = require('path');
var test = require('./lib/test.js');

var discover = function (dir) {
    fs.readdirSync(dir).forEach(function (stem) {
        var name = path.join(dir, stem);
        var stat = fs.statSync(name);
        if (stat.isFile() && stem.match(/\.js$/)) {
            require(name);
        } else if (stat.isDirectory()) {
            discover(name);
        }
    });
};

discover(path.join(__dirname, 'lib'));

test.runAll();
