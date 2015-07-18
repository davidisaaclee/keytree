### text-tree
###

_ = require 'lodash'

parseTemplate = (require 'grammar-parser').parse

TextTree = Polymer
  is: 'text-tree'

  properties:
    treeModel: Object

  navigate: (path, useNumericPath) ->
    @walk path,
      endFn: (x) -> x
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
    branchNode = Polymer.dom(@root).querySelector '.branch'
    for child in Polymer.dom(branchNode).children
      if child.classList.contains 'hole'
        if child.holeId is id
          return child.querySelector 'text-tree'

  # TODO: abort fold procedures if child does not exist?
  walk: (path, options) ->
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

    if tl.length is 0
      if options.endFn?
      then options.endFn nextChild
      else nextChild
    else
      nextChild.walk tl, options


  _isEqual: (a, b) -> a is b

  _createBranchElements: (model) ->
    # HACK: There's something really fishy going on here...
    #       Check out `text-tree.jade` for more info.
    if model is undefined
      console.log '_createBranchElements for undefined!'
      return []

    numericPath =
      if model.numericPath?
      then model.numericPath
      else []
    idPath =
      if model.idPath?
      then model.idPath
      else []
    # FIXME: I don't think this first `if` is ever reached...
    if model.type is 'empty'
      console.log 'empty type'
      [
        type: 'empty'
        numericPath: numericPath
        idPath: idPath
      ]
    else if model.type is 'branch'
      children = if model.children? then model.children else []
      template = parseTemplate model.template
      result = []
      holeCount = 0
      template.forEach (elm, idx) ->
        switch elm.type
          when 'hole'
            pathInfo =
              numericPath: [numericPath..., holeCount]
              idPath: [idPath..., elm.identifier]

            _.assign children[holeCount], pathInfo
            _.assign elm, pathInfo, {value: children[holeCount]}

            result.push elm
            holeCount++
          when 'variadic'
            # eat ALL the children
            for i in [holeCount...children.length]
              subhole =
                type: 'hole'
                identifier: "#{elm.identifier}-#{i}"
                index: elm.index + (i - holeCount)
                holeIndex: holeCount

              pathInfo =
                numericPath: [numericPath..., i]
                idPath: [idPath..., subhole.identifier]

              _.assign children[i], pathInfo
              _.assign subhole, pathInfo, {value: children[i]}

              result.push subhole
              holeCount++
          when 'literal'
            result.push elm
          else
            console.log 'invalid node type', elm.type, elm

      return result

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
    else
      console.log 'Unrecognized node model type: ', model.type

  _requestFill: (evt, detail) ->
    # stop propagation so that only the deepest node responds
    evt.stopPropagation()

    nodeModel = evt.model.item
    @fire 'request-fill',
      idPath: nodeModel.idPath
      numericPath: nodeModel.numericPath
      nodeModel: nodeModel
      sender: this

  _idOfHole: ({idPath}) -> _.last idPath

  _getClassesFromModel: ({classes}) ->
    if not classes?
      classes = []
    if typeof classes is 'string'
      classes = classes.split ' '

    r = _.toArray arguments
      .splice 1
    r.push classes...
    return r.join ' '