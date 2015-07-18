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
var calculatePositions2, checkContainment, checkIntersect, polToCar;

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
      var angle, angleDivision, angleOffset, angleSpan, attempt, pos, r, rect;
      angleSpan = Math.PI;
      angleDivision = angleSpan / items.length;
      angleOffset = (isHeadedLeft ? Math.PI : 0) - (angleSpan / 2) + (angleDivision / 2);
      angle = idx * angleDivision + angleOffset;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwic2NyaXB0LmNvZmZlZSIsIi4uLy4uL3JhZGlhbC1wbG90dGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGF0dGFjaCwgY2FsY3VsYXRlUG9zaXRpb25zLCBkcmF3LCBpLCBpZHgsIGl0ZW0sIGosIGxlbiwgbWtSYW5kb21EaW1lbnNpb25zLCByZWYsIHJnYlRvSGV4LCBzdGF0ZTtcblxuY2FsY3VsYXRlUG9zaXRpb25zID0gcmVxdWlyZSgnLi4vLi4vcmFkaWFsLXBsb3R0ZXInKS5jYWxjdWxhdGVQb3NpdGlvbnM7XG5cbnJnYlRvSGV4ID0gZnVuY3Rpb24ociwgZywgYikge1xuICB2YXIgZm9ybWF0SGV4O1xuICBmb3JtYXRIZXggPSBmdW5jdGlvbihuKSB7XG4gICAgcmV0dXJuICgnMDAnICsgTWF0aC5mbG9vcihuKS50b1N0cmluZygxNikpLnN1YnN0cigtMik7XG4gIH07XG4gIHJldHVybiAnIycgKyAoXCJcIiArIChmb3JtYXRIZXgocikpICsgKGZvcm1hdEhleChnKSkgKyAoZm9ybWF0SGV4KGIpKSk7XG59O1xuXG5ta1JhbmRvbURpbWVuc2lvbnMgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhtYXgsIGhtaW4sIHdtYXgsIHdtaW47XG4gIHdtYXggPSAxMDtcbiAgd21pbiA9IDEwO1xuICBobWluID0gMTA7XG4gIGhtYXggPSAxMDtcbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogTWF0aC5yYW5kb20oKSAqICh3bWF4IC0gd21pbikgKyB3bWluLFxuICAgIGhlaWdodDogTWF0aC5yYW5kb20oKSAqIChobWF4IC0gaG1pbikgKyBobWluXG4gIH07XG59O1xuXG5zdGF0ZSA9IHtcbiAgaXRlbXM6IChmdW5jdGlvbigpIHtcbiAgICB2YXIgaiwgcmVzdWx0cztcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gaiA9IDA7IGogPD0gMTA7IGkgPSArK2opIHtcbiAgICAgIHJlc3VsdHMucHVzaChta1JhbmRvbURpbWVuc2lvbnMoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9KSgpLFxuICByYWRpdXM6IDUwLFxuICBib3VuZHM6IHtcbiAgICBsZWZ0OiAwLFxuICAgIHJpZ2h0OiA1MDAsXG4gICAgdG9wOiAwLFxuICAgIGJvdHRvbTogNTAwXG4gIH0sXG4gIGlzSGVhZGVkTGVmdDogdHJ1ZVxufTtcblxucmVmID0gc3RhdGUuaXRlbXM7XG5mb3IgKGlkeCA9IGogPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBqIDwgbGVuOyBpZHggPSArK2opIHtcbiAgaXRlbSA9IHJlZltpZHhdO1xuICBpdGVtLmNvbG9yID0gcmdiVG9IZXgoaWR4ICogKDI1NSAvIHN0YXRlLml0ZW1zLmxlbmd0aCksIGlkeCAqICgxMjcgLyBzdGF0ZS5pdGVtcy5sZW5ndGgpLCBpZHggKiAoNjQgLyBzdGF0ZS5pdGVtcy5sZW5ndGgpKTtcbn1cblxuZHJhdyA9IGZ1bmN0aW9uKGNhbnZhcykge1xuICB2YXIgY29udGV4dCwgc2lkZUxlbmd0aDtcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZHJhdyhjYW52YXMpO1xuICB9KTtcbiAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICBjb250ZXh0LnNhdmUoKTtcbiAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgY29udGV4dC5maWxsU3R5bGUgPSAnIzU1NSc7XG4gIGNvbnRleHQuZmlsbFJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgaWYgKHN0YXRlLm1vdXNlUG9zaXRpb24gIT0gbnVsbCkge1xuICAgIGNvbnRleHQuZmlsbFN0eWxlID0gJ2JsYWNrJztcbiAgICBzaWRlTGVuZ3RoID0gMTA7XG4gICAgY29udGV4dC5maWxsUmVjdChzdGF0ZS5tb3VzZVBvc2l0aW9uLnggLSAoc2lkZUxlbmd0aCAvIDIpLCBzdGF0ZS5tb3VzZVBvc2l0aW9uLnkgLSAoc2lkZUxlbmd0aCAvIDIpLCBzaWRlTGVuZ3RoLCBzaWRlTGVuZ3RoKTtcbiAgfVxuICBpZiAoc3RhdGUucG9zaXRpb25zICE9IG51bGwpIHtcbiAgICBzdGF0ZS5wb3NpdGlvbnMubWFwKGZ1bmN0aW9uKGFyZywgaWR4KSB7XG4gICAgICB2YXIgcG9zaXRpb24sIHJlY3Q7XG4gICAgICBwb3NpdGlvbiA9IGFyZy5wb3NpdGlvbiwgcmVjdCA9IGFyZy5yZWN0O1xuICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBzdGF0ZS5pdGVtc1tpZHhdLmNvbG9yO1xuICAgICAgcmV0dXJuIGNvbnRleHQuZmlsbFJlY3QocmVjdC5sZWZ0LCByZWN0LnRvcCwgcmVjdC5yaWdodCAtIHJlY3QubGVmdCwgcmVjdC5ib3R0b20gLSByZWN0LnRvcCk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRleHQucmVzdG9yZSgpO1xufTtcblxuYXR0YWNoID0gZnVuY3Rpb24oY2FudmFzKSB7XG4gIHZhciBjb250ZXh0O1xuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkcmF3KGNhbnZhcyk7XG4gIH0pO1xuICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gIHJldHVybiBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGlzSGVhZGVkTGVmdCwgaXRlbXMsIHJlZjE7XG4gICAgc3RhdGUubW91c2VQb3NpdGlvbiA9IHtcbiAgICAgIHg6IGV2dC5vZmZzZXRYLFxuICAgICAgeTogZXZ0Lm9mZnNldFlcbiAgICB9O1xuICAgIHJlZjEgPSBjYWxjdWxhdGVQb3NpdGlvbnMoc3RhdGUubW91c2VQb3NpdGlvbiwgNTAsIHN0YXRlLml0ZW1zLCBzdGF0ZS5ib3VuZHMsIHN0YXRlLmlzSGVhZGVkTGVmdCksIGl0ZW1zID0gcmVmMS5pdGVtcywgaXNIZWFkZWRMZWZ0ID0gcmVmMS5pc0hlYWRlZExlZnQ7XG4gICAgc3RhdGUucG9zaXRpb25zID0gaXRlbXM7XG4gICAgcmV0dXJuIHN0YXRlLmlzSGVhZGVkTGVmdCA9IGlzSGVhZGVkTGVmdDtcbiAgfSk7XG59O1xuXG5hdHRhY2goZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NhbnZhcycpKTtcbiIsInZhciBjYWxjdWxhdGVQb3NpdGlvbnMyLCBjaGVja0NvbnRhaW5tZW50LCBjaGVja0ludGVyc2VjdCwgcG9sVG9DYXI7XG5cbnBvbFRvQ2FyID0gZnVuY3Rpb24oYW5nbGUsIHJhZGl1cywgY2VudGVyKSB7XG4gIGlmIChjZW50ZXIgPT0gbnVsbCkge1xuICAgIGNlbnRlciA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHg6IHJhZGl1cyAqIChNYXRoLmNvcyhhbmdsZSkpICsgY2VudGVyLngsXG4gICAgeTogcmFkaXVzICogKE1hdGguc2luKGFuZ2xlKSkgKyBjZW50ZXIueVxuICB9O1xufTtcblxuY2hlY2tDb250YWlubWVudCA9IGZ1bmN0aW9uKHN1YlJlY3QsIGluUmVjdCkge1xuICByZXR1cm4gKHN1YlJlY3QubGVmdCA+PSBpblJlY3QubGVmdCkgJiYgKHN1YlJlY3QudG9wID49IGluUmVjdC50b3ApICYmIChzdWJSZWN0LnJpZ2h0IDw9IGluUmVjdC5yaWdodCkgJiYgKHN1YlJlY3QuYm90dG9tIDw9IGluUmVjdC5ib3R0b20pO1xufTtcblxuY2hlY2tJbnRlcnNlY3QgPSBmdW5jdGlvbihyMSwgcjIsIG1hcmdpbikge1xuICBpZiAobWFyZ2luID09IG51bGwpIHtcbiAgICBtYXJnaW4gPSAwO1xuICB9XG4gIHJldHVybiAhKChyMi5sZWZ0IC0gbWFyZ2luKSA+IHIxLnJpZ2h0IHx8IChyMi5yaWdodCArIG1hcmdpbikgPCByMS5sZWZ0IHx8IChyMi50b3AgLSBtYXJnaW4pID4gcjEuYm90dG9tIHx8IChyMi5ib3R0b20gKyBtYXJnaW4pIDwgcjEudG9wKTtcbn07XG5cbmNhbGN1bGF0ZVBvc2l0aW9uczIgPSBmdW5jdGlvbihjZW50ZXIsIHJhZGl1cywgaXRlbXMsIGJvdW5kcywgaXNIZWFkZWRMZWZ0KSB7XG4gIHZhciBjb2xsaWRlc1dpdGhQcmV2aW91cywgZmFydGhlc3RQdCwgbWF4RGltZW5zaW9uLCBta1JlY3Q7XG4gIG1rUmVjdCA9IGZ1bmN0aW9uKHB0LCBkaW0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVmdDogcHQueCAtIChkaW0ud2lkdGggLyAyKSxcbiAgICAgIHJpZ2h0OiBwdC54ICsgKGRpbS53aWR0aCAvIDIpLFxuICAgICAgdG9wOiBwdC55IC0gKGRpbS5oZWlnaHQgLyAyKSxcbiAgICAgIGJvdHRvbTogcHQueSArIChkaW0uaGVpZ2h0IC8gMilcbiAgICB9O1xuICB9O1xuICBjb2xsaWRlc1dpdGhQcmV2aW91cyA9IGZ1bmN0aW9uKHJlY3QsIHByZXZpb3VzKSB7XG4gICAgcmV0dXJuIHByZXZpb3VzLmZpbHRlcihmdW5jdGlvbihlbG0pIHtcbiAgICAgIHJldHVybiBjaGVja0ludGVyc2VjdChyZWN0LCBlbG0ucmVjdCwgMTApO1xuICAgIH0pLmxlbmd0aCA+IDA7XG4gIH07XG4gIG1heERpbWVuc2lvbiA9IGl0ZW1zLnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXJyZW50KSB7XG4gICAgaWYgKGN1cnJlbnQud2lkdGggPiBwcmV2LndpZHRoKSB7XG4gICAgICBwcmV2LndpZHRoID0gY3VycmVudC53aWR0aDtcbiAgICB9XG4gICAgaWYgKGN1cnJlbnQuaGVpZ2h0ID4gcHJldi5oZWlnaHQpIHtcbiAgICAgIHByZXYuaGVpZ2h0ID0gY3VycmVudC5oZWlnaHQ7XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9KTtcbiAgZmFydGhlc3RQdCA9IHtcbiAgICB4OiAoaXNIZWFkZWRMZWZ0ID8gLTEgOiAxKSAqIChyYWRpdXMgKyBtYXhEaW1lbnNpb24ud2lkdGgpICsgY2VudGVyLngsXG4gICAgeTogY2VudGVyLnlcbiAgfTtcbiAgaWYgKCFjaGVja0NvbnRhaW5tZW50KG1rUmVjdChmYXJ0aGVzdFB0LCB7XG4gICAgd2lkdGg6IDEsXG4gICAgaGVpZ2h0OiAxXG4gIH0pLCBib3VuZHMpKSB7XG4gICAgaXNIZWFkZWRMZWZ0ID0gIWlzSGVhZGVkTGVmdDtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlzSGVhZGVkTGVmdDogaXNIZWFkZWRMZWZ0LFxuICAgIGl0ZW1zOiBpdGVtcy5tYXAoZnVuY3Rpb24oZGltLCBpZHgpIHtcbiAgICAgIHZhciBhbmdsZSwgYW5nbGVEaXZpc2lvbiwgYW5nbGVPZmZzZXQsIGFuZ2xlU3BhbiwgYXR0ZW1wdCwgcG9zLCByLCByZWN0O1xuICAgICAgYW5nbGVTcGFuID0gTWF0aC5QSTtcbiAgICAgIGFuZ2xlRGl2aXNpb24gPSBhbmdsZVNwYW4gLyBpdGVtcy5sZW5ndGg7XG4gICAgICBhbmdsZU9mZnNldCA9IChpc0hlYWRlZExlZnQgPyBNYXRoLlBJIDogMCkgLSAoYW5nbGVTcGFuIC8gMikgKyAoYW5nbGVEaXZpc2lvbiAvIDIpO1xuICAgICAgYW5nbGUgPSBpZHggKiBhbmdsZURpdmlzaW9uICsgYW5nbGVPZmZzZXQ7XG4gICAgICBhbmdsZSA9IGFuZ2xlICogKGlzSGVhZGVkTGVmdCA/IDEgOiAtMSk7XG4gICAgICByID0gcmFkaXVzO1xuICAgICAgcG9zID0gcG9sVG9DYXIoYW5nbGUsIHIsIGNlbnRlcik7XG4gICAgICByZWN0ID0gbWtSZWN0KHBvcywgZGltKTtcbiAgICAgIGF0dGVtcHQgPSAwO1xuICAgICAgd2hpbGUgKCghY2hlY2tDb250YWlubWVudChyZWN0LCBib3VuZHMpKSAmJiAoYXR0ZW1wdCA8IDEwMCkpIHtcbiAgICAgICAgYXR0ZW1wdCsrO1xuICAgICAgICBhbmdsZSA9IGlzSGVhZGVkTGVmdCA/IDIgKiBNYXRoLlBJIC0gKGlkeCAqIChhbmdsZVNwYW4gLyAoaXRlbXMubGVuZ3RoIC0gMSkpICsgYW5nbGVPZmZzZXQpIDogaWR4ICogKGFuZ2xlU3BhbiAvIChpdGVtcy5sZW5ndGggLSAxKSkgKyBhbmdsZU9mZnNldDtcbiAgICAgICAgciA9IHJhZGl1cyAqIChhdHRlbXB0ICsgMSk7XG4gICAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByLCBjZW50ZXIpO1xuICAgICAgICByZWN0ID0gbWtSZWN0KHBvcywgZGltKTtcbiAgICAgIH1cbiAgICAgIGlmIChhdHRlbXB0ID4gNTApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2hpZ2ggbG9vcCcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgcmVjdDogcmVjdFxuICAgICAgfTtcbiAgICB9KVxuICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNhbGN1bGF0ZVBvc2l0aW9uczogY2FsY3VsYXRlUG9zaXRpb25zMlxufTtcbiJdfQ==
