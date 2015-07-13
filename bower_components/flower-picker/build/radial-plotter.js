(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9ndWxwLWNvZmZlZWlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwicmFkaWFsLXBsb3R0ZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgY2FsY3VsYXRlUG9zaXRpb25zLCBjYWxjdWxhdGVQb3NpdGlvbnMyLCBjaGVja0NvbnRhaW5tZW50LCBjaGVja0ludGVyc2VjdCwgcG9sVG9DYXI7XG5cbnBvbFRvQ2FyID0gZnVuY3Rpb24oYW5nbGUsIHJhZGl1cywgY2VudGVyKSB7XG4gIGlmIChjZW50ZXIgPT0gbnVsbCkge1xuICAgIGNlbnRlciA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHg6IHJhZGl1cyAqIChNYXRoLmNvcyhhbmdsZSkpICsgY2VudGVyLngsXG4gICAgeTogcmFkaXVzICogKE1hdGguc2luKGFuZ2xlKSkgKyBjZW50ZXIueVxuICB9O1xufTtcblxuY2hlY2tDb250YWlubWVudCA9IGZ1bmN0aW9uKHN1YlJlY3QsIGluUmVjdCkge1xuICByZXR1cm4gKHN1YlJlY3QubGVmdCA+PSBpblJlY3QubGVmdCkgJiYgKHN1YlJlY3QudG9wID49IGluUmVjdC50b3ApICYmIChzdWJSZWN0LnJpZ2h0IDw9IGluUmVjdC5yaWdodCkgJiYgKHN1YlJlY3QuYm90dG9tIDw9IGluUmVjdC5ib3R0b20pO1xufTtcblxuY2hlY2tJbnRlcnNlY3QgPSBmdW5jdGlvbihyMSwgcjIsIG1hcmdpbikge1xuICBpZiAobWFyZ2luID09IG51bGwpIHtcbiAgICBtYXJnaW4gPSAwO1xuICB9XG4gIHJldHVybiAhKChyMi5sZWZ0IC0gbWFyZ2luKSA+IHIxLnJpZ2h0IHx8IChyMi5yaWdodCArIG1hcmdpbikgPCByMS5sZWZ0IHx8IChyMi50b3AgLSBtYXJnaW4pID4gcjEuYm90dG9tIHx8IChyMi5ib3R0b20gKyBtYXJnaW4pIDwgcjEudG9wKTtcbn07XG5cbmNhbGN1bGF0ZVBvc2l0aW9ucyA9IGZ1bmN0aW9uKGNlbnRlciwgaXRlbXMsIGJvdW5kcywgYWxnb3JpdGhtKSB7XG4gIHZhciBhbmdsZSwgYW5nbGVEaXZpc2lvbiwgYW5nbGVGbGlwLCBhbmdsZU11bHRpcGxpZXIsIGFuZ2xlTnVkZ2UsIGFuZ2xlT2Zmc2V0LCBhdHRlbXB0LCBjb2xsaWRlc1dpdGhQcmV2aW91cywgZGVmYXVsdEFuZ2xlLCBkaW0sIGksIGlzQ29udGFpbmVkLCBpc0ludGVyc2VjdGluZ090aGVyUGV0YWwsIGosIGxlbiwgbWtSZWN0LCBwb3MsIHJhZGl1cywgcmVjdCwgcmVzdWx0LCByaW5nSW5kZXg7XG4gIGlmIChhbGdvcml0aG0gPT0gbnVsbCkge1xuICAgIGFsZ29yaXRobSA9ICdyb3RhdGUnO1xuICB9XG4gIG1rUmVjdCA9IGZ1bmN0aW9uKHB0LCBkaW0pIHtcbiAgICByZXR1cm4ge1xuICAgICAgbGVmdDogcHQueCAtIChkaW0ud2lkdGggLyAyKSxcbiAgICAgIHJpZ2h0OiBwdC54ICsgKGRpbS53aWR0aCAvIDIpLFxuICAgICAgdG9wOiBwdC55IC0gKGRpbS5oZWlnaHQgLyAyKSxcbiAgICAgIGJvdHRvbTogcHQueSArIChkaW0uaGVpZ2h0IC8gMilcbiAgICB9O1xuICB9O1xuICBjb2xsaWRlc1dpdGhQcmV2aW91cyA9IGZ1bmN0aW9uKHJlY3QsIHByZXZpb3VzKSB7XG4gICAgcmV0dXJuIHByZXZpb3VzLmZpbHRlcihmdW5jdGlvbihlbG0pIHtcbiAgICAgIHJldHVybiBjaGVja0ludGVyc2VjdChyZWN0LCBlbG0ucmVjdCwgMTApO1xuICAgIH0pLmxlbmd0aCA+IDA7XG4gIH07XG4gIHJlc3VsdCA9IFtdO1xuICBmb3IgKGkgPSBqID0gMCwgbGVuID0gaXRlbXMubGVuZ3RoOyBqIDwgbGVuOyBpID0gKytqKSB7XG4gICAgZGltID0gaXRlbXNbaV07XG4gICAgYW5nbGUgPSAoMiAqIE1hdGguUEkpICogaSAvIGl0ZW1zLmxlbmd0aDtcbiAgICBwb3MgPSBwb2xUb0NhcihhbmdsZSwgc3RhdGUucmFkaXVzLCBjZW50ZXIpO1xuICAgIHJlY3QgPSBta1JlY3QocG9zLCBkaW0pO1xuICAgIGF0dGVtcHQgPSAwO1xuXG4gICAgLypcbiAgICBXaGVuIGEgcGV0YWwgZ29lcyBvdXQgb2Ygdmlldywgd2Ugd2FudCB0byBtb3ZlIGl0IHRvIHRoZSBjbG9zZXN0IHZhbGlkXG4gICAgcmVsb2NhdGlvbiBwb2ludCB0byB0aGUgcGV0YWwncyBvcmlnaW5hbCBwb3NpdGlvbi5cbiAgICBXZSBmaW5kIGEgemVyby1jcm9zc2luZyBpbiB0aGUgZGVsdGFzIGJldHdlZW4gZGlzdGFuY2VzIHRvIHZhbGlkIHJlbG9jYXRpb25cbiAgICBwb2ludHMgLT4gd2UgaGF2ZSBvdXIgY2xvc2VzdCByZWxvY2F0aW9uIHBvaW50LlxuICAgICAqL1xuICAgIGlzQ29udGFpbmVkID0gY2hlY2tDb250YWlubWVudChyZWN0LCBib3VuZHMpO1xuICAgIGlzSW50ZXJzZWN0aW5nT3RoZXJQZXRhbCA9IGNvbGxpZGVzV2l0aFByZXZpb3VzKHJlY3QsIHJlc3VsdCk7XG4gICAgd2hpbGUgKCgoIWlzQ29udGFpbmVkKSB8fCBpc0ludGVyc2VjdGluZ090aGVyUGV0YWwpICYmIChhdHRlbXB0IDwgMjAwKSkge1xuICAgICAgaWYgKGFsZ29yaXRobSA9PT0gJ2Nsb3Nlc3QnKSB7XG4gICAgICAgIGF0dGVtcHQgPSBhdHRlbXB0ICsgMTtcbiAgICAgICAgcmluZ0luZGV4ID0gTWF0aC5mbG9vcigoYXR0ZW1wdCAtIDEpIC8gaXRlbXMubGVuZ3RoKSArIDE7XG4gICAgICAgIGFuZ2xlTXVsdGlwbGllciA9IGkgKyBhdHRlbXB0O1xuICAgICAgICBhbmdsZURpdmlzaW9uID0gKDIgKiBNYXRoLlBJKSAvIGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgYW5nbGVNdWx0aXBsaWVyID0gaSArICgoYXR0ZW1wdCAlIDIgPyAtMSA6IDEpICogTWF0aC5mbG9vcihhdHRlbXB0IC8gMikpO1xuICAgICAgICBhbmdsZU9mZnNldCA9IDA7XG4gICAgICAgIGFuZ2xlID0gYW5nbGVNdWx0aXBsaWVyICogYW5nbGVEaXZpc2lvbiArIGFuZ2xlT2Zmc2V0O1xuICAgICAgICByYWRpdXMgPSBzdGF0ZS5yYWRpdXMgKiAoMSArIHJpbmdJbmRleCk7XG4gICAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByYWRpdXMsIGNlbnRlcik7XG4gICAgICAgIHJlY3QgPSBta1JlY3QocG9zLCBkaW0pO1xuICAgICAgfSBlbHNlIGlmIChhbGdvcml0aG0gPT09ICdyb3RhdGUnKSB7XG4gICAgICAgIGF0dGVtcHQrKztcbiAgICAgICAgYW5nbGVEaXZpc2lvbiA9IDIgKiBNYXRoLlBJIC8gaXRlbXMubGVuZ3RoO1xuICAgICAgICBkZWZhdWx0QW5nbGUgPSBpICogYW5nbGVEaXZpc2lvbjtcbiAgICAgICAgYW5nbGVOdWRnZSA9IGFuZ2xlRGl2aXNpb24gKiAoYXR0ZW1wdCAtIDEpICUgaXRlbXMubGVuZ3RoO1xuICAgICAgICBhbmdsZUZsaXAgPSBNYXRoLlBJO1xuICAgICAgICBhbmdsZSA9IGRlZmF1bHRBbmdsZSArIGFuZ2xlRmxpcCArIGFuZ2xlTnVkZ2U7XG4gICAgICAgIHJhZGl1cyA9IHN0YXRlLnJhZGl1cyAqIChNYXRoLmZsb29yKChhdHRlbXB0IC0gMSkgLyBpdGVtcy5sZW5ndGgpICsgMik7XG4gICAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByYWRpdXMsIGNlbnRlcik7XG4gICAgICAgIHJlY3QgPSBta1JlY3QocG9zLCBkaW0pO1xuICAgICAgfSBlbHNlIGlmIChhbGdvcml0aG0gPT09ICdmbGlwJykge1xuICAgICAgICBhdHRlbXB0Kys7XG4gICAgICAgIGFuZ2xlID0gLSgyICogTWF0aC5QSSkgKiBpIC8gaXRlbXMubGVuZ3RoO1xuICAgICAgICByYWRpdXMgPSBzdGF0ZS5yYWRpdXMgKiAyO1xuICAgICAgICBwb3MgPSBwb2xUb0NhcihhbmdsZSwgcmFkaXVzLCBjZW50ZXIpO1xuICAgICAgICByZWN0ID0gbWtSZWN0KHBvcywgZGltKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdVbmtub3duIGFsZ29yaXRobScsIGFsZ29yaXRobSk7XG4gICAgICB9XG4gICAgICBpc0NvbnRhaW5lZCA9IGNoZWNrQ29udGFpbm1lbnQocmVjdCwgYm91bmRzKTtcbiAgICAgIGlzSW50ZXJzZWN0aW5nT3RoZXJQZXRhbCA9IGNvbGxpZGVzV2l0aFByZXZpb3VzKHJlY3QsIHJlc3VsdCk7XG4gICAgfVxuICAgIHJlc3VsdC5wdXNoKHtcbiAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICByZWN0OiByZWN0XG4gICAgfSk7XG4gICAgaWYgKGF0dGVtcHQgPiAxMDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdoaWdoIGF0dGVtcHQgY291bnQ6ICcsIGF0dGVtcHQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuY2FsY3VsYXRlUG9zaXRpb25zMiA9IGZ1bmN0aW9uKGNlbnRlciwgcmFkaXVzLCBpdGVtcywgYm91bmRzLCBpc0hlYWRlZExlZnQpIHtcbiAgdmFyIGNvbGxpZGVzV2l0aFByZXZpb3VzLCBmYXJ0aGVzdFB0LCBtYXhEaW1lbnNpb24sIG1rUmVjdDtcbiAgbWtSZWN0ID0gZnVuY3Rpb24ocHQsIGRpbSkge1xuICAgIHJldHVybiB7XG4gICAgICBsZWZ0OiBwdC54IC0gKGRpbS53aWR0aCAvIDIpLFxuICAgICAgcmlnaHQ6IHB0LnggKyAoZGltLndpZHRoIC8gMiksXG4gICAgICB0b3A6IHB0LnkgLSAoZGltLmhlaWdodCAvIDIpLFxuICAgICAgYm90dG9tOiBwdC55ICsgKGRpbS5oZWlnaHQgLyAyKVxuICAgIH07XG4gIH07XG4gIGNvbGxpZGVzV2l0aFByZXZpb3VzID0gZnVuY3Rpb24ocmVjdCwgcHJldmlvdXMpIHtcbiAgICByZXR1cm4gcHJldmlvdXMuZmlsdGVyKGZ1bmN0aW9uKGVsbSkge1xuICAgICAgcmV0dXJuIGNoZWNrSW50ZXJzZWN0KHJlY3QsIGVsbS5yZWN0LCAxMCk7XG4gICAgfSkubGVuZ3RoID4gMDtcbiAgfTtcbiAgbWF4RGltZW5zaW9uID0gaXRlbXMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnJlbnQpIHtcbiAgICBpZiAoY3VycmVudC53aWR0aCA+IHByZXYud2lkdGgpIHtcbiAgICAgIHByZXYud2lkdGggPSBjdXJyZW50LndpZHRoO1xuICAgIH1cbiAgICBpZiAoY3VycmVudC5oZWlnaHQgPiBwcmV2LmhlaWdodCkge1xuICAgICAgcHJldi5oZWlnaHQgPSBjdXJyZW50LmhlaWdodDtcbiAgICB9XG4gICAgcmV0dXJuIHByZXY7XG4gIH0pO1xuICBmYXJ0aGVzdFB0ID0ge1xuICAgIHg6IChpc0hlYWRlZExlZnQgPyAtMSA6IDEpICogKHJhZGl1cyArIG1heERpbWVuc2lvbi53aWR0aCkgKyBjZW50ZXIueCxcbiAgICB5OiBjZW50ZXIueVxuICB9O1xuICBpZiAoIWNoZWNrQ29udGFpbm1lbnQobWtSZWN0KGZhcnRoZXN0UHQsIHtcbiAgICB3aWR0aDogMSxcbiAgICBoZWlnaHQ6IDFcbiAgfSksIGJvdW5kcykpIHtcbiAgICBpc0hlYWRlZExlZnQgPSAhaXNIZWFkZWRMZWZ0O1xuICB9XG4gIHJldHVybiB7XG4gICAgaXNIZWFkZWRMZWZ0OiBpc0hlYWRlZExlZnQsXG4gICAgaXRlbXM6IGl0ZW1zLm1hcChmdW5jdGlvbihkaW0sIGlkeCkge1xuICAgICAgdmFyIGFuZ2xlLCBhbmdsZU9mZnNldCwgYW5nbGVTcGFuLCBhdHRlbXB0LCBwb3MsIHIsIHJlY3Q7XG4gICAgICBhbmdsZVNwYW4gPSBNYXRoLlBJO1xuICAgICAgYW5nbGVPZmZzZXQgPSAoaXNIZWFkZWRMZWZ0ID8gTWF0aC5QSSA6IDApIC0gKGFuZ2xlU3BhbiAvIDIpO1xuICAgICAgYW5nbGUgPSBpZHggKiAoYW5nbGVTcGFuIC8gKGl0ZW1zLmxlbmd0aCAtIDEpKSArIGFuZ2xlT2Zmc2V0O1xuICAgICAgYW5nbGUgPSBhbmdsZSAqIChpc0hlYWRlZExlZnQgPyAxIDogLTEpO1xuICAgICAgciA9IHJhZGl1cztcbiAgICAgIHBvcyA9IHBvbFRvQ2FyKGFuZ2xlLCByLCBjZW50ZXIpO1xuICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICBhdHRlbXB0ID0gMDtcbiAgICAgIHdoaWxlICgoIWNoZWNrQ29udGFpbm1lbnQocmVjdCwgYm91bmRzKSkgJiYgKGF0dGVtcHQgPCAxMDApKSB7XG4gICAgICAgIGF0dGVtcHQrKztcbiAgICAgICAgYW5nbGUgPSBpc0hlYWRlZExlZnQgPyAyICogTWF0aC5QSSAtIChpZHggKiAoYW5nbGVTcGFuIC8gKGl0ZW1zLmxlbmd0aCAtIDEpKSArIGFuZ2xlT2Zmc2V0KSA6IGlkeCAqIChhbmdsZVNwYW4gLyAoaXRlbXMubGVuZ3RoIC0gMSkpICsgYW5nbGVPZmZzZXQ7XG4gICAgICAgIHIgPSByYWRpdXMgKiAoYXR0ZW1wdCArIDEpO1xuICAgICAgICBwb3MgPSBwb2xUb0NhcihhbmdsZSwgciwgY2VudGVyKTtcbiAgICAgICAgcmVjdCA9IG1rUmVjdChwb3MsIGRpbSk7XG4gICAgICB9XG4gICAgICBpZiAoYXR0ZW1wdCA+IDUwKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdoaWdoIGxvb3AnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBvc2l0aW9uOiBwb3MsXG4gICAgICAgIHJlY3Q6IHJlY3RcbiAgICAgIH07XG4gICAgfSlcbiAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjYWxjdWxhdGVQb3NpdGlvbnM6IGNhbGN1bGF0ZVBvc2l0aW9uczJcbn07XG4iXX0=
