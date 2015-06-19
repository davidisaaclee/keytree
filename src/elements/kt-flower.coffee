polToCar = (angle, radius) ->
  x: radius * (Math.cos angle)
  y: radius * (Math.sin angle)

TWO_PI = 2 * Math.PI

linkFlower = (scope, element, attrs) ->
  console.log 'linking flower'

  petalCollection = document.getElementsByClassName 'petal'
  scope.$watch petalCollection, ((val) -> console.log 'changed', val)

  # console.log scope, element, attrs
  for i in [0...petalCollection.length]
    petalCollection[i].style['position'] = 'relative'
    {x, y} = polToCar (TWO_PI * i / petalCollection.length), 50
    console.log "placing #{petalCollection[i]} at #{x}, #{y}"
    petalCollection[i].style['left'] = x
    petalCollection[i].style['top'] = y

module.exports = linkFlower