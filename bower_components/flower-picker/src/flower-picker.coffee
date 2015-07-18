_ = require 'lodash'
{calculatePositions} = require './radial-plotter'

createElement = (tag, options = {}) ->
  result = document.createElement tag
  if options.id?
    result.id = options.id
  if options.classes?
    for cl in options.classes
      Polymer.dom(result).classList.add cl
  if options.listeners?
    for name, callback of options.listeners
      result.addEventListener name, callback
  if options.attributes?
    for attr, value of options.attributes
      Polymer.dom(result).setAttribute attr, value
  if options.parent?
    Polymer.dom(options.parent).appendChild result
  if options.style?
    (result.style[key] = value) for key, value of options.style
    console.log 'set style', key, result.style[key]
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

  start: (origin) ->
    switch @_mode
      when 'inactive'
        @_spawnFlower origin, @petals
      when 'active'
        console.log 'called `start` when flower was already active'

    @_mode = 'active'

  finish: ({x, y}) ->
    if @_mode isnt 'active'
      console.log 'finishing with nonactive mode', @_mode
      debugger

    if @_overPetal? and @_overPetal.isLeaf and not @_overPetal.wantsFocus
      @select @_overPetal

    if @_overPetal? and @_overPetal.wantsFocus
      do @_overPetal.focus
      @_mode = 'input'

    if @_mode isnt 'input'
      do @close

  select: (petalModel) ->
    this.fire 'selected',
      petal: petalModel
      value: do =>
        if petalModel.value?
        then petalModel.value petalModel.model, petalModel.data
        else petalModel.model

  # delete each flower node; return flower list to empty
  close: () ->
    detachFromParent = (element) ->
      parent = Polymer.dom(element).parentNode
      Polymer.dom(parent).removeChild(element)
    _.each @_flowers,
      _.flow (_.property 'element'), detachFromParent

    @_flowers = []
    @_overPetal = null
    @_mode = 'inactive'

  # ---- State fields ---- #

  # all flowers in the current stack
  _flowers: []

  # the currently hovered-over petal
  # {isLeaf :: boolean, value :: <model type> -> string, model :: <model type>}
  #   | {wantsFocus :: bolean, focus :: ->}   # for modal petals
  _overPetal: null

  # are the blossoms facing left?
  _isHeadedLeft: true

  # inactive, active, input
  _mode: 'inactive'

  # ---- Convenience references ---- #

  _container: () -> @$['picker-container']


  # ---- Private methods ---- #

  _createPetalElement: (model, flowerIndex) ->
    scope = this

    if not model.type? or model.type is 'choice'
      petal = createElement 'div',
        classes: ['petal', 'unselectable']
        listeners:
          'trackover': (detail) -> scope._hoverPetal petal, model, flowerIndex
          'down': (detail) -> scope._hoverPetal petal, model, flowerIndex
          'trackout': (detail) -> scope._unhoverPetal petal

      Polymer.dom(petal).textContent =
        if model.display?
        then model.display model.model, model.data
        else model.model

      if model.isLeaf
      then Polymer.dom(petal).classList.add 'leaf'
      else Polymer.dom(petal).classList.add 'branch'

      return petal
    else if model.type is 'input'
      @_createInputPetal model, flowerIndex

  _createInputPetal: (model, flowerIndex) ->
    scope = this
    model.data = ""

    petal = createElement 'div',
      classes: ['petal', 'unselectable', 'input-petal']
      listeners:
        'trackover': (detail) -> scope._hoverPetal petal, model, flowerIndex
        'down': (detail) -> scope._hoverPetal petal, model, flowerIndex
        'trackout': (detail) -> scope._unhoverPetal petal
    petalText = createElement 'div'
    form = createElement 'form',
      classes: ['input-petal-form']
      attributes:
        'novalidate': true
      listeners:
        'submit': (evt) ->
          do evt.preventDefault
          scope.select model
          do scope.close
      style:
        'display': 'none'
    searchBox = createElement 'input',
      classes: ['input-petal-box']
      attributes:
        'type': 'text'
        'autocorrect': 'off'
      listeners:
        'input': (evt) ->
          model.data = evt.target.value

    do updateDisplay = () ->
      Polymer.dom(petalText).textContent =
        if model.display?
        then model.display model.model, model.data
        else model.model
    Polymer.dom(petal).appendChild petalText
    # finish adding circular dependencies
    _.extend model,
      wantsFocus: true
      focus: () ->
        form.style['display'] = 'initial'
        do searchBox.focus
    searchBox.addEventListener 'input', updateDisplay

    Polymer.dom(form).appendChild searchBox
    Polymer.dom(petal).appendChild form
    return petal


  _spawnFlower: (origin, petals) ->
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
    if @_mode is 'active'
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