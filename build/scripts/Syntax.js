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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiU3ludGF4LmNvZmZlZSIsInV0aWwvbWF0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBHcmFtbWFyLCBIb2xlLCBMaXRlcmFsLCBOb2RlLCBSZWdleCwgU2VxdWVuY2UsIFN5bWJvbCwgU3ludGF4VHJlZSwgbWF0Y2gsXG4gIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBiaW5kID0gZnVuY3Rpb24oZm4sIG1lKXsgcmV0dXJuIGZ1bmN0aW9uKCl7IHJldHVybiBmbi5hcHBseShtZSwgYXJndW1lbnRzKTsgfTsgfSxcbiAgc2xpY2UgPSBbXS5zbGljZTtcblxubWF0Y2ggPSByZXF1aXJlKCd1dGlsL21hdGNoJyk7XG5cbkdyYW1tYXIgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIEdyYW1tYXIocHJvZHVjdGlvbnMpIHtcbiAgICB0aGlzLnByb2R1Y3Rpb25zID0gcHJvZHVjdGlvbnM7XG4gIH1cblxuICBHcmFtbWFyLnByb3RvdHlwZS5wcm9kdWN0aW9ucyA9IHZvaWQgMDtcblxuICBHcmFtbWFyLnByb3RvdHlwZS5tYWtlU2VxdWVuY2UgPSBmdW5jdGlvbihncm91cElkLCBzZXF1ZW5jZUlkKSB7XG4gICAgdmFyIHJlZjtcbiAgICByZXR1cm4gKHJlZiA9IHRoaXMucHJvZHVjdGlvbnNbZ3JvdXBJZF0pICE9IG51bGwgPyByZWZbc2VxdWVuY2VJZF0gOiB2b2lkIDA7XG4gIH07XG5cbiAgcmV0dXJuIEdyYW1tYXI7XG5cbn0pKCk7XG5cblNlcXVlbmNlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBTZXF1ZW5jZShzeW1ib2xzKSB7XG4gICAgdGhpcy5zeW1ib2xzID0gc3ltYm9scztcbiAgfVxuXG4gIFNlcXVlbmNlLnByb3RvdHlwZS5zeW1ib2xzID0gdm9pZCAwO1xuXG4gIFNlcXVlbmNlLnByb3RvdHlwZS5kaXNwbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuc3ltYm9scy5tYXAoZnVuY3Rpb24oc3ltKSB7XG4gICAgICByZXR1cm4gc3ltLmRpc3BsYXkoKTtcbiAgICB9KS5qb2luKCcnKTtcbiAgfTtcblxuICBTZXF1ZW5jZS5wcm90b3R5cGUudGVtcGxhdGVTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zeW1ib2xzLm1hcChmdW5jdGlvbihzeW0pIHtcbiAgICAgIHJldHVybiBtYXRjaChzeW0sIHtcbiAgICAgICAgTGl0ZXJhbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgdmFyIHRleHQ7XG4gICAgICAgICAgdGV4dCA9IGFyZy50ZXh0O1xuICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICB9LFxuICAgICAgICBIb2xlOiBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICB2YXIgZ3JvdXAsIGlkZW50aWZpZXI7XG4gICAgICAgICAgaWRlbnRpZmllciA9IGFyZy5pZGVudGlmaWVyLCBncm91cCA9IGFyZy5ncm91cDtcbiAgICAgICAgICByZXR1cm4gXCJgXCIgKyBpZGVudGlmaWVyICsgXCJgXCI7XG4gICAgICAgIH0sXG4gICAgICAgIFJlZ2V4OiBmdW5jdGlvbihhcmcpIHtcbiAgICAgICAgICB2YXIgcGF0dGVybjtcbiAgICAgICAgICBwYXR0ZXJuID0gYXJnLnBhdHRlcm47XG4gICAgICAgICAgcmV0dXJuIHBhdHRlcm47XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pLmpvaW4oJycpO1xuICB9O1xuXG4gIHJldHVybiBTZXF1ZW5jZTtcblxufSkoKTtcblxuU3ltYm9sID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBTeW1ib2woKSB7fVxuXG4gIFN5bWJvbC5wcm90b3R5cGUuZGlzcGxheSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAnZGlzcGxheSgpIG5vdCBpbXBsZW1lbnRlZC4nO1xuICB9O1xuXG4gIHJldHVybiBTeW1ib2w7XG5cbn0pKCk7XG5cbkxpdGVyYWwgPSAoZnVuY3Rpb24oc3VwZXJDbGFzcykge1xuICBleHRlbmQoTGl0ZXJhbCwgc3VwZXJDbGFzcyk7XG5cbiAgZnVuY3Rpb24gTGl0ZXJhbCh0ZXh0MSkge1xuICAgIHRoaXMudGV4dCA9IHRleHQxO1xuICB9XG5cbiAgTGl0ZXJhbC5wcm90b3R5cGUudGV4dCA9IHZvaWQgMDtcblxuICBMaXRlcmFsLnByb3RvdHlwZS5kaXNwbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudGV4dDtcbiAgfTtcblxuICByZXR1cm4gTGl0ZXJhbDtcblxufSkoU3ltYm9sKTtcblxuSG9sZSA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChIb2xlLCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBIb2xlKGdyb3VwMSwgaWRlbnRpZmllcjEpIHtcbiAgICB0aGlzLmdyb3VwID0gZ3JvdXAxO1xuICAgIHRoaXMuaWRlbnRpZmllciA9IGlkZW50aWZpZXIxO1xuICB9XG5cbiAgSG9sZS5wcm90b3R5cGUuZ3JvdXAgPSB2b2lkIDA7XG5cbiAgSG9sZS5wcm90b3R5cGUuaWRlbnRpZmllciA9IHZvaWQgMDtcblxuICBIb2xlLnByb3RvdHlwZS5kaXNwbGF5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIFwiJmx0O1wiICsgdGhpcy5pZGVudGlmaWVyICsgXCImZ3Q7XCI7XG4gIH07XG5cbiAgcmV0dXJuIEhvbGU7XG5cbn0pKFN5bWJvbCk7XG5cblJlZ2V4ID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKFJlZ2V4LCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBSZWdleChwYXR0ZXJuMSkge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm4xO1xuICB9XG5cbiAgUmVnZXgucHJvdG90eXBlLnBhdHRlcm4gPSB2b2lkIDA7XG5cbiAgUmVnZXgucHJvdG90eXBlLmRpc3BsYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gXCImbHQ7XFxcXFwiICsgdGhpcy5wYXR0ZXJuICsgXCImZ3Q7XCI7XG4gIH07XG5cbiAgcmV0dXJuIFJlZ2V4O1xuXG59KShTeW1ib2wpO1xuXG5TeW50YXhUcmVlID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBTeW50YXhUcmVlKGdyYW1tYXIsIHN0YXJ0R3JvdXApIHtcbiAgICB0aGlzLmdyYW1tYXIgPSBncmFtbWFyO1xuICAgIHRoaXMuX25vdGlmeUNoYW5nZWQgPSBiaW5kKHRoaXMuX25vdGlmeUNoYW5nZWQsIHRoaXMpO1xuICAgIHRoaXMucm9vdCA9IG5ldyBOb2RlKG5ldyBTZXF1ZW5jZShbbmV3IEhvbGUoc3RhcnRHcm91cCwgJ3N0YXJ0JyldKSwgdGhpcyk7XG4gICAgdGhpcy5fbGlzdGVuZXJzID0ge307XG4gIH1cblxuICBTeW50YXhUcmVlLnByb3RvdHlwZS5yb290ID0gdm9pZCAwO1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLmdyYW1tYXIgPSB2b2lkIDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuZmlsbEhvbGUgPSBmdW5jdGlvbihwYXRoLCBmaWxsV2l0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICB0aGlzLnJvb3QubmF2aWdhdGVIb2xlKHBhdGgsIHVzZU51bWVyaWNQYXRoKS5maWxsKGZpbGxXaXRoKTtcbiAgICByZXR1cm4gdGhpcy5fbm90aWZ5Q2hhbmdlZCgpO1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLm5hdmlnYXRlSG9sZSA9IGZ1bmN0aW9uKHBhdGgsIHVzZU51bWVyaWNQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMucm9vdC5uYXZpZ2F0ZUhvbGUocGF0aCwgdXNlTnVtZXJpY1BhdGgpO1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLl9udW1iZXJPZkNhbGxiYWNrcyA9IDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUubm90aWZ5Q2hhbmdlZCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdmFyIGNiSWQ7XG4gICAgY2JJZCA9IFwiI2NiLVwiICsgKHRoaXMuX251bWJlck9mQ2FsbGJhY2tzKyspO1xuICAgIHRoaXMuX2xpc3RlbmVyc1tjYklkXSA9IGNhbGxiYWNrO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBkZWxldGUgX2xpc3RlbmVyc1tjYklkXTtcbiAgICB9O1xuICB9O1xuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLl9ub3RpZnlDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIF8sIGNiLCByZWYsIHJlc3VsdHM7XG4gICAgcmVmID0gdGhpcy5fbGlzdGVuZXJzO1xuICAgIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKF8gaW4gcmVmKSB7XG4gICAgICBjYiA9IHJlZltfXTtcbiAgICAgIHJlc3VsdHMucHVzaChjYigpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdHM7XG4gIH07XG5cbiAgcmV0dXJuIFN5bnRheFRyZWU7XG5cbn0pKCk7XG5cbk5vZGUgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIE5vZGUoc2VxdWVuY2UsIHBhcmVudCkge1xuICAgIHZhciBob2xlSW5kZXgsIG5vdGlmeTtcbiAgICB0aGlzLnNlcXVlbmNlID0gc2VxdWVuY2U7XG4gICAgdGhpcy5fbm90aWZ5Q2hhbmdlZCA9IGJpbmQodGhpcy5fbm90aWZ5Q2hhbmdlZCwgdGhpcyk7XG4gICAgdGhpcy5ob2xlcyA9IHt9O1xuICAgIHRoaXMuX2xpc3RlbmVycyA9IHt9O1xuICAgIGlmICgocGFyZW50ICE9IG51bGwgPyBwYXJlbnQuX25vdGlmeUNoYW5nZWQgOiB2b2lkIDApICE9IG51bGwpIHtcbiAgICAgIHRoaXMubm90aWZ5Q2hhbmdlZChwYXJlbnQuX25vdGlmeUNoYW5nZWQpO1xuICAgIH1cbiAgICBob2xlSW5kZXggPSAwO1xuICAgIG5vdGlmeSA9IHRoaXMuX25vdGlmeUNoYW5nZWQ7XG4gICAgdGhpcy5zZXF1ZW5jZS5zeW1ib2xzLmZvckVhY2goKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc3ltLCBpbmRleCkge1xuICAgICAgICBpZiAoc3ltLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdIb2xlJykge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5ob2xlc1tzeW0uaWRlbnRpZmllcl0gPSB7XG4gICAgICAgICAgICBpZDogc3ltLmlkZW50aWZpZXIsXG4gICAgICAgICAgICBncm91cDogc3ltLmdyb3VwLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgaG9sZUluZGV4OiBob2xlSW5kZXgrKyxcbiAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgZmlsbDogZnVuY3Rpb24od2l0aE5vZGUpIHtcbiAgICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHdpdGhOb2RlO1xuICAgICAgICAgICAgICB3aXRoTm9kZS5ub3RpZnlDaGFuZ2VkKG5vdGlmeSk7XG4gICAgICAgICAgICAgIHJldHVybiBub3RpZnkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKTtcbiAgfVxuXG4gIE5vZGUucHJvdG90eXBlLnNlcXVlbmNlID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLmhvbGVzID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnNlcXVlbmNlLnN5bWJvbHMubWFwKChmdW5jdGlvbihfdGhpcykge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKHN5bWJvbCkge1xuICAgICAgICByZXR1cm4gbWF0Y2goc3ltYm9sLCB7XG4gICAgICAgICAgTGl0ZXJhbDogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgdGV4dDtcbiAgICAgICAgICAgIHRleHQgPSBhcmcudGV4dDtcbiAgICAgICAgICAgIHJldHVybiB0ZXh0O1xuICAgICAgICAgIH0sXG4gICAgICAgICAgSG9sZTogZnVuY3Rpb24oYXJnKSB7XG4gICAgICAgICAgICB2YXIgZ3JvdXAsIGlkZW50aWZpZXI7XG4gICAgICAgICAgICBpZGVudGlmaWVyID0gYXJnLmlkZW50aWZpZXIsIGdyb3VwID0gYXJnLmdyb3VwO1xuICAgICAgICAgICAgaWYgKF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLmhvbGVzW2lkZW50aWZpZXJdLnZhbHVlLnJlbmRlcigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuICdgJyArIGdyb3VwICsgJ2AnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKS5qb2luKFwiXCIpO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLmdldE50aENoaWxkID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICB2YXIgaSwga2V5LCBsZW4sIHJlZjtcbiAgICByZWYgPSBPYmplY3Qua2V5cyh0aGlzLmhvbGVzKTtcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGtleSA9IHJlZltpXTtcbiAgICAgIGlmICh0aGlzLmhvbGVzW2tleV0uaG9sZUluZGV4ID09PSBpbmRleCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ob2xlc1trZXldO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5nZXRDaGlsZCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuIHRoaXMuaG9sZXNbaWRdO1xuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLmlkUGF0aEZyb21OdW1lcmljUGF0aCA9IGZ1bmN0aW9uKG51bWVyaWNQYXRoKSB7XG4gICAgdmFyIGhkLCBuZXh0SG9sZSwgdGw7XG4gICAgaGQgPSBudW1lcmljUGF0aFswXSwgdGwgPSAyIDw9IG51bWVyaWNQYXRoLmxlbmd0aCA/IHNsaWNlLmNhbGwobnVtZXJpY1BhdGgsIDEpIDogW107XG4gICAgbmV4dEhvbGUgPSB0aGlzLmdldE50aENoaWxkKGhkKTtcbiAgICBpZiAobmV4dEhvbGUgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmICh0bC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBbbmV4dEhvbGUuaWRdO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV4dEhvbGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gW25leHRIb2xlLmlkXS5jb25jYXQoc2xpY2UuY2FsbChuZXh0SG9sZS52YWx1ZS5pZFBhdGhGcm9tTnVtZXJpY1BhdGgodGwpKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIE5vZGUucHJvdG90eXBlLndhbGsgPSBmdW5jdGlvbihwYXRoLCBvcHRpb25zKSB7XG4gICAgdmFyIGhkLCBuZXh0SG9sZSwgcmVmLCB0bDtcbiAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIGhkID0gcGF0aFswXSwgdGwgPSAyIDw9IHBhdGgubGVuZ3RoID8gc2xpY2UuY2FsbChwYXRoLCAxKSA6IFtdO1xuICAgIG5leHRIb2xlID0gKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnVzZU51bWVyaWNQYXRoKSB7XG4gICAgICAgICAgcmV0dXJuIF90aGlzLmdldE50aENoaWxkKGhkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gX3RoaXMuZ2V0Q2hpbGQoaGQpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKCk7XG4gICAgaWYgKG5leHRIb2xlID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoKChyZWYgPSBvcHRpb25zLmZvbGQpICE9IG51bGwgPyByZWYucHJvYyA6IHZvaWQgMCkgIT0gbnVsbCkge1xuICAgICAgb3B0aW9ucy5mb2xkLmFjYyA9IG9wdGlvbnMuZm9sZC5wcm9jKG9wdGlvbnMuZm9sZC5hY2MsIG5leHRIb2xlKTtcbiAgICB9XG4gICAgaWYgKHRsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgaWYgKG9wdGlvbnMuZW5kRm4gIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5lbmRGbihuZXh0SG9sZS52YWx1ZSwgbmV4dEhvbGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5leHRIb2xlLnZhbHVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV4dEhvbGUudmFsdWUgIT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbmV4dEhvbGUudmFsdWUud2Fsayh0bCwgb3B0aW9ucyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUubmF2aWdhdGUgPSBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHJldHVybiB0aGlzLndhbGsocGF0aCwge1xuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUubmF2aWdhdGVIb2xlID0gZnVuY3Rpb24ocGF0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICByZXR1cm4gdGhpcy53YWxrKHBhdGgsIHtcbiAgICAgIGVuZEZuOiBmdW5jdGlvbih2YWwsIGhvbGUpIHtcbiAgICAgICAgcmV0dXJuIGhvbGU7XG4gICAgICB9LFxuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuX251bWJlck9mQ2FsbGJhY2tzID0gMDtcblxuICBOb2RlLnByb3RvdHlwZS5ub3RpZnlDaGFuZ2VkID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgY2JJZDtcbiAgICBjYklkID0gXCIjY2ItXCIgKyAodGhpcy5fbnVtYmVyT2ZDYWxsYmFja3MrKyk7XG4gICAgdGhpcy5fbGlzdGVuZXJzW2NiSWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGRlbGV0ZSBfbGlzdGVuZXJzW2NiSWRdO1xuICAgIH07XG4gIH07XG5cbiAgTm9kZS5wcm90b3R5cGUuX25vdGlmeUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgXywgY2IsIHJlZiwgcmVzdWx0cztcbiAgICByZWYgPSB0aGlzLl9saXN0ZW5lcnM7XG4gICAgcmVzdWx0cyA9IFtdO1xuICAgIGZvciAoXyBpbiByZWYpIHtcbiAgICAgIGNiID0gcmVmW19dO1xuICAgICAgcmVzdWx0cy5wdXNoKGNiKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICByZXR1cm4gTm9kZTtcblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEdyYW1tYXI6IEdyYW1tYXIsXG4gIFNlcXVlbmNlOiBTZXF1ZW5jZSxcbiAgUzoge1xuICAgIExpdGVyYWw6IExpdGVyYWwsXG4gICAgSG9sZTogSG9sZSxcbiAgICBSZWdleDogUmVnZXhcbiAgfSxcbiAgU3ludGF4VHJlZTogU3ludGF4VHJlZSxcbiAgTm9kZTogTm9kZVxufTtcbiIsInZhciBtYXRjaDtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaCA9IGZ1bmN0aW9uKG9iaiwgZm5zKSB7XG4gIHZhciBjb25zdHJ1Y3RvciwgZm47XG4gIGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yO1xuICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgd2hpbGUgKCFmbiAmJiBjb25zdHJ1Y3Rvci5fX3N1cGVyX18pIHtcbiAgICBjb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yLl9fc3VwZXJfXy5jb25zdHJ1Y3RvcjtcbiAgICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgfVxuICBpZiAoZm4pIHtcbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIm5vIG1hdGNoIGZvciB0eXBlIFwiICsgY29uc3RydWN0b3IubmFtZSArIFwiLlwiKTtcbiAgfVxufTtcbiJdfQ==
