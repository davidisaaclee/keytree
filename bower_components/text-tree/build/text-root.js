(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
Polymer({
  is: 'text-root',
  properties: {
    treeModel: Object
  },
  listeners: {
    'request-fill': '_fillRequested'
  },
  selected: null,
  rootNode: function() {
    return this.$['root'];
  },
  select: function(path, useNumericPath) {
    var selectedElm;
    if (this.selected != null) {
      this.unselect.apply(this, this.selected);
    }
    selectedElm = this.$.root.walk(path, {
      endFn: function(node) {
        Polymer.dom(node).classList.add('selected');
        return node;
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
      endFn: function(node) {
        return Polymer.dom(node).classList.remove('selected');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwidGV4dC1yb290LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJQb2x5bWVyKHtcbiAgaXM6ICd0ZXh0LXJvb3QnLFxuICBwcm9wZXJ0aWVzOiB7XG4gICAgdHJlZU1vZGVsOiBPYmplY3RcbiAgfSxcbiAgbGlzdGVuZXJzOiB7XG4gICAgJ3JlcXVlc3QtZmlsbCc6ICdfZmlsbFJlcXVlc3RlZCdcbiAgfSxcbiAgc2VsZWN0ZWQ6IG51bGwsXG4gIHJvb3ROb2RlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kWydyb290J107XG4gIH0sXG4gIHNlbGVjdDogZnVuY3Rpb24ocGF0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICB2YXIgc2VsZWN0ZWRFbG07XG4gICAgaWYgKHRoaXMuc2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgdGhpcy51bnNlbGVjdC5hcHBseSh0aGlzLCB0aGlzLnNlbGVjdGVkKTtcbiAgICB9XG4gICAgc2VsZWN0ZWRFbG0gPSB0aGlzLiQucm9vdC53YWxrKHBhdGgsIHtcbiAgICAgIGVuZEZuOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIFBvbHltZXIuZG9tKG5vZGUpLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgICAgfSxcbiAgICAgIHVzZU51bWVyaWNQYXRoOiB1c2VOdW1lcmljUGF0aFxuICAgIH0pO1xuICAgIGlmIChzZWxlY3RlZEVsbSAhPSBudWxsKSB7XG4gICAgICB0aGlzLnNlbGVjdGVkID0gYXJndW1lbnRzO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0ZWRFbG07XG4gIH0sXG4gIHVuc2VsZWN0OiBmdW5jdGlvbihwYXRoLCB1c2VOdW1lcmljUGF0aCkge1xuICAgIHJldHVybiB0aGlzLiQucm9vdC53YWxrKHBhdGgsIHtcbiAgICAgIGVuZEZuOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgIHJldHVybiBQb2x5bWVyLmRvbShub2RlKS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xuICAgICAgfSxcbiAgICAgIHVzZU51bWVyaWNQYXRoOiB1c2VOdW1lcmljUGF0aFxuICAgIH0pO1xuICB9LFxuICBuYXZpZ2F0ZTogZnVuY3Rpb24ocGF0aCwgdXNlTnVtZXJpY1BhdGgpIHtcbiAgICByZXR1cm4gdGhpcy4kLnJvb3QubmF2aWdhdGUocGF0aCwgdXNlTnVtZXJpY1BhdGgpO1xuICB9LFxuICBfZmlsbFJlcXVlc3RlZDogZnVuY3Rpb24oZXZlbnQsIGRldGFpbCkge1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHJldHVybiB0aGlzLmZpcmUoJ3JlcXVlc3RlZC1maWxsJywge1xuICAgICAgaWRQYXRoOiBkZXRhaWwuaWRQYXRoLFxuICAgICAgbnVtZXJpY1BhdGg6IGRldGFpbC5udW1lcmljUGF0aCxcbiAgICAgIG5vZGVNb2RlbDogZGV0YWlsLm5vZGVNb2RlbCxcbiAgICAgIHRyZWU6IHRoaXNcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
