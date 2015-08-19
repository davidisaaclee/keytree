_ = require 'lodash'
match = require 'util/match'
# enumerate = require 'util/enumerate'
renameProperty = require 'util/renameProperty'
{SyntaxTree, Node} = require 'Syntax'
{Grammar, Expression, Piece, Literal, Hole, Input, Subexpression} = require 'Grammar'
# parseGrammar = (require 'parsers/grammar-shorthand').parse
parseGrammar = (require 'parsers/grammar-new').parse
ModeManager = require 'util/ModeManager'

Polymer
  is: 'key-tree'

  # points to active SyntaxTree node
  # {nodeModel: Node,
  #  nodeElement: HTMLElement,
  #  path: <path as array>}
  _activeHole: null

  # flower-picker DOM element
  _flowerPicker: null

  # text-root DOM element
  _textRoot: null

  # input-suggest DOM element
  _userInputBox: null


  ## Event handling ##

  # preventDefault: (evt) -> do evt.preventDefault

  # _handleCursorMovement: (evt) ->
  #   moveTo = switch evt.keyIdentifier
  #     when 'Up'
  #       @syntaxTree.parentOf @_activeHole.nodeModel
  #     when 'Down'
  #       @syntaxTree.firstChildOf @_activeHole.nodeModel
  #     when 'Right'
  #       @syntaxTree.nextSibling @_activeHole.nodeModel
  #     when 'Left'
  #       @syntaxTree.previousSibling @_activeHole.nodeModel
  #   if moveTo?
  #     @setActiveHole @syntaxTree.pathForNode moveTo

  # _onFlowerPickerSelect: (event) ->
  #   model = event.detail.value
  #   expr =
  #     if model.type is 'input'
  #     then model.template
  #     else @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data

  #   @_activeHole?.nodeModel.fill expr

  # _onUp: (event) ->
  #   # TODO

  # _onTextTreeRequestFill: (event) ->
  #   # TODO

  # # _startFlowerPicker: (evt) ->
  # #   pathToHole = evt.detail.idPath

  # #   holeElement = evt.detail.tree.navigate pathToHole
  # #   if not holeElement?
  # #     throw new Error ('Selected an invalid hole element at path' + pathToHole)

  #   # # FIXME: Getting the bounding client rect here seems to be buggy
  #   # #   on Safari - pinch-zooming in the webpage changes the location
  #   # #   of the rect. (This is not the behavior in Google Chrome.)
  #   # # For now, let's just disable zooming... I guess.
  #   # holeRect = holeElement.getBoundingClientRect()
  #   # holeCenter =
  #   #   x: holeRect.left + holeRect.width / 2
  #   #   y: holeRect.top + holeRect.height / 2

  #   # @_spawnFlowerPicker pathToHole, holeCenter

  # _endFlowerPicker: (evt) ->
  #   @_flowerPicker.style['pointer-events'] = 'none'
  #   @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}
  #   @_isFlowerPickerActive = false

  # _selectedUserString: (evt) ->
  #   @_finishUserInput evt.detail.item

  # _addedUserString: (evt) ->
  #   userString = @syntaxTree.registerUserString 'userString', evt.detail.text
  #   @_finishUserInput userString

  # _finishUserInput: (userString) ->
  #   @_activeHole?.nodeModel.fill userString.template

  _makeModeManager: () ->
    (new ModeManager this)
      .add 'idle',

        parent: null

        canTransitionTo: ['pick']

        checkAccept: (acceptFn) ->
          start: () ->
          stop: () ->

        active: (reclaim) ->
          handleCursorMovement = (evt) =>
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

          start: (release) ->
            window.addEventListener 'keyup', handleCursorMovement
            Polymer.Gestures.remove window, 'up', reclaim

          stop: () ->
            window.removeEventListener 'keyup', handleCursorMovement

          background: (release) ->
            window.removeEventListener 'keyup', handleCursorMovement
            Polymer.Gestures.add window, 'up', reclaim


      .add 'pick',
        parent: 'idle'

        canTransitionTo: ['idle']

        checkAccept: (accept) ->
          startFlowerPicker = (evt) =>
            pathToHole = evt.detail.idPath
            holeElement = evt.detail.tree.navigate pathToHole
            if not holeElement?
              throw new Error ('Selected an invalid hole element at path' + pathToHole)

            # FIXME: Getting the bounding client rect here seems to be buggy
            #   on Safari - pinch-zooming in the webpage changes the location
            #   of the rect. (This is not the behavior in Google Chrome.)
            # For now, let's just disable zooming... I guess.
            holeRect = holeElement.getBoundingClientRect()
            holeCenter =
              x: holeRect.left + holeRect.width / 2
              y: holeRect.top + holeRect.height / 2

            @_spawnFlowerPicker pathToHole, holeCenter
            do accept

          start: () ->
            @_textRoot.addEventListener 'requested-fill', startFlowerPicker
          stop: () ->
            @_textRoot.removeEventListener 'requested-fill', startFlowerPicker

        active: (reclaim) ->
          preventDefault = (evt) -> do evt.preventDefault
          onFlowerPickerSelect = (event) =>
            model = event.detail.value
            expr =
              if model.type is 'input'
              then model.template
              else @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
          endFlowerPicker = (evt) =>
            @_flowerPicker.style['pointer-events'] = 'none'
            @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}

          start: () ->
            Polymer.Gestures.add @_flowerPicker, 'track', preventDefault
            @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
            Polymer.Gestures.add document, 'up', endFlowerPicker
          stop: () ->
            Polymer.Gestures.remove @_flowerPicker, 'track', preventDefault
            @_flowerPicker.removeEventListener 'selected', onFlowerPickerSelect
            Polymer.Gestures.remove document, 'up', endFlowerPicker



        # canTransitionTo: ['idle']
        # accept: (accept) ->
        #   startFlowerPicker = (evt) =>
        #     pathToHole = evt.detail.idPath
        #     holeElement = evt.detail.tree.navigate pathToHole
        #     if not holeElement?
        #       throw new Error ('Selected an invalid hole element at path' + pathToHole)

        #     # FIXME: Getting the bounding client rect here seems to be buggy
        #     #   on Safari - pinch-zooming in the webpage changes the location
        #     #   of the rect. (This is not the behavior in Google Chrome.)
        #     # For now, let's just disable zooming... I guess.
        #     holeRect = holeElement.getBoundingClientRect()
        #     holeCenter =
        #       x: holeRect.left + holeRect.width / 2
        #       y: holeRect.top + holeRect.height / 2

        #     @_spawnFlowerPicker pathToHole, holeCenter
        #     do accept

        #   start: () =>
        #     @_textRoot.addEventListener 'requested-fill', startFlowerPicker
        #   stop: () =>
        #     @_textRoot.removeEventListener 'requested-fill', startFlowerPicker
        # active: () ->
        #   preventDefault = (evt) -> do evt.preventDefault
        #   onFlowerPickerSelect = (event) =>
        #     model = event.detail.value
        #     expr =
        #       if model.type is 'input'
        #       then model.template
        #       else @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
        #   endFlowerPicker = (evt) =>
        #     @_flowerPicker.style['pointer-events'] = 'none'
        #     @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}

        #   start: () =>
        #     Polymer.Gestures.add @_flowerPicker, 'track', preventDefault
        #     @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
        #     Polymer.Gestures.add document, 'up', endFlowerPicker
        #   stop: () =>
        #     Polymer.Gestures.remove @_flowerPicker, 'track', preventDefault
        #     @_flowerPicker.removeEventListener 'selected', onFlowerPickerSelect
        #     Polymer.Gestures.remove document, 'up', endFlowerPicker


  ready: () ->
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
        'divide': '"/"'
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

    grammarText = @querySelector '#grammarText'
    setGrammar = @querySelector '#setGrammar'

    grammarText.value = JSON.stringify litRules, null, 2

    loadRulesFromTextarea = () =>
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

      # if app?
      # then app.loadState mock.syntaxTree
      # else app = new App {syntaxTree: mock.syntaxTree}
      @setup mock.syntaxTree

    do loadRulesFromTextarea
    Polymer.Gestures.add setGrammar, 'up', loadRulesFromTextarea
    Polymer.Gestures.add (document.querySelector '#render'), 'up', (evt) ->
      alert app.syntaxTree.root.render()

  setup: (@syntaxTree) ->
    @_flowerPicker = @$.picker
    @_userInputBox = @$['user-input-box']
    @_textRoot = @$.tree

    @_flowerPicker.stayWithinElement = @$.container

    @_isFlowerPickerActive = false

    Polymer.Base.setScrollDirection 'none', @_textRoot

    @_modeManager = do @_makeModeManager
    @_modeManager.start 'idle'

    # @_textRoot.addEventListener 'requested-fill', startFlowerPicker
    # Polymer.Gestures.add document, 'up', endFlowerPicker
    # @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
    # Polymer.Gestures.add @_flowerPicker, 'track', preventDefault

    # cursor movement
    # window.addEventListener 'keyup', @_handleCursorMovement
    # Polymer.Gestures.add document, 'down', ({detail}) =>
    #   @_spawnFlowerPicker @_activeHole.path, detail

    # finally, load state and set initial cursor position
    @loadState @syntaxTree
    setTimeout (() => @setActiveHole ['start::0']), 100

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
      nodeElement = @_textRoot.navigate path, useNumericPath
      @_activeHole =
        path: path
        nodeModel: nodeModel
        nodeElement: nodeElement
      Polymer.dom(nodeElement).classList.add 'active-node'
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
              # type: 'input'
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

  _spawnFlowerPicker: (pathToHole, spawnCenter) ->
    @setActiveHole pathToHole
    node = @syntaxTree.navigate pathToHole

    if node.holeInformation.isUserString
      ###
      TODO
      User string holes should not be modified via the picker.

      Insert the template, and optionally immediately focus on the
      user string hole(s), with keyboard input.
      ###
      # DEBUG: replace this with non-petal input
      # scope = this
      # inputPiece = new Input \
      #   node.holeInformation.id,
      #   node.holeInformation.pattern,
      #   node.holeInformation.quantifier
      # selectedRulesAsPetals = [
      #   model: new Expression [inputPiece]
      #   isLeaf: true
      #   type: 'input'
      #   value: (model, data) ->
      #     type: 'input'
      #     data: data
      #     template: new Expression [new Literal data]
      #   display: (model, data) ->
      #     if data? and data.length > 0
      #     then do (new Input \
      #       node.holeInformation.id,
      #       node.holeInformation.pattern,
      #       node.holeInformation.quantifier,
      #       data).display
      #     else do (new Input \
      #       node.holeInformation.id,
      #       node.holeInformation.pattern,
      #       node.holeInformation.quantifier).display
      # ]

      console.log 'center', spawnCenter
      console.log 'user input box', @_userInputBox
      @_userInputBox.style['visibility'] = 'visible'
      @_userInputBox.style['top'] = "#{spawnCenter.y}px"
      @_userInputBox.style['left'] = "#{spawnCenter.x}px"
      do @_userInputBox.focus
    else
      @_isFlowerPickerActive = true
      @_flowerPicker.style['pointer-events'] = 'auto'
      selectedRulesAsPetals = @_rulesToPetals \
        @syntaxTree.grammar, \
        [node.holeInformation.group]
      @_flowerPicker.petals = selectedRulesAsPetals
      @_flowerPicker.start spawnCenter