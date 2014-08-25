'use strict';

var mocha = require('mocha');
var test = require('../lib/test.js');
require('../index.js');

test.runAll(mocha);
