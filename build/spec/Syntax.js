(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Grammar, Hole, Literal, Node, Regex, Sequence, Symbol, SyntaxTree, generateConstructor, match,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
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

  return Sequence;

})();

Symbol = (function() {
  function Symbol() {}

  return Symbol;

})();

Literal = (function(superClass) {
  extend(Literal, superClass);

  function Literal(text1) {
    this.text = text1;
  }

  Literal.prototype.text = void 0;

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

  return Hole;

})(Symbol);

Regex = (function(superClass) {
  extend(Regex, superClass);

  function Regex(pattern) {
    this.pattern = pattern;
  }

  Regex.prototype.pattern = void 0;

  return Regex;

})(Symbol);

SyntaxTree = (function() {
  function SyntaxTree(grammar, startGroup) {
    this.grammar = grammar;
    this.root = new Node(new Sequence([new Hole(startGroup, 'start')]));
  }

  SyntaxTree.prototype.root = void 0;

  SyntaxTree.prototype.grammar = void 0;

  return SyntaxTree;

})();

Node = (function() {
  function Node(sequence) {
    this.sequence = sequence;
    this.holes = {};
    this.sequence.symbols.forEach((function(_this) {
      return function(sym, index) {
        if (sym.constructor.name === 'Hole') {
          return _this.holes[sym.identifier] = {
            group: sym.group,
            index: index,
            value: null
          };
        }
      };
    })(this));
  }

  Node.prototype.sequence = void 0;

  Node.prototype.holes = void 0;

  Node.prototype.fillHole = function(holeId, fillWith) {
    var hole;
    hole = this.holes[holeId];
    if (hole != null) {
      hole.value = fillWith;
    }
    return this;
  };

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

  Node.prototype.navigate = function(path) {};

  return Node;

})();

generateConstructor = function(klass) {
  return function() {
    var args;
    args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(klass, args, function(){});
  };
};

module.exports = {
  Grammar: Grammar,
  Sequence: generateConstructor(Sequence),
  S: {
    Literal: generateConstructor(Literal),
    Hole: generateConstructor(Hole),
    Regex: generateConstructor(Regex)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vc2NyaXB0cy9TeW50YXguY29mZmVlIiwiLi4vc2NyaXB0cy91dGlsL21hdGNoLmNvZmZlZSIsIlN5bnRheC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEdyYW1tYXIsIEhvbGUsIExpdGVyYWwsIE5vZGUsIFJlZ2V4LCBTZXF1ZW5jZSwgU3ltYm9sLCBTeW50YXhUcmVlLCBnZW5lcmF0ZUNvbnN0cnVjdG9yLCBtYXRjaCxcbiAgZXh0ZW5kID0gZnVuY3Rpb24oY2hpbGQsIHBhcmVudCkgeyBmb3IgKHZhciBrZXkgaW4gcGFyZW50KSB7IGlmIChoYXNQcm9wLmNhbGwocGFyZW50LCBrZXkpKSBjaGlsZFtrZXldID0gcGFyZW50W2tleV07IH0gZnVuY3Rpb24gY3RvcigpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9IGN0b3IucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTsgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTsgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTsgcmV0dXJuIGNoaWxkOyB9LFxuICBoYXNQcm9wID0ge30uaGFzT3duUHJvcGVydHksXG4gIHNsaWNlID0gW10uc2xpY2U7XG5cbm1hdGNoID0gcmVxdWlyZSgndXRpbC9tYXRjaCcpO1xuXG5HcmFtbWFyID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBHcmFtbWFyKHByb2R1Y3Rpb25zKSB7XG4gICAgdGhpcy5wcm9kdWN0aW9ucyA9IHByb2R1Y3Rpb25zO1xuICB9XG5cbiAgR3JhbW1hci5wcm90b3R5cGUucHJvZHVjdGlvbnMgPSB2b2lkIDA7XG5cbiAgR3JhbW1hci5wcm90b3R5cGUubWFrZVNlcXVlbmNlID0gZnVuY3Rpb24oZ3JvdXBJZCwgc2VxdWVuY2VJZCkge1xuICAgIHZhciByZWY7XG4gICAgcmV0dXJuIChyZWYgPSB0aGlzLnByb2R1Y3Rpb25zW2dyb3VwSWRdKSAhPSBudWxsID8gcmVmW3NlcXVlbmNlSWRdIDogdm9pZCAwO1xuICB9O1xuXG4gIHJldHVybiBHcmFtbWFyO1xuXG59KSgpO1xuXG5TZXF1ZW5jZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gU2VxdWVuY2Uoc3ltYm9scykge1xuICAgIHRoaXMuc3ltYm9scyA9IHN5bWJvbHM7XG4gIH1cblxuICBTZXF1ZW5jZS5wcm90b3R5cGUuc3ltYm9scyA9IHZvaWQgMDtcblxuICByZXR1cm4gU2VxdWVuY2U7XG5cbn0pKCk7XG5cblN5bWJvbCA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gU3ltYm9sKCkge31cblxuICByZXR1cm4gU3ltYm9sO1xuXG59KSgpO1xuXG5MaXRlcmFsID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKExpdGVyYWwsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIExpdGVyYWwodGV4dDEpIHtcbiAgICB0aGlzLnRleHQgPSB0ZXh0MTtcbiAgfVxuXG4gIExpdGVyYWwucHJvdG90eXBlLnRleHQgPSB2b2lkIDA7XG5cbiAgcmV0dXJuIExpdGVyYWw7XG5cbn0pKFN5bWJvbCk7XG5cbkhvbGUgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICBleHRlbmQoSG9sZSwgc3VwZXJDbGFzcyk7XG5cbiAgZnVuY3Rpb24gSG9sZShncm91cDEsIGlkZW50aWZpZXIxKSB7XG4gICAgdGhpcy5ncm91cCA9IGdyb3VwMTtcbiAgICB0aGlzLmlkZW50aWZpZXIgPSBpZGVudGlmaWVyMTtcbiAgfVxuXG4gIEhvbGUucHJvdG90eXBlLmdyb3VwID0gdm9pZCAwO1xuXG4gIEhvbGUucHJvdG90eXBlLmlkZW50aWZpZXIgPSB2b2lkIDA7XG5cbiAgcmV0dXJuIEhvbGU7XG5cbn0pKFN5bWJvbCk7XG5cblJlZ2V4ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKFJlZ2V4LCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBSZWdleChwYXR0ZXJuKSB7XG4gICAgdGhpcy5wYXR0ZXJuID0gcGF0dGVybjtcbiAgfVxuXG4gIFJlZ2V4LnByb3RvdHlwZS5wYXR0ZXJuID0gdm9pZCAwO1xuXG4gIHJldHVybiBSZWdleDtcblxufSkoU3ltYm9sKTtcblxuU3ludGF4VHJlZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gU3ludGF4VHJlZShncmFtbWFyLCBzdGFydEdyb3VwKSB7XG4gICAgdGhpcy5ncmFtbWFyID0gZ3JhbW1hcjtcbiAgICB0aGlzLnJvb3QgPSBuZXcgTm9kZShuZXcgU2VxdWVuY2UoW25ldyBIb2xlKHN0YXJ0R3JvdXAsICdzdGFydCcpXSkpO1xuICB9XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUucm9vdCA9IHZvaWQgMDtcblxuICBTeW50YXhUcmVlLnByb3RvdHlwZS5ncmFtbWFyID0gdm9pZCAwO1xuXG4gIHJldHVybiBTeW50YXhUcmVlO1xuXG59KSgpO1xuXG5Ob2RlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBOb2RlKHNlcXVlbmNlKSB7XG4gICAgdGhpcy5zZXF1ZW5jZSA9IHNlcXVlbmNlO1xuICAgIHRoaXMuaG9sZXMgPSB7fTtcbiAgICB0aGlzLnNlcXVlbmNlLnN5bWJvbHMuZm9yRWFjaCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihzeW0sIGluZGV4KSB7XG4gICAgICAgIGlmIChzeW0uY29uc3RydWN0b3IubmFtZSA9PT0gJ0hvbGUnKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW3N5bS5pZGVudGlmaWVyXSA9IHtcbiAgICAgICAgICAgIGdyb3VwOiBzeW0uZ3JvdXAsXG4gICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICB2YWx1ZTogbnVsbFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSkodGhpcykpO1xuICB9XG5cbiAgTm9kZS5wcm90b3R5cGUuc2VxdWVuY2UgPSB2b2lkIDA7XG5cbiAgTm9kZS5wcm90b3R5cGUuaG9sZXMgPSB2b2lkIDA7XG5cbiAgTm9kZS5wcm90b3R5cGUuZmlsbEhvbGUgPSBmdW5jdGlvbihob2xlSWQsIGZpbGxXaXRoKSB7XG4gICAgdmFyIGhvbGU7XG4gICAgaG9sZSA9IHRoaXMuaG9sZXNbaG9sZUlkXTtcbiAgICBpZiAoaG9sZSAhPSBudWxsKSB7XG4gICAgICBob2xlLnZhbHVlID0gZmlsbFdpdGg7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNlcXVlbmNlLnN5bWJvbHMubWFwKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbWF0Y2goc3ltYm9sLCB7XG4gICAgICAgICAgTGl0ZXJhbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgdGV4dDtcbiAgICAgICAgICAgIHRleHQgPSBhcmcudGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSG9sZTogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgZ3JvdXAsIGlkZW50aWZpZXI7XG4gICAgICAgICAgICBpZGVudGlmaWVyID0gYXJnLmlkZW50aWZpZXIsIGdyb3VwID0gYXJnLmdyb3VwO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlLnJlbmRlcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdgJyArIGdyb3VwICsgJ2AnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKS5qb2luKFwiXCIpO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLm5hdmlnYXRlID0gZnVuY3Rpb24ocGF0aCkge307XG5cbiAgcmV0dXJuIE5vZGU7XG5cbn0pKCk7XG5cbmdlbmVyYXRlQ29uc3RydWN0b3IgPSBmdW5jdGlvbihrbGFzcykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3M7XG4gICAgYXJncyA9IDEgPD0gYXJndW1lbnRzLmxlbmd0aCA/IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSA6IFtdO1xuICAgIHJldHVybiAoZnVuY3Rpb24oZnVuYywgYXJncywgY3Rvcikge1xuICAgICAgY3Rvci5wcm90b3R5cGUgPSBmdW5jLnByb3RvdHlwZTtcbiAgICAgIHZhciBjaGlsZCA9IG5ldyBjdG9yLCByZXN1bHQgPSBmdW5jLmFwcGx5KGNoaWxkLCBhcmdzKTtcbiAgICAgIHJldHVybiBPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0ID8gcmVzdWx0IDogY2hpbGQ7XG4gICAgfSkoa2xhc3MsIGFyZ3MsIGZ1bmN0aW9uKCl7fSk7XG4gIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgR3JhbW1hcjogR3JhbW1hcixcbiAgU2VxdWVuY2U6IGdlbmVyYXRlQ29uc3RydWN0b3IoU2VxdWVuY2UpLFxuICBTOiB7XG4gICAgTGl0ZXJhbDogZ2VuZXJhdGVDb25zdHJ1Y3RvcihMaXRlcmFsKSxcbiAgICBIb2xlOiBnZW5lcmF0ZUNvbnN0cnVjdG9yKEhvbGUpLFxuICAgIFJlZ2V4OiBnZW5lcmF0ZUNvbnN0cnVjdG9yKFJlZ2V4KVxuICB9LFxuICBTeW50YXhUcmVlOiBTeW50YXhUcmVlLFxuICBOb2RlOiBOb2RlXG59O1xuIiwidmFyIG1hdGNoO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1hdGNoID0gZnVuY3Rpb24ob2JqLCBmbnMpIHtcbiAgdmFyIGNvbnN0cnVjdG9yLCBmbjtcbiAgY29uc3RydWN0b3IgPSBvYmouY29uc3RydWN0b3I7XG4gIGZuID0gZm5zW2NvbnN0cnVjdG9yLm5hbWVdO1xuICB3aGlsZSAoIWZuICYmIGNvbnN0cnVjdG9yLl9fc3VwZXJfXykge1xuICAgIGNvbnN0cnVjdG9yID0gY29uc3RydWN0b3IuX19zdXBlcl9fLmNvbnN0cnVjdG9yO1xuICAgIGZuID0gZm5zW2NvbnN0cnVjdG9yLm5hbWVdO1xuICB9XG4gIGlmIChmbikge1xuICAgIHJldHVybiBmbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IEVycm9yKFwibm8gbWF0Y2ggZm9yIHR5cGUgXCIgKyBjb25zdHJ1Y3Rvci5uYW1lICsgXCIuXCIpO1xuICB9XG59O1xuIiwidmFyIEdyYW1tYXIsIEhvbGUsIExpdGVyYWwsIE5vZGUsIFJlZ2V4LCBTZXF1ZW5jZSwgU3ludGF4VHJlZSwgcmVmLCByZWYxO1xuXG5yZWYgPSByZXF1aXJlKCdTeW50YXgnKSwgR3JhbW1hciA9IHJlZi5HcmFtbWFyLCBTZXF1ZW5jZSA9IHJlZi5TZXF1ZW5jZSwgKHJlZjEgPSByZWYuUywgTGl0ZXJhbCA9IHJlZjEuTGl0ZXJhbCwgSG9sZSA9IHJlZjEuSG9sZSwgUmVnZXggPSByZWYxLlJlZ2V4KSwgU3ludGF4VHJlZSA9IHJlZi5TeW50YXhUcmVlLCBOb2RlID0gcmVmLk5vZGU7XG5cbmRlc2NyaWJlKCdjb25zdHJ1Y3RpbmcgcGhyYXNlcycsIGZ1bmN0aW9uKCkge1xuICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucnVsZXMgPSB7XG4gICAgICAnU1RBUlQnOiB7XG4gICAgICAgICdzdGFydCc6IFNlcXVlbmNlKFtIb2xlKCdORScsICdleHByJyldKVxuICAgICAgfSxcbiAgICAgICdORSc6IHtcbiAgICAgICAgJ251bS1saXQnOiBTZXF1ZW5jZShbTGl0ZXJhbCgnKG51bSAnKSwgSG9sZSgnTicsICdudW1iZXInKSwgTGl0ZXJhbCgnKScpXSksXG4gICAgICAgICdhcml0aC1vcCc6IFNlcXVlbmNlKFtMaXRlcmFsKCcoYXJpdGggJyksIEhvbGUoJ0EnLCAncmF0b3InKSwgTGl0ZXJhbCgnICcpLCBIb2xlKCdORScsICdyYW5kbCcpLCBMaXRlcmFsKCcgJyksIEhvbGUoJ05FJywgJ3JhbmRyJyksIExpdGVyYWwoJyknKV0pXG4gICAgICB9LFxuICAgICAgJ04nOiB7XG4gICAgICAgICdkaWdpdHMnOiBTZXF1ZW5jZShbUmVnZXgoJ1swLTldKycpXSlcbiAgICAgIH0sXG4gICAgICAnQSc6IHtcbiAgICAgICAgJysnOiBTZXF1ZW5jZShbTGl0ZXJhbCgnKycpXSksXG4gICAgICAgICctJzogU2VxdWVuY2UoW0xpdGVyYWwoJy0nKV0pLFxuICAgICAgICAnKic6IFNlcXVlbmNlKFtMaXRlcmFsKCcqJyldKSxcbiAgICAgICAgJy8nOiBTZXF1ZW5jZShbTGl0ZXJhbCgnLycpXSlcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuZ3JhbW1hciA9IG5ldyBHcmFtbWFyKHRoaXMucnVsZXMpO1xuICAgIHJldHVybiB0aGlzLnN5bnRheFRyZWUgPSBuZXcgU3ludGF4VHJlZSh0aGlzLmdyYW1tYXIsICdORScpO1xuICB9KTtcbiAgaXQoJ3N0YXJ0cyB3aXRoIHRoZSBkZWZhdWx0IGhvbGUnLCBmdW5jdGlvbigpIHtcbiAgICBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10gIT0gbnVsbCkudG9CZSh0cnVlKTtcbiAgICByZXR1cm4gZXhwZWN0KHRoaXMuc3ludGF4VHJlZS5yb290LmhvbGVzWydzdGFydCddLmdyb3VwKS50b0JlKCdORScpO1xuICB9KTtcbiAgaXQoJ2NhbiBhY2Nlc3Mgc2VxdWVuY2VzJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGV4cGVjdCh0aGlzLmdyYW1tYXIubWFrZVNlcXVlbmNlKCdORScsICdudW0tbGl0JykpLnRvRXF1YWwoU2VxdWVuY2UoW0xpdGVyYWwoJyhudW0gJyksIEhvbGUoJ04nLCAnbnVtYmVyJyksIExpdGVyYWwoJyknKV0pKTtcbiAgfSk7XG4gIGl0KCdhY2NlcHRzIHNpbXBsZSBmaWxscycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBudW1Ob2RlO1xuICAgIG51bU5vZGUgPSBuZXcgTm9kZSh0aGlzLmdyYW1tYXIubWFrZVNlcXVlbmNlKCdORScsICdudW0tbGl0JykpO1xuICAgIHRoaXMuc3ludGF4VHJlZS5yb290LmZpbGxIb2xlKCdzdGFydCcsIG51bU5vZGUpO1xuICAgIGV4cGVjdCh0aGlzLnN5bnRheFRyZWUucm9vdC5ob2xlc1snc3RhcnQnXS52YWx1ZSAhPSBudWxsKS50b0JlKHRydWUpO1xuICAgIHJldHVybiBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUpLnRvRXF1YWwobnVtTm9kZSk7XG4gIH0pO1xuICByZXR1cm4gaXQoJ2FjY2VwdHMgZGVlcCBmaWxscycsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcml0aE5vZGUsIG51bU5vZGU7XG4gICAgbnVtTm9kZSA9IG5ldyBOb2RlKHRoaXMuZ3JhbW1hci5tYWtlU2VxdWVuY2UoJ05FJywgJ251bS1saXQnKSk7XG4gICAgYXJpdGhOb2RlID0gbmV3IE5vZGUodGhpcy5ncmFtbWFyLm1ha2VTZXF1ZW5jZSgnTkUnLCAnYXJpdGgtb3AnKSk7XG4gICAgdGhpcy5zeW50YXhUcmVlLnJvb3QuZmlsbEhvbGUoJ3N0YXJ0JywgYXJpdGhOb2RlKTtcbiAgICBleHBlY3QodGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUuaG9sZXNbJ3JhbmRsJ10udmFsdWUpLnRvQmUobnVsbCk7XG4gICAgdGhpcy5zeW50YXhUcmVlLnJvb3QuaG9sZXNbJ3N0YXJ0J10udmFsdWUuZmlsbEhvbGUoJ3JhbmRsJywgbnVtTm9kZSk7XG4gICAgZXhwZWN0KHRoaXMuc3ludGF4VHJlZS5yb290LmhvbGVzWydzdGFydCddLnZhbHVlLmhvbGVzWydyYW5kbCddLnZhbHVlICE9IG51bGwpLnRvQmUodHJ1ZSk7XG4gICAgcmV0dXJuIGV4cGVjdCh0aGlzLnN5bnRheFRyZWUucm9vdC5ob2xlc1snc3RhcnQnXS52YWx1ZS5ob2xlc1sncmFuZGwnXS52YWx1ZSkudG9FcXVhbChudW1Ob2RlKTtcbiAgfSk7XG59KTtcbiJdfQ==
