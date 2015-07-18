{calculatePositions} = require '../../radial-plotter'

rgbToHex = (r, g, b) ->
  formatHex = (n) -> ('00' + Math.floor(n).toString 16).substr -2
  '#' + "#{formatHex r}#{formatHex g}#{formatHex b}"

mkRandomDimensions = () ->
  wmax = 10
  wmin = 10
  hmin = 10
  hmax = 10
  width: Math.random() * (wmax - wmin) + wmin
  height: Math.random() * (hmax - hmin) + hmin


state =
  items: (do mkRandomDimensions for i in [0..10])
  radius: 50
  bounds: {left: 0, right: 500, top: 0, bottom: 500}
  isHeadedLeft: true

for item, idx in state.items
  item.color =
    rgbToHex \
      idx * (255 / state.items.length),
      idx * (127 / state.items.length),
      idx * (64 / state.items.length)

draw = (canvas) ->
  window.requestAnimationFrame () -> draw canvas

  context = canvas.getContext '2d'
  do context.save

  context.clearRect 0, 0, canvas.width, canvas.height
  context.fillStyle = '#555'
  context.fillRect 0, 0, canvas.width, canvas.height

  if state.mousePosition?
    context.fillStyle = 'black'
    sideLength = 10
    context.fillRect \
      state.mousePosition.x - (sideLength / 2), \
      state.mousePosition.y - (sideLength / 2), \
      sideLength, \
      sideLength

  if state.positions?
    state.positions.map ({position, rect}, idx) ->
      context.fillStyle = state.items[idx].color
      context.fillRect \
        rect.left, \
        rect.top, \
        rect.right - rect.left, \
        rect.bottom - rect.top

  do context.restore

attach = (canvas) ->
  window.requestAnimationFrame () -> draw canvas
  context = canvas.getContext '2d'
  canvas.addEventListener 'mousemove', (evt) ->
    state.mousePosition =
      x: evt.offsetX
      y: evt.offsetY
     {items, isHeadedLeft} =
      calculatePositions \
        state.mousePosition, \
        50,
        state.items, \
        state.bounds, \
        state.isHeadedLeft
    state.positions = items
    state.isHeadedLeft = isHeadedLeft

attach document.getElementById 'canvas'