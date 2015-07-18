(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwicmFkaWFsLXBsb3R0ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY2FsY3VsYXRlUG9zaXRpb25zMiwgY2hlY2tDb250YWlubWVudCwgY2hlY2tJbnRlcnNlY3QsIHBvbFRvQ2FyO1xuXG5wb2xUb0NhciA9IGZ1bmN0aW9uKGFuZ2xlLCByYWRpdXMsIGNlbnRlcikge1xuICBpZiAoY2VudGVyID09IG51bGwpIHtcbiAgICBjZW50ZXIgPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIHtcbiAgICB4OiByYWRpdXMgKiAoTWF0aC5jb3MoYW5nbGUpKSArIGNlbnRlci54LFxuICAgIHk6IHJhZGl1cyAqIChNYXRoLnNpbihhbmdsZSkpICsgY2VudGVyLnlcbiAgfTtcbn07XG5cbmNoZWNrQ29udGFpbm1lbnQgPSBmdW5jdGlvbihzdWJSZWN0LCBpblJlY3QpIHtcbiAgcmV0dXJuIChzdWJSZWN0LmxlZnQgPj0gaW5SZWN0LmxlZnQpICYmIChzdWJSZWN0LnRvcCA+PSBpblJlY3QudG9wKSAmJiAoc3ViUmVjdC5yaWdodCA8PSBpblJlY3QucmlnaHQpICYmIChzdWJSZWN0LmJvdHRvbSA8PSBpblJlY3QuYm90dG9tKTtcbn07XG5cbmNoZWNrSW50ZXJzZWN0ID0gZnVuY3Rpb24ocjEsIHIyLCBtYXJnaW4pIHtcbiAgaWYgKG1hcmdpbiA9PSBudWxsKSB7XG4gICAgbWFyZ2luID0gMDtcbiAgfVxuICByZXR1cm4gISgocjIubGVmdCAtIG1hcmdpbikgPiByMS5yaWdodCB8fCAocjIucmlnaHQgKyBtYXJnaW4pIDwgcjEubGVmdCB8fCAocjIudG9wIC0gbWFyZ2luKSA+IHIxLmJvdHRvbSB8fCAocjIuYm90dG9tICsgbWFyZ2luKSA8IHIxLnRvcCk7XG59O1xuXG5jYWxjdWxhdGVQb3NpdGlvbnMyID0gZnVuY3Rpb24oY2VudGVyLCByYWRpdXMsIGl0ZW1zLCBib3VuZHMsIGlzSGVhZGVkTGVmdCkge1xuICB2YXIgY29sbGlkZXNXaXRoUHJldmlvdXMsIGZhcnRoZXN0UHQsIG1heERpbWVuc2lvbiwgbWtSZWN0O1xuICBta1JlY3QgPSBmdW5jdGlvbihwdCwgZGltKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxlZnQ6IHB0LnggLSAoZGltLndpZHRoIC8gMiksXG4gICAgICByaWdodDogcHQueCArIChkaW0ud2lkdGggLyAyKSxcbiAgICAgIHRvcDogcHQueSAtIChkaW0uaGVpZ2h0IC8gMiksXG4gICAgICBib3R0b206IHB0LnkgKyAoZGltLmhlaWdodCAvIDIpXG4gICAgfTtcbiAgfTtcbiAgY29sbGlkZXNXaXRoUHJldmlvdXMgPSBmdW5jdGlvbihyZWN0LCBwcmV2aW91cykge1xuICAgIHJldHVybiBwcmV2aW91cy5maWx0ZXIoZnVuY3Rpb24oZWxtKSB7XG4gICAgICByZXR1cm4gY2hlY2tJbnRlcnNlY3QocmVjdCwgZWxtLnJlY3QsIDEwKTtcbiAgICB9KS5sZW5ndGggPiAwO1xuICB9O1xuICBtYXhEaW1lbnNpb24gPSBpdGVtcy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VycmVudCkge1xuICAgIGlmIChjdXJyZW50LndpZHRoID4gcHJldi53aWR0aCkge1xuICAgICAgcHJldi53aWR0aCA9IGN1cnJlbnQud2lkdGg7XG4gICAgfVxuICAgIGlmIChjdXJyZW50LmhlaWdodCA+IHByZXYuaGVpZ2h0KSB7XG4gICAgICBwcmV2LmhlaWdodCA9IGN1cnJlbnQuaGVpZ2h0O1xuICAgIH1cbiAgICByZXR1cm4gcHJldjtcbiAgfSk7XG4gIGZhcnRoZXN0UHQgPSB7XG4gICAgeDogKGlzSGVhZGVkTGVmdCA/IC0xIDogMSkgKiAocmFkaXVzICsgbWF4RGltZW5zaW9uLndpZHRoKSArIGNlbnRlci54LFxuICAgIHk6IGNlbnRlci55XG4gIH07XG4gIGlmICghY2hlY2tDb250YWlubWVudChta1JlY3QoZmFydGhlc3RQdCwge1xuICAgIHdpZHRoOiAxLFxuICAgIGhlaWdodDogMVxuICB9KSwgYm91bmRzKSkge1xuICAgIGlzSGVhZGVkTGVmdCA9ICFpc0hlYWRlZExlZnQ7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpc0hlYWRlZExlZnQ6IGlzSGVhZGVkTGVmdCxcbiAgICBpdGVtczogaXRlbXMubWFwKGZ1bmN0aW9uKGRpbSwgaWR4KSB7XG4gICAgICB2YXIgYW5nbGUsIGFuZ2xlRGl2aXNpb24sIGFuZ2xlT2Zmc2V0LCBhbmdsZVNwYW4sIGF0dGVtcHQsIHBvcywgciwgcmVjdDtcbiAgICAgIGFuZ2xlU3BhbiA9IE1hdGguUEk7XG4gICAgICBhbmdsZURpdmlzaW9uID0gYW5nbGVTcGFuIC8gaXRlbXMubGVuZ3RoO1xuICAgICAgYW5nbGVPZmZzZXQgPSAoaXNIZWFkZWRMZWZ0ID8gTWF0aC5QSSA6IDApIC0gKGFuZ2xlU3BhbiAvIDIpICsgKGFuZ2xlRGl2aXNpb24gLyAyKTtcbiAgICAgIGFuZ2xlID0gaWR4ICogYW5nbGVEaXZpc2lvbiArIGFuZ2xlT2Zmc2V0O1xuICAgICAgYW5nbGUgPSBhbmdsZSAqIChpc0hlYWRlZExlZnQgPyAxIDogLTEpO1xuICAgICAgciA9IHJhZGl1cztcbiAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByLCBjZW50ZXIpO1xuICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICBhdHRlbXB0ID0gMDtcbiAgICAgIHdoaWxlICgoIWNoZWNrQ29udGFpbm1lbnQocmVjdCwgYm91bmRzKSkgJiYgKGF0dGVtcHQgPCAxMDApKSB7XG4gICAgICAgIGF0dGVtcHQrKztcbiAgICAgICAgYW5nbGUgPSBpc0hlYWRlZExlZnQgPyAyICogTWF0aC5QSSAtIChpZHggKiAoYW5nbGVTcGFuIC8gKGl0ZW1zLmxlbmd0aCAtIDEpKSArIGFuZ2xlT2Zmc2V0KSA6IGlkeCAqIChhbmdsZVNwYW4gLyAoaXRlbXMubGVuZ3RoIC0gMSkpICsgYW5nbGVPZmZzZXQ7XG4gICAgICAgIHIgPSByYWRpdXMgKiAoYXR0ZW1wdCArIDEpO1xuICAgICAgICBwb3MgPSBwb2xUb0NhcihhbmdsZSwgciwgY2VudGVyKTtcbiAgICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICB9XG4gICAgICBpZiAoYXR0ZW1wdCA+IDUwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdoaWdoIGxvb3AnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgIHJlY3Q6IHJlY3RcbiAgICAgIH07XG4gICAgfSlcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjYWxjdWxhdGVQb3NpdGlvbnM6IGNhbGN1bGF0ZVBvc2l0aW9uczJcbn07XG4iXX0=
