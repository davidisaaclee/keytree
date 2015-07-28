(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.addEventListener('WebComponentsReady', function() {
  var sampleTree;
  sampleTree = [
    {
      type: 'hole',
      id: 'start',
      isFilled: true,
      value: [
        {
          type: 'literal',
          value: '(+ '
        }, {
          type: 'hole',
          id: 'randl::0',
          placeholder: 'randl',
          isFilled: true,
          classes: 'special-node',
          value: [
            {
              type: 'literal',
              value: '42'
            }
          ]
        }, {
          type: 'hole',
          id: 'randr::0',
          placeholder: 'randr',
          isFilled: false,
          value: null
        }, {
          type: 'action',
          display: 'action',
          onAction: function() {
            return alert('did action');
          }
        }, {
          type: 'literal',
          value: ')'
        }
      ]
    }
  ];
  document.querySelector('#tree').treeModel = sampleTree;
  return document.querySelector('#tree').addEventListener('requested-fill', function(evt) {
    console.log('requested-fill', arguments);
    return console.log(evt.detail.tree.select(evt.detail.idPath));
  });
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGVtby5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignV2ViQ29tcG9uZW50c1JlYWR5JywgZnVuY3Rpb24oKSB7XG4gIHZhciBzYW1wbGVUcmVlO1xuICBzYW1wbGVUcmVlID0gW1xuICAgIHtcbiAgICAgIHR5cGU6ICdob2xlJyxcbiAgICAgIGlkOiAnc3RhcnQnLFxuICAgICAgaXNGaWxsZWQ6IHRydWUsXG4gICAgICB2YWx1ZTogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ2xpdGVyYWwnLFxuICAgICAgICAgIHZhbHVlOiAnKCsgJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ2hvbGUnLFxuICAgICAgICAgIGlkOiAncmFuZGw6OjAnLFxuICAgICAgICAgIHBsYWNlaG9sZGVyOiAncmFuZGwnLFxuICAgICAgICAgIGlzRmlsbGVkOiB0cnVlLFxuICAgICAgICAgIGNsYXNzZXM6ICdzcGVjaWFsLW5vZGUnLFxuICAgICAgICAgIHZhbHVlOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdsaXRlcmFsJyxcbiAgICAgICAgICAgICAgdmFsdWU6ICc0MidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnaG9sZScsXG4gICAgICAgICAgaWQ6ICdyYW5kcjo6MCcsXG4gICAgICAgICAgcGxhY2Vob2xkZXI6ICdyYW5kcicsXG4gICAgICAgICAgaXNGaWxsZWQ6IGZhbHNlLFxuICAgICAgICAgIHZhbHVlOiBudWxsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnYWN0aW9uJyxcbiAgICAgICAgICBkaXNwbGF5OiAnYWN0aW9uJyxcbiAgICAgICAgICBvbkFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ2RpZCBhY3Rpb24nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnbGl0ZXJhbCcsXG4gICAgICAgICAgdmFsdWU6ICcpJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfVxuICBdO1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdHJlZScpLnRyZWVNb2RlbCA9IHNhbXBsZVRyZWU7XG4gIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdHJlZScpLmFkZEV2ZW50TGlzdGVuZXIoJ3JlcXVlc3RlZC1maWxsJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgY29uc29sZS5sb2coJ3JlcXVlc3RlZC1maWxsJywgYXJndW1lbnRzKTtcbiAgICByZXR1cm4gY29uc29sZS5sb2coZXZ0LmRldGFpbC50cmVlLnNlbGVjdChldnQuZGV0YWlsLmlkUGF0aCkpO1xuICB9KTtcbn0pO1xuIl19
