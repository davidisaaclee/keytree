polToCar = (angle, radius, center = {x: 0, y: 0}) ->
  x: radius * (Math.cos angle) + center.x
  y: radius * (Math.sin angle) + center.y

checkContainment = (subRect, inRect) ->
  (subRect.left   >= inRect.left)  and
  (subRect.top    >= inRect.top)   and
  (subRect.right  <= inRect.right) and
  (subRect.bottom <= inRect.bottom)

checkIntersect = (r1, r2, margin = 0) ->
  not \
    ((r2.left - margin) > r1.right or
     (r2.right + margin) < r1.left or
     (r2.top - margin) > r1.bottom or
     (r2.bottom + margin) < r1.top)

# calculatePositions = (center, items, bounds, algorithm = 'rotate') ->
#   mkRect = (pt, dim) ->
#     left: pt.x - (dim.width / 2)
#     right: pt.x + (dim.width / 2)
#     top: pt.y - (dim.height / 2)
#     bottom: pt.y + (dim.height / 2)
#   collidesWithPrevious = (rect, previous) ->
#     previous
#       .filter (elm) -> checkIntersect rect, elm.rect, 10
#       .length > 0

#   result = []
#   for dim, i in items
#     angle = (2 * Math.PI) * i / items.length
#     pos = polToCar angle, state.radius, center
#     rect = mkRect pos, dim
#     attempt = 0

#     ###
#     When a petal goes out of view, we want to move it to the closest valid
#     relocation point to the petal's original position.
#     We find a zero-crossing in the deltas between distances to valid relocation
#     points -> we have our closest relocation point.
#     ###

#     isContained = checkContainment rect, bounds
#     isIntersectingOtherPetal = collidesWithPrevious rect, result

#     while ((not isContained) or isIntersectingOtherPetal) and (attempt < 200)
#       if algorithm is 'closest'
#         attempt = attempt + 1
#         # subtracting 1 from attempt, since attempts 1-items.length are on
#         #   ring 1 (and attempt 0 is the only attempt on ring 0)
#         ringIndex = Math.floor((attempt - 1) / items.length) + 1
#         angleMultiplier = i + attempt
#         # TODO: change division based on ring index (+ radius + petal size)
#         angleDivision = (2 * Math.PI) / items.length
#         angleMultiplier = i + ((if attempt % 2 then -1 else 1) * Math.floor(attempt / 2))
#         angleOffset = 0
#         # angleMultiplier = i
#         # angleOffset = (Math.floor(attempt / items.length) % 2) * (angleDivision / 2)
#         # angleOffset = angleDivision / 2

#         angle = angleMultiplier * angleDivision + angleOffset
#         radius = state.radius * (1 + ringIndex)
#         pos = polToCar angle, radius, center
#         rect = mkRect pos, dim
#       else if algorithm is 'rotate'
#         attempt++
#         angleDivision = 2 * Math.PI / items.length
#         defaultAngle = i * angleDivision
#         angleNudge = angleDivision * (attempt - 1) % items.length
#         angleFlip = Math.PI
#         angle = defaultAngle + angleFlip + angleNudge

#         radius = state.radius * (Math.floor((attempt - 1) / items.length) + 2)
#         pos = polToCar angle, radius, center
#         rect = mkRect pos, dim
#       else if algorithm is 'flip'
#         attempt++
#         angle = -(2 * Math.PI) * i / items.length
#         radius = state.radius * 2
#         pos = polToCar angle, radius, center
#         rect = mkRect pos, dim
#       else
#         console.log 'Unknown algorithm', algorithm

#       isContained = checkContainment rect, bounds
#       isIntersectingOtherPetal = collidesWithPrevious rect, result

#     result.push {position: pos, rect: rect}
#     if attempt > 100 then console.log 'high attempt count: ', attempt
#   return result


# center : {x, y}
# radius : Number
# items : {width, height}
# bounds : DOMRect
# isHeadedLeft : Boolean
# returns {isHeadedLeft: Boolean, items: [{position: {x, y}, rect: DOMRect}]}
calculatePositions2 = (center, radius, items, bounds, isHeadedLeft) ->
  mkRect = (pt, dim) ->
    left: pt.x - (dim.width / 2)
    right: pt.x + (dim.width / 2)
    top: pt.y - (dim.height / 2)
    bottom: pt.y + (dim.height / 2)
  collidesWithPrevious = (rect, previous) ->
    previous
      .filter (elm) -> checkIntersect rect, elm.rect, 10
      .length > 0

  # directionVector =
  #   x: Math.cos direction
  #   y: Math.sin direction

  maxDimension =
    items.reduce (prev, current) ->
      if current.width > prev.width
        prev.width = current.width
      if current.height > prev.height
        prev.height = current.height
      prev

  farthestPt =
    x: (if isHeadedLeft then -1 else 1) * (radius + maxDimension.width) + center.x
    # y: directionVector.y * (state.radius + maxDimension.height) + center.y
    y: center.y

  if not checkContainment (mkRect farthestPt, {width: 1, height: 1}), bounds
    isHeadedLeft = !isHeadedLeft

  isHeadedLeft: isHeadedLeft
  items: items.map (dim, idx) ->
    angleSpan = Math.PI
    angleDivision = angleSpan / items.length
    angleOffset =
      (if isHeadedLeft then Math.PI else 0) - 
        (angleSpan / 2) +
        (angleDivision / 2)
    angle = idx * angleDivision + angleOffset
    angle = angle * (if isHeadedLeft then 1 else -1)
    r = radius
    pos = polToCar angle, r, center
    rect = mkRect pos, dim

    attempt = 0
    while (not checkContainment rect, bounds) and (attempt < 100)
      attempt++
      angle =
        if isHeadedLeft
        then 2 * Math.PI - (idx * (angleSpan / (items.length - 1)) + angleOffset)
        else (idx * (angleSpan / (items.length - 1)) + angleOffset)

      r = radius * (attempt + 1)
      pos = polToCar angle, r, center
      rect = mkRect pos, dim

    if attempt > 50 then console.log 'high loop'
    
    position: pos
    rect: rect




####################################


module.exports =
  calculatePositions: calculatePositions2