(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var attach, calculatePositions, draw, i, idx, item, j, len, mkRandomDimensions, ref, rgbToHex, state;

calculatePositions = require('../../radial-plotter').calculatePositions;

rgbToHex = function(r, g, b) {
  var formatHex;
  formatHex = function(n) {
    return ('00' + Math.floor(n).toString(16)).substr(-2);
  };
  return '#' + ("" + (formatHex(r)) + (formatHex(g)) + (formatHex(b)));
};

mkRandomDimensions = function() {
  var hmax, hmin, wmax, wmin;
  wmax = 10;
  wmin = 10;
  hmin = 10;
  hmax = 10;
  return {
    width: Math.random() * (wmax - wmin) + wmin,
    height: Math.random() * (hmax - hmin) + hmin
  };
};

state = {
  items: (function() {
    var j, results;
    results = [];
    for (i = j = 0; j <= 10; i = ++j) {
      results.push(mkRandomDimensions());
    }
    return results;
  })(),
  radius: 50,
  bounds: {
    left: 0,
    right: 500,
    top: 0,
    bottom: 500
  },
  isHeadedLeft: true
};

ref = state.items;
for (idx = j = 0, len = ref.length; j < len; idx = ++j) {
  item = ref[idx];
  item.color = rgbToHex(idx * (255 / state.items.length), idx * (127 / state.items.length), idx * (64 / state.items.length));
}

draw = function(canvas) {
  var context, sideLength;
  window.requestAnimationFrame(function() {
    return draw(canvas);
  });
  context = canvas.getContext('2d');
  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#555';
  context.fillRect(0, 0, canvas.width, canvas.height);
  if (state.mousePosition != null) {
    context.fillStyle = 'black';
    sideLength = 10;
    context.fillRect(state.mousePosition.x - (sideLength / 2), state.mousePosition.y - (sideLength / 2), sideLength, sideLength);
  }
  if (state.positions != null) {
    state.positions.map(function(arg, idx) {
      var position, rect;
      position = arg.position, rect = arg.rect;
      context.fillStyle = state.items[idx].color;
      return context.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    });
  }
  return context.restore();
};

attach = function(canvas) {
  var context;
  window.requestAnimationFrame(function() {
    return draw(canvas);
  });
  context = canvas.getContext('2d');
  return canvas.addEventListener('mousemove', function(evt) {
    var isHeadedLeft, items, ref1;
    state.mousePosition = {
      x: evt.offsetX,
      y: evt.offsetY
    };
    ref1 = calculatePositions(state.mousePosition, 50, state.items, state.bounds, state.isHeadedLeft), items = ref1.items, isHeadedLeft = ref1.isHeadedLeft;
    state.positions = items;
    return state.isHeadedLeft = isHeadedLeft;
  });
};

attach(document.getElementById('canvas'));

},{"../../radial-plotter":2}],2:[function(require,module,exports){
var calculatePositions, calculatePositions2, checkContainment, checkIntersect, polToCar;

polToCar = function(angle, radius, center) {
  if (center == null) {
    center = {
      x: 0,
      y: 0
    };
  }
  return {
    x: radius * (Math.cos(angle)) + center.x,
    y: radius * (Math.sin(angle)) + center.y
  };
};

checkContainment = function(subRect, inRect) {
  return (subRect.left >= inRect.left) && (subRect.top >= inRect.top) && (subRect.right <= inRect.right) && (subRect.bottom <= inRect.bottom);
};

checkIntersect = function(r1, r2, margin) {
  if (margin == null) {
    margin = 0;
  }
  return !((r2.left - margin) > r1.right || (r2.right + margin) < r1.left || (r2.top - margin) > r1.bottom || (r2.bottom + margin) < r1.top);
};

calculatePositions = function(center, items, bounds, algorithm) {
  var angle, angleDivision, angleFlip, angleMultiplier, angleNudge, angleOffset, attempt, collidesWithPrevious, defaultAngle, dim, i, isContained, isIntersectingOtherPetal, j, len, mkRect, pos, radius, rect, result, ringIndex;
  if (algorithm == null) {
    algorithm = 'rotate';
  }
  mkRect = function(pt, dim) {
    return {
      left: pt.x - (dim.width / 2),
      right: pt.x + (dim.width / 2),
      top: pt.y - (dim.height / 2),
      bottom: pt.y + (dim.height / 2)
    };
  };
  collidesWithPrevious = function(rect, previous) {
    return previous.filter(function(elm) {
      return checkIntersect(rect, elm.rect, 10);
    }).length > 0;
  };
  result = [];
  for (i = j = 0, len = items.length; j < len; i = ++j) {
    dim = items[i];
    angle = (2 * Math.PI) * i / items.length;
    pos = polToCar(angle, state.radius, center);
    rect = mkRect(pos, dim);
    attempt = 0;

    /*
    When a petal goes out of view, we want to move it to the closest valid
    relocation point to the petal's original position.
    We find a zero-crossing in the deltas between distances to valid relocation
    points -> we have our closest relocation point.
     */
    isContained = checkContainment(rect, bounds);
    isIntersectingOtherPetal = collidesWithPrevious(rect, result);
    while (((!isContained) || isIntersectingOtherPetal) && (attempt < 200)) {
      if (algorithm === 'closest') {
        attempt = attempt + 1;
        ringIndex = Math.floor((attempt - 1) / items.length) + 1;
        angleMultiplier = i + attempt;
        angleDivision = (2 * Math.PI) / items.length;
        angleMultiplier = i + ((attempt % 2 ? -1 : 1) * Math.floor(attempt / 2));
        angleOffset = 0;
        angle = angleMultiplier * angleDivision + angleOffset;
        radius = state.radius * (1 + ringIndex);
        pos = polToCar(angle, radius, center);
        rect = mkRect(pos, dim);
      } else if (algorithm === 'rotate') {
        attempt++;
        angleDivision = 2 * Math.PI / items.length;
        defaultAngle = i * angleDivision;
        angleNudge = angleDivision * (attempt - 1) % items.length;
        angleFlip = Math.PI;
        angle = defaultAngle + angleFlip + angleNudge;
        radius = state.radius * (Math.floor((attempt - 1) / items.length) + 2);
        pos = polToCar(angle, radius, center);
        rect = mkRect(pos, dim);
      } else if (algorithm === 'flip') {
        attempt++;
        angle = -(2 * Math.PI) * i / items.length;
        radius = state.radius * 2;
        pos = polToCar(angle, radius, center);
        rect = mkRect(pos, dim);
      } else {
        console.log('Unknown algorithm', algorithm);
      }
      isContained = checkContainment(rect, bounds);
      isIntersectingOtherPetal = collidesWithPrevious(rect, result);
    }
    result.push({
      position: pos,
      rect: rect
    });
    if (attempt > 100) {
      console.log('high attempt count: ', attempt);
    }
  }
  return result;
};

calculatePositions2 = function(center, radius, items, bounds, isHeadedLeft) {
  var collidesWithPrevious, farthestPt, maxDimension, mkRect;
  mkRect = function(pt, dim) {
    return {
      left: pt.x - (dim.width / 2),
      right: pt.x + (dim.width / 2),
      top: pt.y - (dim.height / 2),
      bottom: pt.y + (dim.height / 2)
    };
  };
  collidesWithPrevious = function(rect, previous) {
    return previous.filter(function(elm) {
      return checkIntersect(rect, elm.rect, 10);
    }).length > 0;
  };
  maxDimension = items.reduce(function(prev, current) {
    if (current.width > prev.width) {
      prev.width = current.width;
    }
    if (current.height > prev.height) {
      prev.height = current.height;
    }
    return prev;
  });
  farthestPt = {
    x: (isHeadedLeft ? -1 : 1) * (radius + maxDimension.width) + center.x,
    y: center.y
  };
  if (!checkContainment(mkRect(farthestPt, {
    width: 1,
    height: 1
  }), bounds)) {
    isHeadedLeft = !isHeadedLeft;
  }
  return {
    isHeadedLeft: isHeadedLeft,
    items: items.map(function(dim, idx) {
      var angle, angleOffset, angleSpan, attempt, pos, r, rect;
      angleSpan = Math.PI;
      angleOffset = (isHeadedLeft ? Math.PI : 0) - (angleSpan / 2);
      angle = idx * (angleSpan / (items.length - 1)) + angleOffset;
      angle = angle * (isHeadedLeft ? 1 : -1);
      r = radius;
      pos = polToCar(angle, r, center);
      rect = mkRect(pos, dim);
      attempt = 0;
      while ((!checkContainment(rect, bounds)) && (attempt < 100)) {
        attempt++;
        angle = isHeadedLeft ? 2 * Math.PI - (idx * (angleSpan / (items.length - 1)) + angleOffset) : idx * (angleSpan / (items.length - 1)) + angleOffset;
        r = radius * (attempt + 1);
        pos = polToCar(angle, r, center);
        rect = mkRect(pos, dim);
      }
      if (attempt > 50) {
        console.log('high loop');
      }
      return {
        position: pos,
        rect: rect
      };
    })
  };
};

module.exports = {
  calculatePositions: calculatePositions2
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic2NyaXB0LmNvZmZlZSIsIi4uLy4uL3JhZGlhbC1wbG90dGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGF0dGFjaCwgY2FsY3VsYXRlUG9zaXRpb25zLCBkcmF3LCBpLCBpZHgsIGl0ZW0sIGosIGxlbiwgbWtSYW5kb21EaW1lbnNpb25zLCByZWYsIHJnYlRvSGV4LCBzdGF0ZTtcblxuY2FsY3VsYXRlUG9zaXRpb25zID0gcmVxdWlyZSgnLi4vLi4vcmFkaWFsLXBsb3R0ZXInKS5jYWxjdWxhdGVQb3NpdGlvbnM7XG5cbnJnYlRvSGV4ID0gZnVuY3Rpb24ociwgZywgYikge1xuICB2YXIgZm9ybWF0SGV4O1xuICBmb3JtYXRIZXggPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuICgnMDAnICsgTWF0aC5mbG9vcihuKS50b1N0cmluZygxNikpLnN1YnN0cigtMik7XG4gIH07XG4gIHJldHVybiAnIycgKyAoXCJcIiArIChmb3JtYXRIZXgocikpICsgKGZvcm1hdEhleChnKSkgKyAoZm9ybWF0SGV4KGIpKSk7XG59O1xuXG5ta1JhbmRvbURpbWVuc2lvbnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhtYXgsIGhtaW4sIHdtYXgsIHdtaW47XG4gIHdtYXggPSAxMDtcbiAgd21pbiA9IDEwO1xuICBobWluID0gMTA7XG4gIGhtYXggPSAxMDtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogTWF0aC5yYW5kb20oKSAqICh3bWF4IC0gd21pbikgKyB3bWluLFxuICAgIGhlaWdodDogTWF0aC5yYW5kb20oKSAqIChobWF4IC0gaG1pbikgKyBobWluXG4gIH07XG59O1xuXG5zdGF0ZSA9IHtcbiAgaXRlbXM6IChmdW5jdGlvbigpIHtcbiAgICB2YXIgaiwgcmVzdWx0cztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gaiA9IDA7IGogPD0gMTA7IGkgPSArK2opIHtcbiAgICAgIHJlc3VsdHMucHVzaChta1JhbmRvbURpbWVuc2lvbnMoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9KSgpLFxuICByYWRpdXM6IDUwLFxuICBib3VuZHM6IHtcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiA1MDAsXG4gICAgdG9wOiAwLFxuICAgIGJvdHRvbTogNTAwXG4gIH0sXG4gIGlzSGVhZGVkTGVmdDogdHJ1ZVxufTtcblxucmVmID0gc3RhdGUuaXRlbXM7XG5mb3IgKGlkeCA9IGogPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBqIDwgbGVuOyBpZHggPSArK2opIHtcbiAgaXRlbSA9IHJlZltpZHhdO1xuICBpdGVtLmNvbG9yID0gcmdiVG9IZXgoaWR4ICogKDI1NSAvIHN0YXRlLml0ZW1zLmxlbmd0aCksIGlkeCAqICgxMjcgLyBzdGF0ZS5pdGVtcy5sZW5ndGgpLCBpZHggKiAoNjQgLyBzdGF0ZS5pdGVtcy5sZW5ndGgpKTtcbn1cblxuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICB2YXIgY29udGV4dCwgc2lkZUxlbmd0aDtcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZHJhdyhjYW52YXMpO1xuICB9KTtcbiAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0LnNhdmUoKTtcbiAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSAnIzU1NSc7XG4gIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgaWYgKHN0YXRlLm1vdXNlUG9zaXRpb24gIT0gbnVsbCkge1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ2JsYWNrJztcbiAgICBzaWRlTGVuZ3RoID0gMTA7XG4gICAgY29udGV4dC5maWxsUmVjdChzdGF0ZS5tb3VzZVBvc2l0aW9uLnggLSAoc2lkZUxlbmd0aCAvIDIpLCBzdGF0ZS5tb3VzZVBvc2l0aW9uLnkgLSAoc2lkZUxlbmd0aCAvIDIpLCBzaWRlTGVuZ3RoLCBzaWRlTGVuZ3RoKTtcbiAgfVxuICBpZiAoc3RhdGUucG9zaXRpb25zICE9IG51bGwpIHtcbiAgICBzdGF0ZS5wb3NpdGlvbnMubWFwKGZ1bmN0aW9uKGFyZywgaWR4KSB7XG4gICAgICB2YXIgcG9zaXRpb24sIHJlY3Q7XG4gICAgICBwb3NpdGlvbiA9IGFyZy5wb3NpdGlvbiwgcmVjdCA9IGFyZy5yZWN0O1xuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBzdGF0ZS5pdGVtc1tpZHhdLmNvbG9yO1xuICAgICAgcmV0dXJuIGNvbnRleHQuZmlsbFJlY3QocmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC5yaWdodCAtIHJlY3QubGVmdCwgcmVjdC5ib3R0b20gLSByZWN0LnRvcCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuYXR0YWNoID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gIHZhciBjb250ZXh0O1xuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkcmF3KGNhbnZhcyk7XG4gIH0pO1xuICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIHJldHVybiBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGlzSGVhZGVkTGVmdCwgaXRlbXMsIHJlZjE7XG4gICAgc3RhdGUubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgIHg6IGV2dC5vZmZzZXRYLFxuICAgICAgeTogZXZ0Lm9mZnNldFlcbiAgICB9O1xuICAgIHJlZjEgPSBjYWxjdWxhdGVQb3NpdGlvbnMoc3RhdGUubW91c2VQb3NpdGlvbiwgNTAsIHN0YXRlLml0ZW1zLCBzdGF0ZS5ib3VuZHMsIHN0YXRlLmlzSGVhZGVkTGVmdCksIGl0ZW1zID0gcmVmMS5pdGVtcywgaXNIZWFkZWRMZWZ0ID0gcmVmMS5pc0hlYWRlZExlZnQ7XG4gICAgc3RhdGUucG9zaXRpb25zID0gaXRlbXM7XG4gICAgcmV0dXJuIHN0YXRlLmlzSGVhZGVkTGVmdCA9IGlzSGVhZGVkTGVmdDtcbiAgfSk7XG59O1xuXG5hdHRhY2goZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpKTtcbiIsInZhciBjYWxjdWxhdGVQb3NpdGlvbnMsIGNhbGN1bGF0ZVBvc2l0aW9uczIsIGNoZWNrQ29udGFpbm1lbnQsIGNoZWNrSW50ZXJzZWN0LCBwb2xUb0NhcjtcblxucG9sVG9DYXIgPSBmdW5jdGlvbihhbmdsZSwgcmFkaXVzLCBjZW50ZXIpIHtcbiAgaWYgKGNlbnRlciA9PSBudWxsKSB7XG4gICAgY2VudGVyID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDBcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgeDogcmFkaXVzICogKE1hdGguY29zKGFuZ2xlKSkgKyBjZW50ZXIueCxcbiAgICB5OiByYWRpdXMgKiAoTWF0aC5zaW4oYW5nbGUpKSArIGNlbnRlci55XG4gIH07XG59O1xuXG5jaGVja0NvbnRhaW5tZW50ID0gZnVuY3Rpb24oc3ViUmVjdCwgaW5SZWN0KSB7XG4gIHJldHVybiAoc3ViUmVjdC5sZWZ0ID49IGluUmVjdC5sZWZ0KSAmJiAoc3ViUmVjdC50b3AgPj0gaW5SZWN0LnRvcCkgJiYgKHN1YlJlY3QucmlnaHQgPD0gaW5SZWN0LnJpZ2h0KSAmJiAoc3ViUmVjdC5ib3R0b20gPD0gaW5SZWN0LmJvdHRvbSk7XG59O1xuXG5jaGVja0ludGVyc2VjdCA9IGZ1bmN0aW9uKHIxLCByMiwgbWFyZ2luKSB7XG4gIGlmIChtYXJnaW4gPT0gbnVsbCkge1xuICAgIG1hcmdpbiA9IDA7XG4gIH1cbiAgcmV0dXJuICEoKHIyLmxlZnQgLSBtYXJnaW4pID4gcjEucmlnaHQgfHwgKHIyLnJpZ2h0ICsgbWFyZ2luKSA8IHIxLmxlZnQgfHwgKHIyLnRvcCAtIG1hcmdpbikgPiByMS5ib3R0b20gfHwgKHIyLmJvdHRvbSArIG1hcmdpbikgPCByMS50b3ApO1xufTtcblxuY2FsY3VsYXRlUG9zaXRpb25zID0gZnVuY3Rpb24oY2VudGVyLCBpdGVtcywgYm91bmRzLCBhbGdvcml0aG0pIHtcbiAgdmFyIGFuZ2xlLCBhbmdsZURpdmlzaW9uLCBhbmdsZUZsaXAsIGFuZ2xlTXVsdGlwbGllciwgYW5nbGVOdWRnZSwgYW5nbGVPZmZzZXQsIGF0dGVtcHQsIGNvbGxpZGVzV2l0aFByZXZpb3VzLCBkZWZhdWx0QW5nbGUsIGRpbSwgaSwgaXNDb250YWluZWQsIGlzSW50ZXJzZWN0aW5nT3RoZXJQZXRhbCwgaiwgbGVuLCBta1JlY3QsIHBvcywgcmFkaXVzLCByZWN0LCByZXN1bHQsIHJpbmdJbmRleDtcbiAgaWYgKGFsZ29yaXRobSA9PSBudWxsKSB7XG4gICAgYWxnb3JpdGhtID0gJ3JvdGF0ZSc7XG4gIH1cbiAgbWtSZWN0ID0gZnVuY3Rpb24ocHQsIGRpbSkge1xuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiBwdC54IC0gKGRpbS53aWR0aCAvIDIpLFxuICAgICAgcmlnaHQ6IHB0LnggKyAoZGltLndpZHRoIC8gMiksXG4gICAgICB0b3A6IHB0LnkgLSAoZGltLmhlaWdodCAvIDIpLFxuICAgICAgYm90dG9tOiBwdC55ICsgKGRpbS5oZWlnaHQgLyAyKVxuICAgIH07XG4gIH07XG4gIGNvbGxpZGVzV2l0aFByZXZpb3VzID0gZnVuY3Rpb24ocmVjdCwgcHJldmlvdXMpIHtcbiAgICByZXR1cm4gcHJldmlvdXMuZmlsdGVyKGZ1bmN0aW9uKGVsbSkge1xuICAgICAgcmV0dXJuIGNoZWNrSW50ZXJzZWN0KHJlY3QsIGVsbS5yZWN0LCAxMCk7XG4gICAgfSkubGVuZ3RoID4gMDtcbiAgfTtcbiAgcmVzdWx0ID0gW107XG4gIGZvciAoaSA9IGogPSAwLCBsZW4gPSBpdGVtcy5sZW5ndGg7IGogPCBsZW47IGkgPSArK2opIHtcbiAgICBkaW0gPSBpdGVtc1tpXTtcbiAgICBhbmdsZSA9ICgyICogTWF0aC5QSSkgKiBpIC8gaXRlbXMubGVuZ3RoO1xuICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCBzdGF0ZS5yYWRpdXMsIGNlbnRlcik7XG4gICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgYXR0ZW1wdCA9IDA7XG5cbiAgICAvKlxuICAgIFdoZW4gYSBwZXRhbCBnb2VzIG91dCBvZiB2aWV3LCB3ZSB3YW50IHRvIG1vdmUgaXQgdG8gdGhlIGNsb3Nlc3QgdmFsaWRcbiAgICByZWxvY2F0aW9uIHBvaW50IHRvIHRoZSBwZXRhbCdzIG9yaWdpbmFsIHBvc2l0aW9uLlxuICAgIFdlIGZpbmQgYSB6ZXJvLWNyb3NzaW5nIGluIHRoZSBkZWx0YXMgYmV0d2VlbiBkaXN0YW5jZXMgdG8gdmFsaWQgcmVsb2NhdGlvblxuICAgIHBvaW50cyAtPiB3ZSBoYXZlIG91ciBjbG9zZXN0IHJlbG9jYXRpb24gcG9pbnQuXG4gICAgICovXG4gICAgaXNDb250YWluZWQgPSBjaGVja0NvbnRhaW5tZW50KHJlY3QsIGJvdW5kcyk7XG4gICAgaXNJbnRlcnNlY3RpbmdPdGhlclBldGFsID0gY29sbGlkZXNXaXRoUHJldmlvdXMocmVjdCwgcmVzdWx0KTtcbiAgICB3aGlsZSAoKCghaXNDb250YWluZWQpIHx8IGlzSW50ZXJzZWN0aW5nT3RoZXJQZXRhbCkgJiYgKGF0dGVtcHQgPCAyMDApKSB7XG4gICAgICBpZiAoYWxnb3JpdGhtID09PSAnY2xvc2VzdCcpIHtcbiAgICAgICAgYXR0ZW1wdCA9IGF0dGVtcHQgKyAxO1xuICAgICAgICByaW5nSW5kZXggPSBNYXRoLmZsb29yKChhdHRlbXB0IC0gMSkgLyBpdGVtcy5sZW5ndGgpICsgMTtcbiAgICAgICAgYW5nbGVNdWx0aXBsaWVyID0gaSArIGF0dGVtcHQ7XG4gICAgICAgIGFuZ2xlRGl2aXNpb24gPSAoMiAqIE1hdGguUEkpIC8gaXRlbXMubGVuZ3RoO1xuICAgICAgICBhbmdsZU11bHRpcGxpZXIgPSBpICsgKChhdHRlbXB0ICUgMiA/IC0xIDogMSkgKiBNYXRoLmZsb29yKGF0dGVtcHQgLyAyKSk7XG4gICAgICAgIGFuZ2xlT2Zmc2V0ID0gMDtcbiAgICAgICAgYW5nbGUgPSBhbmdsZU11bHRpcGxpZXIgKiBhbmdsZURpdmlzaW9uICsgYW5nbGVPZmZzZXQ7XG4gICAgICAgIHJhZGl1cyA9IHN0YXRlLnJhZGl1cyAqICgxICsgcmluZ0luZGV4KTtcbiAgICAgICAgcG9zID0gcG9sVG9DYXIoYW5nbGUsIHJhZGl1cywgY2VudGVyKTtcbiAgICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICB9IGVsc2UgaWYgKGFsZ29yaXRobSA9PT0gJ3JvdGF0ZScpIHtcbiAgICAgICAgYXR0ZW1wdCsrO1xuICAgICAgICBhbmdsZURpdmlzaW9uID0gMiAqIE1hdGguUEkgLyBpdGVtcy5sZW5ndGg7XG4gICAgICAgIGRlZmF1bHRBbmdsZSA9IGkgKiBhbmdsZURpdmlzaW9uO1xuICAgICAgICBhbmdsZU51ZGdlID0gYW5nbGVEaXZpc2lvbiAqIChhdHRlbXB0IC0gMSkgJSBpdGVtcy5sZW5ndGg7XG4gICAgICAgIGFuZ2xlRmxpcCA9IE1hdGguUEk7XG4gICAgICAgIGFuZ2xlID0gZGVmYXVsdEFuZ2xlICsgYW5nbGVGbGlwICsgYW5nbGVOdWRnZTtcbiAgICAgICAgcmFkaXVzID0gc3RhdGUucmFkaXVzICogKE1hdGguZmxvb3IoKGF0dGVtcHQgLSAxKSAvIGl0ZW1zLmxlbmd0aCkgKyAyKTtcbiAgICAgICAgcG9zID0gcG9sVG9DYXIoYW5nbGUsIHJhZGl1cywgY2VudGVyKTtcbiAgICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICB9IGVsc2UgaWYgKGFsZ29yaXRobSA9PT0gJ2ZsaXAnKSB7XG4gICAgICAgIGF0dGVtcHQrKztcbiAgICAgICAgYW5nbGUgPSAtKDIgKiBNYXRoLlBJKSAqIGkgLyBpdGVtcy5sZW5ndGg7XG4gICAgICAgIHJhZGl1cyA9IHN0YXRlLnJhZGl1cyAqIDI7XG4gICAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByYWRpdXMsIGNlbnRlcik7XG4gICAgICAgIHJlY3QgPSBta1JlY3QocG9zLCBkaW0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Vua25vd24gYWxnb3JpdGhtJywgYWxnb3JpdGhtKTtcbiAgICAgIH1cbiAgICAgIGlzQ29udGFpbmVkID0gY2hlY2tDb250YWlubWVudChyZWN0LCBib3VuZHMpO1xuICAgICAgaXNJbnRlcnNlY3RpbmdPdGhlclBldGFsID0gY29sbGlkZXNXaXRoUHJldmlvdXMocmVjdCwgcmVzdWx0KTtcbiAgICB9XG4gICAgcmVzdWx0LnB1c2goe1xuICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgIHJlY3Q6IHJlY3RcbiAgICB9KTtcbiAgICBpZiAoYXR0ZW1wdCA+IDEwMCkge1xuICAgICAgY29uc29sZS5sb2coJ2hpZ2ggYXR0ZW1wdCBjb3VudDogJywgYXR0ZW1wdCk7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5jYWxjdWxhdGVQb3NpdGlvbnMyID0gZnVuY3Rpb24oY2VudGVyLCByYWRpdXMsIGl0ZW1zLCBib3VuZHMsIGlzSGVhZGVkTGVmdCkge1xuICB2YXIgY29sbGlkZXNXaXRoUHJldmlvdXMsIGZhcnRoZXN0UHQsIG1heERpbWVuc2lvbiwgbWtSZWN0O1xuICBta1JlY3QgPSBmdW5jdGlvbihwdCwgZGltKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IHB0LnggLSAoZGltLndpZHRoIC8gMiksXG4gICAgICByaWdodDogcHQueCArIChkaW0ud2lkdGggLyAyKSxcbiAgICAgIHRvcDogcHQueSAtIChkaW0uaGVpZ2h0IC8gMiksXG4gICAgICBib3R0b206IHB0LnkgKyAoZGltLmhlaWdodCAvIDIpXG4gICAgfTtcbiAgfTtcbiAgY29sbGlkZXNXaXRoUHJldmlvdXMgPSBmdW5jdGlvbihyZWN0LCBwcmV2aW91cykge1xuICAgIHJldHVybiBwcmV2aW91cy5maWx0ZXIoZnVuY3Rpb24oZWxtKSB7XG4gICAgICByZXR1cm4gY2hlY2tJbnRlcnNlY3QocmVjdCwgZWxtLnJlY3QsIDEwKTtcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9O1xuICBtYXhEaW1lbnNpb24gPSBpdGVtcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VycmVudCkge1xuICAgIGlmIChjdXJyZW50LndpZHRoID4gcHJldi53aWR0aCkge1xuICAgICAgcHJldi53aWR0aCA9IGN1cnJlbnQud2lkdGg7XG4gICAgfVxuICAgIGlmIChjdXJyZW50LmhlaWdodCA+IHByZXYuaGVpZ2h0KSB7XG4gICAgICBwcmV2LmhlaWdodCA9IGN1cnJlbnQuaGVpZ2h0O1xuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSk7XG4gIGZhcnRoZXN0UHQgPSB7XG4gICAgeDogKGlzSGVhZGVkTGVmdCA/IC0xIDogMSkgKiAocmFkaXVzICsgbWF4RGltZW5zaW9uLndpZHRoKSArIGNlbnRlci54LFxuICAgIHk6IGNlbnRlci55XG4gIH07XG4gIGlmICghY2hlY2tDb250YWlubWVudChta1JlY3QoZmFydGhlc3RQdCwge1xuICAgIHdpZHRoOiAxLFxuICAgIGhlaWdodDogMVxuICB9KSwgYm91bmRzKSkge1xuICAgIGlzSGVhZGVkTGVmdCA9ICFpc0hlYWRlZExlZnQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpc0hlYWRlZExlZnQ6IGlzSGVhZGVkTGVmdCxcbiAgICBpdGVtczogaXRlbXMubWFwKGZ1bmN0aW9uKGRpbSwgaWR4KSB7XG4gICAgICB2YXIgYW5nbGUsIGFuZ2xlT2Zmc2V0LCBhbmdsZVNwYW4sIGF0dGVtcHQsIHBvcywgciwgcmVjdDtcbiAgICAgIGFuZ2xlU3BhbiA9IE1hdGguUEk7XG4gICAgICBhbmdsZU9mZnNldCA9IChpc0hlYWRlZExlZnQgPyBNYXRoLlBJIDogMCkgLSAoYW5nbGVTcGFuIC8gMik7XG4gICAgICBhbmdsZSA9IGlkeCAqIChhbmdsZVNwYW4gLyAoaXRlbXMubGVuZ3RoIC0gMSkpICsgYW5nbGVPZmZzZXQ7XG4gICAgICBhbmdsZSA9IGFuZ2xlICogKGlzSGVhZGVkTGVmdCA/IDEgOiAtMSk7XG4gICAgICByID0gcmFkaXVzO1xuICAgICAgcG9zID0gcG9sVG9DYXIoYW5nbGUsIHIsIGNlbnRlcik7XG4gICAgICByZWN0ID0gbWtSZWN0KHBvcywgZGltKTtcbiAgICAgIGF0dGVtcHQgPSAwO1xuICAgICAgd2hpbGUgKCghY2hlY2tDb250YWlubWVudChyZWN0LCBib3VuZHMpKSAmJiAoYXR0ZW1wdCA8IDEwMCkpIHtcbiAgICAgICAgYXR0ZW1wdCsrO1xuICAgICAgICBhbmdsZSA9IGlzSGVhZGVkTGVmdCA/IDIgKiBNYXRoLlBJIC0gKGlkeCAqIChhbmdsZVNwYW4gLyAoaXRlbXMubGVuZ3RoIC0gMSkpICsgYW5nbGVPZmZzZXQpIDogaWR4ICogKGFuZ2xlU3BhbiAvIChpdGVtcy5sZW5ndGggLSAxKSkgKyBhbmdsZU9mZnNldDtcbiAgICAgICAgciA9IHJhZGl1cyAqIChhdHRlbXB0ICsgMSk7XG4gICAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByLCBjZW50ZXIpO1xuICAgICAgICByZWN0ID0gbWtSZWN0KHBvcywgZGltKTtcbiAgICAgIH1cbiAgICAgIGlmIChhdHRlbXB0ID4gNTApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hpZ2ggbG9vcCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgcmVjdDogcmVjdFxuICAgICAgfTtcbiAgICB9KVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNhbGN1bGF0ZVBvc2l0aW9uczogY2FsY3VsYXRlUG9zaXRpb25zMlxufTtcbiJdfQ==
