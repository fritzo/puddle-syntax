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

1.  Strings - Immutable space-delimited lists of tokens.

    **Examples:**

        "DEFINE VAR two LAMBDA VAR f LAMBDA VAR x APP VAR f APP VAR f VAR x"

        "ASSERT EQUAL APP VAR two I I"

    **JSON Serializable:** yes

2.  Lines - Immutable objects with a `code` attribute that is a term
    and a `name` attribute that is either `null` or a string.
    Each line is either an assertion or a definition;
    assertions have `name = null` and definitions define `name` by their `code`.

    **Examples:**

        {
            "name": "two",
            "code": "LAMBDA VAR f LAMBDA VAR x APP VAR f APP VAR x VAR x"
        }

        {
            "name": null,
            "code": "EQUAL APP VAR two I I"
        }

    **JSON Serializable:** yes

3.  Terms - Immutable array-representations of abstract syntax trees.

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

    **JSON Serializable:** yes

4.  Trees - Mutable cross-linked abstract syntax trees for easy traversal.

    **JSON Serializable:** no, because of cycles

### Module `syntax.compiler`

### Function `syntax.pretty`

### Module `syntax.tree`

### Module `syntax.cursor`

## License

Copyright 2013-2014 Fritz Obermeyer.<br/>
Puddle is licensed under the [MIT license](/LICENSE).
