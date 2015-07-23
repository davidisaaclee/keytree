### text-tree
###

_ = require 'lodash'
parseTemplate = (require 'grammar-parser').parse

TextTree = Polymer
  is: 'text-tree'

  properties:
    treeModel:
      type: Object
      observer: '_treeModelChanged'

  navigate: (path, useNumericPath) ->
    @walk path,
      endFn: _.identity
      useNumericPath: useNumericPath

  getNthChild: (index) ->
    branchNode =
      Polymer.dom(this.root).querySelector('.branch')
    holes =
      Polymer.dom(branchNode)
        .childNodes
        .filter (elm) -> elm.classList?.contains 'hole'

    if holes?
    then holes[index]?.querySelector 'text-tree'
    else null

  getChild: (id) ->
    Polymer.dom(@root)
      .querySelectorAll '.node'
      .forEach (node) ->
        if node.holeId is id
          console.log node
          return node.querySelector 'text-tree'

  # TODO: abort fold procedures if child does not exist?
  walk: (path, options) ->
    if path.length is 0
      if options.endFn?
      then options.endFn this
      else this
    else
      [hd, tl...] = path

      nextChild = do =>
        if options.useNumericPath
        then @getNthChild hd
        else @getChild hd

      # Return `null` if no element at that path.
      if not nextChild?
        return null

      if options.fold?.proc?
        options.fold.acc =
          options.fold.proc options.fold.acc, nextChild

      nextChild.walk tl, options


  _isEqual: (a, b) -> a is b

  # _createBranchElements: (model) ->
  #   # HACK: There's something really fishy going on here...
  #   #       Check out `text-tree.jade` for more info.
  #   if model is undefined
  #     console.log '_createBranchElements for undefined!'
  #     return []

  #   numericPath =
  #     if model.numericPath?
  #     then model.numericPath
  #     else []
  #   idPath =
  #     if model.idPath?
  #     then model.idPath
  #     else []
  #   # FIXME: I don't think this first `if` is ever reached...
  #   if model.type is 'empty'
  #     [
  #       type: 'empty'
  #       numericPath: numericPath
  #       idPath: idPath
  #     ]
  #   else if model.type is 'branch'
  #     children = if model.children? then model.children else []
  #     template = parseTemplate model.template
  #     result = []
  #     holeCount = 0
  #     template.forEach (elm, idx) ->
  #       switch elm.type
  #         when 'hole'
  #           pathInfo =
  #             numericPath: [numericPath..., holeCount]
  #             idPath: [idPath..., elm.identifier]

  #           _.assign children[holeCount], pathInfo
  #           _.assign elm, pathInfo, {value: children[holeCount]}

  #           result.push elm
  #           holeCount++
  #         when 'variadic'
  #           # eat ALL the children
  #           for i in [holeCount...children.length]
  #             subhole =
  #               type: 'hole'
  #               identifier: "#{elm.identifier}-#{i}"
  #               index: elm.index + (i - holeCount)
  #               holeIndex: holeCount

  #             pathInfo =
  #               numericPath: [numericPath..., i]
  #               idPath: [idPath..., subhole.identifier]

  #             _.assign children[i], pathInfo
  #             _.assign subhole, pathInfo, {value: children[i]}

  #             result.push subhole
  #             holeCount++
  #         when 'literal'
  #           result.push elm
  #         else
  #           console.log 'invalid node type', elm.type, elm

  #     return result

      # holes = template.filter (elm) -> elm.type is 'hole'

      # while children.length < holes.length
      #   children.push {type: 'empty'}

      # holes.forEach (elm, idx) ->
      #   myNumericPath = [numericPath..., idx]
      #   myIdPath = [idPath..., elm.identifier]

      #   elm.value = children[idx]
      #   elm.numericPath = myNumericPath
      #   elm.idPath = myIdPath
      #   elm.value.numericPath = myNumericPath
      #   elm.value.idPath = myIdPath

      # return template
    # else
    #   console.log 'Unrecognized node model type: ', model.type

  _requestFill: (evt, detail) ->
    # stop propagation so that only the deepest node responds
    evt.stopPropagation()

    # nodeModel = evt.model.item
    nodeModel = @treeModel
    @fire 'request-fill',
      idPath: nodeModel.__idPath
      numericPath: nodeModel.__numericPath
      nodeModel: nodeModel
      sender: this

  _idOfHole: ({__idPath}) -> _.last __idPath

  _getClassesFromModel: ({classes}) ->
    if not classes?
      classes = []
    if typeof classes is 'string'
      classes = classes.split ' '

    r = _.toArray arguments
      .splice 1
    r.push classes...
    return r.join ' '

  _treeModelChanged: (model) ->
    console.log 'tt model changed'
    if model.type is 'hole' and model.isFilled
      if not model.__idPath?
        model.__idPath = [model.id]
      if not model.__numericPath?
        # I think this makes sense? If we need to start from a single
        # element, then the first index can only be 0.
        model.__numericPath = [0]

      holeCount = 0
      model.value.forEach (child) ->
        if child.type is 'hole'
          child.__idPath = [model.__idPath..., child.id]
          child.__numericPath = [model.__numericPath..., holeCount++]