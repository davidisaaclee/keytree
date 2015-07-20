_ = require 'lodash'
match = require 'util/match' # class-based pattern matching
require 'util/property' # convenience wrapper for Object.defineProperty

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

# Describes and matches a `Symbol` as a sequence of `Piece`s.
class Sequence
  constructor: (@symbols) ->
    @holes = {}
    sequenceIndex = 0
    holeIndex = 0
    _.reduce @symbols, (acc, elm) ->
      match elm,
        Variadic: ({identifier, group}) ->
          acc[identifier] =
            id: identifier
            group: group
            isVariadic: true
            sequenceIndex: sequenceIndex++
            holeIndex: holeIndex++
        Hole: ({identifier, group}) ->
          acc[identifier] =
            id: identifier
            group: group
            isVariadic: false
            sequenceIndex: sequenceIndex++
            holeIndex: holeIndex++
        else: -> sequenceIndex++

  # (defined in constructor)
  # holes: {<identifier>: {id: String,
  #                        group: String,
  #                        isVariadic: Boolean,
  #                        sequenceIndex: Integer
  #                        holeIndex: Integer}}

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
          Variadic: ({identifier, group}) -> "`#{identifier}*`"
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


class Variadic extends Hole
  display: () -> "<#{@identifier}...>"


class Regex extends Symbol
  constructor: (@pattern, @identifier) ->

  # identifier :: String
  identifier: undefined

  # pattern :: String
  pattern: undefined

  display: () -> "<#{@identifier}...>"


module.exports =
  Grammar: Grammar
  Sequence: Sequence
  S:
    Literal: Literal
    Hole: Hole
    Regex: Regex
    Variadic: Variadic