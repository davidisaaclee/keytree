_ = require 'lodash'
match = require 'util/match'
{SyntaxTree, \
 Node} = require 'Syntax'
{Grammar, \
 Sequence, \
 S: {Literal, Hole, Regex, Variadic}} = require 'Grammar'
parseGrammar = (require 'parsers/grammar-shorthand').parse

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
      # do deactivateHole
      @_flowerPicker.style['pointer-events'] = 'none'
      @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}

    onFlowerPickerSelect = (event) =>
      model = event.detail.value
      sequence = @syntaxTree.grammar.makeSequence model.group, model.identifier, model.data
      @_activeHole?.nodeModel.fill sequence

    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    Polymer.Gestures.add @_textRoot, 'up', endFlowerPicker
    @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    Polymer.Base.setScrollDirection 'none', @_textRoot
    Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

  loadState: (syntaxTree) ->
    syntaxTreeToTextTree = (st) ->
      helper = (node, holeId, holeIndex) ->
        if node.isFilled
          type: 'branch'
          template: node.sequence.templateString().replace ///\t///g, '  '
          children: node.children.map helper
        else
          type: 'empty'
      helper st.root
    updateView = () =>
      @_textRoot.treeModel = syntaxTreeToTextTree @syntaxTree
      @_textRoot.dispatchEvent (new CustomEvent 'changed')

    do updateView
    @syntaxTree.addEventListener 'changed', updateView

  setActiveHole: (path, useNumericPath) ->
    if @_activeHole?
      Polymer.dom(@_activeHole.nodeElement).classList.remove 'active-node'

    nodeModel = @syntaxTree.navigate path, useNumericPath
    if nodeModel?
      @_activeHole =
        path: path
        nodeModel: nodeModel
        nodeElement:
          @_textRoot.navigate(path, useNumericPath).querySelector '.node'
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
              sequence: model
          needsInput =
            _.any rules[group][innerKey].symbols, (sym) ->
              sym.constructor.name is 'Regex'
          custom =
            if needsInput
              type: 'input'
              display: (model, data) ->
                if data? and data.length > 0
                then do (grammar.makeSequence group, innerKey, data).display
                else do (grammar.makeSequence group, innerKey).display
            else
              display: (model) -> model.display()
          _.extend custom, common
    if result.length is 1
    then result[0].children
    else result


window.addEventListener 'WebComponentsReady', () ->
  litRules =
    'START':
      'start': '`start:NE`'
    'NE':
      'num-lit': '(num `digits:N`)'
      'arith-op': '(arith `rator:A`\n\t`randl:NE`\n\t`randr:NE`)'
      'list': '(list `element:NE*`)'
      'variable': '(box `identifier:\\[a-z]+`)'
    'N':
      'digits': '`digits:\\[0-9]+`'
    'A':
      '+': '+'
      '-': '-'
      '*': '*'
      '/': '/'
  mock = {}
  mock.rules =
    _.mapValues litRules, (vo) ->
      _.mapValues vo, (vi) ->
        parsedSeq = parseGrammar vi
        new Sequence parsedSeq.map ({type, value, id}) ->
          switch type
            when 'literal' then new Literal value
            when 'hole' then new Hole value, id
            when 'varargs' then new Variadic value, id
            when 'regex' then new Regex value, id
            else console.log 'unrecognized production: ', type, value

  mock.grammar = new Grammar mock.rules
  mock.syntaxTree = new SyntaxTree mock.grammar, 'NE'

  child = new Node mock.syntaxTree.root, 'start', (mock.grammar.makeSequence 'NE', 'arith-op')

  # numNode = Node.makeRoot (mock.grammar.makeSequence 'NE', 'num-lit')
  # arithNode = Node.makeRoot (mock.grammar.makeSequence 'NE', 'arith-op')
  # listNode = Node.makeRoot (mock.grammar.makeSequence 'NE', 'list')

  # mock.syntaxTree
  #   .navigate [0], true
  #   .fill arithNode

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
    console.log app.syntaxTree.root.render()
