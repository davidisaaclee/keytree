_ = require 'lodash'
match = require 'util/match'
{SyntaxTree, Node} = require 'Syntax'
{Grammar, Expression, Piece, Literal, Hole, Subexpression} = require 'Grammar'
# parseGrammar = (require 'parsers/grammar-shorthand').parse
parseGrammar = (require 'parsers/grammar-new').parse

class App
  # points to active SyntaxTree node
  # {nodeModel: Node,
  #  nodeElement: HTMLElement,
  #  path: <path as array>}
  _activeHole: null

  # flower-picker DOM element
  _flowerPicker: null

  # text-root DOM element
  _textRoot: null

  constructor: ({@syntaxTree}) ->
    do @setup
    @loadState @syntaxTree
    setTimeout () => @setActiveHole []

  setup: () ->
    @_flowerPicker = document.querySelector '#picker'
    @_textRoot = document.querySelector '#tree'

    preventDefault = (evt) -> do evt.preventDefault

    startFlowerPicker = (evt) =>
      console.log 'startFlowerPicker'
      @_flowerPicker.style['pointer-events'] = 'auto'
      pathToHole = evt.detail.idPath

      selectedRulesAsPetals =
        @_rulesToPetals \
          @syntaxTree.grammar, \
          [@syntaxTree.navigate(pathToHole).holeInformation.group]
      holeElement = evt.detail.tree.navigate pathToHole
      nodeElement = holeElement.querySelector '.node'

      # FIXME: Getting the bounding client rect here seems to be buggy
      #   on Safari - pinch-zooming in the webpage changes the location
      #   of the rect. (This is not the behavior in Google Chrome.)
      # For now, let's just disable zooming... I guess.
      holeRect = holeElement.getBoundingClientRect()
      holeCenter =
        x: holeRect.left + holeRect.width / 2
        y: holeRect.top + holeRect.height / 2

      @setActiveHole pathToHole
      @_flowerPicker.petals = selectedRulesAsPetals
      @_flowerPicker.start holeCenter

    endFlowerPicker = (evt) =>
      console.log 'endFlowerPicker'
      # do deactivateHole
      @_flowerPicker.style['pointer-events'] = 'none'
      @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}

    onFlowerPickerSelect = (event) =>
      model = event.detail.value
      expr = @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
      @_activeHole?.nodeModel.fill expr

    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    @_textRoot.addEventListener 'requested-fill', () ->
      console.log 'requested-fill!'
    # Polymer.Gestures.add @_textRoot, 'up', endFlowerPicker
    @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    Polymer.Base.setScrollDirection 'none', @_textRoot
    Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

  # newTreeFormat =
  #   type: 'hole'
  #   id: 'start'
  #   isFilled: true
  #   value: [
  #     type: 'literal'
  #     value: '(+ '
  #    ,
  #     type: 'hole'
  #     id: 'randl'
  #     isFilled: true
  #     classes: 'special-node'
  #     value: [
  #       type: 'literal'
  #       value: '42'
  #     ]
  #    ,
  #     type: 'hole'
  #     id: 'randr'
  #     isFilled: false
  #     value: null
  #    ,
  #     type: 'literal'
  #     value: ')'
  #   ]

  loadState: (syntaxTree) ->
    syntaxTreeToTextTree = (st) ->
      (do st.flatten)[0] # we don't care about _baseNode
      # helper = (node, nodeId) ->
      #   type: 'hole'
      #   id: if node.holeInformation then node.holeInformation.id else nodeId
      #   isFilled: node.isFilled
      #   value: do ->
      #     pieceMap = (acc, piece, index) ->
      #       switch piece.type
      #         when 'literal'
      #           acc.push
      #             type: 'literal'
      #             value: piece.text
      #         when 'hole'
      #           # TODO: quantifiers
      #           childNode = node.childrenMap[piece.identifier]
      #           toPush =
      #             if childNode.isFilled
      #             then helper childNode
      #             else
      #               type: 'hole'
      #               id: piece.identifier
      #               isFilled: false
      #               value: null
      #           acc.push toPush
      #         when 'subexpression'
      #           acc.push (piece.expression.pieces.map pieceMap)...
      #       return acc
      #     result = []
      #     node.template?.pieces.reduce pieceMap, result
      #     return result

        # if node.isFilled
        #   type: 'branch'
        #   template: node.template.templateString().replace ///\t///g, '  '
        #   children: node.children.map helper
        # else
        #   type: 'empty'
      # helper st.root, 'root'
    updateView = () =>
      @_textRoot.treeModel = syntaxTreeToTextTree @syntaxTree
      @_textRoot.dispatchEvent (new CustomEvent 'changed')

    @syntaxTree.addEventListener 'changed', updateView
    do updateView

  setActiveHole: (path, useNumericPath) ->
    # if @_activeHole?
    #   Polymer.dom(@_activeHole.nodeElement).classList.remove 'active-node'

    # nodeModel = @syntaxTree.navigate path, useNumericPath
    # if nodeModel?
    #   @_activeHole =
    #     path: path
    #     nodeModel: nodeModel
    #     nodeElement:
    #       @_textRoot.navigate(path, useNumericPath).querySelector '.node'
    #   Polymer.dom(@_activeHole.nodeElement).classList.add 'active-node'
    # else
    #   @_activeHole = null

    # return nodeModel

  _rulesToPetals: (grammar, groups) ->
    rules = grammar.productions
    if not groups?
      groups = Object.keys rules
    result =
      groups.map (group) ->
        model: group
        isLeaf: false
        children: (Object.keys rules[group]).map (innerKey) ->
          common =
            model: rules[group][innerKey]
            isLeaf: true
            value: (model, data) ->
              group: group
              identifier: innerKey
              data: data
              template: model
          needsInput =
            _.any rules[group][innerKey].symbols, (sym) ->
              sym.constructor.name is 'Regex'
          custom =
            if needsInput
              type: 'input'
              display: (model, data) ->
                if data? and data.length > 0
                then do (grammar.makeExpression group, innerKey, data).display
                else do (grammar.makeExpression group, innerKey).display
            else
              display: (model) -> model.display()
          _.extend custom, common
    console.log '_rulesToPetals', result
    if result.length is 1
    then result[0].children
    else result


window.addEventListener 'WebComponentsReady', () ->
  litRules =
    'START':
      'start': '<start:NE>'
    'NE':
      'num-lit': '"(num " <digits:N> ")"'
      'arith-op': '"(arith " <rator:A> "\n\t" <randl:NE> "\n\t" <randr:NE> ")"'
      'list': '"(list " <element:NE>* ")"'
      'list-lit': '"[" (<hd:NE> (", " <tl:NE>)*)? "]"'
      # 'variable': '"(box " <identifier:\\[a-z]+> ")"'
    'N':
      'digits': '"digit placeholder"'
      # 'digits': '<digits:\\[0-9]+>'
    'A':
      '+': '"+"'
      '-': '"-"'
      '*': '"*"'
      '/': '"/"'
  mock = {}
  mock.rules =
    _.mapValues litRules, (vo) ->
      _.mapValues vo, (vi) ->
        parseHelper = (expr) ->
          switch expr.type
            when 'expression'
              new Expression expr.value.map parseHelper
            when 'literal'
              new Literal expr.value, expr.quantifier
            when 'hole'
              new Hole expr.id, expr.value, expr.quantifier
            when 'subexpression'
              new Subexpression (parseHelper expr.value), expr.quantifier
        parseHelper parseGrammar vi

  mock.grammar = new Grammar mock.rules
  mock.syntaxTree = new SyntaxTree mock.grammar, 'NE'

  startNode = mock.syntaxTree.root

  # arithOpExpr = mock.grammar.makeExpression 'NE', 'arith-op'
  # child = new Node mock.syntaxTree.root, 'start', arithOpExpr

  # numNode = Node.makeRoot (mock.grammar.makeSequence 'NE', 'num-lit')
  # arithNode = Node.makeRoot (mock.grammar.makeExpression 'NE', 'arith-op')
  # listNode = Node.makeRoot (mock.grammar.makeSequence 'NE', 'list')


  # listLit = mock.grammar.makeExpression 'NE', 'list-lit'
  # mock.syntaxTree
  #   .navigate [0], true
  #   .fill listLit

  # number = mock.grammar.makeExpression 'NE', 'num-lit'
  # mock.syntaxTree
  #   .navigate ['start', 'hd']
  #   .fill number

  # number2 = mock.grammar.makeExpression 'NE', 'num-lit'
  # mock.syntaxTree
  #   .navigate ['start', 'tl']
  #   .fill number2

  # list = mock.grammar.makeExpression 'NE', 'list'
  # mock.syntaxTree
  #   .navigate ['start', 'tl']
  #   .fill list

  # console.log mock.syntaxTree

  # mock.syntaxTree.root
  #   .navigateHole [0, 0], true
  #   .fill numNode

  # mock.syntaxTree.root
  #   .navigateHole [0, 1], true
  #   .fill arithNode

  # mock.syntaxTree.root
  #   .navigateHole [0], true
  #   .fill arithNode

  # mock.syntaxTree.root
  #   .navigateHole [0, 1], true
  #   .fill numNode

  app = new App {syntaxTree: mock.syntaxTree}

  # Polymer.Gestures.add (document.querySelector '#render'), 'up', (evt) ->
  #   console.log app.syntaxTree.root.render()