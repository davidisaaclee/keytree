(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Polymer({
  is: 'text-root',
  listeners: {
    'request-fill': '_fillRequested'
  },
  selected: null,
  rootNode: function() {
    return this.$['root'].querySelector('.node');
  },
  select: function(path, useNumericPath) {
    var selectedElm;
    if (this.selected != null) {
      this.unselect.apply(this, this.selected);
    }
    selectedElm = this.$.root.walk(path, {
      endFn: function(elm) {
        Polymer.dom(elm).classList.add('selected');
        return elm;
      },
      useNumericPath: useNumericPath
    });
    if (selectedElm != null) {
      this.selected = arguments;
    }
    return selectedElm;
  },
  unselect: function(path, useNumericPath) {
    return this.$.root.walk(path, {
      endFn: function(elm) {
        return Polymer.dom(elm).classList.remove('selected');
      },
      fold: {
        proc: function(acc, elm) {
          return Polymer.dom(elm).classList.remove('selected');
        }
      },
      useNumericPath: useNumericPath
    });
  },
  navigate: function(path, useNumericPath) {
    return this.$.root.navigate(path, useNumericPath);
  },
  _fillRequested: function(event, detail) {
    event.stopPropagation();
    return this.fire('requested-fill', {
      idPath: detail.idPath,
      numericPath: detail.numericPath,
      nodeModel: detail.nodeModel,
      tree: this
    });
  }
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwidGV4dC1yb290LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiUG9seW1lcih7XG4gIGlzOiAndGV4dC1yb290JyxcbiAgbGlzdGVuZXJzOiB7XG4gICAgJ3JlcXVlc3QtZmlsbCc6ICdfZmlsbFJlcXVlc3RlZCdcbiAgfSxcbiAgc2VsZWN0ZWQ6IG51bGwsXG4gIHJvb3ROb2RlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kWydyb290J10ucXVlcnlTZWxlY3RvcignLm5vZGUnKTtcbiAgfSxcbiAgc2VsZWN0OiBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHZhciBzZWxlY3RlZEVsbTtcbiAgICBpZiAodGhpcy5zZWxlY3RlZCAhPSBudWxsKSB7XG4gICAgICB0aGlzLnVuc2VsZWN0LmFwcGx5KHRoaXMsIHRoaXMuc2VsZWN0ZWQpO1xuICAgIH1cbiAgICBzZWxlY3RlZEVsbSA9IHRoaXMuJC5yb290LndhbGsocGF0aCwge1xuICAgICAgZW5kRm46IGZ1bmN0aW9uKGVsbSkge1xuICAgICAgICBQb2x5bWVyLmRvbShlbG0pLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG4gICAgICAgIHJldHVybiBlbG07XG4gICAgICB9LFxuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gICAgaWYgKHNlbGVjdGVkRWxtICE9IG51bGwpIHtcbiAgICAgIHRoaXMuc2VsZWN0ZWQgPSBhcmd1bWVudHM7XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3RlZEVsbTtcbiAgfSxcbiAgdW5zZWxlY3Q6IGZ1bmN0aW9uKHBhdGgsIHVzZU51bWVyaWNQYXRoKSB7XG4gICAgcmV0dXJuIHRoaXMuJC5yb290LndhbGsocGF0aCwge1xuICAgICAgZW5kRm46IGZ1bmN0aW9uKGVsbSkge1xuICAgICAgICByZXR1cm4gUG9seW1lci5kb20oZWxtKS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xuICAgICAgfSxcbiAgICAgIGZvbGQ6IHtcbiAgICAgICAgcHJvYzogZnVuY3Rpb24oYWNjLCBlbG0pIHtcbiAgICAgICAgICByZXR1cm4gUG9seW1lci5kb20oZWxtKS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgdXNlTnVtZXJpY1BhdGg6IHVzZU51bWVyaWNQYXRoXG4gICAgfSk7XG4gIH0sXG4gIG5hdmlnYXRlOiBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHJldHVybiB0aGlzLiQucm9vdC5uYXZpZ2F0ZShwYXRoLCB1c2VOdW1lcmljUGF0aCk7XG4gIH0sXG4gIF9maWxsUmVxdWVzdGVkOiBmdW5jdGlvbihldmVudCwgZGV0YWlsKSB7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuZmlyZSgncmVxdWVzdGVkLWZpbGwnLCB7XG4gICAgICBpZFBhdGg6IGRldGFpbC5pZFBhdGgsXG4gICAgICBudW1lcmljUGF0aDogZGV0YWlsLm51bWVyaWNQYXRoLFxuICAgICAgbm9kZU1vZGVsOiBkZXRhaWwubm9kZU1vZGVsLFxuICAgICAgdHJlZTogdGhpc1xuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
