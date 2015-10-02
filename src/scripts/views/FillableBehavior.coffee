ST = require 'SyntaxTree'
HoleFillerView = require 'views/HoleFillerView'

module.exports = FillableBehavior =
  _pushPicker: (ontoElement, grammar, group, holeContext) ->
    childrenModels =
      grammar.getTemplatesForGroup group
        .map (template) =>
          template: template
          treeModel: new ST.ExpressionNode template.expression, group
          grammar: grammar

    filler = new HoleFillerView childrenModels
    filler.forwardTrackEvents this

    @_modalPicker = document.createElement 'modal-overlay'
    Polymer.dom @_modalPicker
      .appendChild filler
    Polymer.dom ontoElement
      .appendChild @_modalPicker

    onPick = (evt) =>
      console.log 'onPick', this, evt
      evt.stopPropagation()
      @removeEventListener 'pick', onPick

      if holeContext?
        if evt.detail.treeModel?
          holeContext.fillWithNode evt.detail.treeModel
          @fire 'pick', treeModel: holeContext.parent.parent
          do @_popPicker
        else
          console.warn 'idk what to do here'
          debugger
      else
        debugger


    @addEventListener 'pick', onPick
    @listen this, 'track', '_cancelPicker'

    @_modalPicker.active = true


  _popPicker: () ->
    if @_modalPicker?
      @_modalPicker.destroy {}

  _cancelPicker: (evt) ->
    if evt.detail.state is 'end'
      @_popPicker()