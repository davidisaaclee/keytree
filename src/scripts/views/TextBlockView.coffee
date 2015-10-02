ST = require 'SyntaxTree'
HoleView = require 'views/HoleView'
TextCellView = require 'views/TextCellView'
InputView = require 'views/InputView'

TextBlockView = Polymer
  is: 'kt-text-block'

  properties:
    documentModel:
      type: Object
      observer: 'setModel'


  factoryImpl: (documentModel) ->
    @setModel documentModel

  setModel: (@documentModel) ->
    @documentModel.treeModel.addEventListener 'changed', () =>
      do @_modelChanged
    do @_modelChanged


  _modelChanged: () ->
    if not @_cleaning
      @_cleaning = true
      while Polymer.dom(@$.root).firstChild?
        Polymer.dom(@$.root).removeChild Polymer.dom(@$.root).firstChild
      @_cleaning = false
    do @_populate


  _populate: () ->
    ST.flatten @documentModel.treeModel
      .map (line) =>
        lineElm = document.createElement 'text-flow-line'
        lineElm.indent = line.tabstops
        line.pieces
          .map (pc) =>
            tags = []
            for i in [0...pc.tags.length]
              tags.push pc.tags[0...pc.tags.length - i].join '.'
            tagList = tags.join ' '
            switch pc.type
              when 'text'
                @_createTextElement tagList, pc
              when 'hole'
                @_createHoleElement tagList, pc
              when 'input'
                @_createInputElement tagList, pc
              when 'action'
                @_createActionElement tagList, pc

          .forEach (elt) ->
            Polymer.dom(lineElm).appendChild elt

        return lineElm

      .forEach (lineElm) =>
        Polymer.dom(@$.root).appendChild lineElm


  _createTextElement: (tagList, pc) ->
    elt = document.createElement 'text-flow-piece'
    elt.nodeId = tagList
    textCellView = new TextCellView @documentModel.grammar, pc.display, pc.holeContext
    Polymer.dom(elt).appendChild textCellView
    return elt


  _createHoleElement: (tagList, pc) ->
    elt = document.createElement 'text-flow-piece'
    elt.nodeId = tagList
    holeView = new HoleView @documentModel.grammar, pc.display, pc.node
    Polymer.dom(elt).appendChild holeView
    return elt


  _createInputElement: (tagList, pc) ->
      elt = document.createElement 'text-flow-piece'
      elt.nodeId = tagList
      holeView = new InputView pc.pattern, pc.data
      Polymer.dom(elt).appendChild holeView
      return elt


  _createActionElement: (tagList, pc) ->
    elt = document.createElement 'text-flow-piece'
    button = document.createElement 'button'
    button.addEventListener 'click', pc.action

    Polymer.dom(elt).appendChild button
    return elt

module.exports = TextBlockView