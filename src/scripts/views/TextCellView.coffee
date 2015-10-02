FillableBehavior = require 'views/FillableBehavior'

TextCellView = Polymer
  is: 'kt-text-cell'

  behaviors: [FillableBehavior]

  properties:
    display:
      type: String
      value: ''

  listeners:
    'down': '_onDown'

  ###
  @param grammar [Grammar.Grammar] The document's grammar.
  @param display [String] The text to display.
  @param holeContext [SyntaxTree.HoleNode] The hole which this text fills. If
    `null`, is either root or is part of a picker. (HACK)
  ###
  factoryImpl: (@grammar, @display, @holeContext) ->

  _onDown: (evt) ->
    if @holeContext?
      evt.stopPropagation()
      @_pushPicker @root, @grammar, @holeContext.group, @holeContext

module.exports = TextCellView