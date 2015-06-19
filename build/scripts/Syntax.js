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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiU3ludGF4LmNvZmZlZSIsInV0aWwvbWF0Y2guY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBHcmFtbWFyLCBIb2xlLCBMaXRlcmFsLCBOb2RlLCBSZWdleCwgU2VxdWVuY2UsIFN5bWJvbCwgU3ludGF4VHJlZSwgZ2VuZXJhdGVDb25zdHJ1Y3RvciwgbWF0Y2gsXG4gIGV4dGVuZCA9IGZ1bmN0aW9uKGNoaWxkLCBwYXJlbnQpIHsgZm9yICh2YXIga2V5IGluIHBhcmVudCkgeyBpZiAoaGFzUHJvcC5jYWxsKHBhcmVudCwga2V5KSkgY2hpbGRba2V5XSA9IHBhcmVudFtrZXldOyB9IGZ1bmN0aW9uIGN0b3IoKSB7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfSBjdG9yLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7IGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7IGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7IHJldHVybiBjaGlsZDsgfSxcbiAgaGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5LFxuICBzbGljZSA9IFtdLnNsaWNlO1xuXG5tYXRjaCA9IHJlcXVpcmUoJ3V0aWwvbWF0Y2gnKTtcblxuR3JhbW1hciA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gR3JhbW1hcihwcm9kdWN0aW9ucykge1xuICAgIHRoaXMucHJvZHVjdGlvbnMgPSBwcm9kdWN0aW9ucztcbiAgfVxuXG4gIEdyYW1tYXIucHJvdG90eXBlLnByb2R1Y3Rpb25zID0gdm9pZCAwO1xuXG4gIEdyYW1tYXIucHJvdG90eXBlLm1ha2VTZXF1ZW5jZSA9IGZ1bmN0aW9uKGdyb3VwSWQsIHNlcXVlbmNlSWQpIHtcbiAgICB2YXIgcmVmO1xuICAgIHJldHVybiAocmVmID0gdGhpcy5wcm9kdWN0aW9uc1tncm91cElkXSkgIT0gbnVsbCA/IHJlZltzZXF1ZW5jZUlkXSA6IHZvaWQgMDtcbiAgfTtcblxuICByZXR1cm4gR3JhbW1hcjtcblxufSkoKTtcblxuU2VxdWVuY2UgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFNlcXVlbmNlKHN5bWJvbHMpIHtcbiAgICB0aGlzLnN5bWJvbHMgPSBzeW1ib2xzO1xuICB9XG5cbiAgU2VxdWVuY2UucHJvdG90eXBlLnN5bWJvbHMgPSB2b2lkIDA7XG5cbiAgcmV0dXJuIFNlcXVlbmNlO1xuXG59KSgpO1xuXG5TeW1ib2wgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFN5bWJvbCgpIHt9XG5cbiAgcmV0dXJuIFN5bWJvbDtcblxufSkoKTtcblxuTGl0ZXJhbCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChMaXRlcmFsLCBzdXBlckNsYXNzKTtcblxuICBmdW5jdGlvbiBMaXRlcmFsKHRleHQxKSB7XG4gICAgdGhpcy50ZXh0ID0gdGV4dDE7XG4gIH1cblxuICBMaXRlcmFsLnByb3RvdHlwZS50ZXh0ID0gdm9pZCAwO1xuXG4gIHJldHVybiBMaXRlcmFsO1xuXG59KShTeW1ib2wpO1xuXG5Ib2xlID0gKGZ1bmN0aW9uKHN1cGVyQ2xhc3MpIHtcbiAgZXh0ZW5kKEhvbGUsIHN1cGVyQ2xhc3MpO1xuXG4gIGZ1bmN0aW9uIEhvbGUoZ3JvdXAxLCBpZGVudGlmaWVyMSkge1xuICAgIHRoaXMuZ3JvdXAgPSBncm91cDE7XG4gICAgdGhpcy5pZGVudGlmaWVyID0gaWRlbnRpZmllcjE7XG4gIH1cblxuICBIb2xlLnByb3RvdHlwZS5ncm91cCA9IHZvaWQgMDtcblxuICBIb2xlLnByb3RvdHlwZS5pZGVudGlmaWVyID0gdm9pZCAwO1xuXG4gIHJldHVybiBIb2xlO1xuXG59KShTeW1ib2wpO1xuXG5SZWdleCA9IChmdW5jdGlvbihzdXBlckNsYXNzKSB7XG4gIGV4dGVuZChSZWdleCwgc3VwZXJDbGFzcyk7XG5cbiAgZnVuY3Rpb24gUmVnZXgocGF0dGVybikge1xuICAgIHRoaXMucGF0dGVybiA9IHBhdHRlcm47XG4gIH1cblxuICBSZWdleC5wcm90b3R5cGUucGF0dGVybiA9IHZvaWQgMDtcblxuICByZXR1cm4gUmVnZXg7XG5cbn0pKFN5bWJvbCk7XG5cblN5bnRheFRyZWUgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFN5bnRheFRyZWUoZ3JhbW1hciwgc3RhcnRHcm91cCkge1xuICAgIHRoaXMuZ3JhbW1hciA9IGdyYW1tYXI7XG4gICAgdGhpcy5yb290ID0gbmV3IE5vZGUobmV3IFNlcXVlbmNlKFtuZXcgSG9sZShzdGFydEdyb3VwLCAnc3RhcnQnKV0pKTtcbiAgfVxuXG4gIFN5bnRheFRyZWUucHJvdG90eXBlLnJvb3QgPSB2b2lkIDA7XG5cbiAgU3ludGF4VHJlZS5wcm90b3R5cGUuZ3JhbW1hciA9IHZvaWQgMDtcblxuICByZXR1cm4gU3ludGF4VHJlZTtcblxufSkoKTtcblxuTm9kZSA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gTm9kZShzZXF1ZW5jZSkge1xuICAgIHRoaXMuc2VxdWVuY2UgPSBzZXF1ZW5jZTtcbiAgICB0aGlzLmhvbGVzID0ge307XG4gICAgdGhpcy5zZXF1ZW5jZS5zeW1ib2xzLmZvckVhY2goKGZ1bmN0aW9uKF90aGlzKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oc3ltLCBpbmRleCkge1xuICAgICAgICBpZiAoc3ltLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdIb2xlJykge1xuICAgICAgICAgIHJldHVybiBfdGhpcy5ob2xlc1tzeW0uaWRlbnRpZmllcl0gPSB7XG4gICAgICAgICAgICBncm91cDogc3ltLmdyb3VwLFxuICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgdmFsdWU6IG51bGxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pKHRoaXMpKTtcbiAgfVxuXG4gIE5vZGUucHJvdG90eXBlLnNlcXVlbmNlID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLmhvbGVzID0gdm9pZCAwO1xuXG4gIE5vZGUucHJvdG90eXBlLmZpbGxIb2xlID0gZnVuY3Rpb24oaG9sZUlkLCBmaWxsV2l0aCkge1xuICAgIHZhciBob2xlO1xuICAgIGhvbGUgPSB0aGlzLmhvbGVzW2hvbGVJZF07XG4gICAgaWYgKGhvbGUgIT0gbnVsbCkge1xuICAgICAgaG9sZS52YWx1ZSA9IGZpbGxXaXRoO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5zZXF1ZW5jZS5zeW1ib2xzLm1hcCgoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihzeW1ib2wpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoKHN5bWJvbCwge1xuICAgICAgICAgIExpdGVyYWw6IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICAgICAgdmFyIHRleHQ7XG4gICAgICAgICAgICB0ZXh0ID0gYXJnLnRleHQ7XG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgICB9LFxuICAgICAgICAgIEhvbGU6IGZ1bmN0aW9uKGFyZykge1xuICAgICAgICAgICAgdmFyIGdyb3VwLCBpZGVudGlmaWVyO1xuICAgICAgICAgICAgaWRlbnRpZmllciA9IGFyZy5pZGVudGlmaWVyLCBncm91cCA9IGFyZy5ncm91cDtcbiAgICAgICAgICAgIGlmIChfdGhpcy5ob2xlc1tpZGVudGlmaWVyXS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHJldHVybiBfdGhpcy5ob2xlc1tpZGVudGlmaWVyXS52YWx1ZS5yZW5kZXIoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiAnYCcgKyBncm91cCArICdgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KSh0aGlzKSkuam9pbihcIlwiKTtcbiAgfTtcblxuICBOb2RlLnByb3RvdHlwZS5uYXZpZ2F0ZSA9IGZ1bmN0aW9uKHBhdGgpIHt9O1xuXG4gIHJldHVybiBOb2RlO1xuXG59KSgpO1xuXG5nZW5lcmF0ZUNvbnN0cnVjdG9yID0gZnVuY3Rpb24oa2xhc3MpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBhcmdzO1xuICAgIGFyZ3MgPSAxIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBzbGljZS5jYWxsKGFyZ3VtZW50cywgMCkgOiBbXTtcbiAgICByZXR1cm4gKGZ1bmN0aW9uKGZ1bmMsIGFyZ3MsIGN0b3IpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XG4gICAgICB2YXIgY2hpbGQgPSBuZXcgY3RvciwgcmVzdWx0ID0gZnVuYy5hcHBseShjaGlsZCwgYXJncyk7XG4gICAgICByZXR1cm4gT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCA/IHJlc3VsdCA6IGNoaWxkO1xuICAgIH0pKGtsYXNzLCBhcmdzLCBmdW5jdGlvbigpe30pO1xuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIEdyYW1tYXI6IEdyYW1tYXIsXG4gIFNlcXVlbmNlOiBnZW5lcmF0ZUNvbnN0cnVjdG9yKFNlcXVlbmNlKSxcbiAgUzoge1xuICAgIExpdGVyYWw6IGdlbmVyYXRlQ29uc3RydWN0b3IoTGl0ZXJhbCksXG4gICAgSG9sZTogZ2VuZXJhdGVDb25zdHJ1Y3RvcihIb2xlKSxcbiAgICBSZWdleDogZ2VuZXJhdGVDb25zdHJ1Y3RvcihSZWdleClcbiAgfSxcbiAgU3ludGF4VHJlZTogU3ludGF4VHJlZSxcbiAgTm9kZTogTm9kZVxufTtcbiIsInZhciBtYXRjaDtcblxubW9kdWxlLmV4cG9ydHMgPSBtYXRjaCA9IGZ1bmN0aW9uKG9iaiwgZm5zKSB7XG4gIHZhciBjb25zdHJ1Y3RvciwgZm47XG4gIGNvbnN0cnVjdG9yID0gb2JqLmNvbnN0cnVjdG9yO1xuICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgd2hpbGUgKCFmbiAmJiBjb25zdHJ1Y3Rvci5fX3N1cGVyX18pIHtcbiAgICBjb25zdHJ1Y3RvciA9IGNvbnN0cnVjdG9yLl9fc3VwZXJfXy5jb25zdHJ1Y3RvcjtcbiAgICBmbiA9IGZuc1tjb25zdHJ1Y3Rvci5uYW1lXTtcbiAgfVxuICBpZiAoZm4pIHtcbiAgICByZXR1cm4gZm4uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBFcnJvcihcIm5vIG1hdGNoIGZvciB0eXBlIFwiICsgY29uc3RydWN0b3IubmFtZSArIFwiLlwiKTtcbiAgfVxufTtcbiJdfQ==
