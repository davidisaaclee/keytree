match = require 'util/match'

# ---- MODEL ---- #

# The grammar of a single language.
class Grammar
  constructor: (@productions) ->

  # productions :: { [<identifier> : { [<identifier> : Sequence] }] }
  productions: undefined

  # makeSequence :: String -> String -> Sequence
  makeSequence: (groupId, sequenceId) ->
    @productions[groupId]?[sequenceId]


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
          Hole: ({identifier, group}) -> "`#{identifier}`"
          Regex: ({pattern}) -> pattern
      .join ''


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

  display: () -> "&lt;#{@identifier}&gt;"


class VarArgs extends Hole


class Regex extends Symbol
  constructor: (@pattern) ->

  # pattern :: String
  pattern: undefined

  display: () -> "&lt;\\#{@pattern}&gt;"


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

  _notifyChanged: () => cb() for _, cb of @_listeners


# Represents a node in a `SyntaxTree`, containing the ability to render itself and its children.
class Node
  constructor: (@sequence, parent) ->
    @holes = {}
    @_listeners = {}

    if parent?._notifyChanged?
      @notifyChanged parent._notifyChanged

    holeIndex = 0
    notify = @_notifyChanged
    @sequence.symbols.forEach (sym, index) =>
      match sym,
        Hole: (hole) =>
          @holes[hole.identifier] =
            id: hole.identifier
            group: hole.group
            index: index
            holeIndex: holeIndex++
            value: null
            fill: (withNode) ->
              @value = withNode
              withNode.notifyChanged notify
              do notify
        VarArgs: (varargs) =>
          

  # sequence :: Sequence
  sequence: undefined

  # holes :: {
  #   <identifier>: {
  #     id :: String,
  #     group :: String,
  #     index :: Integer,
  #     holeIndex :: Integer,
  #     value :: Node,
  #     fill :: Node -> () } }
  holes: undefined


  # Renders this node into text, recurring on its children.
  # render :: Unit -> String
  render: () ->
    @sequence.symbols
      .map (symbol) =>
        match symbol,
          Literal: ({text}) => text
          Hole: ({identifier, group}) =>
            if @holes[identifier].value?
            then @holes[identifier].value.render()
            else ('`' + group + '`')
      .join ""


  getNthChild: (index) ->
    for key in Object.keys @holes
      if @holes[key].holeIndex is index
      then return @holes[key]
    return null


  getChild: (id) ->
    return @holes[id]


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

  _notifyChanged: () => cb() for _, cb of @_listeners


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
  SyntaxTree: SyntaxTree
  Node: Node