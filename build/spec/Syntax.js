(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Grammar, Hole, Literal, Node, Regex, Sequence, Symbol, SyntaxTree, match,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  slice = [].slice;

match = require('util/match');

Grammar = (function() {
  function Grammar(productions) {
    this.productions = productions;
  }

  Grammar.prototype.productions = void 0;

  Grammar.prototype.makeSequence = function(groupId, sequenceId) {
    var ref;
    return (ref = this.productions[groupId]) != null ? ref[sequenceId] : void 0;
  };

  return Grammar;

})();

Sequence = (function() {
  function Sequence(symbols) {
    this.symbols = symbols;
  }

  Sequence.prototype.symbols = void 0;

  Sequence.prototype.display = function() {
    return this.symbols.map(function(sym) {
      return sym.display();
    }).join('');
  };

  Sequence.prototype.templateString = function() {
    return this.symbols.map(function(sym) {
      return match(sym, {
        Literal: function(arg) {
          var text;
          text = arg.text;
          return text;
        },
        Hole: function(arg) {
          var group, identifier;
          identifier = arg.identifier, group = arg.group;
          return "`" + identifier + "`";
        },
        Regex: function(arg) {
          var pattern;
          pattern = arg.pattern;
          return pattern;
        }
      });
    }).join('');
  };

  return Sequence;

})();

Symbol = (function() {
  function Symbol() {}

  Symbol.prototype.display = function() {
    return 'display() not implemented.';
  };

  return Symbol;

})();

Literal = (function(superClass) {
  extend(Literal, superClass);

  function Literal(text1) {
    this.text = text1;
  }

  Literal.prototype.text = void 0;

  Literal.prototype.display = function() {
    return this.text;
  };

  return Literal;

})(Symbol);

Hole = (function(superClass) {
  extend(Hole, superClass);

  function Hole(group1, identifier1) {
    this.group = group1;
    this.identifier = identifier1;
  }

  Hole.prototype.group = void 0;

  Hole.prototype.identifier = void 0;

  Hole.prototype.display = function() {
    return "&lt;" + this.identifier + "&gt;";
  };

  return Hole;

})(Symbol);

Regex = (function(superClass) {
  extend(Regex, superClass);

  function Regex(pattern1) {
    this.pattern = pattern1;
  }

  Regex.prototype.pattern = void 0;

  Regex.prototype.display = function() {
    return "&lt;\\" + this.pattern + "&gt;";
  };

  return Regex;

})(Symbol);

SyntaxTree = (function() {
  function SyntaxTree(grammar, startGroup) {
    this.grammar = grammar;
    this._notifyChanged = bind(this._notifyChanged, this);
    this.root = new Node(new Sequence([new Hole(startGroup, 'start')]), this);
    this._listeners = {};
  }

  SyntaxTree.prototype.root = void 0;

  SyntaxTree.prototype.grammar = void 0;

  SyntaxTree.prototype.fillHole = function(path, fillWith, useNumericPath) {
    this.root.navigateHole(path, useNumericPath).fill(fillWith);
    return this._notifyChanged();
  };

  SyntaxTree.prototype.navigateHole = function(path, useNumericPath) {
    return this.root.navigateHole(path, useNumericPath);
  };

  SyntaxTree.prototype._numberOfCallbacks = 0;

  SyntaxTree.prototype.notifyChanged = function(callback) {
    var cbId;
    cbId = "#cb-" + (this._numberOfCallbacks++);
    this._listeners[cbId] = callback;
    return function() {
      return delete _listeners[cbId];
    };
  };

  SyntaxTree.prototype._notifyChanged = function() {
    var _, cb, ref, results;
    ref = this._listeners;
    results = [];
    for (_ in ref) {
      cb = ref[_];
      results.push(cb());
    }
    return results;
  };

  return SyntaxTree;

})();

Node = (function() {
  function Node(sequence, parent) {
    var holeIndex, notify;
    this.sequence = sequence;
    this._notifyChanged = bind(this._notifyChanged, this);
    this.holes = {};
    this._listeners = {};
    if ((parent != null ? parent._notifyChanged : void 0) != null) {
      this.notifyChanged(parent._notifyChanged);
    }
    holeIndex = 0;
    notify = this._notifyChanged;
    this.sequence.symbols.forEach((function(_this) {
      return function(sym, index) {
        if (sym.constructor.name === 'Hole') {
          return _this.holes[sym.identifier] = {
            id: sym.identifier,
            group: sym.group,
            index: index,
            holeIndex: holeIndex++,
            value: null,
            fill: function(withNode) {
              this.value = withNode;
              withNode.notifyChanged(notify);
              return notify();
            }
          };
        }
      };
    })(this));
  }

  Node.prototype.sequence = void 0;

  Node.prototype.holes = void 0;

  Node.prototype.render = function() {
    return this.sequence.symbols.map((function(_this) {
      return function(symbol) {
        return match(symbol, {
          Literal: function(arg) {
            var text;
            text = arg.text;
            return text;
          },
          Hole: function(arg) {
            var group, identifier;
            identifier = arg.identifier, group = arg.group;
            if (_this.holes[identifier].value != null) {
              return _this.holes[identifier].value.render();
            } else {
              return '`' + group + '`';
            }
          }
        });
      };
    })(this)).join("");
  };

  Node.prototype.getNthChild = function(index) {
    var i, key, len, ref;
    ref = Object.keys(this.holes);
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      if (this.holes[key].holeIndex === index) {
        return this.holes[key];
      }
    }
    return null;
  };

  Node.prototype.getChild = function(id) {
    return this.holes[id];
  };

  Node.prototype.idPathFromNumericPath = function(numericPath) {
    var hd, nextHole, tl;
    hd = numericPath[0], tl = 2 <= numericPath.length ? slice.call(numericPath, 1) : [];
    nextHole = this.getNthChild(hd);
    if (nextHole == null) {
      return null;
    }
    if (tl.length === 0) {
      return [nextHole.id];
    } else {
      if (nextHole.value != null) {
        return [nextHole.id].concat(slice.call(nextHole.value.idPathFromNumericPath(tl)));
      } else {
        return [];
      }
    }
  };

  Node.prototype.walk = function(path, options) {
    var hd, nextHole, ref, tl;
    if (options == null) {
      options = {};
    }
    hd = path[0], tl = 2 <= path.length ? slice.call(path, 1) : [];
    nextHole = (function(_this) {
      return function() {
        if (options.useNumericPath) {
          return _this.getNthChild(hd);
        } else {
          return _this.getChild(hd);
        }
      };
    })(this)();
    if (nextHole == null) {
      return null;
    }
    if (((ref = options.fold) != null ? ref.proc : void 0) != null) {
      options.fold.acc = options.fold.proc(options.fold.acc, nextHole);
    }
    if (tl.length === 0) {
      if (options.endFn != null) {
        return options.endFn(nextHole.value, nextHole);
      } else {
        return nextHole.value;
      }
    } else {
      if (nextHole.value != null) {
        return nextHole.value.walk(tl, options);
      } else {
        return null;
      }
    }
  };

  Node.prototype.navigate = function(path, useNumericPath) {
    return this.walk(path, {
      useNumericPath: useNumericPath
    });
  };

  Node.prototype.navigateHole = function(path, useNumericPath) {
    return this.walk(path, {
      endFn: function(val, hole) {
        return hole;
      },
      useNumericPath: useNumericPath
    });
  };

  Node.prototype._numberOfCallbacks = 0;

  Node.prototype.notifyChanged = function(callback) {
    var cbId;
    cbId = "#cb-" + (this._numberOfCallbacks++);
    this._listeners[cbId] = callback;
    return function() {
      return delete _listeners[cbId];
    };
  };

  Node.prototype._notifyChanged = function() {
    var _, cb, ref, results;
    ref = this._listeners;
    results = [];
    for (_ in ref) {
      cb = ref[_];
      results.push(cb());
    }
    return results;
  };

  return Node;

})();

module.exports = {
  Grammar: Grammar,
  Sequence: Sequence,
  S: {
    Literal: Literal,
    Hole: Hole,
    Regex: Regex
  },
  SyntaxTree: SyntaxTree,
  Node: Node
};

},{"util/match":2}],2:[function(require,module,exports){
var match;

module.exports = match = function(obj, fns) {
  var constructor, fn;
  constructor = obj.constructor;
  fn = fns[constructor.name];
  while (!fn && constructor.__super__) {
    constructor = constructor.__super__.constructor;
    fn = fns[constructor.name];
  }
  if (fn) {
    return fn.apply(null, arguments);
  } else {
    throw Error("no match for type " + constructor.name + ".");
  }
};

},{}],3:[function(require,module,exports){
var Grammar, Hole, Literal, Node, Regex, Sequence, SyntaxTree, ref, ref1;

ref = require('Syntax'), Grammar = ref.Grammar, Sequence = ref.Sequence, (ref1 = ref.S, Literal = ref1.Literal, Hole = ref1.Hole, Regex = ref1.Regex), SyntaxTree = ref.SyntaxTree, Node = ref.Node;

describe('constructing phrases', function() {
  beforeEach(function() {
    this.rules = {
      'START': {
        'start': Sequence([Hole('NE', 'expr')])
      },
      'NE': {
        'num-lit': Sequence([Literal('(num '), Hole('N', 'number'), Literal(')')]),
        'arith-op': Sequence([Literal('(arith '), Hole('A', 'rator'), Literal(' '), Hole('NE', 'randl'), Literal(' '), Hole('NE', 'randr'), Literal(')')])
      },
      'N': {
        'digits': Sequence([Regex('[0-9]+')])
      },
      'A': {
        '+': Sequence([Literal('+')]),
        '-': Sequence([Literal('-')]),
        '*': Sequence([Literal('*')]),
        '/': Sequence([Literal('/')])
      }
    };
    this.grammar = new Grammar(this.rules);
    return this.syntaxTree = new SyntaxTree(this.grammar, 'NE');
  });
  it('starts with the default hole', function() {
    expect(this.syntaxTree.root.holes['start'] != null).toBe(true);
    return expect(this.syntaxTree.root.holes['start'].group).toBe('NE');
  });
  it('can access sequences', function() {
    return expect(this.grammar.makeSequence('NE', 'num-lit')).toEqual(Sequence([Literal('(num '), Hole('N', 'number'), Literal(')')]));
  });
  it('accepts simple fills', function() {
    var numNode;
    numNode = new Node(this.grammar.makeSequence('NE', 'num-lit'));
    this.syntaxTree.root.fillHole('start', numNode);
    expect(this.syntaxTree.root.holes['start'].value != null).toBe(true);
    return expect(this.syntaxTree.root.holes['start'].value).toEqual(numNode);
  });
  return it('accepts deep fills', function() {
    var arithNode, numNode;
    numNode = new Node(this.grammar.makeSequence('NE', 'num-lit'));
    arithNode = new Node(this.grammar.makeSequence('NE', 'arith-op'));
    this.syntaxTree.root.fillHole('start', arithNode);
    expect(this.syntaxTree.root.holes['start'].value.holes['randl'].value).toBe(null);
    this.syntaxTree.root.holes['start'].value.fillHole('randl', numNode);
    expect(this.syntaxTree.root.holes['start'].value.holes['randl'].value != null).toBe(true);
    return expect(this.syntaxTree.root.holes['start'].value.holes['randl'].value).toEqual(numNode);
  });
});

},{"Syntax":1}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vc2NyaXB0cy9TeW50YXguY29mZmVlIiwiLi4vc2NyaXB0cy91dGlsL21hdGNoLmNvZmZlZSIsIlN5bnRheC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEdyYW1tYXIsIEhvbGUsIExpdGVyYWwsIE5vZGUsIFJlZ2V4LCBTZXF1ZW5jZSwgU3ltYm9sLCBTeW50YXhUcmVlLCBtYXRjaCxcbiAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gIGJpbmQgPSBmdW5jdGlvbihmbiwgbWUpeyByZXR1cm4gZnVuY3Rpb24oKXsgcmV0dXJuIGZuLmFwcGx5KG1lLCBhcmd1bWVudHMpOyB9OyB9LFxuICBzbGljZSA9IFtdLnNsaWNlO1xuXG5tYXRjaCA9IHJlcXVpcmUoJ3V0aWwvbWF0Y2gnKTtcblxuR3JhbW1hciA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gR3JhbW1hcihwcm9kdWN0aW9ucykge1xuICAgIHRoaXMucHJvZHVjdGlvbnMgPSBwcm9kdWN0aW9ucztcbiAgfVxuXG4gIEdyYW1tYXIucHJvdG90eXBlLnByb2R1Y3Rpb25zID0gdm9pZCAwO1xuXG4gIEdyYW1tYXIucHJvdG90eXBlLm1ha2VTZXF1ZW5jZSA9IGZ1bmN0aW9uKGdyb3VwSWQsIHNlcXVlbmNlSWQpIHtcbiAgICB2YXIgcmVmO1xuICAgIHJldHVybiAocmVmID0gdGhpcy5wcm9kdWN0aW9uc1tncm91cElkXSkgIT0gbnVsbCA/IHJlZltzZXF1ZW5jZUlkXSA6IHZvaWQgMDtcbiAgfTtcblxuICByZXR1cm4gR3JhbW1hcjtcblxufSkoKTtcblxuU2VxdWVuY2UgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFNlcXVlbmNlKHN5bWJvbHMpIHtcbiAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzO1xuICB9XG5cbiAgU2VxdWVuY2UucHJvdG90eXBlLnN5bWJvbHMgPSB2b2lkIDA7XG5cbiAgU2VxdWVuY2UucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zeW1ib2xzLm1hcChmdW5jdGlvbihzeW0pIHtcbiAgICAgIHJldHVybiBzeW0uZGlzcGxheSgpO1xuICAgIH0pLmpvaW4oJycpO1xuICB9O1xuXG4gIFNlcXVlbmNlLnByb3RvdHlwZS50ZW1wbGF0ZVN0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN5bWJvbHMubWFwKGZ1bmN0aW9uKHN5bSkge1xuICAgICAgcmV0dXJuIG1hdGNoKHN5bSwge1xuICAgICAgICBMaXRlcmFsOiBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICB2YXIgdGV4dDtcbiAgICAgICAgICB0ZXh0ID0gYXJnLnRleHQ7XG4gICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgIH0sXG4gICAgICAgIEhvbGU6IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICAgIHZhciBncm91cCwgaWRlbnRpZmllcjtcbiAgICAgICAgICBpZGVudGlmaWVyID0gYXJnLmlkZW50aWZpZXIsIGdyb3VwID0gYXJnLmdyb3VwO1xuICAgICAgICAgIHJldHVybiBcImBcIiArIGlkZW50aWZpZXIgKyBcImBcIjtcbiAgICAgICAgfSxcbiAgICAgICAgUmVnZXg6IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICAgIHZhciBwYXR0ZXJuO1xuICAgICAgICAgIHBhdHRlcm4gPSBhcmcucGF0dGVybjtcbiAgICAgICAgICByZXR1cm4gcGF0dGVybjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSkuam9pbignJyk7XG4gIH07XG5cbiAgcmV0dXJuIFNlcXVlbmNlO1xuXG59KSgpO1xuXG5TeW1ib2wgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFN5bWJvbCgpIHt9XG5cbiAgU3ltYm9sLnByb3RvdHlwZS5kaXNwbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICdkaXNwbGF5KCkgbm90IGltcGxlbWVudGVkLic7XG4gIH07XG5cbiAgcmV0dXJuIFN5bWJvbDtcblxufSkoKTtcblxuTGl0ZXJhbCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChMaXRlcmFsLCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBMaXRlcmFsKHRleHQxKSB7XG4gICAgdGhpcy50ZXh0ID0gdGV4dDE7XG4gIH1cblxuICBMaXRlcmFsLnByb3RvdHlwZS50ZXh0ID0gdm9pZCAwO1xuXG4gIExpdGVyYWwucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy50ZXh0O1xuICB9O1xuXG4gIHJldHVybiBMaXRlcmFsO1xuXG59KShTeW1ib2wpO1xuXG5Ib2xlID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKEhvbGUsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIEhvbGUoZ3JvdXAxLCBpZGVudGlmaWVyMSkge1xuICAgIHRoaXMuZ3JvdXAgPSBncm91cDE7XG4gICAgdGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllcjE7XG4gIH1cblxuICBIb2xlLnByb3RvdHlwZS5ncm91cCA9IHZvaWQgMDtcblxuICBIb2xlLnByb3RvdHlwZS5pZGVudGlmaWVyID0gdm9pZCAwO1xuXG4gIEhvbGUucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCImbHQ7XCIgKyB0aGlzLmlkZW50aWZpZXIgKyBcIiZndDtcIjtcbiAgfTtcblxuICByZXR1cm4gSG9sZTtcblxufSkoU3ltYm9sKTtcblxuUmVnZXggPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICBleHRlbmQoUmVnZXgsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIFJlZ2V4KHBhdHRlcm4xKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjE7XG4gIH1cblxuICBSZWdleC5wcm90b3R5cGUucGF0dGVybiA9IHZvaWQgMDtcblxuICBSZWdleC5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIiZsdDtcXFxcXCIgKyB0aGlzLnBhdHRlcm4gKyBcIiZndDtcIjtcbiAgfTtcblxuICByZXR1cm4gUmVnZXg7XG5cbn0pKFN5bWJvbCk7XG5cblN5bnRheFRyZWUgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFN5bnRheFRyZWUoZ3JhbW1hciwgc3RhcnRHcm91cCkge1xuICAgIHRoaXMuZ3JhbW1hciA9IGdyYW1tYXI7XG4gICAgdGhpcy5fbm90aWZ5Q2hhbmdlZCA9IGJpbmQodGhpcy5fbm90aWZ5Q2hhbmdlZCwgdGhpcyk7XG4gICAgdGhpcy5yb290ID0gbmV3IE5vZGUobmV3IFNlcXVlbmNlKFtuZXcgSG9sZShzdGFydEdyb3VwLCAnc3RhcnQnKV0pLCB0aGlzKTtcbiAgICB0aGlzLl9saXN0ZW5lcnMgPSB7fTtcbiAgfVxuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLnJvb3QgPSB2b2lkIDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuZ3JhbW1hciA9IHZvaWQgMDtcblxuICBTeW50YXhUcmVlLnByb3RvdHlwZS5maWxsSG9sZSA9IGZ1bmN0aW9uKHBhdGgsIGZpbGxXaXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHRoaXMucm9vdC5uYXZpZ2F0ZUhvbGUocGF0aCwgdXNlTnVtZXJpY1BhdGgpLmZpbGwoZmlsbFdpdGgpO1xuICAgIHJldHVybiB0aGlzLl9ub3RpZnlDaGFuZ2VkKCk7XG4gIH07XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUubmF2aWdhdGVIb2xlID0gZnVuY3Rpb24ocGF0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290Lm5hdmlnYXRlSG9sZShwYXRoLCB1c2VOdW1lcmljUGF0aCk7XG4gIH07XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuX251bWJlck9mQ2FsbGJhY2tzID0gMDtcblxuICBTeW50YXhUcmVlLnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VkID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgY2JJZDtcbiAgICBjYklkID0gXCIjY2ItXCIgKyAodGhpcy5fbnVtYmVyT2ZDYWxsYmFja3MrKyk7XG4gICAgdGhpcy5fbGlzdGVuZXJzW2NiSWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZSBfbGlzdGVuZXJzW2NiSWRdO1xuICAgIH07XG4gIH07XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuX25vdGlmeUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgXywgY2IsIHJlZiwgcmVzdWx0cztcbiAgICByZWYgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoXyBpbiByZWYpIHtcbiAgICAgIGNiID0gcmVmW19dO1xuICAgICAgcmVzdWx0cy5wdXNoKGNiKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICByZXR1cm4gU3ludGF4VHJlZTtcblxufSkoKTtcblxuTm9kZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gTm9kZShzZXF1ZW5jZSwgcGFyZW50KSB7XG4gICAgdmFyIGhvbGVJbmRleCwgbm90aWZ5O1xuICAgIHRoaXMuc2VxdWVuY2UgPSBzZXF1ZW5jZTtcbiAgICB0aGlzLl9ub3RpZnlDaGFuZ2VkID0gYmluZCh0aGlzLl9ub3RpZnlDaGFuZ2VkLCB0aGlzKTtcbiAgICB0aGlzLmhvbGVzID0ge307XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG4gICAgaWYgKChwYXJlbnQgIT0gbnVsbCA/IHBhcmVudC5fbm90aWZ5Q2hhbmdlZCA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgdGhpcy5ub3RpZnlDaGFuZ2VkKHBhcmVudC5fbm90aWZ5Q2hhbmdlZCk7XG4gICAgfVxuICAgIGhvbGVJbmRleCA9IDA7XG4gICAgbm90aWZ5ID0gdGhpcy5fbm90aWZ5Q2hhbmdlZDtcbiAgICB0aGlzLnNlcXVlbmNlLnN5bWJvbHMuZm9yRWFjaCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihzeW0sIGluZGV4KSB7XG4gICAgICAgIGlmIChzeW0uY29uc3RydWN0b3IubmFtZSA9PT0gJ0hvbGUnKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW3N5bS5pZGVudGlmaWVyXSA9IHtcbiAgICAgICAgICAgIGlkOiBzeW0uaWRlbnRpZmllcixcbiAgICAgICAgICAgIGdyb3VwOiBzeW0uZ3JvdXAsXG4gICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICBob2xlSW5kZXg6IGhvbGVJbmRleCsrLFxuICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICBmaWxsOiBmdW5jdGlvbih3aXRoTm9kZSkge1xuICAgICAgICAgICAgICB0aGlzLnZhbHVlID0gd2l0aE5vZGU7XG4gICAgICAgICAgICAgIHdpdGhOb2RlLm5vdGlmeUNoYW5nZWQobm90aWZ5KTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5vdGlmeSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkodGhpcykpO1xuICB9XG5cbiAgTm9kZS5wcm90b3R5cGUuc2VxdWVuY2UgPSB2b2lkIDA7XG5cbiAgTm9kZS5wcm90b3R5cGUuaG9sZXMgPSB2b2lkIDA7XG5cbiAgTm9kZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc2VxdWVuY2Uuc3ltYm9scy5tYXAoKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc3ltYm9sKSB7XG4gICAgICAgIHJldHVybiBtYXRjaChzeW1ib2wsIHtcbiAgICAgICAgICBMaXRlcmFsOiBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICAgIHZhciB0ZXh0O1xuICAgICAgICAgICAgdGV4dCA9IGFyZy50ZXh0O1xuICAgICAgICAgICAgcmV0dXJuIHRleHQ7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBIb2xlOiBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICAgIHZhciBncm91cCwgaWRlbnRpZmllcjtcbiAgICAgICAgICAgIGlkZW50aWZpZXIgPSBhcmcuaWRlbnRpZmllciwgZ3JvdXAgPSBhcmcuZ3JvdXA7XG4gICAgICAgICAgICBpZiAoX3RoaXMuaG9sZXNbaWRlbnRpZmllcl0udmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuaG9sZXNbaWRlbnRpZmllcl0udmFsdWUucmVuZGVyKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gJ2AnICsgZ3JvdXAgKyAnYCc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSkodGhpcykpLmpvaW4oXCJcIik7XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuZ2V0TnRoQ2hpbGQgPSBmdW5jdGlvbihpbmRleCkge1xuICAgIHZhciBpLCBrZXksIGxlbiwgcmVmO1xuICAgIHJlZiA9IE9iamVjdC5rZXlzKHRoaXMuaG9sZXMpO1xuICAgIGZvciAoaSA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAga2V5ID0gcmVmW2ldO1xuICAgICAgaWYgKHRoaXMuaG9sZXNba2V5XS5ob2xlSW5kZXggPT09IGluZGV4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhvbGVzW2tleV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLmdldENoaWxkID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gdGhpcy5ob2xlc1tpZF07XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuaWRQYXRoRnJvbU51bWVyaWNQYXRoID0gZnVuY3Rpb24obnVtZXJpY1BhdGgpIHtcbiAgICB2YXIgaGQsIG5leHRIb2xlLCB0bDtcbiAgICBoZCA9IG51bWVyaWNQYXRoWzBdLCB0bCA9IDIgPD0gbnVtZXJpY1BhdGgubGVuZ3RoID8gc2xpY2UuY2FsbChudW1lcmljUGF0aCwgMSkgOiBbXTtcbiAgICBuZXh0SG9sZSA9IHRoaXMuZ2V0TnRoQ2hpbGQoaGQpO1xuICAgIGlmIChuZXh0SG9sZSA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKHRsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtuZXh0SG9sZS5pZF07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXh0SG9sZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBbbmV4dEhvbGUuaWRdLmNvbmNhdChzbGljZS5jYWxsKG5leHRIb2xlLnZhbHVlLmlkUGF0aEZyb21OdW1lcmljUGF0aCh0bCkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUud2FsayA9IGZ1bmN0aW9uKHBhdGgsIG9wdGlvbnMpIHtcbiAgICB2YXIgaGQsIG5leHRIb2xlLCByZWYsIHRsO1xuICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgaGQgPSBwYXRoWzBdLCB0bCA9IDIgPD0gcGF0aC5sZW5ndGggPyBzbGljZS5jYWxsKHBhdGgsIDEpIDogW107XG4gICAgbmV4dEhvbGUgPSAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMudXNlTnVtZXJpY1BhdGgpIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZ2V0TnRoQ2hpbGQoaGQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5nZXRDaGlsZChoZCk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkodGhpcykoKTtcbiAgICBpZiAobmV4dEhvbGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICgoKHJlZiA9IG9wdGlvbnMuZm9sZCkgIT0gbnVsbCA/IHJlZi5wcm9jIDogdm9pZCAwKSAhPSBudWxsKSB7XG4gICAgICBvcHRpb25zLmZvbGQuYWNjID0gb3B0aW9ucy5mb2xkLnByb2Mob3B0aW9ucy5mb2xkLmFjYywgbmV4dEhvbGUpO1xuICAgIH1cbiAgICBpZiAodGwubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAob3B0aW9ucy5lbmRGbiAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBvcHRpb25zLmVuZEZuKG5leHRIb2xlLnZhbHVlLCBuZXh0SG9sZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV4dEhvbGUudmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXh0SG9sZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgIHJldHVybiBuZXh0SG9sZS52YWx1ZS53YWxrKHRsLCBvcHRpb25zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5uYXZpZ2F0ZSA9IGZ1bmN0aW9uKHBhdGgsIHVzZU51bWVyaWNQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMud2FsayhwYXRoLCB7XG4gICAgICB1c2VOdW1lcmljUGF0aDogdXNlTnVtZXJpY1BhdGhcbiAgICB9KTtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5uYXZpZ2F0ZUhvbGUgPSBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHJldHVybiB0aGlzLndhbGsocGF0aCwge1xuICAgICAgZW5kRm46IGZ1bmN0aW9uKHZhbCwgaG9sZSkge1xuICAgICAgICByZXR1cm4gaG9sZTtcbiAgICAgIH0sXG4gICAgICB1c2VOdW1lcmljUGF0aDogdXNlTnVtZXJpY1BhdGhcbiAgICB9KTtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5fbnVtYmVyT2ZDYWxsYmFja3MgPSAwO1xuXG4gIE5vZGUucHJvdG90eXBlLm5vdGlmeUNoYW5nZWQgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBjYklkO1xuICAgIGNiSWQgPSBcIiNjYi1cIiArICh0aGlzLl9udW1iZXJPZkNhbGxiYWNrcysrKTtcbiAgICB0aGlzLl9saXN0ZW5lcnNbY2JJZF0gPSBjYWxsYmFjaztcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZGVsZXRlIF9saXN0ZW5lcnNbY2JJZF07XG4gICAgfTtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5fbm90aWZ5Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBfLCBjYiwgcmVmLCByZXN1bHRzO1xuICAgIHJlZiA9IHRoaXMuX2xpc3RlbmVycztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChfIGluIHJlZikge1xuICAgICAgY2IgPSByZWZbX107XG4gICAgICByZXN1bHRzLnB1c2goY2IoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIHJldHVybiBOb2RlO1xuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgR3JhbW1hcjogR3JhbW1hcixcbiAgU2VxdWVuY2U6IFNlcXVlbmNlLFxuICBTOiB7XG4gICAgTGl0ZXJhbDogTGl0ZXJhbCxcbiAgICBIb2xlOiBIb2xlLFxuICAgIFJlZ2V4OiBSZWdleFxuICB9LFxuICBTeW50YXhUcmVlOiBTeW50YXhUcmVlLFxuICBOb2RlOiBOb2RlXG59O1xuIiwidmFyIG1hdGNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoID0gZnVuY3Rpb24ob2JqLCBmbnMpIHtcbiAgdmFyIGNvbnN0cnVjdG9yLCBmbjtcbiAgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gIGZuID0gZm5zW2NvbnN0cnVjdG9yLm5hbWVdO1xuICB3aGlsZSAoIWZuICYmIGNvbnN0cnVjdG9yLl9fc3VwZXJfXykge1xuICAgIGNvbnN0cnVjdG9yID0gY29uc3RydWN0b3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yO1xuICAgIGZuID0gZm5zW2NvbnN0cnVjdG9yLm5hbWVdO1xuICB9XG4gIGlmIChmbikge1xuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwibm8gbWF0Y2ggZm9yIHR5cGUgXCIgKyBjb25zdHJ1Y3Rvci5uYW1lICsgXCIuXCIpO1xuICB9XG59O1xuIiwidmFyIEdyYW1tYXIsIEhvbGUsIExpdGVyYWwsIE5vZGUsIFJlZ2V4LCBTZXF1ZW5jZSwgU3ludGF4VHJlZSwgcmVmLCByZWYxO1xuXG5yZWYgPSByZXF1aXJlKCdTeW50YXgnKSwgR3JhbW1hciA9IHJlZi5HcmFtbWFyLCBTZXF1ZW5jZSA9IHJlZi5TZXF1ZW5jZSwgKHJlZjEgPSByZWYuUywgTGl0ZXJhbCA9IHJlZjEuTGl0ZXJhbCwgSG9sZSA9IHJlZjEuSG9sZSwgUmVnZXggPSByZWYxLlJlZ2V4KSwgU3ludGF4VHJlZSA9IHJlZi5TeW50YXhUcmVlLCBOb2RlID0gcmVmLk5vZGU7XG5cbmRlc2NyaWJlKCdjb25zdHJ1Y3RpbmcgcGhyYXNlcycsIGZ1bmN0aW9uKCkge1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVsZXMgPSB7XG4gICAgICAnU1RBUlQnOiB7XG4gICAgICAgICdzdGFydCc6IFNlcXVlbmNlKFtIb2xlKCdORScsICdleHByJyldKVxuICAgICAgfSxcbiAgICAgICdORSc6IHtcbiAgICAgICAgJ251bS1saXQnOiBTZXF1ZW5jZShbTGl0ZXJhbCgnKG51bSAnKSwgSG9sZSgnTicsICdudW1iZXInKSwgTGl0ZXJhbCgnKScpXSksXG4gICAgICAgICdhcml0aC1vcCc6IFNlcXVlbmNlKFtMaXRlcmFsKCcoYXJpdGggJyksIEhvbGUoJ0EnLCAncmF0b3InKSwgTGl0ZXJhbCgnICcpLCBIb2xlKCdORScsICdyYW5kbCcpLCBMaXRlcmFsKCcgJyksIEhvbGUoJ05FJywgJ3JhbmRyJyksIExpdGVyYWwoJyknKV0pXG4gICAgICB9LFxuICAgICAgJ04nOiB7XG4gICAgICAgICdkaWdpdHMnOiBTZXF1ZW5jZShbUmVnZXgoJ1swLTldKycpXSlcbiAgICAgIH0sXG4gICAgICAnQSc6IHtcbiAgICAgICAgJysnOiBTZXF1ZW5jZShbTGl0ZXJhbCgnKycpXSksXG4gICAgICAgICctJzogU2VxdWVuY2UoW0xpdGVyYWwoJy0nKV0pLFxuICAgICAgICAnKic6IFNlcXVlbmNlKFtMaXRlcmFsKCcqJyldKSxcbiAgICAgICAgJy8nOiBTZXF1ZW5jZShbTGl0ZXJhbCgnLycpXSlcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuZ3JhbW1hciA9IG5ldyBHcmFtbWFyKHRoaXMucnVsZXMpO1xuICAgIHJldHVybiB0aGlzLnN5bnRheFRyZWUgPSBuZXcgU3ludGF4VHJlZSh0aGlzLmdyYW1tYXIsICdORScpO1xuICB9KTtcbiAgaXQoJ3N0YXJ0cyB3aXRoIHRoZSBkZWZhdWx0IGhvbGUnLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10gIT0gbnVsbCkudG9CZSh0cnVlKTtcbiAgICByZXR1cm4gZXhwZWN0KHRoaXMuc3ludGF4VHJlZS5yb290LmhvbGVzWydzdGFydCddLmdyb3VwKS50b0JlKCdORScpO1xuICB9KTtcbiAgaXQoJ2NhbiBhY2Nlc3Mgc2VxdWVuY2VzJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGV4cGVjdCh0aGlzLmdyYW1tYXIubWFrZVNlcXVlbmNlKCdORScsICdudW0tbGl0JykpLnRvRXF1YWwoU2VxdWVuY2UoW0xpdGVyYWwoJyhudW0gJyksIEhvbGUoJ04nLCAnbnVtYmVyJyksIExpdGVyYWwoJyknKV0pKTtcbiAgfSk7XG4gIGl0KCdhY2NlcHRzIHNpbXBsZSBmaWxscycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBudW1Ob2RlO1xuICAgIG51bU5vZGUgPSBuZXcgTm9kZSh0aGlzLmdyYW1tYXIubWFrZVNlcXVlbmNlKCdORScsICdudW0tbGl0JykpO1xuICAgIHRoaXMuc3ludGF4VHJlZS5yb290LmZpbGxIb2xlKCdzdGFydCcsIG51bU5vZGUpO1xuICAgIGV4cGVjdCh0aGlzLnN5bnRheFRyZWUucm9vdC5ob2xlc1snc3RhcnQnXS52YWx1ZSAhPSBudWxsKS50b0JlKHRydWUpO1xuICAgIHJldHVybiBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUpLnRvRXF1YWwobnVtTm9kZSk7XG4gIH0pO1xuICByZXR1cm4gaXQoJ2FjY2VwdHMgZGVlcCBmaWxscycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcml0aE5vZGUsIG51bU5vZGU7XG4gICAgbnVtTm9kZSA9IG5ldyBOb2RlKHRoaXMuZ3JhbW1hci5tYWtlU2VxdWVuY2UoJ05FJywgJ251bS1saXQnKSk7XG4gICAgYXJpdGhOb2RlID0gbmV3IE5vZGUodGhpcy5ncmFtbWFyLm1ha2VTZXF1ZW5jZSgnTkUnLCAnYXJpdGgtb3AnKSk7XG4gICAgdGhpcy5zeW50YXhUcmVlLnJvb3QuZmlsbEhvbGUoJ3N0YXJ0JywgYXJpdGhOb2RlKTtcbiAgICBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUuaG9sZXNbJ3JhbmRsJ10udmFsdWUpLnRvQmUobnVsbCk7XG4gICAgdGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUuZmlsbEhvbGUoJ3JhbmRsJywgbnVtTm9kZSk7XG4gICAgZXhwZWN0KHRoaXMuc3ludGF4VHJlZS5yb290LmhvbGVzWydzdGFydCddLnZhbHVlLmhvbGVzWydyYW5kbCddLnZhbHVlICE9IG51bGwpLnRvQmUodHJ1ZSk7XG4gICAgcmV0dXJuIGV4cGVjdCh0aGlzLnN5bnRheFRyZWUucm9vdC5ob2xlc1snc3RhcnQnXS52YWx1ZS5ob2xlc1sncmFuZGwnXS52YWx1ZSkudG9FcXVhbChudW1Ob2RlKTtcbiAgfSk7XG59KTtcbiJdfQ==
