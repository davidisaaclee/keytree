_ = require 'lodash'
match = require 'util/match'
renameProperty = require 'util/renameProperty'
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

    # Closure variables
    isFlowerPickerActive = false

    preventDefault = (evt) -> do evt.preventDefault

    startFlowerPicker = (evt) =>
      isFlowerPickerActive = true
      @_flowerPicker.style['pointer-events'] = 'auto'
      pathToHole = evt.detail.idPath
      selectedRulesAsPetals =
        @_rulesToPetals \
          @syntaxTree.grammar, \
          [@syntaxTree.navigate(pathToHole).holeInformation.group]
      holeElement = evt.detail.tree.navigate pathToHole
      if not holeElement?
        debugger
        evt.detail.tree.navigate pathToHole

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
      if isFlowerPickerActive
        @_flowerPicker.style['pointer-events'] = 'none'
        @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}
        isFlowerPickerActive = false

    onFlowerPickerSelect = (event) =>
      model = event.detail.value
      expr = @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
      @_activeHole?.nodeModel.fill expr

    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    Polymer.Gestures.add @_textRoot, 'up', endFlowerPicker
    @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    Polymer.Base.setScrollDirection 'none', @_textRoot
    Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

  loadState: (syntaxTree) ->
    ###
    TextTreeModel ::= TextTreeHoleModel
                    | TextTreeLiteralModel

    TextTreeHoleModel ::=
      type: 'hole'
      id: String
      placeholder: String
      isFilled: Boolean
      value: [TextTreeModel]

    TextTreeLiteralModel ::=
      type: 'literal'
      value: String
    ###
    syntaxTreeToTextTree = (st) ->
      toRename =
        'instanceId': 'id'
        'holeId': 'placeholder'
      recursiveOptions =
        enabled: true
        descendOn: ['value']
        descendOnArrays: true
      (renameProperty toRename, recursiveOptions) (do st.flatten)

    updateView = () =>
      @_textRoot.treeModel = syntaxTreeToTextTree @syntaxTree
      @_textRoot.dispatchEvent (new CustomEvent 'changed')

    @syntaxTree.addEventListener 'changed', updateView
    do updateView

  setActiveHole: (path, useNumericPath) ->
    if @_activeHole?
      Polymer.dom(@_activeHole.nodeElement).classList.remove 'active-node'

    nodeModel = @syntaxTree.navigate path, useNumericPath
    if nodeModel?
      @_activeHole =
        path: path
        nodeModel: nodeModel
        nodeElement: @_textRoot.navigate path, useNumericPath
      Polymer.dom(@_activeHole.nodeElement).classList.add 'active-node'
    else
      @_activeHole = null

    return nodeModel

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
        parseHelper = ({type, id, quantifier, value}) ->
          switch type
            when 'expression'
              new Expression value.map parseHelper
            when 'literal'
              new Literal value, quantifier
            when 'hole'
              new Hole id, value, quantifier
            when 'subexpression'
              new Subexpression (new Expression value.map parseHelper), quantifier, id
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

  Polymer.Gestures.add (document.querySelector '#render'), 'up', (evt) ->
    alert app.syntaxTree.root.render()