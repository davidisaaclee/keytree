(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var TWO_PI, linkFlower, polToCar;

polToCar = function(angle, radius) {
  return {
    x: radius * (Math.cos(angle)),
    y: radius * (Math.sin(angle))
  };
};

TWO_PI = 2 * Math.PI;

linkFlower = function(scope, element, attrs) {
  var i, j, petalCollection, ref, ref1, results, x, y;
  console.log('linking flower');
  petalCollection = document.getElementsByClassName('petal');
  scope.$watch(petalCollection, (function(val) {
    return console.log('changed', val);
  }));
  results = [];
  for (i = j = 0, ref = petalCollection.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
    petalCollection[i].style['position'] = 'relative';
    ref1 = polToCar(TWO_PI * i / petalCollection.length, 50), x = ref1.x, y = ref1.y;
    console.log("placing " + petalCollection[i] + " at " + x + ", " + y);
    petalCollection[i].style['left'] = x;
    results.push(petalCollection[i].style['top'] = y);
  }
  return results;
};

module.exports = linkFlower;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwia3QtZmxvd2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBUV09fUEksIGxpbmtGbG93ZXIsIHBvbFRvQ2FyO1xuXG5wb2xUb0NhciA9IGZ1bmN0aW9uKGFuZ2xlLCByYWRpdXMpIHtcbiAgcmV0dXJuIHtcbiAgICB4OiByYWRpdXMgKiAoTWF0aC5jb3MoYW5nbGUpKSxcbiAgICB5OiByYWRpdXMgKiAoTWF0aC5zaW4oYW5nbGUpKVxuICB9O1xufTtcblxuVFdPX1BJID0gMiAqIE1hdGguUEk7XG5cbmxpbmtGbG93ZXIgPSBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgdmFyIGksIGosIHBldGFsQ29sbGVjdGlvbiwgcmVmLCByZWYxLCByZXN1bHRzLCB4LCB5O1xuICBjb25zb2xlLmxvZygnbGlua2luZyBmbG93ZXInKTtcbiAgcGV0YWxDb2xsZWN0aW9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncGV0YWwnKTtcbiAgc2NvcGUuJHdhdGNoKHBldGFsQ29sbGVjdGlvbiwgKGZ1bmN0aW9uKHZhbCkge1xuICAgIHJldHVybiBjb25zb2xlLmxvZygnY2hhbmdlZCcsIHZhbCk7XG4gIH0pKTtcbiAgcmVzdWx0cyA9IFtdO1xuICBmb3IgKGkgPSBqID0gMCwgcmVmID0gcGV0YWxDb2xsZWN0aW9uLmxlbmd0aDsgMCA8PSByZWYgPyBqIDwgcmVmIDogaiA+IHJlZjsgaSA9IDAgPD0gcmVmID8gKytqIDogLS1qKSB7XG4gICAgcGV0YWxDb2xsZWN0aW9uW2ldLnN0eWxlWydwb3NpdGlvbiddID0gJ3JlbGF0aXZlJztcbiAgICByZWYxID0gcG9sVG9DYXIoVFdPX1BJICogaSAvIHBldGFsQ29sbGVjdGlvbi5sZW5ndGgsIDUwKSwgeCA9IHJlZjEueCwgeSA9IHJlZjEueTtcbiAgICBjb25zb2xlLmxvZyhcInBsYWNpbmcgXCIgKyBwZXRhbENvbGxlY3Rpb25baV0gKyBcIiBhdCBcIiArIHggKyBcIiwgXCIgKyB5KTtcbiAgICBwZXRhbENvbGxlY3Rpb25baV0uc3R5bGVbJ2xlZnQnXSA9IHg7XG4gICAgcmVzdWx0cy5wdXNoKHBldGFsQ29sbGVjdGlvbltpXS5zdHlsZVsndG9wJ10gPSB5KTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbGlua0Zsb3dlcjtcbiJdfQ==
