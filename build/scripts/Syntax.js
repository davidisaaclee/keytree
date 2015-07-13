(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Grammar, Hole, Literal, Node, Regex, Sequence, Symbol, SyntaxTree, VarArgs, match,
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

VarArgs = (function(superClass) {
  extend(VarArgs, superClass);

  function VarArgs() {
    return VarArgs.__super__.constructor.apply(this, arguments);
  }

  return VarArgs;

})(Hole);

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
        return match(sym, {
          Hole: function(hole) {
            return _this.holes[hole.identifier] = {
              id: hole.identifier,
              group: hole.group,
              index: index,
              holeIndex: holeIndex++,
              value: null,
              fill: function(withNode) {
                this.value = withNode;
                withNode.notifyChanged(notify);
                return notify();
              }
            };
          },
          VarArgs: function(varargs) {}
        });
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiU3ludGF4LmNvZmZlZSIsInV0aWwvbWF0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgR3JhbW1hciwgSG9sZSwgTGl0ZXJhbCwgTm9kZSwgUmVnZXgsIFNlcXVlbmNlLCBTeW1ib2wsIFN5bnRheFRyZWUsIFZhckFyZ3MsIG1hdGNoLFxuICBleHRlbmQgPSBmdW5jdGlvbihjaGlsZCwgcGFyZW50KSB7IGZvciAodmFyIGtleSBpbiBwYXJlbnQpIHsgaWYgKGhhc1Byb3AuY2FsbChwYXJlbnQsIGtleSkpIGNoaWxkW2tleV0gPSBwYXJlbnRba2V5XTsgfSBmdW5jdGlvbiBjdG9yKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH0gY3Rvci5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlOyBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpOyBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlOyByZXR1cm4gY2hpbGQ7IH0sXG4gIGhhc1Byb3AgPSB7fS5oYXNPd25Qcm9wZXJ0eSxcbiAgYmluZCA9IGZ1bmN0aW9uKGZuLCBtZSl7IHJldHVybiBmdW5jdGlvbigpeyByZXR1cm4gZm4uYXBwbHkobWUsIGFyZ3VtZW50cyk7IH07IH0sXG4gIHNsaWNlID0gW10uc2xpY2U7XG5cbm1hdGNoID0gcmVxdWlyZSgndXRpbC9tYXRjaCcpO1xuXG5HcmFtbWFyID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBHcmFtbWFyKHByb2R1Y3Rpb25zKSB7XG4gICAgdGhpcy5wcm9kdWN0aW9ucyA9IHByb2R1Y3Rpb25zO1xuICB9XG5cbiAgR3JhbW1hci5wcm90b3R5cGUucHJvZHVjdGlvbnMgPSB2b2lkIDA7XG5cbiAgR3JhbW1hci5wcm90b3R5cGUubWFrZVNlcXVlbmNlID0gZnVuY3Rpb24oZ3JvdXBJZCwgc2VxdWVuY2VJZCkge1xuICAgIHZhciByZWY7XG4gICAgcmV0dXJuIChyZWYgPSB0aGlzLnByb2R1Y3Rpb25zW2dyb3VwSWRdKSAhPSBudWxsID8gcmVmW3NlcXVlbmNlSWRdIDogdm9pZCAwO1xuICB9O1xuXG4gIHJldHVybiBHcmFtbWFyO1xuXG59KSgpO1xuXG5TZXF1ZW5jZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gU2VxdWVuY2Uoc3ltYm9scykge1xuICAgIHRoaXMuc3ltYm9scyA9IHN5bWJvbHM7XG4gIH1cblxuICBTZXF1ZW5jZS5wcm90b3R5cGUuc3ltYm9scyA9IHZvaWQgMDtcblxuICBTZXF1ZW5jZS5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnN5bWJvbHMubWFwKGZ1bmN0aW9uKHN5bSkge1xuICAgICAgcmV0dXJuIHN5bS5kaXNwbGF5KCk7XG4gICAgfSkuam9pbignJyk7XG4gIH07XG5cbiAgU2VxdWVuY2UucHJvdG90eXBlLnRlbXBsYXRlU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3ltYm9scy5tYXAoZnVuY3Rpb24oc3ltKSB7XG4gICAgICByZXR1cm4gbWF0Y2goc3ltLCB7XG4gICAgICAgIExpdGVyYWw6IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICAgIHZhciB0ZXh0O1xuICAgICAgICAgIHRleHQgPSBhcmcudGV4dDtcbiAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfSxcbiAgICAgICAgSG9sZTogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgdmFyIGdyb3VwLCBpZGVudGlmaWVyO1xuICAgICAgICAgIGlkZW50aWZpZXIgPSBhcmcuaWRlbnRpZmllciwgZ3JvdXAgPSBhcmcuZ3JvdXA7XG4gICAgICAgICAgcmV0dXJuIFwiYFwiICsgaWRlbnRpZmllciArIFwiYFwiO1xuICAgICAgICB9LFxuICAgICAgICBSZWdleDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgdmFyIHBhdHRlcm47XG4gICAgICAgICAgcGF0dGVybiA9IGFyZy5wYXR0ZXJuO1xuICAgICAgICAgIHJldHVybiBwYXR0ZXJuO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KS5qb2luKCcnKTtcbiAgfTtcblxuICByZXR1cm4gU2VxdWVuY2U7XG5cbn0pKCk7XG5cblN5bWJvbCA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gU3ltYm9sKCkge31cblxuICBTeW1ib2wucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJ2Rpc3BsYXkoKSBub3QgaW1wbGVtZW50ZWQuJztcbiAgfTtcblxuICByZXR1cm4gU3ltYm9sO1xuXG59KSgpO1xuXG5MaXRlcmFsID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKExpdGVyYWwsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIExpdGVyYWwodGV4dDEpIHtcbiAgICB0aGlzLnRleHQgPSB0ZXh0MTtcbiAgfVxuXG4gIExpdGVyYWwucHJvdG90eXBlLnRleHQgPSB2b2lkIDA7XG5cbiAgTGl0ZXJhbC5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnRleHQ7XG4gIH07XG5cbiAgcmV0dXJuIExpdGVyYWw7XG5cbn0pKFN5bWJvbCk7XG5cbkhvbGUgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICBleHRlbmQoSG9sZSwgc3VwZXJDbGFzcyk7XG5cbiAgZnVuY3Rpb24gSG9sZShncm91cDEsIGlkZW50aWZpZXIxKSB7XG4gICAgdGhpcy5ncm91cCA9IGdyb3VwMTtcbiAgICB0aGlzLmlkZW50aWZpZXIgPSBpZGVudGlmaWVyMTtcbiAgfVxuXG4gIEhvbGUucHJvdG90eXBlLmdyb3VwID0gdm9pZCAwO1xuXG4gIEhvbGUucHJvdG90eXBlLmlkZW50aWZpZXIgPSB2b2lkIDA7XG5cbiAgSG9sZS5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBcIiZsdDtcIiArIHRoaXMuaWRlbnRpZmllciArIFwiJmd0O1wiO1xuICB9O1xuXG4gIHJldHVybiBIb2xlO1xuXG59KShTeW1ib2wpO1xuXG5WYXJBcmdzID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKFZhckFyZ3MsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIFZhckFyZ3MoKSB7XG4gICAgcmV0dXJuIFZhckFyZ3MuX19zdXBlcl9fLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gVmFyQXJncztcblxufSkoSG9sZSk7XG5cblJlZ2V4ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKFJlZ2V4LCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBSZWdleChwYXR0ZXJuMSkge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm4xO1xuICB9XG5cbiAgUmVnZXgucHJvdG90eXBlLnBhdHRlcm4gPSB2b2lkIDA7XG5cbiAgUmVnZXgucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCImbHQ7XFxcXFwiICsgdGhpcy5wYXR0ZXJuICsgXCImZ3Q7XCI7XG4gIH07XG5cbiAgcmV0dXJuIFJlZ2V4O1xuXG59KShTeW1ib2wpO1xuXG5TeW50YXhUcmVlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBTeW50YXhUcmVlKGdyYW1tYXIsIHN0YXJ0R3JvdXApIHtcbiAgICB0aGlzLmdyYW1tYXIgPSBncmFtbWFyO1xuICAgIHRoaXMuX25vdGlmeUNoYW5nZWQgPSBiaW5kKHRoaXMuX25vdGlmeUNoYW5nZWQsIHRoaXMpO1xuICAgIHRoaXMucm9vdCA9IG5ldyBOb2RlKG5ldyBTZXF1ZW5jZShbbmV3IEhvbGUoc3RhcnRHcm91cCwgJ3N0YXJ0JyldKSwgdGhpcyk7XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG4gIH1cblxuICBTeW50YXhUcmVlLnByb3RvdHlwZS5yb290ID0gdm9pZCAwO1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLmdyYW1tYXIgPSB2b2lkIDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuZmlsbEhvbGUgPSBmdW5jdGlvbihwYXRoLCBmaWxsV2l0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICB0aGlzLnJvb3QubmF2aWdhdGVIb2xlKHBhdGgsIHVzZU51bWVyaWNQYXRoKS5maWxsKGZpbGxXaXRoKTtcbiAgICByZXR1cm4gdGhpcy5fbm90aWZ5Q2hhbmdlZCgpO1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLm5hdmlnYXRlSG9sZSA9IGZ1bmN0aW9uKHBhdGgsIHVzZU51bWVyaWNQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdC5uYXZpZ2F0ZUhvbGUocGF0aCwgdXNlTnVtZXJpY1BhdGgpO1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLl9udW1iZXJPZkNhbGxiYWNrcyA9IDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUubm90aWZ5Q2hhbmdlZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiSWQ7XG4gICAgY2JJZCA9IFwiI2NiLVwiICsgKHRoaXMuX251bWJlck9mQ2FsbGJhY2tzKyspO1xuICAgIHRoaXMuX2xpc3RlbmVyc1tjYklkXSA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWxldGUgX2xpc3RlbmVyc1tjYklkXTtcbiAgICB9O1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLl9ub3RpZnlDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8sIGNiLCByZWYsIHJlc3VsdHM7XG4gICAgcmVmID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF8gaW4gcmVmKSB7XG4gICAgICBjYiA9IHJlZltfXTtcbiAgICAgIHJlc3VsdHMucHVzaChjYigpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgcmV0dXJuIFN5bnRheFRyZWU7XG5cbn0pKCk7XG5cbk5vZGUgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIE5vZGUoc2VxdWVuY2UsIHBhcmVudCkge1xuICAgIHZhciBob2xlSW5kZXgsIG5vdGlmeTtcbiAgICB0aGlzLnNlcXVlbmNlID0gc2VxdWVuY2U7XG4gICAgdGhpcy5fbm90aWZ5Q2hhbmdlZCA9IGJpbmQodGhpcy5fbm90aWZ5Q2hhbmdlZCwgdGhpcyk7XG4gICAgdGhpcy5ob2xlcyA9IHt9O1xuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuICAgIGlmICgocGFyZW50ICE9IG51bGwgPyBwYXJlbnQuX25vdGlmeUNoYW5nZWQgOiB2b2lkIDApICE9IG51bGwpIHtcbiAgICAgIHRoaXMubm90aWZ5Q2hhbmdlZChwYXJlbnQuX25vdGlmeUNoYW5nZWQpO1xuICAgIH1cbiAgICBob2xlSW5kZXggPSAwO1xuICAgIG5vdGlmeSA9IHRoaXMuX25vdGlmeUNoYW5nZWQ7XG4gICAgdGhpcy5zZXF1ZW5jZS5zeW1ib2xzLmZvckVhY2goKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc3ltLCBpbmRleCkge1xuICAgICAgICByZXR1cm4gbWF0Y2goc3ltLCB7XG4gICAgICAgICAgSG9sZTogZnVuY3Rpb24oaG9sZSkge1xuICAgICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW2hvbGUuaWRlbnRpZmllcl0gPSB7XG4gICAgICAgICAgICAgIGlkOiBob2xlLmlkZW50aWZpZXIsXG4gICAgICAgICAgICAgIGdyb3VwOiBob2xlLmdyb3VwLFxuICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgIGhvbGVJbmRleDogaG9sZUluZGV4KyssXG4gICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgICBmaWxsOiBmdW5jdGlvbih3aXRoTm9kZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSB3aXRoTm9kZTtcbiAgICAgICAgICAgICAgICB3aXRoTm9kZS5ub3RpZnlDaGFuZ2VkKG5vdGlmeSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vdGlmeSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgVmFyQXJnczogZnVuY3Rpb24odmFyYXJncykge31cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKTtcbiAgfVxuXG4gIE5vZGUucHJvdG90eXBlLnNlcXVlbmNlID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLmhvbGVzID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNlcXVlbmNlLnN5bWJvbHMubWFwKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbWF0Y2goc3ltYm9sLCB7XG4gICAgICAgICAgTGl0ZXJhbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgdGV4dDtcbiAgICAgICAgICAgIHRleHQgPSBhcmcudGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSG9sZTogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgZ3JvdXAsIGlkZW50aWZpZXI7XG4gICAgICAgICAgICBpZGVudGlmaWVyID0gYXJnLmlkZW50aWZpZXIsIGdyb3VwID0gYXJnLmdyb3VwO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlLnJlbmRlcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdgJyArIGdyb3VwICsgJ2AnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKS5qb2luKFwiXCIpO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLmdldE50aENoaWxkID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICB2YXIgaSwga2V5LCBsZW4sIHJlZjtcbiAgICByZWYgPSBPYmplY3Qua2V5cyh0aGlzLmhvbGVzKTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGtleSA9IHJlZltpXTtcbiAgICAgIGlmICh0aGlzLmhvbGVzW2tleV0uaG9sZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ob2xlc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5nZXRDaGlsZCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaG9sZXNbaWRdO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLmlkUGF0aEZyb21OdW1lcmljUGF0aCA9IGZ1bmN0aW9uKG51bWVyaWNQYXRoKSB7XG4gICAgdmFyIGhkLCBuZXh0SG9sZSwgdGw7XG4gICAgaGQgPSBudW1lcmljUGF0aFswXSwgdGwgPSAyIDw9IG51bWVyaWNQYXRoLmxlbmd0aCA/IHNsaWNlLmNhbGwobnVtZXJpY1BhdGgsIDEpIDogW107XG4gICAgbmV4dEhvbGUgPSB0aGlzLmdldE50aENoaWxkKGhkKTtcbiAgICBpZiAobmV4dEhvbGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0bC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbbmV4dEhvbGUuaWRdO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV4dEhvbGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gW25leHRIb2xlLmlkXS5jb25jYXQoc2xpY2UuY2FsbChuZXh0SG9sZS52YWx1ZS5pZFBhdGhGcm9tTnVtZXJpY1BhdGgodGwpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLndhbGsgPSBmdW5jdGlvbihwYXRoLCBvcHRpb25zKSB7XG4gICAgdmFyIGhkLCBuZXh0SG9sZSwgcmVmLCB0bDtcbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGhkID0gcGF0aFswXSwgdGwgPSAyIDw9IHBhdGgubGVuZ3RoID8gc2xpY2UuY2FsbChwYXRoLCAxKSA6IFtdO1xuICAgIG5leHRIb2xlID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnVzZU51bWVyaWNQYXRoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmdldE50aENoaWxkKGhkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZ2V0Q2hpbGQoaGQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKCk7XG4gICAgaWYgKG5leHRIb2xlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoKChyZWYgPSBvcHRpb25zLmZvbGQpICE9IG51bGwgPyByZWYucHJvYyA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgb3B0aW9ucy5mb2xkLmFjYyA9IG9wdGlvbnMuZm9sZC5wcm9jKG9wdGlvbnMuZm9sZC5hY2MsIG5leHRIb2xlKTtcbiAgICB9XG4gICAgaWYgKHRsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKG9wdGlvbnMuZW5kRm4gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5lbmRGbihuZXh0SG9sZS52YWx1ZSwgbmV4dEhvbGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHRIb2xlLnZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV4dEhvbGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbmV4dEhvbGUudmFsdWUud2Fsayh0bCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUubmF2aWdhdGUgPSBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHJldHVybiB0aGlzLndhbGsocGF0aCwge1xuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUubmF2aWdhdGVIb2xlID0gZnVuY3Rpb24ocGF0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICByZXR1cm4gdGhpcy53YWxrKHBhdGgsIHtcbiAgICAgIGVuZEZuOiBmdW5jdGlvbih2YWwsIGhvbGUpIHtcbiAgICAgICAgcmV0dXJuIGhvbGU7XG4gICAgICB9LFxuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuX251bWJlck9mQ2FsbGJhY2tzID0gMDtcblxuICBOb2RlLnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VkID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgY2JJZDtcbiAgICBjYklkID0gXCIjY2ItXCIgKyAodGhpcy5fbnVtYmVyT2ZDYWxsYmFja3MrKyk7XG4gICAgdGhpcy5fbGlzdGVuZXJzW2NiSWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZSBfbGlzdGVuZXJzW2NiSWRdO1xuICAgIH07XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuX25vdGlmeUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgXywgY2IsIHJlZiwgcmVzdWx0cztcbiAgICByZWYgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoXyBpbiByZWYpIHtcbiAgICAgIGNiID0gcmVmW19dO1xuICAgICAgcmVzdWx0cy5wdXNoKGNiKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICByZXR1cm4gTm9kZTtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEdyYW1tYXI6IEdyYW1tYXIsXG4gIFNlcXVlbmNlOiBTZXF1ZW5jZSxcbiAgUzoge1xuICAgIExpdGVyYWw6IExpdGVyYWwsXG4gICAgSG9sZTogSG9sZSxcbiAgICBSZWdleDogUmVnZXhcbiAgfSxcbiAgU3ludGF4VHJlZTogU3ludGF4VHJlZSxcbiAgTm9kZTogTm9kZVxufTtcbiIsInZhciBtYXRjaDtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaCA9IGZ1bmN0aW9uKG9iaiwgZm5zKSB7XG4gIHZhciBjb25zdHJ1Y3RvciwgZm47XG4gIGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yO1xuICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgd2hpbGUgKCFmbiAmJiBjb25zdHJ1Y3Rvci5fX3N1cGVyX18pIHtcbiAgICBjb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yLl9fc3VwZXJfXy5jb25zdHJ1Y3RvcjtcbiAgICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgfVxuICBpZiAoZm4pIHtcbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIm5vIG1hdGNoIGZvciB0eXBlIFwiICsgY29uc3RydWN0b3IubmFtZSArIFwiLlwiKTtcbiAgfVxufTtcbiJdfQ==
