'use strict';

var _ = require('lodash');
var symbols = require('./compiler').symbols;

//----------------------------------------------------------------------------
// Combinators

var combinators = {};

_.each(symbols, function (symbol) {
    if (_.isString(symbol)) {
        combinators[symbol] = symbol;
    }
});

[
    'APP', 'COMP', 'JOIN', 'RAND', 'QUOTE', 'VAR'
]
.forEach(function (name) {
    combinators[name] = symbols[name];
});

//----------------------------------------------------------------------------
// Lambda Calculus

var lambda = {};

[
    'HOLE', 'TOP', 'BOT',
    'I', //'K', 'B', 'C', 'W', 'S', 'Y', 'U', 'V', 'P', 'A', 'J', 'R',
    'VAR', 'APP', 'COMP', 'LAMBDA', 'LETREC', 'JOIN', 'RAND',
    'QUOTE', 'QLESS', 'QNLESS', 'QEQUAL', 'LESS', 'NLESS', 'EQUAL',
    'ASSERT', 'DEFINE', 'CURSOR',
]
.forEach(function (name) {
    lambda[name] = symbols[name];
});

module.exports = {
    combinators: combinators,
    lambda: lambda,
};
