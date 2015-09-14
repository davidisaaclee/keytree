_ = require 'lodash'
{SyntaxTree, Node} = require 'Syntax'
{Grammar, Expression, Piece, Literal, Hole, Input, Subexpression} = require 'Grammar'
match = require 'util/match'
# enumerate = require 'util/enumerate'
renameProperty = require 'util/renameProperty'
ModeManager = require 'util/ModeManager'
InputUtil = require 'util/Input'
parseGrammar = (require 'parsers/grammar-new').parse

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

        canTransitionTo: ['pick', 'input']

        checkAccept: (acceptFn) ->
          start: () ->
          stop: () ->

        active: (release, reclaim) ->
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

          start: (data) ->
            window.addEventListener 'keyup', handleCursorMovement
            Polymer.Gestures.remove window, 'up', reclaim

          stop: () ->
            window.removeEventListener 'keyup', handleCursorMovement

          background: (data) ->
            window.removeEventListener 'keyup', handleCursorMovement


      .add 'pick',
        parent: 'idle'

        canTransitionTo: ['idle']

        checkAccept: (accept) ->
          startFlowerPicker = (evt) =>
            pathToHole = evt.detail.idPath
            holeElement = evt.detail.tree.navigate pathToHole
            node = @syntaxTree.navigate pathToHole
            if node.holeInformation.isUserString
              return
            else
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

              scrollOffset = do @_pageScrollOffset
              holeCenter.x += scrollOffset.left
              holeCenter.y += scrollOffset.top

              @_spawnFlowerPicker pathToHole, holeCenter
              do accept

          start: (data) ->
            @_textRoot.addEventListener 'requested-fill', startFlowerPicker
          stop: () ->
            @_textRoot.removeEventListener 'requested-fill', startFlowerPicker

        active: (release, reclaim) ->
          preventDefault = (evt) -> do evt.preventDefault
          onFlowerPickerSelect = (event) =>
            model = event.detail.value
            expr =
              if model.type is 'input'
              then model.template
              else @syntaxTree.grammar.makeExpression model.group, model.identifier, model.data
            @_activeHole?.nodeModel.fill expr
          endFlowerPicker = (evt) =>
            @_flowerPicker.style['pointer-events'] = 'none'
            @_flowerPicker.finish {x: evt.detail.x, y: evt.detail.y}
            do release

          start: (data) ->
            Polymer.Gestures.add @_flowerPicker, 'track', preventDefault
            @_flowerPicker.addEventListener 'selected', onFlowerPickerSelect
            Polymer.Gestures.add document, 'up', endFlowerPicker
          stop: () ->
            # known issue with removing gesture listener on touch-only devices
            Polymer.Gestures.remove @_flowerPicker, 'track', preventDefault
            @_flowerPicker.removeEventListener 'selected', onFlowerPickerSelect
            Polymer.Gestures.remove document, 'up', endFlowerPicker


      .add 'input',
        parent: 'idle'

        canTransitionTo: ['idle', 'pick']

        checkAccept: (accept) ->
          startInput = (evt) =>
            pathToHole = evt.detail.idPath
            holeElement = evt.detail.tree.navigate pathToHole
            node = @syntaxTree.navigate pathToHole
            if node.holeInformation.isUserString
              accept
                path: pathToHole
                holeElement: holeElement
                node: node

          removeEventListeners = ->

          start: () ->
            textRoot = @_textRoot
            removeEventListeners = @_coordinateEvents
              trigger:
                node: textRoot
                event: 'requested-fill'
              waitFor:
                gesture: 'up'
              callback: startInput
          stop: () ->
            do removeEventListeners
            do @_userInputBox.blur

        active: (release, reclaim) ->
          onUserStringAdd = (holeNode) => (evt) =>
            @syntaxTree.registerUserString 'string', evt.detail.text
            # console.log holeNode
            tmpl = holeNode.template.withData evt.detail.text
            console.log tmpl
            holeNode.fill tmpl
            do release
          onUserStringSelect = (holeNode) => (evt) =>
            # holeNode.fill evt.detail.model
            # console.log evt.detail.model
            # console.log 'onUserStringSelect'
            do release

          nodeBeingFilled = null

          start: (data) ->
            nodeBeingFilled = data.node.parent

            holeRect = data.holeElement.getBoundingClientRect()
            holeCenter =
              x: holeRect.left + holeRect.width / 2
              y: holeRect.top + holeRect.height / 2
            @_userInputBox.style['visibility'] = 'visible'
            @_userInputBox.style['top'] = "#{holeCenter.y}px"
            @_userInputBox.style['left'] = "#{holeCenter.x}px"
            do @_userInputBox.focus

            enterCode = 13
            @_userInputBox.addEventListener \
              'selected',
              (onUserStringSelect nodeBeingFilled)
            @_userInputBox.addEventListener \
              'add',
              (onUserStringAdd nodeBeingFilled)
          stop: () ->
            @_userInputBox.style['visibility'] = 'hidden'
            @_userInputBox.removeEventListener \
              'selected',
              (onUserStringSelect nodeBeingFilled)
            @_userInputBox.removeEventListener \
              'add',
              (onUserStringAdd nodeBeingFilled)





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

      @setup mock.syntaxTree

    do loadRulesFromTextarea
    Polymer.Gestures.add setGrammar, 'up', loadRulesFromTextarea
    Polymer.Gestures.add @$.render, 'up', (evt) =>
      alert @syntaxTree.root.render()
    Polymer.Gestures.add @$['focus-button'], 'up', () =>
      @$['user-input-box'].focus()

  setup: (@syntaxTree) ->
    @_flowerPicker = @$.picker
    @_flowerPicker.stayWithinElement = @$.container

    @_userInputBox = @$['user-input-box']
    @_userInputBox.suggestions = @syntaxTree.userStrings.string
    @_userInputBox.displayOnEmpty = true

    @_textRoot = @$.tree
    Polymer.Base.setScrollDirection 'none', @_textRoot

    @_modeManager = do @_makeModeManager
    @_modeManager.start 'idle'

    # finally, load state and set initial cursor position
    @loadState @syntaxTree
    setTimeout (() => @setActiveHole ['start::0']), 100

  loadState: (syntaxTree) ->
    @syntaxTree = syntaxTree
    ###
    TextTreeModel ::= TextTreeHoleModel
                    | TextTreeLiteralModel
                    | TextTreeActionModel

    TextTreeHoleModel ::=
      type: 'hole'
      id: String
      placeholder: String
      isFilled: Boolean
      value: [TextTreeModel]

    TextTreeLiteralModel ::=
      type: 'literal'
      value: String

    TextTreeActionModel ::=
      type: 'action'
      display: String
      onAction: () ->
    ###
    syntaxTreeToTextTree = (st) ->
      toRename =
        'instanceId': 'id'
        'name': 'placeholder'
      recursiveOptions =
        enabled: true
        descendOn: ['value']
        descendOnArrays: true
      (renameProperty toRename, recursiveOptions) (do st.flatten)

    updateView = () =>
      @_textRoot.treeModel = syntaxTreeToTextTree @syntaxTree
      console.log @_textRoot.treeModel
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

    @_flowerPicker.style['pointer-events'] = 'auto'
    selectedRulesAsPetals = @_rulesToPetals \
      @syntaxTree.grammar, \
      [node.holeInformation.group]
    @_flowerPicker.petals = selectedRulesAsPetals
    @_flowerPicker.start spawnCenter


  ### Helpers ###

  _pageScrollOffset: () ->
    if window.pageXOffset?
    then left: window.pageXOffset, top: window.pageYOffset
    else
      if (document.compatMode || "") is "CSS1Compat"
      then left: document.documentElement.scrollLeft, top: document.documentElement.scrollTop
      else left: document.body.scrollLeft, top: document.body.scrollTop

  # Coordinate events with a trigger and optional "wait for" event.
  # The callback will not be called until the "wait for" event is fired _after_
  #   the trigger event has been fired.
  #
  # trigger:
  #   node: ()
  #   event: ''
  #   gesture: ''
  # waitFor:
  #   node: ()      # if not supplied, uses trigger.node
  #   event: ''
  #   gesture: ''
  # callback: ->
  # autoremove: true | false
  _coordinateEvents: ({callback, trigger, waitFor, autoremove}) ->
    if callback? and trigger? and trigger.node?
      if trigger.event? or trigger.gesture?
        # Create a function to easily add a callback to the specified
        #   event or gesture.
        # This function returns a function which unsubscribes the callback.
        makeAddEvent = (node, event, gesture, autoremove) ->
          if event?
            return (cb) ->
              # cook callback to include autoremove if wanted
              cb_ =
                if autoremove
                then (evt) ->
                  cb evt
                  console.log 'removing ', event, gesture
                  node.removeEventListener event, cb_
                else cb

              node.addEventListener event, cb_
              return () ->
                console.log 'removing ', event
                node.removeEventListener event, cb_
          else if gesture?
            return (cb) ->
              # cook callback to include autoremove if wanted
              cb_ =
                if autoremove
                then (evt) ->
                  cb evt
                  console.log 'removing ', event, gesture
                  Polymer.Gestures.remove node, gesture, cb_
                else cb

              Polymer.Gestures.add node, gesture, cb_
              return () ->
                console.log 'removing ', gesture
                Polymer.Gestures.remove node, gesture, cb_
          else
            console.error 'makeAddEvent with no event'

        addTriggerEvent =
          makeAddEvent trigger.node, trigger.event, trigger.gesture, autoremove

        if waitFor?
          # if waitFor.node is not supplied, use the trigger node
          waitForNode = if waitFor.node? then waitFor.node else trigger.node

          if waitFor.event? or waitFor.gesture?
            addWaitForEvent =
              makeAddEvent waitForNode, waitFor.event, waitFor.gesture, autoremove

            # when the trigger is called, grab the event and...
            removeOuter = removeInner = ->
            removeOuter = addTriggerEvent (evt) ->
              # wait for the waitfor event. when that is called...
              removeInner = addWaitForEvent () ->
                # call the original callback, with the original event
                callback evt
            return () -> do removeInner; do removeOuter
          else
            console.warn '_coordinateEvents given a `waitFor` node ' +
              'with no event specified. doing nothing...'
            return
        else
          # simple callback registration:
          # add the callback, return unsusbscribe function
          return addTriggerEvent callback
      else
        # doesn't meet minimum requirements, nothing to do
        console.warn '_coordinateEvents called without minimum requirements.'
        return