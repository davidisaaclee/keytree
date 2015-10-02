_ = require 'lodash'
ST = require 'SyntaxTree'
Grammar = require 'Grammar'
HoleFillerView = require 'views/HoleFillerView'
FillableBehavior = require 'views/FillableBehavior'
require 'views/TextBlockView'



HoleView = Polymer
  is: 'kt-hole-view'

  behaviors: [FillableBehavior]

  properties:
    identifier:
      type: String
      value: '<identifier>'

  listeners:
    'track': '_onTrack'


  factoryImpl: (@grammar, @identifier, @node) ->

  ready: () ->

  _onDown: (evt) ->
    evt.stopPropagation()
    @_pushPicker @root, @grammar, @node.group, @node


  _onTrack: (evt) ->
    switch evt.detail.state
      when 'track'
        if evt.detail.hover() is @$.identifier
          @_pushPicker @root, @grammar, @node.group, @node

module.exports = HoleView