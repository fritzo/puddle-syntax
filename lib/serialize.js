'use strict';

var _ = require('lodash');
var assert = require('./assert');

var parser = function () {

    var parseSymbol = {};

    var symbolParser = function (name, arity) {
        if (arity === 0) {
            return function () {
                return name;
            };
        } else {
            return function (parser) {
                var parsed = [name];
                for (var i = 0; i < arity; ++i) {
                    parsed.push(parser.parse());
                }
                return parsed;
            };
        }
    };

    var Parser = function (tokens) {
        if (_.isString(tokens)) {
            tokens = tokens.split(' ');
        }
        this.tokens = tokens;
        this.pos = 0;
    };

    Parser.prototype.pop = function () {
        return this.tokens[this.pos++];
    };

    Parser.prototype.parse = function () {
        var head = this.pop();
        var parser = parseSymbol[head];
        assert(parser !== undefined, 'unrecognized token: ' + head);
        return parser(this);
    };

    var parse = function (string) {
        var parser = new Parser(string);
        return parser.parse();
    };

    parse.declareSymbol = function (name, arity, parser) {
        assert(
            parseSymbol[name] === undefined,
            'duplicate symbol: ' + name);
        parseSymbol[name] = parser || symbolParser(name, arity);
    };

    return parse;
};

var printer = function () {
    var pushTokens = function (tokens, expr) {
        if (_.isString(expr)) {
            tokens.push(expr);
        } else {
            tokens.push(expr[0]);
            for (var i = 1; i < expr.length; ++i) {
                pushTokens(tokens, expr[i]);
            }
        }
    };
    return function (expr) {
        var tokens = [];
        pushTokens(tokens, expr);
        return tokens.join(' ');
    };
};

module.exports = {
    parser: parser,
    printer: printer,
};
