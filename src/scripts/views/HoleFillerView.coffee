_ = require 'lodash'

isDescendant = (child, parent) -> switch
  when child is parent then true
  when not child.parentNode? then false
  else isDescendant child.parentNode, parent

ancestorPath = (elt) ->
  if elt.parentNode?
  then [elt, (ancestorPath elt.parentNode)...]
  else [elt]

eventPath = (evt) ->
  evt.path || (ancestorPath evt)



HoleFillerView = Polymer
  is: 'kt-hole-filler'


  properties:
    choices:
      type: Array

  factoryImpl: (@choices) ->

  attached: () ->
    @async () =>
      Polymer.dom @root
        .querySelectorAll '.choice'
        .forEach (tb) ->
          tb.drawBackground = true
          tb.backgroundStyle =
            fill: 'rgba(216, 216, 216, 0.7)'
            r: '3px'
            stroke: 'none'
            padding:
              left: 2
              right: 2

  _onTrack: (evt) ->
    switch evt.detail.state
      when 'enter'
        elt = evt.target
        while not (elt.classList.contains 'choice') and elt.parentNode?
          elt = elt.parentNode

        if elt.classList.contains 'choice'
          @_hoverChoice
            element: elt
            model: evt.model.item
        else
          console.log 'invalid enter'

      when 'track'
        null
      when 'exit'
        @_selected = null
        evt.target.$.root.drawBackground = false
      when 'end'
        @fire 'pick',
          template: evt.model.item.template
          treeModel: evt.model.item.treeModel

  _hoverChoice: ({element, model}) ->
    if element? and model?
      @_hovered = model
      element.$.root.backgroundStyle =
        fill: 'rgba(216, 216, 216, 0.7)'
        r: '3px'
        stroke: 'none'
        padding:
          left: 2
          right: 2
      element.$.root.drawBackground = true
    else
      @_hovered = null


  ###
  --- UNDER CONSTRUCTION ---

  Trying to figure out a way to "forward" tracking events from view to overlay
    so that the newly-created overlay can receive the tracking event without
    having the user take his finger off the screen.
  ###
  forwardTrackEvents: (srcElement) ->
    srcElement.addEventListener 'track', forwardTrack = (evt) ->
      if evt.detail.__forwardingFrom?
        evt.stopPropagation()
        return

      elt = document.elementFromPoint evt.detail.x, evt.detail.y
      if elt?
        fwdDetail = _.clone evt.detail
        fwdDetail.__forwardingFrom = this

        if elt isnt @_lastForwardPath?[0]
          eltPath = ancestorPath elt

          if @_lastForwardPath?
            exitQueue = []
            enterQueue = []
            trackRootElt = null
            for ancestor in @_lastForwardPath
              idx = _.indexOf eltPath, ancestor
              if idx is -1
                exitQueue.push ancestor
              else
                enterQueue = _.slice eltPath, 0, idx
                trackRootElt = eltPath[idx]
                break

            exitQueue.forEach (elt) =>
              @fire 'track', (_.extend fwdDetail, {state: 'exit'}),
                node: elt
                bubbles: false

            enterQueue.forEach (elt) =>
              @fire 'track', (_.extend fwdDetail, {state: 'enter'}),
                node: elt
                bubbles: false

            if trackRootElt?
              @fire 'track', fwdDetail,
                node: trackRootElt
                bubbles: true

          @_lastForwardPath = eltPath

        else
          @fire 'track', fwdDetail,
            node: elt
            bubbles: true

          @_lastForwardPath = ancestorPath elt

module.exports = HoleFillerView