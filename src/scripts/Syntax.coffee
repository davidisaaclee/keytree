_ = require 'lodash'
match = require 'util/match' # class-based pattern matching
require 'util/property' # convenience wrapper for Object.defineProperty

{Expression, Grammar, Piece, Literal, Hole, Subexpression} = require 'Grammar'


###
Tree navigation

Since pieces can be quantified, there must be a distinct way of referring to the
immutable pieces of a template versus the mutable pieces of a Node.

template: <lonely:E>* (", " <inSubX:E>)*
node: <lonely-0:E> <lonely-1:E>, <inSubX-0:E>, <inSubX-1:E>

holes:
  lonely: [lonely-0, lonely-1]
subexpressions:
  0: # the 0th subexpression, scanning from top level
    0: # the 0th instance of this subexpression
      holes:
        inSubX: [inSubX-0]
      subexpressions: []
    1:
      holes:
        inSubX: [inSubX-1]

template: (<outer:E> (", " <inner:E>*)* " : ")*
node: <outer-0:E>, <inner-0-0-0:E> <inner-0-0-1:E>, <inner-0-1-0:E> : <outer-1:E>, <inner-1-0-0:E>

holes: {}
subexpressions: [
  [
    holes: {outer: [outer-0]}
    subexpressions: [
      [
        holes: {inner: [inner-0-0]}
       ,
        holes: {inner: [inner-0-1]}
      ]
    ]
   ,
    holes: {outer: [outer-1]}
    subexpressions: [
      [
        holes: {inner: [inner-1-0]}
        subexpression: {}
      ]
    ]
  ]
]
###

# Represents a syntax tree, containing all information necessary to render the text.
class SyntaxTree
  constructor: (@grammar, startGroup) ->
    @_listeners = {}
    @_baseNode = Node.makeRoot (new Expression [new Hole 'start', startGroup, 'one'])
    # @rootHole = _.first _.values @root.childrenMap
    @root = _.first _.values @_baseNode.childrenMap
    @root.routeEvents this

  # root :: Node
  root: undefined

  # grammar :: Grammar
  grammar: undefined

  # Returns the `Node` at `path`, or `null` if no such node.
  # Should handle variadic IDs ("<identifier>-<clone number>").
  # TODO: If the base ID of a variadic hole is an element of the `path`...?
  navigate: (path, useNumericPath) ->
    @_baseNode.navigate path, useNumericPath

  navigateExpression: (path) -> @_baseNode.navigateExpression path

  # Register a callback to be executed on tree modification.
  # Returns an unsubscribe function.
  addEventListener: (kind, callback) ->
    if not @_listeners[kind]?
      @_listeners[kind] = []
    l = @_listeners[kind].push callback
    return () => @_listeners[kind][l] = undefined

  dispatchEvent: (kind, details) =>
    @_listeners[kind]?.forEach (cb) -> cb? details
    @_eventParent?.dispatchEvent kind, details

  routeEvents: (parent) ->
    @_eventParent = parent

  flatten: () -> do @_baseNode.flatten

  # If `node` has children, return the first child.
  # If `node` has no children, but has a succeeding sibling,
  #   return that sibling.
  # Otherwise, return `node`.
  nextNode: (node) ->
    if (_.any node.holeList, ({value}) -> value?)
      node.holeList[0]
    else
      console.log node
###
Subexpressions

- all subexprs are assigned IDs when template is parsed
- quantified subexprs are indexed in `quantifiedChildren`, with the `Node` array
  containing Expression Nodes
- all children of each subexpr instance are indexed as normal in `childrenMap` and
  `children` (allowing consistent `navigate` behavior)
- when a instance of a kleene subexpr is modified (fill, delete, etc), check that
  there is an empty node at the end of the sequence of subexpr instances
###


###
Nodes should be able to
- navigate to parent
- navigate to any of their descendants given a path
- fill/replace own template
- render own expression into text
- provide a sequential view of own expression (for UI)
- give information about hole it fills
- add empty instances of quantified subexpressions
###

###
Represents a node in a `SyntaxTree`, containing the ability to render itself and
its children.

Public
+ makeRoot: Expression -> Node
  : Creates a parentless Node.
- template: Expression
  : Template expression for this Node.
- parent: Node
- children: [Node]
  : List of children in order of sequence (expanded varargs)
- childrenMap: {<id>: Node}
  : Maps hole id to child node. For variadic holes, maps the base ID to the
    youngest (rightmost) child node.
- quantifiedChildren: {<id>: [Node]}
  : Maps hole ID to array of child nodes for quantified (Kleene or optional)
    holes.
- isFilled: Boolean
  : `true` if this node has been given a sequence.
- fill: Expression -> Node
  : Replaces this node's template with the specified template expression.
- walk: Array, Object -> Node
  : Walks the tree described by this node, optionally mutating nodes along the
    way or mutating the found node.
- render: Unit -> String
  : Renders this node into text, recurring on its children.
- holeInformation: - {id: String,
                      group: String,
                      quantifier: 'kleene' | 'optional' | 'one',
                      sequenceIndex: Integer
                      holeIndex: Integer}
  : Dictionary of information about the hole which this node fills.
Private
- _setTemplate: Expression -> ()
  : Sets this node's template, creating hole list, empty children, etc.
- _holes: {<hole id>: {id: String,
                       group: String,
                       quantifier: 'kleene' | 'optional' | 'one',
                       sequenceIndex: Integer
                       holeIndex: Integer}}
  : Immutable map of information about the holes which this Node offers.
###

class Node
  ###
  Node.prototype.constructor - generic constructor
    parent - the to-be-created Node's parent
    holeId - the id of the hole in the parent which the new Node will fill
    template - the syntactic template expression that the new node will follow
  ###
  constructor: (parent, holeId, template) ->
    @_eventListeners = {}

    Object.defineProperty this, 'parent',
      get: () -> @_parent
      set: (newValue) =>
        @_parent = newValue
        if @_parent?
          if not @_parent._holes[holeId]?
            console.log 'ERROR: Attempted to fill non-existent hole.'
            debugger
          @holeInformation = @_parent._holes[holeId]
    @_eventParent = @parent = parent

    if template?
    then @_setTemplate template
    else
      @isFilled = false
      @template = null

  ###
  Node.makeRoot - creates a parentless Node, given only the template expression
  ###
  @makeRoot: (template) ->
    result = new Node()
    result._setTemplate template
    return result

  ###
  holeInformation: - {id: String,
                      group: String,
                      isVariadic: Boolean,
                      sequenceIndex: Integer
                      holeIndex: Integer} - dict of information about the hole
                                            that this node fills
  ###
  holeInformation: null

  ###
  fill :: Expression -> Node
  Replaces this node's template with the specified template expression.
  ###
  fill: (template) ->
    @_setTemplate template
    @dispatchEvent 'changed'
    return this


  ###
  walk :: Array, Object -> Node
        | Array, {endFn :: Node -> a, ...} -> a
  : Walks the tree described by this node, optionally mutating nodes along the
    way or mutating the found node.

  path - the numeric or id path to the desired node
  options
    useNumericPath - `true` if `path` argument is numeric
    endFn - procedure to apply on the node at `path` before returning,
            with type `(<node>) -> <return>`
    fold
      proc - procedure for folding, with type `(<accum>, <elm>) -> <accum>`
      acc - initial accumulator value for folding

  Returns the found `Node`, or the result of `options.endFn` on the found
    `Node`.
  ###
  walk: (path, options = {}) ->
    if path.length is 0
      if options.endFn?
      then options.endFn this
      else this
    else
      [hd, tl...] = path
      nextChild = do =>
        if options.useNumericPath
        then @_getNthChild hd
        else @_getChild hd

      # Check that such a child exists.
      if not nextChild?
        return null

      if options.fold?.proc?
      then options.fold.acc = options.fold.proc options.fold.acc, nextChild

      nextChild.walk tl, options

  ###
  Navigates to the _instance_ at instance ID path `path`.
  ###
  navigate: (path, useNumericPath) -> @walk path, useNumericPath: useNumericPath


  ###
  Navigates to the _template information_ node at `path`, where `path` is a
  sequence of `PathElement`s, terminated by a `PathTerminator`.

    PathElement ::= { type: 'hole' | 'subexpression'
                    , identifier: String
                    , index: Integer }
    PathTerminator ::= PathElement
                     | { type: 'hole' | 'subexpression'
                       , identifier: String }

  When the `index` property is _included_ in the `PathTerminator`, this method
  returns a `Node` (for holes) or an `InstanceInfo` (for subexpressions).

    InstanceInfo ::=
      holes:
        <hole template id>: HoleInfo
      subexpressions:
        <subexpr template id>: SubexprInfo

  When the `index` property is _omitted_ from the `PathTerminator`, this method
  returns a `HoleInfo` or a `SubexprInfo`.

    HoleInfo ::=
      instances: [Node]
      pushEmpty: () -> Node
      node: () -> Node

    SubexprInfo ::=
      instances: [InstanceInfo]
      pushEmpty: () -> InstanceInfo
  ###
  navigateExpression: (path) ->
    helper = (path, info) =>
      if path.length is 0
      then info
      else
        [hd, tl...] = path
        outerInfo =
          switch hd.type
            when 'hole' then info.holes[hd.identifier]
            when 'subexpression'
              info.subexpressions[hd.identifier]
        if not outerInfo?
          return undefined

        if tl.length is 0
          if hd.index?
            return outerInfo.instances[hd.index]
          else
            return outerInfo
        else
          if not hd.index?
            console.log 'navigateExpression() - Intermediate path element omitting index.', hd
          instance = outerInfo.instances[hd.index]
          if not instance?
            return undefined
          switch hd.type
            when 'hole' then instance.navigateExpression tl
            when 'subexpression' then helper tl, instance
    helper path, @_instanceInfo


  ###
  render :: Unit -> String
  Renders this node into text, recurring on its children.
  ###
  render: () ->
    do helper = (tree = (do @flatten)) ->
      _ (tree)
        .reject type: 'action'
        .map (elm) ->
          switch elm.type
            when 'literal' then elm.value
            when 'hole'
              if elm.isFilled
              then helper elm.value
              else "<#{elm.holeId}>"
        .join ''

  ###
  children :: () -> [Node]
  Returns an in-order list of this Node's children.
  ###
  children: () ->
    if not @template?
      # Template not yet set; cannot have any children.
      return []

    iteratee = (acc, {type, value}) ->
      switch type
        when 'hole-info'
          acc.push value.instances...
          return acc
        when 'subexpr-info'
          r = value.instances
            .map (inst) -> inst.infoList.reduce iteratee
            .reduce ((acc_, chldn) -> acc_.push chldn...), []
          acc.push r...
          return acc
    @_instanceInfo.infoList.reduce iteratee, []

  ###
  "Flattens" this node's descendants into a concrete syntax tree.

  ReturnType ::= CST

  CST ::= LiteralElement
        | HoleElement

  LiteralElement ::=
    type: 'literal'
    value: String

  HoleElement ::=
    type: 'hole'
    isFilled: Boolean
    instanceId: String   # unique (within sequence) ID
    holeId: String       # non-unique hole template ID
    value: [ReturnType]

  ActionElement ::=
    type: 'action'
    display: String
    onAction: () ->

  ###
  # TODO: should the `pushEmpty` functions be put in this structure?
  flatten: () ->
    scope = this
    reduction = (info) ->
      (acc = [], pc) ->
        switch pc.type
          when 'literal'
            acc.push {type: 'literal', value: pc.text}
          when 'hole'
            Array.prototype.push.apply acc, \
              info.holes[pc.identifier].instances.map (instance) ->
                type: 'hole'
                isFilled: instance.isFilled
                holeId: instance.holeInformation.id
                instanceId: instance.instanceId
                value: if instance.isFilled then do instance.flatten else []
            expandNode =
              type: 'action'
              display: '+'
              onAction: () -> do info.holes[pc.identifier].pushEmpty
            switch pc.quantifier
              when 'kleene'
                acc.push expandNode
              when 'optional'
                if info.holes[pc.identifier].instances.length is 0
                  acc.push expandNode
          # when 'input'
          #   # TODO
          when 'subexpression'
            ## does this method have any benefit?
            # recurHoles =
            #   info.subexpressions[pc.identifier].instances.map (instance) ->
            #     pc.expression.pieces.reduce (reduction instance), []
            # Array.prototype.push.apply acc, (_.flatten recurHoles)
            info.subexpressions[pc.identifier].instances.map (instance) ->
              pc.expression.pieces.reduce (reduction instance), acc
            expandNode =
              type: 'action'
              display: '+'
              onAction: () ->
                do info.subexpressions[pc.identifier].pushEmpty
            switch pc.quantifier
              when 'kleene'
                acc.push expandNode
              when 'optional'
                if info.subexpressions[pc.identifier].instances.length is 0
                  acc.push expandNode
        return acc

    @template.pieces.reduce (reduction @_instanceInfo), []

  ## Event routing ##

  addEventListener: (kind, callback) ->
    if not @_eventListeners[kind]?
      @_eventListeners[kind] = []
    l = @_eventListeners[kind].push callback
    return () -> @_eventListeners[kind][l] = undefined

  dispatchEvent: (kind, details) =>
    @_eventListeners[kind]?.forEach (cb) -> cb? details
    @_eventParent?.dispatchEvent kind, details

  routeEvents: (parent) -> @_eventParent = parent

  ## Private methods ##

  _getChild: (id) -> @childrenMap?[id]

  _getNthChild: (n) -> @children[n]

  _makeSubexprId: (n) -> "s#{n}"

  _setTemplate: (template) ->
    if not template?
      console.log 'Node was supplied null template: ', @
      return

    @isFilled = true
    @template = template
    @childrenMap = {}

    parentNode = this
    makeHoleInfo = (subexprPath) ->
      subexprIndex = 0
      (acc, piece) ->
        switch piece.type
          when 'hole'
            acc[piece.identifier] =
              id: piece.identifier
              group: piece.group
              quantifier: piece.quantifier
              subexpressionPath: subexprPath
          when 'subexpression'
            newSubPath = [subexprPath..., piece.identifier]
            piece.expression.pieces.reduce (makeHoleInfo newSubPath), acc
        return acc
    @_holes = template.pieces.reduce (makeHoleInfo []), {}

    ###
    InstanceInfo ::=
      holes:
        <hole template id>: HoleInfo
      subexpressions:
        <subexpr template id>: SubexprInfo
      infoList: {type: 'hole-info', value: HoleInfo}
              | {type: 'subexpr-info', value: SubexprInfo}

    HoleInfo ::=
      instances: [Node]
      pushEmpty: () -> Node
      lastInstance: () -> Node

    SubexprInfo ::=
      instances: [InstanceInfo]
      pushEmpty: () -> InstanceInfo
    ###
    @_instanceInfo = do makeInstanceInfo = (expr = template, path = []) ->
      reduction = (acc, elm) ->
        switch elm.type
          when 'hole'
            if not acc.holes?
              acc.holes = {}
            holeInfo =
              instances: []
              # set `quiet` to true to disable sending change event
              pushEmpty: (quiet = false) ->
                emptyNode = new Node parentNode, elm.identifier
                pathString = [path..., @instances.length].join '.'
                emptyNode.instanceId = "#{elm.identifier}::#{pathString}"
                @instances.push emptyNode
                parentNode.childrenMap[emptyNode.instanceId] = emptyNode
                if not quiet
                  parentNode.dispatchEvent 'changed'
                emptyNode
              lastInstance: () -> @instances[@instances.length - 1]

            acc.holes[elm.identifier] = holeInfo
            acc.infoList.push {type: 'hole-info', value: holeInfo}
            if elm.quantifier is 'one'
              holeInfo.pushEmpty(true)
          when 'subexpression'
            if not acc.subexpressions?
              acc.subexpressions = {}
            subId = elm.identifier
            subExprInfo =
              instances: []
              # set `quiet` to true to disable sending change event
              pushEmpty: (quiet = false) ->
                instanceInfo = makeInstanceInfo elm.expression, [path..., subId, @instances.length]
                @instances.push instanceInfo
                if not quiet
                  parentNode.dispatchEvent 'changed'
                return instanceInfo
            acc.subexpressions[subId] = subExprInfo
            acc.infoList.push {type: 'subexpr-info', value: subExprInfo}
            if elm.quantifier is 'one'
              subExprInfo.pushEmpty(true)
        return acc
      expr.pieces.reduce reduction, {infoList: []}

module.exports =
  SyntaxTree: SyntaxTree
  Node: Node