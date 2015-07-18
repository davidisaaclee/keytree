_ = require 'lodash'
match = require 'util/match' # class-based pattern matching
require 'util/property' # convenience wrapper for Object.defineProperty

# ---- MODEL ---- #

# The grammar of a single language.
class Grammar
  constructor: (@productions) ->

  # productions :: { [<identifier> : { [<identifier> : Sequence] }] }
  productions: undefined

  # makeSequence :: String -> String -> {} -> Sequence
  makeSequence: (groupId, sequenceId, data) ->
    if data?
    then @productions[groupId]?[sequenceId].withData data
    else @productions[groupId]?[sequenceId]


# # A set of production rules for a particular nonterminal.
# class Production
#   constructor: (@symbols) ->

#   # # The identifier corresponding to this rule set's nonterminal.
#   # # identifier :: String
#   # identifier: undefined

#   # Set of symbols which can be produced by this rule set.
#   # symbols :: {<identifier>: <Symbol>}
#   symbols: undefined


# Describes and matches a `Symbol` as a sequence of `Piece`s.
class Sequence
  constructor: (@symbols) ->

  # symbols :: [Symbol]
  symbols: undefined

  display: () ->
    @symbols
      .map (sym) -> do sym.display
      .join ''

  templateString: () ->
    @symbols
      .map (sym) ->
        match sym,
          Literal: ({text}) -> text
          VarArgs: ({identifier, group}) -> "`#{identifier}*`"
          Hole: ({identifier, group}) -> "`#{identifier}`"
          Regex: ({identifier, pattern}) -> "`#{identifier}`"
      .join ''

  # Creates a copy of this `Sequence` with the specified data filled-in.
  withData: (data) ->
    if not (_.any @symbols, (sym) -> sym.constructor.name is 'Regex')
    then this
    else new Sequence @symbols.map (sym) ->
      if sym.constructor.name is 'Regex'
      then new Literal data
      else sym


# A single element of a `Sequence`.
class Symbol
  display: () -> 'display() not implemented.'


# An unchanging string literal; a terminal.
class Literal extends Symbol
  constructor: (@text) ->

  # text :: String
  text: undefined

  display: () -> @text


# A hole to be filled; annotated with a valid group identifier for filling; a nonterminal.
class Hole extends Symbol
  constructor: (@group, @identifier) ->

  # the identifier of the group this hole wants
  # group :: String
  group: undefined

  # the identifier of this hole
  # identifier :: String
  identifier: undefined

  display: () -> "<#{@identifier}>"


class VarArgs extends Hole
  display: () -> "<#{@identifier}...>"


class Regex extends Symbol
  constructor: (@pattern, @identifier) ->

  # identifier :: String
  identifier: undefined

  # pattern :: String
  pattern: undefined

  display: () -> "<#{@identifier}...>"


# ---- INSTANCE ---- #

# Represents a syntax tree, containing all information necessary to render the text.
class SyntaxTree
  constructor: (@grammar, startGroup) ->
    @root = new Node (new Sequence [new Hole startGroup, 'start']), this
    @_listeners = {}

  # root :: Node
  root: undefined

  # grammar :: Grammar
  grammar: undefined

  fillHole: (path, fillWith, useNumericPath) ->
    @root
      .navigateHole path, useNumericPath
      .fill fillWith
    @_notifyChanged()

  navigateHole: (path, useNumericPath) ->
    @root.navigateHole path, useNumericPath

  # Register a callback to be executed on tree modification.
  # Returns an unsubscribe function.
  _numberOfCallbacks: 0
  notifyChanged: (callback) ->
    cbId = "#cb-#{@_numberOfCallbacks++}"
    @_listeners[cbId] = callback
    return () -> delete _listeners[cbId]

  _notifyChanged: () => cb() for k, cb of @_listeners


# Represents a node in a `SyntaxTree`, containing the ability to render itself and its children.
class Node
  constructor: (@sequence, parent) ->
    @_holes = {}
    @_listeners = {}

    # User-facing count of holes, expanding variadic holes.
    Object.defineProperty this, 'holeCount',
      get: () ->
        iteratee = (acc, val) ->
          if val.isVariadic
          then acc.count += val.value.length
          else acc.count += 1
        (_.transform @_holes, iteratee, {count: 0}).count

    # User-facing list of holes in sequence order, expanding variadic holes.
    Object.defineProperty this, 'holeList',
      get: () ->
        iteratee = (acc, elm) ->
          coerceVarIntoHole = (varargs) ->
            varargs.value.map (val, idx) ->
              customizations =
                id: "#{varargs.id}-#{idx}"
                value: val
                fill: (withNode) -> varargs.fill withNode, idx
              _.chain varargs
                .clone()
                .extend customizations
                .value()

          if elm.isVariadic
          then acc.unshift (coerceVarIntoHole elm)...
          else acc.unshift elm
        _.sortBy (_.transform @_holes, iteratee, []), _.property 'index'

    if parent?._notifyChanged?
      @notifyChanged parent._notifyChanged

    holeIndex = 0
    notify = @_notifyChanged
    @sequence.symbols.forEach (sym, index) =>
      match sym,
        Hole: (hole) =>
          @_holes[hole.identifier] =
            id: hole.identifier
            group: hole.group
            isVariadic: false
            index: index
            holeIndex: holeIndex++
            value: null
            fill: (withNode) ->
              @value = withNode
              withNode.notifyChanged notify
              do notify
        VarArgs: (varargs) =>
          @_holes[varargs.identifier] =
            id: varargs.identifier
            group: varargs.group
            isVariadic: true
            index: index
            holeIndex: holeIndex++
            value: [null]
            fill: (withNode, atIndex) ->
              @value[atIndex] = withNode
              if (@value.length - 1) is atIndex
                @value.push null
              withNode.notifyChanged notify
              do notify
        else: ->

  # sequence :: Sequence
  sequence: undefined

  # Holds the underlying models for the holes. Importantly, variadic holes
  #   will only occupy one entry in this object, regardless of how many holes
  #   within the variadic hole are filled.
  # To interface with holes more colloquially, use the `holeCount` or
  #   `holeList` properties.
  # holes :: {
  #   <identifier>: {
  #     id :: String,
  #     group :: String,
  #     index :: Integer,  # the index in the sequence
  #     holeIndex :: Integer,  # the index among the holes in the sequence
  #     value :: Node, (or for VarArgs, [Node])
  #     fill :: Node -> () } }
  _holes: undefined

  # # User-facing count of holes, expanding variadic holes.
  # @property 'holeCount' # defined in constructor


  # # User-facing list of holes in sequence order, expanding variadic holes.
  # @property 'holeList' # defined in constructor


  # Renders this node into text, recurring on its children.
  # render :: Unit -> String
  render: () ->
    @sequence.symbols
      .map (symbol) =>
        match symbol,
          Literal: ({text}) => text
          Hole: ({identifier, group}) =>
            if @_holes[identifier].value?
            then do =>
              if @_holes[identifier].isVariadic
              then do =>
                @_holes[identifier].value
                  .map (elm) -> if elm? then elm.render() else "`#{identifier}`"
                  .join ' '
              else do @_holes[identifier].value.render
            else ('`' + group + '`')
      .join ''


  getNthChild: (index) -> @holeList[index]
    # for key in Object.keys @_holes
    #   if @_holes[key].holeIndex is index
    #   then return @_holes[key]
    # return null


  getChild: (id) ->
    if @_holes[id]?
      return @_holes[id]
    else
      _.find @holeList, (elm) -> elm.id is id

      # [prefix, index] = id.split '-'
      # if index? and @_holes[prefix]? and @_holes[prefix].isVariadic
      #   r = @_holes[prefix].value[parseInt index]
      #   if r? then r else null
      # else
      #   return null



  idPathFromNumericPath: (numericPath) ->
    [hd, tl...] = numericPath
    nextHole = @getNthChild hd

    # Check that such a hole exists.
    if not nextHole?
      return null

    if tl.length is 0
    then [nextHole.id]
    else
      if nextHole.value?
      then [nextHole.id, (nextHole.value.idPathFromNumericPath tl)...]
      else []


  walk: (path, options = {}) ->
    [hd, tl...] = path
    nextHole = do =>
      if options.useNumericPath
      then @getNthChild hd
      else @getChild hd

    # Check that such a hole exists.
    if not nextHole?
      return null

    # # Check that such a hole has a value.
    # if not nextHole.value?
    #   return 'empty' # ???

    if options.fold?.proc?
    then options.fold.acc = options.fold.proc options.fold.acc, nextHole

    if tl.length is 0
      if options.endFn?
      then options.endFn nextHole.value, nextHole
      else nextHole.value
    else
      if nextHole.value?
      then nextHole.value.walk tl, options
      else null


  navigate: (path, useNumericPath) ->
    @walk path, {useNumericPath: useNumericPath}

  navigateHole: (path, useNumericPath) ->
    @walk path,
      endFn: (val, hole) -> hole
      useNumericPath: useNumericPath

  # Register a callback to be executed on tree modification.
  # Returns an unsubscribe function.
  _numberOfCallbacks: 0
  notifyChanged: (callback) ->
    cbId = "#cb-#{@_numberOfCallbacks++}"
    @_listeners[cbId] = callback
    return () -> delete _listeners[cbId]

  _notifyChanged: () => cb() for k, cb of @_listeners


# ---- Exports ---- #

# # terser constructors: turn `new Class(args...)` into `Class(args...)`
# generateConstructor = (klass) -> (args...) -> new klass args...

# module.exports =
#   Grammar: Grammar
#   Sequence: generateConstructor Sequence
#   S:
#     Literal: generateConstructor Literal
#     Hole: generateConstructor Hole
#     Regex: generateConstructor Regex
#   SyntaxTree: SyntaxTree
#   Node: Node

module.exports =
  Grammar: Grammar
  Sequence: Sequence
  S:
    Literal: Literal
    Hole: Hole
    Regex: Regex
    Variadic: VarArgs
  SyntaxTree: SyntaxTree
  Node: Node