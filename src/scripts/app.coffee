_ = require 'lodash'
match = require 'util/match'
{Grammar, \
 Sequence, \
 S: {Literal, Hole, Regex}, \
 SyntaxTree, \
 Node} = require 'Syntax'
parseGrammar = (require 'parsers/grammar_shorthand').parse

class App
  # points to active SyntaxTree node
  # {node: Node, path: <path as array>}
  _activeNode: null

  # flower-picker DOM element
  _flowerPicker: null

  # text-root DOM element
  _textRoot: null

  constructor: ({@syntaxTree}) ->
    do @setup
    @loadState @syntaxTree

  setup: () ->
    @_flowerPicker = document.querySelector '#picker'
    @_textRoot = document.querySelector '#tree'

    preventDefault = (evt) -> do evt.preventDefault

    deactivateHole = null
    startFlowerPicker = (evt) =>
      @_flowerPicker.style['pointer-events'] = 'auto'
      pathToHole = evt.detail.idPath
      selectedRulesAsPetals =
        @_rulesToPetals \
          @syntaxTree.grammar.productions, \
          [@syntaxTree.navigateHole(pathToHole).group]
      holeElement = evt.detail.tree.navigate pathToHole
      nodeElement = holeElement.querySelector '.node'
      Polymer.dom(nodeElement).classList.add 'active-node'
      deactivateHole = () ->
        Polymer.dom(nodeElement).classList.remove 'active-node'

      # FIXME: Getting the bounding client rect here seems to be buggy
      #   on Safari - pinch-zooming in the webpage changes the location
      #   of the rect. (This is not the behavior in Google Chrome.)
      # For now, let's just disable zooming... I guess.
      holeRect = holeElement.getBoundingClientRect()
      holeCenter =
        x: holeRect.left + holeRect.width / 2
        y: holeRect.top + holeRect.height / 2

      @setActiveNode pathToHole
      @_flowerPicker.petals = selectedRulesAsPetals
      @_flowerPicker.start holeCenter

    endFlowerPicker = (evt) =>
      do deactivateHole
      @_flowerPicker.style['pointer-events'] = 'none'
      @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}

    onFlowerPickerSelect = (event) =>
      model = event.detail.value
      sequence = @syntaxTree.grammar.makeSequence model.group, model.identifier
      @_activeNode?.node.fill (new Node sequence)

    @setActiveNode [0]
    @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    Polymer.Gestures.add @_textRoot, 'up', endFlowerPicker
    @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    Polymer.Base.setScrollDirection 'none', @_textRoot
    Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

  loadState: (syntaxTree) ->
    syntaxTreeToTextTree = (st) ->
      helper = (node, holeId, holeIndex) ->
        if node?
          type: 'branch'
          template: node.sequence.templateString().replace ///\t///g, '  '
          children: Object.keys(node.holes).map (key) ->
            helper node.holes[key].value, key, node.holes[key].holeIndex
        else
          type: 'empty'
      helper st.root
    updateView = () =>
      @_textRoot.treeModel = syntaxTreeToTextTree @syntaxTree, 'start', 0

    do updateView
    @syntaxTree.notifyChanged updateView

  setActiveNode: (path) ->
    node = @syntaxTree.navigateHole path
    @_activeNode =
      if node?
        path: path
        node: node
      else
        null

    @_textRoot.select path
    return node

  _rulesToPetals: (rules, groups) ->
      if not groups?
        groups = Object.keys rules
      result =
        groups.map (group) ->
          model: group
          isLeaf: false
          children: (Object.keys rules[group]).map (innerKey) ->
            model: rules[group][innerKey]
            isLeaf: true
            display: (model) -> model.display()
            value: (model) ->
              group: group
              identifier: innerKey
              sequence: model
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
            when 'regex' then new Regex value
            else console.log 'unrecognized production: ', type, value

  mock.grammar = new Grammar mock.rules
  mock.syntaxTree = new SyntaxTree mock.grammar, 'NE'

  numNode = new Node (mock.grammar.makeSequence 'NE', 'num-lit')
  arithNode = new Node (mock.grammar.makeSequence 'NE', 'arith-op')

  mock.syntaxTree.root
    .navigateHole [0], true
    .fill arithNode

  mock.syntaxTree.root
    .navigateHole [0, 1], true
    .fill numNode

  app = new App {syntaxTree: mock.syntaxTree}