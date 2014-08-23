'use strict';

var _ = require('underscore');
var test = require('./test');
var assert = require('./assert');
var template = require('./template');
var compiler = require('./compiler');

var templates = {
    HOLE: template('?'),
    TOP: template('T'),
    BOT: template('_'),
    I: template('1'),
    VAR: template('{0}'),
    APP: template('{0} {1}'),
    COMP: template('{0}*{1}'),
    JOIN: template('{0}|{1}'),
    RAND: template('({0}+{1})'),
    LAMBDA: template('\\ {0} {1}'),
    LETREC: template('let {0} = {1}. {2}'),
    PAREN: template('({0})'),
    QUOTE: template('{{0}}'),
    LESS: template('{{0} [= {1}}'),
    NLESS: template('{{0} [!= {1}}'),
    EQUAL: template('{{0} = {1}}'),
    DEFINE: template('Define {0} = {1}.'),
    ASSERT: template('Assert {0}.'),
    CURSOR: template('[{0}]')
};

var print = compiler.fold(function (token, args) {
    return templates[token](args);
});

var pretty = function (term) {
    return print(compiler.parenthesize(term));
};

test('pretty', function () {
    var examples = [
        ['LAMBDA VAR a VAR a', '\\ a a'],
        ['APP APP VAR a VAR b VAR c', 'a b c'],
        ['APP VAR a APP VAR b VAR c', 'a (b c)']
    ];
    assert.forward(_.compose(pretty, compiler.load), examples);
});

module.exports = pretty;
