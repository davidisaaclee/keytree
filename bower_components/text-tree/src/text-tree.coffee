### text-tree
###

_ = require 'lodash'
parseTemplate = (require 'grammar-parser').parse

TextTree = Polymer
  is: 'text-tree'

  properties:
    ###
    TreeModel ::= HoleModel
                | LiteralModel
                | ActionModel

    HoleModel ::=
      type: 'hole'
      id: String
      placeholder: String
      isFilled: Boolean
      value: [TextTreeModel]

    LiteralModel ::=
      type: 'literal'
      value: String

    ActionModel ::=
      type: 'action'
      display: String | HTMLElement
      onAction: Function
    ###
    treeModel:
      type: Object
      observer: '_treeModelChanged'
      value: null
    placeholder: String

  navigate: (path, useNumericPath) ->
    @walk path,
      endFn: _.identity
      useNumericPath: useNumericPath

  # TODO: abort fold procedures if child does not exist?
  ###
  path - a path to the desired node
  options ::=
    endFn: (text-tree) -> ()
    fold:
      proc:
      acc:
  ###
  walk: (path, options) ->
    do helper = (current = this, path_ = path) ->
      if path_.length is 0
        if options.endFn?
        then options.endFn current
        else end
      else
        [hd, tl...] = path_
        nextChild = current.holeElements[hd]

        # Return `null` if no element at that path.
        if not nextChild?
          return null

        if options.fold?.proc?
          options.fold.acc =
            options.fold.proc options.fold.acc, nextChild

        helper nextChild, tl

  _requestFill: (evt, detail) ->
    do evt.stopPropagation # want only the deepest node to respond
    nodeModel = evt.model.piece
    @fire 'request-fill',
      idPath: nodeModel.__idPath
      numericPath: nodeModel.__numericPath
      nodeModel: nodeModel
      sender: this

  _calculatePaths: (model, idx) ->
    if not model.__parentPath?
      model.__parentPath =
        idPath: []
        numericPath: []
    model.__idPath = [model.__parentPath.idPath..., model.id]
    model.__numericPath = [model.__parentPath.numericPath..., idx] # TODO: ??

    model.value?.forEach (child) ->
      child.__parentPath =
        idPath: model.__idPath
        numericPath: model.__numericPath

  _treeModelChanged: (model) ->
    _.filter model, type: 'hole'
      .forEach @_calculatePaths

    getHoleElm = ({id, isFilled}) =>
      # HACK: sort of; there's something up with dom-if. seems to be creating
      #       hidden empty elements? which share data-hole-id attributes. so
      #       we refine the query by specifying filled or empty.
      selector =
        "[data-hole-id=\"#{id}\"].#{if isFilled then 'filled' else 'empty'}"
      Polymer.dom(@root).querySelector selector
    makeChildInfo = (elm) ->
      id: elm.dataset?.holeId
      isFilled: elm.classList.contains 'filled'
      container: elm
      node: Polymer.dom(elm).querySelector 'text-tree'
    # wait for elements to be created
    @async () =>
      @holeElements = _.chain model
        .filter type: 'hole'
        .reduce ((ac, pc) -> ac[pc.id] = getHoleElm pc; return ac), {}
        .value()

  ## Computed properties helpers ##

  _isEqual: (a, b) -> a is b

  _isTruthy: (x) -> if x then true else false

  _idOfHole: ({__idPath}) -> _.last __idPath

  _getClassesFromModel: (model, extraClasses...) ->
    result = if model.classes? then model.classes else []
    if not _.isArray result
      result = [result]
    result.push extraClasses...
    return result.join ' '

  # respond to action nodes
  _actionDown: (event) ->
    do event.stopPropagation
    do event.model.piece.onAction

  _stopEvent: (event) ->
    do event.preventDefault
    do event.stopPropagation