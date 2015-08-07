_ = require 'lodash'
match = require 'util/match'
renameProperty = require 'util/renameProperty'
{SyntaxTree, Node} = require 'Syntax'
{Grammar, Expression, Piece, Literal, Hole, Input, Subexpression} = require 'Grammar'
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
    setTimeout () => @setActiveHole ['start::0']

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
      console.log expr
      @_activeHole?.nodeModel.fill expr

    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    Polymer.Gestures.add @_textRoot, 'up', endFlowerPicker
    @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    Polymer.Base.setScrollDirection 'none', @_textRoot
    Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

  loadState: (syntaxTree) ->
    @syntaxTree = syntaxTree
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
      # console.log st.flatten()
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
    console.log 'setActiveHole', arguments...
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
            _.any rules[group][innerKey].pieces, type: 'input'
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
      'variable': '<identifier:\\any>'
    'N':
      # 'digits': '"digit placeholder"'
      'digits': '<digits:\\numbers>'
    'A':
      'add': '"+"'
      'subtract': '"-"'
      'multiply': '"*"'
      'divid': '"/"'
    # 'UNION': [ 'NE', 'N' ] # TODO

  # koffeeRules =
  #   START:
  #     start: '<start:BLOCK>'
  #   BLOCK:
  #     block: '(<statement:E> "\n")*'
  #   E:
  #     app: '<function:E> " " <arg:E> (", " <args:E>)*'
  #     doapp: '"do " <function:E>'
  #     assign: '<id:ID> " = " <expr:E>'
  #     func: '"(" (<parameter:ID> (", " <parameters:ID>)*)? ") -> " <body:BLOCK>'
  #     ident: '<id:ID>'
  #   ID:
  #     # ident: '<identifier:\[a-z]i+>'
  #     ident: '"placeholder"'


  grammarText = document.querySelector '#grammarText'
  setGrammar = document.querySelector '#setGrammar'
  app = null

  grammarText.value = JSON.stringify litRules, null, 2

  loadRulesFromTextarea = () ->
    rulesText = JSON.parse grammarText.value
    mock = {}
    mock.rules =
      _.mapValues rulesText, (vo) ->
        _.mapValues vo, (vi) ->
          parseHelper = ({type, id, quantifier, value}) ->
            switch type
              when 'expression'
                new Expression value.map parseHelper
              when 'literal'
                new Literal value, quantifier
              when 'hole'
                new Hole id, value, quantifier
              when 'input'
                new Input id, value, quantifier
              when 'subexpression'
                innerExpr = new Expression value.map parseHelper
                new Subexpression innerExpr, quantifier, id
          parseHelper parseGrammar vi
    mock.grammar = new Grammar mock.rules
    mock.syntaxTree = new SyntaxTree mock.grammar, 'START'
    startNode = mock.syntaxTree.root

    if app?
    then app.loadState mock.syntaxTree
    else app = new App {syntaxTree: mock.syntaxTree}

  do loadRulesFromTextarea
  Polymer.Gestures.add setGrammar, 'up', loadRulesFromTextarea
  Polymer.Gestures.add (document.querySelector '#render'), 'up', (evt) ->
    alert app.syntaxTree.root.render()