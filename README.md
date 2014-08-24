[![Build Status](https://travis-ci.org/fritzo/puddle-syntax.svg?branch=master)](http://travis-ci.org/fritzo/puddle-syntax)
[![NPM Version](https://badge.fury.io/js/puddle-syntax.svg)](https://www.npmjs.org/package/puddle-syntax)
[![NPM Dependencies](https://david-dm.org/fritzo/puddle-syntax.svg)](https://www.npmjs.org/package/puddle-syntax)

# puddle-syntax

Syntax tools for the
[Puddle](https://github.com/fritzo/puddle) coding environment

## APi Reference

    var syntax = require('puddle-syntax');

### Data Formats

This module deals with four formats of data.

1.  Codes - Immutable space-delimited lists of tokens.

    **JSON Serializable:** yes

    **Examples:**

        "I"

        "VAR x"

        "APP VAR f VAR x"

        "DEFINE VAR two LAMBDA VAR f LAMBDA VAR x APP VAR f APP VAR f VAR x"

        "ASSERT EQUAL APP VAR two I I"

2.  Lines - Immutable objects with a `code` field and
    a `name` field that is either `null` or a string.
    Each line is either an assertion or a definition;
    assertions have `name = null` and definitions define `name` by their `code`.

    **JSON Serializable:** yes

    **Examples:**

        // a definition
        {
            "name": "two",
            "code": "LAMBDA VAR f LAMBDA VAR x APP VAR f APP VAR x VAR x"
        }

        // an assertion
        {
            "name": null,
            "code": "EQUAL APP VAR two I I"
        }

3.  Terms - Immutable array-representations of abstract syntax trees.

    **JSON Serializable:** yes

    **Examples:**

        [
            "DEFINE", ["VAR", "two"], [
                "LAMBDA", ["VAR", "f"], [
                    "LAMBDA", ["VAR", "x"], [
                        "APP", ["VAR" "f"], [
                            "APP", ["VAR" "f"], ["VAR" "x"],
                        ]
                    ]
                ]
            ]
        ]

        [
            "ASSERT", [
                "EQUAL", ["APP", ["VAR", "two"], "I"], "I"
            ]
        ]

4.  Trees - Mutable cross-linked abstract syntax trees for easy traversal.

    **JSON Serializable:** no, because of cycles

    **Examples:**

        {"name": "I", "above": null, "below": []}

        {"name": "VAR", "varName": "x", "above": null, "below": []}

        var fx = {
            "name": "APP",
            "above": null,
            "below": [
                {"name": "VAR", "varName": "f", "below": [], "above": fx},
                {"name": "VAR", "varName": "x", "below": [], "above": fx}
            ]
        };

### Module `syntax.compiler` <a name="compiler"/>

Signature:

    compiler.symbols : object(string | function) (constructors for terms)
    compiler.load : code -> term
    compiler.dump : term -> code
    compiler.loadLine : line -> term
    compiler.dumpLine : term -> line
    compiler.print : term -> string
    compiler.enumerateFresh : int -> string (a variable name)
    compiler.substitute : name * term -> term
    compiler.parenthesize : term -> term
    compiler.fold : /\f: (string * any -> t). term -> t

Examples:

    compiler.load("APP VAR f VAR x");
    // = ["APP", ["VAR", "f"], ["VAR", "x"]]

    compiler.dump(["APP", ["VAR", "f"], ["VAR", "x"]]);
    // = "APP VAR f VAR x"

### Function `syntax.pretty` <a name="pretty"/>

Signature:

    pretty : term -> string

Examples:

    pretty("LAMBDA VAR x APP VAR f VAR x");
    // = "\ x f x"

### Module `syntax.tree` <a name="tree"/>

Signature:

    tree.load : term -> node
    tree.dump : node -> term
    getRoot : node -> node
    getLocals : node -> Array of strings (variable names)
    getFresh : node -> string (a variable name)

Examples:

    tree.load(["VAR", "x"]);
    // = {"name": "VAR", "varName": "x", "above": null, "below": []}

    tree.dump({"name": "VAR", "varName": "x", "above": null, "below": []});
    // = ["VAR", "x"]

### Module `syntax.cursor` <a name="cursor"/>

## License

Copyright 2013-2014 Fritz Obermeyer.<br/>
Puddle is licensed under the [MIT license](/LICENSE).
