_ = require 'lodash'
match = require 'util/match' # class-based pattern matching
require 'util/property' # convenience wrapper for Object.defineProperty

{Grammar, Sequence, S} = require 'Grammar'
{Literal, Hole, Regex, Variadic} = S

# Represents a syntax tree, containing all information necessary to render the text.
class SyntaxTree
  constructor: (@grammar, startGroup) ->
    @_listeners = {}
    @root = Node.makeRoot (new Sequence [new Hole startGroup, 'start'])
    @root.routeEvents this

  # root :: Node
  root: undefined

  # grammar :: Grammar
  grammar: undefined

  # Returns the `Node` at `path`, or `null` if no such node.
  # Should handle variadic IDs ("<identifier>-<clone number>").
  # TODO: If the base ID of a variadic hole is an element of the `path`...?
  navigate: (path, useNumericPath) ->
    @root.navigate path, useNumericPath

  # Register a callback to be executed on tree modification.
  # Returns an unsubscribe function.
  addEventListener: (kind, callback) ->
    if not @_listeners[kind]?
      @_listeners[kind] = []
    l = @_listeners[kind].push callback
    return () => @_listeners[kind][l] = undefined

  dispatchEvent: (kind, details) => @_listeners[kind].forEach (cb) -> cb? details

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
Represents a node in a `SyntaxTree`, containing the ability to render itself and
its children.

Public
- sequence: Sequence
  : Template sequence for this Node.
- parent: Node
- children: [Node]
  : List of children in order of sequence (expanded varargs)
- childrenMap: {<id>: Node | [Node]}
  : Maps hole id to child node. For variadic holes, maps the base ID to an array
    of all children of that node.
- isFilled: Boolean
  : `true` if this node has been given a sequence.
- fill: Node -> Node
  : Replaces this node's sequence & children with the specified node's sequence
    and children.
- holeInformation: - {id: String,
                      group: String,
                      isVariadic: Boolean,
                      sequenceIndex: Integer
                      holeIndex: Integer}
  : Dictionary of information about the hole which this node fills.
Private
- _setSequence: Sequence -> ()
  : Sets this node's sequence, creating hole list, empty children, etc.
- _holes: { <hole id>: {id: String,
                        group: String,
                        isVariadic: Boolean,
                        sequenceIndex: Integer
                        holeIndex: Integer}}
  : Map of information about the holes which this Node offers.
###

class Node
  ###
  Node.prototype.constructor - generic constructor
    parent - the to-be-created Node's parent
    holeId - the id of the hole in the parent which the new Node will fill
    sequence - the syntactic sequence that the new node will follow
  ###
  constructor: (parent, holeId, sequence) ->
    @_eventListeners = {}

    Object.defineProperty this, 'parent',
      get: () -> @_parent
      set: (newValue) =>
        @_parent = newValue
        if @_parent?
          @holeInformation = @_parent._holes[holeId]
    @_eventParent = @parent = parent


    if sequence?
    then @_setSequence sequence
    else @isFilled = false

  ###
  Node.makeRoot - creates a parentless Node, given only the sequence
  ###
  @makeRoot: (sequence) ->
    result = new Node()
    result._setSequence sequence
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

  fill: (sequence) ->
    @_setSequence sequence
    @dispatchEvent 'changed'

  ###
  path - the numeric or id path to the desired node
  options
    useNumericPath - `true` if `path` argument is numeric
    endFn - procedure to apply on the node at `path` before returning,
            with type `(<node>) -> <return>`
    fold
      proc - procedure for folding, with type `(<accum>, <elm>) -> <accum>`
      acc - initial accumulator value for folding
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

  navigate: (path, useNumericPath) ->
    @walk path, useNumericPath: useNumericPath

  # Renders this node into text, recurring on its children.
  # render :: Unit -> String
  render: () ->
    @sequence.symbols
      .map (symbol) =>
        match symbol,
          Literal: ({text}) => text
          Variadic: ({identifier, group}) =>
            for child in @childrenMap[identifier]
              if child.isFilled
              then do child.render
              else ('`' + group + '`')
          Hole: ({identifier, group}) =>
            if @childrenMap[identifier].isFilled
            then do =>
              do @childrenMap[identifier].render
            else ('`' + group + '`')
      .join ''

  ## Event routing ##

  addEventListener: (kind, callback) ->
    if not @_eventListeners[kind]?
      @_eventListeners[kind] = []
    l = @_eventListeners[kind].push callback
    return () -> @_eventListeners[kind][l] = undefined

  dispatchEvent: (kind, details) =>
    @_eventListeners[kind]?.forEach (cb) -> cb? details
    @_eventParent.dispatchEvent kind, details

  routeEvents: (parent) -> @_eventParent = parent

  ## Private methods ##

  _getChild: (id) -> @childrenMap[id]

  _getNthChild: (n) -> @children[n]

  _setSequence: (sequence) ->
    if not sequence?
      return

    @isFilled = true
    @sequence = sequence
    holeIndex = 0
    @_holes = {}

    # Populate the `_holes` dictionary.
    @sequence.symbols.forEach (sym, index) =>
      match sym,
        Hole: (hole) =>
          @_holes[hole.identifier] =
            id: hole.identifier
            group: hole.group
            isVariadic: false
            sequenceIndex: index
            holeIndex: holeIndex++
        Variadic: (varargs) =>
          @_holes[varargs.identifier] =
            id: varargs.identifier
            group: varargs.group
            isVariadic: true
            sequenceIndex: index
            holeIndex: holeIndex++
        else: ->

    # Populate the `children` list and `childrenMap`.
    childCount = 0
    @children = []
    variadicChildrenMap = {}
    @childrenMap = _.mapValues @_holes, (v, k) =>
      if v.isVariadic
        variadicId = ({__cloneNumber, holeInformation}) ->
          "#{holeInformation.id}-#{__cloneNumber}"

        child = new Node this, v.id
        child.__cloneNumber = 0
        child.variadicId = variadicId child
        @children[childCount++] = child
        variadicChildrenMap[child.variadicId] = child

        # override `fill` to make a new empty sibling on fill
        scope = this
        child.fill = () ->
          # to first call "super"
          Node.prototype.fill.apply this, arguments
          # and then make a new empty sibling to take this node's place.
          # TODO: "if there is no empty node after this node"
          sibling = new Node scope, @holeInformation.id
          sibling.fill = @fill
          sibling.__cloneNumber = @__cloneNumber + 1
          sibling.variadicId = variadicId sibling
          scope.children[childCount++] = sibling
          scope.childrenMap[sibling.variadicId] = sibling
          scope.childrenMap[@holeInformation.id].push sibling
          @dispatchEvent 'changed'
        return [child]
      else
        child = new Node this, v.id
        @children[childCount++] = child
        return child
    _.extend @childrenMap, variadicChildrenMap


module.exports =
  SyntaxTree: SyntaxTree
  Node: Node