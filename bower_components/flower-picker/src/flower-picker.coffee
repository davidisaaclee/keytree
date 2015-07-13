_ = require 'lodash'
{calculatePositions} = require './radial-plotter'

createElement = (tag, options) ->
  result = document.createElement tag
  if options.id?
    result.id = options.id
  if options.classes?
    for cl in options.classes
      Polymer.dom(result).classList.add cl
  if options.listeners?
    for name, callback of options.listeners
      result.addEventListener name, callback
  if options.parent?
    Polymer.dom(options.parent).appendChild result
  return result

polToCar = (angle, radius) ->
  x: radius * (Math.cos angle)
  y: radius * (Math.sin angle)

centerToOffset = ({x, y}, element) ->
  rect = element.getBoundingClientRect()

  top: y - (rect.height / 2)
  left: x - (rect.width / 2)

elementCenterPosition = (element, relativeTo) ->
  elmBounds = element.getBoundingClientRect()
  relBounds = relativeTo.getBoundingClientRect()

  x: elmBounds.left - relBounds.left + (elmBounds.width / 2)
  y: elmBounds.top - relBounds.top + (elmBounds.height / 2)

checkContainment = (subRect, inRect) ->
  (subRect.left   >= inRect.left)  and
  (subRect.top    >= inRect.top)   and
  (subRect.right  <= inRect.right) and
  (subRect.bottom <= inRect.bottom)

rectFromOffset = (baseRect, {x, y}) ->
  result =
    left: x + baseRect.left,
    top: y + baseRect.top,
    width: baseRect.width,
    height: baseRect.height
  result['right'] = result.left + result.width
  result['bottom'] = result.top + result.height
  return result

TWO_PI = Math.PI * 2

toCssFigure = (num) -> num.toPrecision(8)

Polymer
  is: 'flower-picker'

  properties:
    petals:
      type: Array
    radius:
      type: Number
      value: 80
    enabled:
      type: Boolean
      value: false
    stayWithin:
      type: String
      observer: '_stayWithinChanged'

  ready: () ->
    # boundHandler = _.bind @_handleTrack, this
    # Polymer.Gestures.add @_container(), 'track', boundHandler
    # do @enable

  enable: () ->
    # Polymer.Gestures.add @_container(), 'track', (_.bind @_handleTrack, this)
    @enabled = true

  disable: () ->
    # Polymer.Gestures.remove @_container(), 'track', (_.bind @_handleTrack, this)
    @enabled = false

  start: (origin) ->
    @enable()
    @_isActive = true
    @_spawnFlower origin, @petals

  finish: ({x, y}) ->
    @disable()
    if @_overPetal? and @_overPetal.isLeaf
      this.fire 'selected',
        petal: @_overPetal
        value: do =>
          if @_overPetal.value?
          then @_overPetal.value @_overPetal.model
          else @_overPetal.model

    # delete each flower node; return flower list to empty
    detachFromParent = (element) ->
      parent = Polymer.dom(element).parentNode
      Polymer.dom(parent).removeChild(element)
    _.each @_flowers,
      _.flow (({element}) -> element), detachFromParent

    @_flowers = []
    @_overPetal = null
    @_isActive = false

  # ---- State fields ---- #

  # all flowers in the current stack
  _flowers: []

  # the currently hovered-over petal
  _overPetal: null

  # is a flower currently being displayed?
  _isActive: false

  # are the blossoms facing left?
  _isHeadedLeft: true

  # ---- Convenience references ---- #

  _container: () -> @$['picker-container']


  # ---- Private methods ---- #

  _createPetalElement: (model, flowerIndex) ->
    if not model.isBackPetal?
      scope = this
      petal = createElement 'div',
        classes: ['petal', 'unselectable']
        listeners:
          'trackover': (detail) -> scope._hoverPetal petal, model, flowerIndex
          'down': (detail) -> scope._hoverPetal petal, model, flowerIndex
          'trackout': (detail) -> scope._unhoverPetal petal

      Polymer.dom(petal).innerHTML =
        if model.display?
        then model.display(model.model)
        else model.model

      console.log 'petal set to ', Polymer.dom(petal).innerHTML, model.display?, model.display(model.model)

      if model.isLeaf
      then Polymer.dom(petal).classList.add 'leaf'
      else Polymer.dom(petal).classList.add 'branch'
    else
      # is a back-petal; don't draw anything for now?
      petal = document.createElement 'div'

    return petal

  _spawnFlower: (origin, petals, backPetalPoint) ->
    spawningFlowerIndex = @_flowers.length

    flower = createElement 'div',
      id: "flower#{spawningFlowerIndex}"
      classes: ['flower']
      parent: @_container()

    pistil = createElement 'div',
      id: "pistil#{spawningFlowerIndex}"
      classes: ['pistil']
      parent: flower

    offsetFlower = do ->
      {top, left} = centerToOffset origin, flower
      left: toCssFigure left
      top: toCssFigure top
    this.transform "translate(\
      #{offsetFlower.left}px, \
      #{offsetFlower.top}px)", \
      flower

    offsetPistil = do ->
      flowerCenter = elementCenterPosition flower, flower
      {top, left} = centerToOffset flowerCenter, pistil
      left: toCssFigure left
      top: toCssFigure top
    this.transform "translate(\
      #{offsetPistil.left}px, \
      #{offsetPistil.top}px)", \
      pistil

    pistil.addEventListener 'trackover', \
      (evt) => @_hoverPistil spawningFlowerIndex

    # deactivate lower flowers
    if @_flowers.length != 0
      @_deactivateFlower @_flowers[@_flowers.length - 1]

    angleOffset = (Math.PI / (2 * petals.length)) + Math.PI

    petalElements =
      petals.map (model) => @_createPetalElement model, spawningFlowerIndex
    petalElements.forEach (elm) -> Polymer.dom(flower).appendChild elm
    # bounds = @_container().getBoundingClientRect()
    bounds = @_stayWithinElement?.getBoundingClientRect()
    {items, isHeadedLeft} =
      calculatePositions \
        origin,
        @radius,
        (petalElements.map (elm) -> elm.getBoundingClientRect()),
        bounds,
        @_isHeadedLeft

    @_isHeadedLeft = isHeadedLeft

    flowerBox = flower.getBoundingClientRect()
    _.zip petalElements, items
      .forEach ([elm, {position, rect}]) =>
        @transform \
          "translate(\
            #{toCssFigure (rect.left - origin.x)}px, \
            #{toCssFigure (rect.top - origin.y)}px)", \
          elm

    @_flowers.push
      element: flower
      origin: origin

  _deactivateFlower: (flower) ->
    Polymer.dom(flower.element).childNodes.forEach (node) ->
      if node.classList.contains 'petal'
        Polymer.dom(node).classList.add 'inactive-petal'
      else if node.classList.contains 'flower'
        Polymer.dom(node).classList.add 'inactive-flower'

  _activateFlower: (flower) ->
    Polymer.dom(flower.element).childNodes.forEach (node) ->
      if node.classList.contains 'petal'
        Polymer.dom(node).classList.remove 'inactive-petal'
        if node.classList.contains 'over-branch'
          Polymer.dom(node).classList.remove 'over-branch'
      else if node.classList.contains 'flower'
        Polymer.dom(node).classList.remove 'inactive-flower'

  _popFlower: () ->
    if @_flowers.length > 0
      flower = @_flowers[@_flowers.length - 1]
      flowerParent = Polymer.dom(flower.element).parentNode
      Polymer.dom(flowerParent).removeChild(flower.element)
      @_flowers.splice (@_flowers.length - 1), 1

      if @_flowers.length != 0
        @_activateFlower @_flowers[@_flowers.length - 1]

  # _createLinkElementFrom: (fromFlowerIndex) ->
  #   if (@_flowers.length - 1) > (fromFlowerIndex + 1)
  #     console.log 'Not enough flowers to make that link!'

  #   src = @_flowers[fromFlowerIndex]
  #   dst = @_flowers[fromFlowerIndex + 1]

  #   angle = -Math.acos ((dst.origin.x - src.origin.x) / @radius)

  #   linkElm = document.createElement 'div'
  #   Polymer.dom(@_container()).appendChild linkElm
  #   Polymer.dom(linkElm).classList.add 'pistil-link'
  #   linkElm.style['position'] = 'absolute'
  #   linkElm.style['width'] = "#{@radius}px"
  #   linkElm.style['height'] = '5px'

  #   linkElm.style['transform'] = "rotate(#{angle}rad)"
  #   # linkElm.style['-webkit-transform'] = "rotate(#{angle}rad)"

  #   linkElm.style['background-color'] = '#faa'
  #   linkElm.style['left'] = src.origin.x + 'px'
  #   linkElm.style['top'] = src.origin.y + 'px'
  #   linkElm.style['transform-origin'] = 'center left'

  # ---- Event handlers ---- #

  _hoverPetal: (petalElement, petalModel, flowerIndex) ->
    if @_overPetal is petalModel
      # nothing to do
      return
    else if flowerIndex is (@_flowers.length - 1)
      petalElement.classList.add 'over-petal'
      @_overPetal = petalModel
      elementCenter = do =>
        petalRect = petalElement.getBoundingClientRect()
        fieldRect = @_container().getBoundingClientRect()
        x: petalRect.left - fieldRect.left + (petalRect.width / 2)
        y: petalRect.top - fieldRect.top + (petalRect.height / 2)
      if not @_overPetal.isLeaf
        Polymer.dom(petalElement).classList.add 'over-branch'

        currFlowerElm = @_flowers[@_flowers.length - 1].element
        @_spawnFlower \
          elementCenter, \
          @_overPetal.children, \
          (elementCenterPosition currFlowerElm, @_container())

        # @_createLinkElementFrom flowerIndex

  _unhoverPetal: (petalElement) ->
    petalElement.classList.remove 'over-petal'
    @_overPetal = null

  _hoverPistil: (depth) ->
    if depth >= @_flowers.length
      console.log "hovering over pistil of depth #{depth}, \
        but the flower stack is only #{@_flowers.length} deep."
    else if depth isnt @_flowers.length
      for i in [(@_flowers.length - 1)..(depth + 1)] by -1
        @_popFlower()

  _handleUp: ({detail}) ->
    fieldRect = @_container().getBoundingClientRect()
    @finish
      x: detail.x - fieldRect.left
      y: detail.y - fieldRect.top

  _lastHover: null
  _handleTrack: (evt) ->
    if @enabled
      evt.stopPropagation?()
      evt.preventDefault?()

      hover = evt.detail.hover()

      this.fire 'trackover', evt.detail, {node: hover}
      if hover isnt @_lastHover
        this.fire 'trackout', evt.detail, {node: @_lastHover}
        @_lastHover = hover

  _nullFn: () ->


  _stayWithinChanged: (newValue, oldValue) ->
    @_stayWithinElement = document.querySelector ('#' + newValue)

    boundHandler = _.bind @_handleTrack, this
    Polymer.Gestures.add @_stayWithinElement, 'track', boundHandler