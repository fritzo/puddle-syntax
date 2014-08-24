'use strict';

var _ = require('underscore');
var assert = require('assert');

var create = function () {
    return {
        name: 'CURSOR',
        below: [undefined],
        above: null
    };
};

var remove = function (cursor) {
    var above = cursor.above;
    cursor.below[0].above = above;
    if (above) {
        var pos = above.below.indexOf(cursor);
        above.below[pos] = cursor.below[0];
        return pos;
    }
    cursor.below[0] = undefined;
    cursor.above = null;
};

var insertBelow = function (cursor, above, pos) {
    var below = above.below[pos];
    above.below[pos] = cursor;
    cursor.above = above;
    below.above = cursor;
    cursor.below[0] = below;
};

var insertAbove = function (cursor, below) {
    cursor.below[0] = below;
    var above = below.above;
    below.above = cursor;
    cursor.above = above;
    if (above !== null) {
        var pos = above.below.indexOf(below);
        above.below[pos] = cursor;
    }
};

var replaceBelow = (function () {
    var findCursor = function (term) {
        if (term.name === 'CURSOR') {
            return term;
        } else {
            for (var i = 0; i < term.below.length; ++i) {
                var cursor = findCursor(term.below[i]);
                if (cursor !== undefined) {
                    return cursor;
                }
            }
        }
    };
    return function (oldCursor, newTerm) {
        var newCursor = findCursor(newTerm);
        if (newCursor === undefined) {
            newCursor = create();
            insertAbove(newCursor, newTerm);
            newTerm = newCursor;
        }
        var above = oldCursor.above;
        assert(above !== null, 'tried to replace with cursor at root');
        var pos = remove(oldCursor);
        above.below[pos] = newTerm;
        newTerm.above = above;
        return newCursor;
    };
})();

var tryMove = (function () {

    var traverseDownLeft = function (node) {
        while (node.below.length) {
            node = _.first(node.below);
        }
        return node;
    };

    var traverseDownRight = function (node) {
        while (node.below.length) {
            node = _.last(node.below);
        }
        return node;
    };

    var traverseLeftDown = function (node) {
        var above = node.above;
        while (above !== null) {
            var pos = _.indexOf(above.below, node);
            assert(pos >= 0, 'node not found in node.above.below');
            if (pos > 0) {
                return traverseDownRight(above.below[pos - 1]);
            }
            node = above;
            above = node.above;
        }
        return traverseDownRight(node);
    };

    var traverseRightDown = function (node) {
        var above = node.above;
        while (above !== null) {
            var pos = _.indexOf(above.below, node);
            assert(pos >= 0, 'node not found in node.above.below');
            if (pos < above.below.length - 1) {
                return traverseDownLeft(above.below[pos + 1]);
            }
            node = above;
            above = node.above;
        }
        return traverseDownLeft(node);
    };

    var tryMoveLeft = function (cursor) {
        var node = cursor.below[0];
        remove(cursor);
        var next = traverseLeftDown(node);
        insertAbove(cursor, next);
        return true;
    };

    var tryMoveRight = function (cursor) {
        var node = cursor.below[0];
        remove(cursor);
        var next = traverseRightDown(node);
        insertAbove(cursor, next);
        return true;
    };

    var tryMoveUp = function (cursor) {
        if (cursor.above !== null) {
            var pivot = cursor.above;
            remove(cursor);
            insertAbove(cursor, pivot);
            return true;
        } else {
            return false;
        }
    };

    var tryMoveDown = function (cursor) {
        var pivot = cursor.below[0];
        if (pivot.below.length > 0) {
            remove(cursor);
            insertBelow(cursor, pivot, 0);
            return true;
        } else {
            return false;
        }
    };

    var directions = {
        U: tryMoveUp,
        L: tryMoveLeft,
        D: tryMoveDown,
        R: tryMoveRight
    };

    return function (cursor, direction) {
        return directions[direction](cursor);
    };
})();

module.exports = {
    create: create,
    remove: remove,
    insertAbove: insertAbove,
    replaceBelow: replaceBelow,
    tryMove: tryMove,
};
