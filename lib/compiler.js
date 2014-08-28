/* jshint unused: false */
'use strict';

var _ = require('underscore');
var assert = require('./assert');
var test = require('./test').suite('compiler');
var TODO = require('./TODO');
var pattern = require('./pattern');

//--------------------------------------------------------------------------
// Parse

var parse = (function () {

    var parseSymbol = {};

    var symbolParser = function (name, arity) {
        if (arity === 0) {
            return function (parser) {
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
})();

var parseLine = function (line) {
    var name = line.name;
    var body = parse(line.code);
    if (name !== null) {
        return DEFINE(VAR(name), body);
    } else {
        return ASSERT(body);
    }
};

//--------------------------------------------------------------------------
// Serialize

var print = (function () {
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
})();

test('parse', function () {
    var examples = [
        'VAR x',
        'QUOTE APP LAMBDA CURSOR VAR x VAR x HOLE',
        'LETREC VAR i LAMBDA VAR x VAR x APP VAR i VAR i',
    ];
    assert.inverses(parse, print, examples);
});

var printLine = function (term) {
    var token = term[0];
    if (token === 'ASSERT') {
        return {
            token: null,
            code: print(term[1])
        };
    } else if (token === 'DEFINE') {
        return {
            name: term[1][1],
            code: print(term[2])
        };
    }
};

//--------------------------------------------------------------------------
// Symbols

var symbols = {};
var newSymbol = function (token, arity, parser) {
    arity = arity || 0;
    parse.declareSymbol(token, arity, parser);
    var symbol;
    if (arity === 0) {
        symbol = token;
    } else {
        var errorMessage = token +
            '(...) called with wrong number of arguments';
        symbol = function () {
            assert.equal(arguments.length, arity, errorMessage);
            return [token].concat(_.toArray(arguments));
        };
        symbol.token = token;
        symbol.arity = arity;
    }
    symbols[token] = symbol;
    return symbol;
};

var TOP = newSymbol('TOP');
var BOT = newSymbol('BOT');
var I = newSymbol('I');
var K = newSymbol('K');
var B = newSymbol('B');
var C = newSymbol('C');
var CI = newSymbol('CI');
var CB = newSymbol('CB');
var W = newSymbol('W');
var S = newSymbol('S');
var Y = newSymbol('Y');
var U = newSymbol('U');
var V = newSymbol('V');
var P = newSymbol('P');
var A = newSymbol('A');
var J = newSymbol('J');
var R = newSymbol('R');
var QLESS = newSymbol('QLESS');
var QNLESS = newSymbol('QNLESS');
var QEQUAL = newSymbol('QEQUAL');
var HOLE = newSymbol('HOLE');
var PAREN = newSymbol('PAREN', 1);
var QUOTE = newSymbol('QUOTE', 1);
var CURSOR = newSymbol('CURSOR', 1);
var ASSERT = newSymbol('ASSERT', 1);
var VAR = newSymbol('VAR', 1, function (tokens) {
    var name = tokens.pop();
    return ['VAR', name];
});
var APP = newSymbol('APP', 2);
var COMP = newSymbol('COMP', 2);
var JOIN = newSymbol('JOIN', 2);
var RAND = newSymbol('RAND', 2);
var LAMBDA = newSymbol('LAMBDA', 2);
var DEFINE = newSymbol('DEFINE', 2);
var STACK = newSymbol('STACK', 2);
var LETREC = newSymbol('LETREC', 3);
var LESS = newSymbol('LESS', 2);
var NLESS = newSymbol('NLESS', 2);
var EQUAL = newSymbol('EQUAL', 2);

var app = function (term) {
    for (var i = 1; i < arguments.length; ++i) {
        term = ['APP', term, arguments[i]];
    }
    return term;
};

test('app', function () {
    assert.equal(
        app('w', 'x', 'y', 'z'),
        APP(APP(APP('w', 'x'), 'y'), 'z'));
});

var comp = function (term) {
    for (var i = 1; i < arguments.length; ++i) {
        term = ['COMP', term, arguments[i]];
    }
    return term;
};

test('comp', function () {
    assert.equal(comp('x', 'y'), COMP('x', 'y'));
    assert.equal(comp('x', 'y', 'z'), COMP(COMP('x', 'y'), 'z'));
});

var stack = (function () {
    var pop = Array.prototype.pop;
    return function () {
        var tail = pop.call(arguments);
        while (arguments.length) {
            tail = ['STACK', pop.call(arguments), tail];
        }
        return tail;
    };
})();

test('stack', function () {
    assert.equal(
        stack('x', 'y', 'z', []),
        STACK('x', STACK('y', STACK('z', []))));
});

//----------------------------------------------------------------------------
// Fragments

var fragments = (function () {

    var combinators = {};
    var fragments = {
        combinators: combinators,
    };

    _.each(symbols, function (symbol) {
        if (_.isString(symbol)) {
            combinators[symbol] = symbol;
        }
    });

    combinators.APP = APP;
    combinators.COMP = COMP;
    combinators.JOIN = JOIN;
    combinators.RAND = RAND;
    combinators.QUOTE = QUOTE;
    combinators.VAR = VAR;

    return fragments;
})();

//--------------------------------------------------------------------------
// Conversion : appTree <-> code

var definitions = {};
definitions.CI = app(C, I);
definitions.CB = app(C, B);
definitions.U = comp(Y, comp(app(S, B), app(J, app(C, B, I)), app(C, B)));
definitions.V = comp(definitions.U, app(J, I));
definitions.P = comp(app(B, definitions.V), J);
definitions.A = HOLE;  // TODO define

//--------------------------------------------------------------------------
// Convert : appTree <-> stack

var toStack = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var tail = pattern.variable('tail');
    var t = pattern.match(
        app(x, y), function (match, tail) {
            return t(match.x, stack(match.y, tail));
        },
        x, function (match, tail) {
            return stack(match.x, tail);
        }
    );
    var pop = Array.prototype.pop;
    var head = 'STACK';
    return function (appTree) {
        var tail;
        if (arguments.length === 1) {
            tail = [];
        } else {
            tail = pop.call(arguments);
        }
        while (arguments.length > 1) {
            tail = [head, pop.call(arguments), tail];
        }
        return t(appTree, tail);
    };
})();

var fromStack = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var tail = pattern.variable('tail');
    var t = pattern.match(
        stack(x, y, tail), function (match) {
            return t(stack(app(match.x, match.y), match.tail));
        },
        stack(x, []), function (match) {
            return match.x;
        }
    );
    return t;
})();

test('toStack, fromStack', function () {
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var examples = [
        [I, stack(I, [])],
        [app(x, y), stack(x, y, [])],
        [app(x, y, z), stack(x, y, z, [])],
        [app(S, app(K, x), y, z), stack(S, app(K, x), y, z, [])]
    ];
    assert.forward(toStack, examples);
    assert.backward(fromStack, examples);
});

//--------------------------------------------------------------------------
// Simplify :   stack -> simple stack
//
// Implements affine-beta-eta-alpha reduction for lambda-letrec terms.

var fresh = (function () {
    var alphabet = 'abcdefghijklmnopqrstuvwxyz';
    var count = 0;
    var enumerate = function (i) {
        var name = alphabet[i % alphabet.length];
        var number = Math.floor(i / alphabet.length);
        if (number > 0) {
            name += number;
        }
        return name;
    };
    var fresh = function () {
        var name = enumerate(count);
        count += 1;
        return VAR(name);
    };
    fresh.reset = function () {
        count = 0;
    };
    fresh.enumerate = enumerate;
    return fresh;
})();

var normalizeAlpha = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var z = pattern.variable('z');
    var string = pattern.variable('string');
    var array = pattern.variable('array', _.isArray);

    var renamePattern = pattern.match(
        VAR(string), function (match, map) {
            assert(!_.has(map, match.string));
            var result = fresh();
            map[match.string] = result[1];
            return result;
        },
        array, function (match, map) {
            var array = [].concat(match.array);
            for (var i = 1; i < array.length; ++i) {
                array[i] = renamePattern(array[i], map);
            }
            return array;
        }
    );

    var renameTerm = pattern.match(
        VAR(string), function (match, map) {
            return VAR(map[match.string] || match.string);
        },
        LAMBDA(x, y), function (match, map) {
            map = _.extend({}, map);
            var x = renamePattern(match.x, map);
            var y = renameTerm(match.y, map);
            return LAMBDA(x, y);
        },
        LETREC(x, y, z), function (match, map) {
            map = _.extend({}, map);
            var x = renamePattern(match.x, map);
            var y = renameTerm(match.y, map);
            var z = renameTerm(match.z, map);
            return LETREC(x, y, z);
        },
        array, function (match, map) {
            var array = [].concat(match.array);
            for (var i = 1; i < array.length; ++i) {
                array[i] = renameTerm(array[i], map);
            }
            return array;
        },
        string, function (match) {
            return match.string;
        }
    );

    return function (term) {
        fresh.reset();
        return renameTerm(term, {});
    };
})();

test('normalizeAlpha', function () {
    var a = VAR('a');
    var b = VAR('b');
    var c = VAR('c');
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var examples = [
        [x, x],
        [LAMBDA(x, x), LAMBDA(a, a)],
        [LETREC(x, y, x), LETREC(a, y, a)],
        [app(LAMBDA(x, x), LETREC(x, x, x)),
          app(LAMBDA(a, a), LETREC(b, b, b))],
        [app(LAMBDA(x, x), x), app(LAMBDA(a, a), x)]
    ];
    assert.forward(normalizeAlpha, examples);
});

var substitute = (function () {
    var string = pattern.variable('string');
    var array = pattern.variable('array', _.isArray);

    var t = pattern.match(
        VAR(string), function (match, varName, def) {
            return match.string === varName ? def : VAR(match.string);
        },
        // TODO take care with binders,
        // or ensure variables are globally unique
        array, function (match, varName, def) {
            var array = [].concat(match.array);
            for (var i = 1; i < array.length; ++i) {
                array[i] = t(array[i], varName, def);
            }
            return array;
        },
        string, function (match) {
            return match.string;
        }
    );

    return function (varName, def, body) {
        return t(body, varName, def);
    };
})();

test('substitute', function () {
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var fun = function (args) {
        return substitute.apply(null, args);
    };
    var examples = [
        [['x', y, z], z],
        [['x', y, x], y],
        [['x', app(x, y, z), app(x, y, z)], app(app(x, y, z), y, z)],
        [['x', z, LAMBDA(y, app(x, y))], LAMBDA(y, app(z, y))]
    ];
    assert.forward(fun, examples);
});

var simplifyLetrec = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var name = pattern.variable('name');
    var array = pattern.variable('array', _.isArray);
    var notFound = {};

    var t = pattern.match(
        VAR(name), function (match, varName, def) {
            if (match.name !== varName) {
                return notFound;
            } else if (countOccurrences(varName, def) === 0) {
                return def;
            } else {
                return LETREC(VAR(varName), def, VAR(varName));
            }
        },
        APP(x, y), function (match, varName, def) {
            var tx = t(match.x, varName, def);
            var ty = t(match.y, varName, def);
            if (tx === notFound) {
                if (ty === notFound) {
                    // unused
                    return APP(match.x, match.y);
                } else {
                    // narrow scope
                    return APP(match.x, ty);
                }
            } else {
                if (ty === notFound) {
                    // narrow scope
                    return APP(tx, match.y);
                } else {
                    // no-op
                    return LETREC(VAR(varName), def, APP(match.x, match.y));
                }
            }
        },
        x, function (match) {
            TODO('handle ' + JSON.stringify(match.x));
        }
    );

    return function (varName, def, body) {
        return t(body, varName, def);
    };
})();

var countOccurrences = (function () {
    var string = pattern.variable('string');
    var array = pattern.variable('array', _.isArray);

    var t = pattern.match(
        VAR(string), function (match, varName) {
            return match.string === varName ? 1 : 0;
        },
        array, function (match, varName) {
            var array = match.array;
            var result = 0;
            for (var i = 1; i < array.length; ++i) {
                result += t(array[i], varName);
            }
            return result;
        },
        string, function () {
            return 0;
        }
    );

    return function (varName, body) {
        return t(body, varName);
    };
})();

test('countOccurrences', function () {
    var x = VAR('x');
    var y = VAR('y');
    var fun = function (args) {
        return countOccurrences.apply(null, args);
    };
    var examples = [
        [['x', x], 1],
        [['x', y], 0],
        [['x', I], 0],
        [['x', app(y, y)], 0],
        [['x', app(x, y)], 1],
        [['x', app(x, x, x, y, x)], 4]
    ];
    assert.forward(fun, examples);
});

var normalizeAffineBetaEta = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var z = pattern.variable('z');
    var name = pattern.variable('name');
    var name2 = pattern.variable('name2');
    var tail = pattern.variable('tail');
    var array = pattern.variable('array', _.isArray);

    var normalizeStack = pattern.match(
        stack(TOP, tail), function (match) {
            return TOP;
        },
        stack(BOT, tail), function (match) {
            return BOT;
        },
        stack(JOIN(TOP, x), tail), function () {
            return TOP;
        },
        stack(JOIN(x, TOP), tail), function () {
            return TOP;
        },
        stack(JOIN(BOT, x), tail), function (match) {
            return normalizeStack(toStack(match.x, match.tail));
        },
        stack(JOIN(x, BOT), tail), function (match) {
            return normalizeStack(toStack(match.x, match.tail));
        },
        stack(LAMBDA(VAR(name), app(x, VAR(name2))), tail), function (match) {
            if (match.name === match.name2 &&
                    countOccurrences(match.name, match.x) === 0)
            {
                    return normalizeStack(stack(match.x, match.tail));
            }
        },
        stack(LAMBDA(VAR(name), x), VAR(name2), tail), function (match) {
            var head = substitute(match.name, VAR(match.name2), match.x);
            return normalizeStack(toStack(head, match.tail));
        },
        stack(LAMBDA(VAR(name), x), y, tail), function (match) {
            var head;
            var tail;
            switch (countOccurrences(match.name, match.x)) {
                case 0:
                    return normalizeStack(toStack(match.x, match.tail));
                case 1:
                    head = substitute(match.name, match.y, match.x);
                    return normalizeStack(toStack(head, match.tail));
                default:
                    head = LAMBDA(VAR(match.name), match.x);
                    tail = normalizeTail(stack(match.y, match.tail));
                    return fromStack(stack(head, tail));
            }
        },
        // TODO implement LETREC simplification
        //stack(LETREC(VAR(name), x, y), tail), function (match) {
        //  var head = normalizeLetrec(match.name. match.x, match.y);
        //  var tail = normalizeTail(tail);
        //  return fromStack(stack(head, tail));
        //},
        stack(x, tail), function (match) {
                return fromStack(stack(match.x, normalizeTail(match.tail)));
        }
    );

    var normalizeTail = pattern.match(
        [], function () {
            return [];
        },
        stack(x, y), function (match) {
            var tx = normalize(match.x);
            var ty = normalizeTail(match.y);
            return stack(tx, ty);
        }
    );

    var normalize = function (term) {
        return normalizeStack(toStack(term));
    };

    return normalize;
})();

test('normalizeAffineBetaEta', function () {
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var xx = app(x, x);
    var yy = app(y, y);
    var yz = app(y, z);
    var examples = [
        [x, x],
        [app(TOP, x, y, z), TOP],
        [app(BOT, x, y, z), BOT],
        [JOIN(TOP, x), TOP],
        [JOIN(x, TOP), TOP],
        [JOIN(BOT, x), x],
        [JOIN(x, BOT), x],
        [app(LAMBDA(x, app(y, x)), app(y, z)), app(y, app(y, z))],
        [app(LAMBDA(x, app(x, x)), y), app(y, y)],
        [app(LAMBDA(x, app(x, x)), app(y, z)),
          app(LAMBDA(x, app(x, x)), app(y, z))],
        [LAMBDA(x, app(y, x)), y],
        [LAMBDA(x, app(x, x)), LAMBDA(x, app(x, x))],
        [HOLE, HOLE],
        [app(HOLE, x, app(TOP, y)), app(HOLE, x, TOP)]
    ];
    assert.forward(normalizeAffineBetaEta, examples);
});

var simplify = function (term) {
    term = normalizeAffineBetaEta(term);
    term = normalizeAlpha(term);
    return term;
};

//--------------------------------------------------------------------------
// Convert : simple appTree -> lambda

var lambdaSymbols = (function () {
    var subset = [
        'HOLE', 'TOP', 'BOT',
        'I', //'K', 'B', 'C', 'W', 'S', 'Y', 'U', 'V', 'P', 'A', 'J', 'R',
        'VAR', 'APP', 'COMP', 'LAMBDA', 'LETREC', 'JOIN', 'RAND',
        'QUOTE', 'QLESS', 'QNLESS', 'QEQUAL', 'LESS', 'NLESS', 'EQUAL',
        'ASSERT', 'DEFINE', 'CURSOR',
    ];
    var lambdaSymbols = {};
    subset.forEach(function (name) {
        lambdaSymbols[name] = symbols[name];
    });
    return lambdaSymbols;
})();

var decompile = (function () {

    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var z = pattern.variable('z');
    var head = pattern.variable('head');
    var tail = pattern.variable('tail');
    var name = pattern.variable('name');
    var array = pattern.variable('array', _.isArray);
    var atom = pattern.variable('atom', function (struct) {
        return _.isString(struct) && _.has(definitions, struct);
    });

    var ensureVar = function (v, handler) {
        var name = v.name;
        return function (match) {
            var tail = match.tail;
            if (tail.length === 0) {
                var v = fresh();
                match[name] = v;
                return LAMBDA(v, handler(match));
            } else {
                match[name] = decompile(tail[1]);  // FIXME,
                // incorrect decompile call
                match.tail = tail[2];
                return handler(match);
            }
        };
    };

    var ensure = function () {
        var pop = Array.prototype.pop;
        var handler = pop.call(arguments);
        while (arguments.length) {
            handler = ensureVar(pop.call(arguments), handler);
        }
        return function (match) {
            var head = handler(match);
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        };
    };

    var decompileStack = pattern.match(
        stack(COMP(x, y), tail), function (match) {
            return decompileStack(stack(B, match.x, match.y, match.tail));
        },
        stack(HOLE, tail), function (match) {
            return fromStack(stack(HOLE, decompileTail(match.tail)));
        },
        stack(TOP, tail), function () {
            return TOP;
        },
        stack(BOT, tail), function () {
            return BOT;
        },
        // TODO fix ensure() to simplify cases
        //stack(K, tail), ensure(x, y, function (match) {
        //  return match.x;
        //}),
        //stack(C, I, tail), ensure(x, y, function (match) {
        //  return app(match.y, match.x);
        //}),
        //stack(B, tail), ensure(x, y, z, function (match) {
        //  return app(match.x, app(match.y, match.z));
        //}),
        //stack(C, tail), ensure(x, y, z, function (match) {
        //  return app(match.x, match.z, match.y);
        //}),
        stack(I, []), function (match) {
            var x = fresh();
            return LAMBDA(x, x);
        },
        stack(I, x, tail), function (match) {
            return decompileStack(toStack(match.x, match.tail));
        },
        stack(K, []), function (match) {
            var x = fresh();
            var y = fresh();
            return LAMBDA(x, LAMBDA(y, x));
        },
        stack(K, x, []), function (match) {
            var y = fresh();
            var tx = decompileStack(toStack(match.x));
            return LAMBDA(y, tx);
        },
        stack(K, x, y, tail), function (match) {
            return decompileStack(toStack(match.x, match.tail));
        },
        stack(B, []), function () {
            var x = fresh();
            var y = fresh();
            var z = fresh();
            return LAMBDA(x, LAMBDA(y, LAMBDA(z, app(x, app(y, z)))));
        },
        stack(B, x, []), function (match) {
            var y = fresh();
            var z = fresh();
            var xyz = decompileStack(toStack(match.x, app(y, z), []));
            return LAMBDA(y, LAMBDA(z, xyz));
        },
        stack(B, x, y, []), function (match) {
            var z = fresh();
            var xyz = decompileStack(toStack(match.x, app(match.y, z), []));
            return LAMBDA(z, xyz);
        },
        stack(B, x, y, z, tail), function (match) {
            return decompileStack(
                toStack(match.x, app(match.y, match.z), match.tail));
        },
        stack(C, []), function () {
            var x = fresh();
            var y = fresh();
            var z = fresh();
            return LAMBDA(x, LAMBDA(y, LAMBDA(z, app(x, z, y))));
        },
        stack(C, x, []), function (match) {
            var y = fresh();
            var z = fresh();
            var xzy = decompileStack(toStack(match.x, z, y, []));
            return LAMBDA(y, LAMBDA(z, xzy));
        },
        stack(C, x, y, []), function (match) {
            var z = fresh();
            var xzy = decompileStack(toStack(match.x, z, match.y, []));
            return LAMBDA(z, xzy);
        },
        stack(C, x, y, z, tail), function (match) {
            return decompileStack(
                toStack(match.x, match.z, match.y, match.tail));
        },
        stack(W, []), function () {
            var x = fresh();
            var y = fresh();
            return LAMBDA(x, LAMBDA(y, app(x, y, y)));
        },
        stack(W, x, []), function (match) {
            var y = fresh();
            var tx = decompile(match.x);
            return LAMBDA(y, app(tx, y, y));
        },
        stack(W, x, VAR(name), tail), function (match) {
            var y = VAR(match.name);
            var head = decompile(app(match.x, y, y));
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(W, x, y, tail), function (match) {
            var y = fresh();
            var ty = decompile(match.y);
            var head = LETREC(y, ty, decompile(app(match.x, y, y)));
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(S, []), function () {
            var x = fresh();
            var y = fresh();
            var z = fresh();
            return LAMBDA(x, LAMBDA(y, LAMBDA(z, app(x, z, app(y, z)))));
        },
        stack(S, x, []), function (match) {
            var y = fresh();
            var z = fresh();
            var tx = decompile(match.x);
            return LAMBDA(y, LAMBDA(z, app(tx, z, app(y, z))));
        },
        stack(S, x, y, []), function (match) {
            var z = fresh();
            var tx = decompile(match.x);
            var ty = decompile(match.y);
            return LAMBDA(z, app(tx, z, app(ty, z)));
        },
        stack(S, x, y, VAR(name), tail), function (match) {
            var z = VAR(match.name);
            var head = decompile(app(match.x, z, app(match.y, z)));
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(S, x, y, z, tail), function (match) {
            var z = fresh();
            var tz = decompile(match.z);
            var xz = app(match.x, z);
            var yz = app(match.y, z);
            var head = LETREC(z, tz, decompile(app(xz, yz)));
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(Y, tail), ensure(x, function (match) {
            var y = fresh();
            var z = fresh();
            return LETREC(y, LAMBDA(z, app(match.x, app(y, z))), y);
        }),
        stack(J, tail), ensure(x, y, function (match) {
            return JOIN(match.x, match.y);
        }),
        stack(R, tail), ensure(x, y, function (match) {
            return RAND(match.x, match.y);
        }),
        // TODO reimplement via ensureQuoted
        stack(QLESS, []), function (match) {
            var x = fresh();
            var y = fresh();
            return LAMBDA(QUOTE(x), LAMBDA(QUOTE(y), LESS(x, y)));
        },
        stack(QLESS, QUOTE(x), []), function (match) {
            var y = fresh();
            return LAMBDA(QUOTE(y), LESS(match.x, y));
        },
        stack(QLESS, x, []), function (match) {
            var x = fresh();
            var y = fresh();
            return LETREC(QUOTE(x), match.x, LAMBDA(QUOTE(y), LESS(x, y)));
        },
        // ... other cases omitted: (QUOTE(x), y); (x, QUOTE(y))
        stack(QLESS, QUOTE(x), QUOTE(y), tail), function (match) {
            var head = LESS(match.x, match.y);
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(QLESS, x, y, tail), function (match) {
            var x = fresh();
            var y = fresh();
            var head =
                LETREC(QUOTE(x), match.x,
                LETREC(QUOTE(y), match.y, LESS(x, y)));
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(QNLESS, QUOTE(x), QUOTE(y), tail), function (match) {
            var head = NLESS(match.x, match.y);
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(QEQUAL, QUOTE(x), QUOTE(y), tail), function (match) {
            var head = EQUAL(match.x, match.y);
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(VAR(name), tail), function (match) {
            var head = VAR(match.name);
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        },
        stack(atom, tail), function (match) {
            var head = definitions[match.atom];
            return decompileStack(toStack(head, match.tail));
        },
        stack(array, tail), function (match) {
            var head = match.array;
            assert(_.isString(head[0]));
            head = [].concat(head);
            for (var i = 1; i < head.length; ++i) {
                head[i] = decompile(head[i]);
            }
            var tail = decompileTail(match.tail);
            return fromStack(stack(head, tail));
        }
    );

    var decompileTail = pattern.match(
        [], function () {
            return [];
        },
        stack(x, y), function (match) {
            var tx = decompile(match.x);
            var ty = decompileTail(match.y);
            return stack(tx, ty);
        }
    );

    var decompile = function (code) {
        return decompileStack(toStack(code));
    };

    return function (code) {
        fresh.reset();
        var term = decompile(code);
        term = simplify(term);
        return term;
    };
})();

//--------------------------------------------------------------------------
// Abstract : varName -> simple appTree -> simple appTree

var tryAbstract = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var name = pattern.variable('name');
    var notFound = {};

    var t = pattern.match(
        VAR(name), function (match, varName) {
            if (match.name !== varName) {
                return notFound;
            } else {
                return I;
            }
        },
        APP(x, VAR(name)), function (match, varName) {
            var tx = t(match.x, varName);
            if (tx === notFound) {
                if (match.name !== varName) {
                    return notFound;
                } else {
                    return match.x;
                }
            } else {
                if (match.name !== varName) {
                    return app(C, tx, VAR(match.name));
                } else {
                    return app(W, tx);
                }
            }
        },
        APP(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound) {
                if (ty === notFound) {
                    return notFound;
                } else {
                    return comp(match.x, ty);
                }
            } else {
                if (ty === notFound) {
                    return app(C, tx, match.y);
                } else {
                    return app(S, tx, ty);
                }
            }
        },
        COMP(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound) {
                if (ty === notFound) {
                    return notFound;
                } else {
                    if (_.isEqual(match.y, VAR(varName))) {
                        return app(B, match.x);
                    } else {
                        return comp(app(B, match.x), ty);
                    }
                }
            } else {
                if (ty === notFound) {
                    return comp(app(CB, match.y), tx);
                } else {
                    return app(S, app(B, tx), ty);
                }
            }
        },
        JOIN(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound) {
                if (ty === notFound) {
                    return notFound;
                } else {
                    // this hack will be obsoleted by simplifyLambda
                    if (ty === I) {                     // HACK
                        return app(J, match.x);           // HACK
                    } else {                            // HACK
                        return comp(app(J, match.x), ty);
                    }                                   // HACK
                }
            } else {
                if (ty === notFound) {
                    return comp(app(J, match.y), tx);
                } else {
                    return JOIN(tx, ty);
                }
            }
        },
        RAND(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound) {
                if (ty === notFound) {
                    return notFound;
                } else {
                    return comp(app(R, match.x), ty);
                }
            } else {
                if (ty === notFound) {
                    return comp(app(R, match.y), tx);
                } else {
                    return RAND(tx, ty);
                }
            }
        },
        QUOTE(x), function (match, varName) {
            var tx = t(match.x, varName);
            if (tx === notFound) {
                return notFound;
            } else {
                TODO('implement quoted tryAbstraction');
            }
        },
        LESS(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound && ty === notFound) {
                return notFound;
            } else {
                TODO('implement quoted tryAbstraction');
            }
        },
        NLESS(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound && ty === notFound) {
                return notFound;
            } else {
                TODO('implement quoted tryAbstraction');
            }
        },
        EQUAL(x, y), function (match, varName) {
            var tx = t(match.x, varName);
            var ty = t(match.y, varName);
            if (tx === notFound && ty === notFound) {
                return notFound;
            } else {
                TODO('implement quoted tryAbstraction');
            }
        },
        x, function () {
            return notFound;
        }
    );

    t.notFound = notFound;

    return t;
})();

var compileLambda = function (varName, body) {
    var result = tryAbstract(body, varName);
    if (result === tryAbstract.notFound) {
        return app(K, body);
    } else {
        return result;
    }
};

test('compileLambda', function () {
    var a = VAR('a');
    var x = VAR('x');
    var y = VAR('y');
    var lambdaA = _.partial(compileLambda, 'a');
    var examples = [
        [a, I],
        [app(x, a), x],
        [app(x, a, a), app(W, x)],
        [app(y, app(x, a)), COMP(y, x)],
        [app(x, a, y), app(C, x, y)],
        [app(x, a, app(x, a)), app(S, x, x)],
        [x, app(K, x)]
    ];
    assert.forward(lambdaA, examples);
});

var compileLetrec = function (varName, def, body) {
    var bodyResult = tryAbstract(body, varName);
    if (bodyResult === tryAbstract.notFound) {
        return body;
    } else {
        var defResult = tryAbstract(def, varName);
        if (defResult === tryAbstract.notFound) {
            return app(bodyResult, def);
        } else {
            return app(bodyResult, app(Y, defResult));
        }
    }
};

test('compileLetrec', function () {
    var a = VAR('a');
    var x = VAR('x');
    var y = VAR('y');
    var letrecA = function (pair) {
        var def = pair[0];
        var body = pair[1];
        return compileLetrec('a', def, body);
    };
    var examples = [
        [['bomb', x], x],
        [[I, app(x, a)], app(x, I)],
        [[a, app(x, a)], app(x, app(Y, I))],
        [[app(y, a), app(x, a)], app(x, app(Y, y))]
    ];
    assert.forward(letrecA, examples);
});

var compile = (function () {
    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var z = pattern.variable('z');
    var name = pattern.variable('name');

    var t = pattern.match(
        VAR(name), function (match) {
            return VAR(match.name);
        },
        LAMBDA(VAR(name), x), function (match) {
            return compileLambda(match.name, t(match.x));
        },
        LETREC(VAR(name), x, y), function (match) {
            return compileLetrec(match.name, t(match.x), t(match.y));
        },
        x, function (match) {
            var x = match.x;
            if (_.isString(x)) {
                return x;
            } else {
                assert(_.isArray(x), x);
                var result = [x[0]];
                for (var i = 1; i < x.length; ++i) {
                    result.push(t(x[i]));
                }
                return result;
            }
        }
    );

    return t;
})();

test('decompile, compile', function () {
    var a = VAR('a');
    var b = VAR('b');
    var c = VAR('c');
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var xy = app(x, y);  // just something that is not a variable
    var examples = [
        [COMP(x, y), LAMBDA(a, app(x, app(y, a)))],
        [TOP, TOP],
        [BOT, BOT],
        [I, LAMBDA(a, a)],
        [K, LAMBDA(a, LAMBDA(b, a))],
        [app(K, x), LAMBDA(a, x)],
        [app(C, I), LAMBDA(a, LAMBDA(b, app(b, a)))],
        [app(C, I, x), LAMBDA(a, app(a, x))],
        [B, LAMBDA(a, LAMBDA(b, LAMBDA(c, app(a, app(b, c)))))],
        [app(B, x), LAMBDA(a, LAMBDA(b, app(x, app(a, b))))],
        [C, LAMBDA(a, LAMBDA(b, LAMBDA(c, app(a, c, b))))],
        [app(C, x), LAMBDA(a, LAMBDA(b, app(x, b, a)))],
        [app(C, x, y), LAMBDA(a, app(x, a, y))],
        [W, LAMBDA(a, LAMBDA(b, app(a, b, b)))],
        [app(W, x), LAMBDA(a, app(x, a, a))],
        [app(W, x, xy), LETREC(a, xy, app(x, a, a))],
        [S, LAMBDA(a, LAMBDA(b, LAMBDA(c, app(a, c, app(b, c)))))],
        [app(S, x), LAMBDA(a, LAMBDA(b, app(x, b, app(a, b))))],
        [app(S, x, y), LAMBDA(a, app(x, a, app(y, a)))],
        [app(S, x, y, xy), LETREC(a, xy, app(x, a, app(y, a)))],
        [J, LAMBDA(a, LAMBDA(b, JOIN(a, b)))],
        [app(J, x), LAMBDA(a, JOIN(x, a))],
        // TODO add these after simplifyLambda works
        //[app(J, x, y), JOIN(x, y)],
        //[app(J, x, y, I), app(JOIN(x, y), LAMBDA(a, a))],
        //[R, LAMBDA(a, LAMBDA(b, RAND(a, b)))],
        //[app(R, x), LAMBDA(a, RAND(x, a))],
        //[app(R, x, y), RAND(x, y)],
        //[app(R, x, y, I), app(RAND(x, y), LAMBDA(a, a))],
        [QUOTE(K), QUOTE(LAMBDA(a, LAMBDA(b, a)))],
        [app(QUOTE(x), K), app(QUOTE(x), LAMBDA(a, LAMBDA(b, a)))],
        [LESS(x, y), LESS(x, y)],
        [NLESS(x, y), NLESS(x, y)],
        [EQUAL(x, y), EQUAL(x, y)],
        [VAR(x), VAR(x)],
        [app(VAR(x), K), app(VAR(x), LAMBDA(a, LAMBDA(b, a)))],
        [HOLE, HOLE]
    ];
    assert.forward(decompile, examples);
    assert.backward(compile, examples);
});

test('decompile', function () {
    // compile would fail these because they involve pattern matching
    var a = VAR('a');
    var b = VAR('b');
    var c = VAR('c');
    var x = VAR('x');
    var y = VAR('y');
    var z = VAR('z');
    var xy = app(x, y);  // just something that is not a variable
    var k = LAMBDA(a, LAMBDA(b, a));
    var examples = [
        [app(B, x, y), LAMBDA(a, app(x, app(y, a)))],
        [app(C, x, y, z), app(x, z, y)],
        [comp(C, app(C, I)), LAMBDA(a, LAMBDA(b, LAMBDA(c, app(c, a, b))))],
        [app(W, x, y), app(x, y, y)],
        [app(W, x, y, K), app(x, y, y, k)],
        [app(S, x, y, z), app(x, z, app(y, z))],
        [app(S, x, y, z, K), app(x, z, app(y, z), k)],
        [Y, LAMBDA(a, LETREC(b, LAMBDA(c, app(a, app(b, c))), b))],
        [app(QLESS, QUOTE(x), QUOTE(y)), LESS(x, y)],
        [app(QNLESS, QUOTE(x), QUOTE(y)), NLESS(x, y)],
        [app(QEQUAL, QUOTE(x), QUOTE(y)), EQUAL(x, y)],
        // TODO move this back above
        [app(J, x, y), JOIN(x, y)],
        [app(J, x, y, K), app(JOIN(x, y), k)],
        [HOLE, HOLE]
    ];
    assert.forward(decompile, examples);
});

test('compile', function () {
    // decompile would fail these because input is not simple
    var a = VAR('a');
    var x = VAR('x');
    var y = VAR('y');
    var examples = [
        [LAMBDA(a, app(x, app(y, a))), COMP(x, y)],
        [app(LAMBDA(a, a), x), app(I, x)],
        [HOLE, HOLE]
    ];
    assert.forward(compile, examples);
});

//--------------------------------------------------------------------------
// Parenthesize

var parenthesize = (function () {

    var x = pattern.variable('x');
    var y = pattern.variable('y');
    var z = pattern.variable('z');
    var name = pattern.variable('name');
    var atom = pattern.variable('atom', _.isString);

    var tPatt = pattern.match(
        VAR(name), function (match) {
            return VAR(match.name);
        },
        QUOTE(x), function (match) {
            return QUOTE(tPatt(match.x));
        },
        CURSOR(x), function (match) {
            return CURSOR(tPatt(match.x));
        }
    );

    var tAtom = pattern.match(
        atom, function (match) {
            return match.atom;
        },
        VAR(name), function (match) {
            return VAR(match.name);
        },
        RAND(x, y), function (match) {
            return RAND(tInline(match.x), tInline(match.y));
        },
        QUOTE(x), function (match) {
            return QUOTE(tInline(match.x));
        },
        LESS(x, y), function (match) {
            return LESS(tJoin(match.x), tJoin(match.y));
        },
        NLESS(x, y), function (match) {
            return NLESS(tJoin(match.x), tJoin(match.y));
        },
        EQUAL(x, y), function (match) {
            return EQUAL(tJoin(match.x), tJoin(match.y));
        },
        CURSOR(x), function (match) {
            return CURSOR(tAtom(match.x));
        },
        x, function (match) {
            return PAREN(tInline(match.x));
        }
    );

    var tComp = pattern.match(
        COMP(x, y), function (match) {
            return COMP(tComp(match.x), tComp(match.y));
        },
        CURSOR(x), function (match) {
            return CURSOR(tComp(match.x));
        },
        x, function (match) {
            return tAtom(match.x);
        }
    );

    var tApp = pattern.match(
        APP(x, y), function (match) {
            return APP(tApp(match.x), tAtom(match.y));
        },
        CURSOR(x), function (match) {
            return CURSOR(tApp(match.x));
        },
        x, function (match) {
            return tComp(match.x);
        }
    );

    var tJoin = pattern.match(
        JOIN(x, y), function (match) {
            return JOIN(tJoin(match.x), tJoin(match.y));
        },
        CURSOR(x), function (match) {
            return CURSOR(tJoin(match.x));
        },
        x, function (match) {
            return tApp(match.x);
        }
    );

    var tInline = pattern.match(
        LAMBDA(x, y), function (match) {
            return LAMBDA(tPatt(match.x), tInline(match.y));
        },
        LETREC(x, y, z), function (match) {
            return LETREC(
                tPatt(match.x),
                tJoin(match.y),
                tInline(match.z));
        },
        CURSOR(x), function (match) {
            return CURSOR(tInline(match.x));
        },
        x, function (match) {
            return tJoin(match.x);
        }
    );

    var t = pattern.match(
        DEFINE(x, y), function (match) {
            return DEFINE(tAtom(match.x), tJoin(match.y));
        },
        ASSERT(x), function (match) {
            return ASSERT(tJoin(match.x));
        },
        CURSOR(x), function (match) {
            return CURSOR(t(match.x));
        },
        x, function (match) {
            return tInline(match.x);
        }
    );

    return t;
})();

//------------------------------------------------------------------------
// Folding

var fold = function (fun) {
    var array = pattern.variable('array', _.isArray);
    var string = pattern.variable('string', _.isString);

    var t = pattern.match(
        VAR(string), function (match) {
            return fun('VAR', match.string);
        },
        array, function (match) {
            var array = match.array;
            var args = [];
            for (var i = 1; i < array.length; ++i) {
                args.push(t(array[i]));
            }
            return fun(array[0], args);
        },
        string, function (match) {
            return fun(match.string, []);
        }
    );

    return t;
};

test('fold', function () {
    // TODO add tests
});

//------------------------------------------------------------------------

module.exports = {
    fragments: fragments,
    symbols: lambdaSymbols,
    load: function (string) {
        var code = parse(string);
        var term = decompile(code);
        return term;
    },
    loadLine: function (line) {
        var code = parseLine(line);
        var term = decompile(code);
        return term;
    },
    dumpLine: function (term) {
        var code = compile(term);
        var line = printLine(code);
        return line;
    },
    dump: function (term) {
        var code = compile(term);
        return print(code);
    },
    print: print,
    enumerateFresh: fresh.enumerate,
    substitute: substitute,
    parenthesize: parenthesize,
    fold: fold,
};
