match = require 'util/match'

# ---- MODEL ---- #

# The grammar of a single language.
class Grammar
  constructor: (@productions) ->

  # productions :: { <identifier> :: Production }
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


# A single element of a `Sequence`.
class Symbol


# An unchanging string literal; a terminal.
class Literal extends Symbol
  constructor: (@text) ->

  # text :: String
  text: undefined


# A hole to be filled; annotated with a valid group identifier for filling; a nonterminal.
class Hole extends Symbol
  constructor: (@group, @identifier) ->

  # the identifier of the group this hole wants
  # group :: String
  group: undefined

  # the identifier of this hole
  # identifier :: String
  identifier: undefined


class Regex extends Symbol
  constructor: (@pattern) ->

  # pattern :: String
  pattern: undefined


# ---- INSTANCE ---- #

# Represents a syntax tree, containing all information necessary to render the text.
class SyntaxTree
  constructor: (@grammar, startGroup) ->
    @root = new Node (new Sequence [new Hole startGroup, 'start'])

  # root :: Node
  root: undefined

  # grammar :: Grammar
  grammar: undefined


# Represents a node in a `SyntaxTree`, containing the ability to render itself and its children.
class Node
  constructor: (@sequence) ->
    @holes = {}
    @sequence.symbols.forEach (sym, index) =>
      if sym.constructor.name is 'Hole'
        @holes[sym.identifier] = {group: sym.group, index: index, value: null}

  # sequence :: Sequence
  sequence: undefined

  # holes :: { <identifier>: { group :: String, index :: Integer, value :: Node } }
  holes: undefined

  # fillHole :: String -> Node -> Node
  fillHole: (holeId, fillWith) ->
    hole = @holes[holeId]
    if hole?
      hole.value = fillWith
    @

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

  # navigate :: Path -> Node
  navigate: (path) -> # TODO


# ---- Exports ---- #

# terser constructors: turn `new Class(args...)` into `Class(args...)`
generateConstructor = (klass) -> (args...) -> new klass args...

module.exports =
  Grammar: Grammar
  Sequence: generateConstructor Sequence
  S:
    Literal: generateConstructor Literal
    Hole: generateConstructor Hole
    Regex: generateConstructor Regex
  SyntaxTree: SyntaxTree
  Node: Node