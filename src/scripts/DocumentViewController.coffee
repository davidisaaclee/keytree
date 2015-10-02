ST = require 'SyntaxTree'
# LiteralView = require 'views/LiteralView'
HoleView = require 'views/HoleView'
TextCellView = require 'views/TextCellView'
InputView = require 'views/InputView'

class DocumentViewController
  constructor: (@documentModel, @documentElement) ->
    @rootNode = document.createElement 'text-flow'
    @documentElement.appendChild @rootNode

    @rootNode.drawBackground = true

    unselect = null

    @rootNode.addEventListener 'select', (evt) =>
      if unselect?
        do unselect

      topTag = (evt.detail.nodeId.split /\s/)[0]
      unselect = @rootNode.highlightNode topTag,
        fill: '#ccf'
        stroke: 'none'
        borderRadius: 2

    @documentModel.treeModel.addEventListener 'changed', (event) =>
      if not @_cleaning
        @_cleaning = true
        while Polymer.dom(@rootNode).firstChild?
          Polymer.dom(@rootNode).removeChild Polymer.dom(@rootNode).firstChild
        @_cleaning = false
      @_modelChanged @rootNode
      # @rootNode.updateChildren()


  _modelChanged: (rootFlow) ->
    getProductionsForGroup = (group) =>
      @documentModel.grammar.productions[group]

    makeHoleDelegate = (group, node) ->
      getProductions: () -> getProductionsForGroup group
      fill: (productionKey) ->
        node.fill (getProductionsForGroup group)[productionKey]

    ST.flatten @documentModel.treeModel
      .map (line) ->
        lineElm = document.createElement 'text-flow-line'
        lineElm.indent = line.tabstops
        line.pieces
          .map (pc) ->
            tags = []
            for i in [0...pc.tags.length]
              tags.push pc.tags[0...pc.tags.length - i].join '.'
            tagList = tags.join ' '

            switch pc.type
              when 'text'
                elt = document.createElement 'text-flow-piece'

                elt.nodeId = tagList
                delegate = makeHoleDelegate pc.holeContext.value.group, pc.holeContext
                textCellView = new TextCellView pc.display, delegate
                Polymer.dom(elt).appendChild textCellView
                return elt

              when 'hole'
                elt = document.createElement 'text-flow-piece'

                elt.nodeId = tagList
                holeView = new HoleView pc.display, (makeHoleDelegate pc.group, pc.node)
                Polymer.dom(elt).appendChild holeView
                return elt

              when 'input'
                elt = document.createElement 'text-flow-piece'

                elt.nodeId = tagList
                holeView = new InputView pc.pattern, pc.data
                Polymer.dom(elt).appendChild holeView
                return elt

              when 'action'
                elt = document.createElement 'text-flow-piece'

                button = document.createElement 'button'
                button.addEventListener 'click', pc.action

                Polymer.dom(elt).appendChild button
                return elt

          .forEach (elt) ->
            Polymer.dom(lineElm).appendChild elt

        return lineElm

      .forEach (lineElm) ->
        Polymer.dom(rootFlow).appendChild lineElm


module.exports = DocumentViewController