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

    # cursor movement
    addEventListener 'keyup', (evt) =>
      moveTo = switch evt.keyIdentifier
        when 'Up'
          @syntaxTree.parentOf @_activeHole.nodeModel
        when 'Down'
          @syntaxTree.firstChildOf @_activeHole.nodeModel
        when 'Right'
          @syntaxTree.nextSibling @_activeHole.nodeModel
        when 'Left'
          @syntaxTree.previousSibling @_activeHole.nodeModel
      if moveTo?
        @setActiveHole @syntaxTree.pathForNode moveTo
    Polymer.Gestures.add document, 'down', ({detail}) =>
      @_spawnFlowerPicker @_activeHole.path, detail

  setup: () ->
    @_flowerPicker = document.querySelector '#picker'
    @_textRoot = document.querySelector '#tree'

    @_isFlowerPickerActive = false

    preventDefault = (evt) -> do evt.preventDefault

    startFlowerPicker = (evt) =>
      pathToHole = evt.detail.idPath

      holeElement = evt.detail.tree.navigate pathToHole
      if not holeElement?
        throw new Error 'Selected an invalid hole element at path', pathToHole

      # FIXME: Getting the bounding client rect here seems to be buggy
      #   on Safari - pinch-zooming in the webpage changes the location
      #   of the rect. (This is not the behavior in Google Chrome.)
      # For now, let's just disable zooming... I guess.
      holeRect = holeElement.getBoundingClientRect()
      holeCenter =
        x: holeRect.left + holeRect.width / 2
        y: holeRect.top + holeRect.height / 2

      @_spawnFlowerPicker pathToHole, holeCenter

    endFlowerPicker = (evt) =>
      if @_isFlowerPickerActive
        @_flowerPicker.style['pointer-events'] = 'none'
        @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}
        @_isFlowerPickerActive = false

    onFlowerPickerSelect = (event) =>
      model = event.detail.value

      expr =
        if model.type is 'input'
        then model.template
        else @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data

      @_activeHole?.nodeModel.fill expr

      # expr = @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
      # @_activeHole?.nodeModel.fill expr

    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    Polymer.Gestures.add document, 'up', endFlowerPicker
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

  _spawnFlowerPicker: (pathToHole, spawnCenter) =>
    @_isFlowerPickerActive = true
    @_flowerPicker.style['pointer-events'] = 'auto'
    @setActiveHole pathToHole
    selectedRulesAsPetals = null
    node = @syntaxTree.navigate pathToHole
    if node.holeInformation.isUserString
      ###
      TODO
      User string holes should not be modified via the picker.

      Insert the template, and optionally immediately focus on the
      user string hole(s), with keyboard input.
      ###
      # DEBUG: replace this with non-petal input
      scope = this
      inputPiece = new Input \
        node.holeInformation.id,
        node.holeInformation.pattern,
        node.holeInformation.quantifier
      selectedRulesAsPetals = [
        model: new Expression [inputPiece]
        isLeaf: true
        type: 'input'
        value: (model, data) ->
          type: 'input'
          data: data
          template: new Expression [new Literal data]
        display: (model, data) ->
          if data? and data.length > 0
          then do (new Input \
            node.holeInformation.id,
            node.holeInformation.pattern,
            node.holeInformation.quantifier,
            data).display
          else do (new Input \
            node.holeInformation.id,
            node.holeInformation.pattern,
            node.holeInformation.quantifier).display
      ]
    else
      selectedRulesAsPetals = @_rulesToPetals \
        @syntaxTree.grammar, \
        [node.holeInformation.group]
    @_flowerPicker.petals = selectedRulesAsPetals
    @_flowerPicker.start spawnCenter


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