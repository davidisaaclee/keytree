_ = require 'lodash'
match = require 'util/match' # class-based pattern matching
require 'util/property' # convenience wrapper for Object.defineProperty

# The grammar of a single language.
class Grammar
  constructor: (@productions) ->

  # productions :: { [<group> : { [<production id> : Expression] }] }
  productions: undefined

  # makeExpression :: String -> String -> {} -> Expression
  makeExpression: (groupId, productionId, data) ->
    if data?
    then @productions[groupId]?[productionId].withData data
    else @productions[groupId]?[productionId]


# sequence of pieces, with extra grammatical metadata
class Template
  constructor: (@pieces) ->

  display: () ->
    @pieces
      .map (sym) -> do sym.display
      .join ''

  templateString: () ->
    do @display

class Piece
  # type: literal | hole | subexpression
  # data: {text: <string>}
  #     | {identifier: <string>, group: <string>}
  #     | {template: <Template>}
  # quantifier: kleene | optional | one
  @make: (type, data, quantifier) ->
    if not quantifier? then quantifier = 'one'
    switch type
      when 'literal' then new Literal data.text, quantifier
      when 'hole' then new Hole data.identifier, data.group, quantifier
      when 'subexpression' then new Subexpression data.template, quantifier

  display: () ->
    console.warn 'display() not overriden for this Piece:', this

class Literal extends Piece
  constructor: (@text, @quantifier) ->
    @type = 'literal'
    if not @quantifier? then @quantifier = 'one'

  display: () -> @text

class Hole extends Piece
  constructor: (@identifier, @group, @quantifier) ->
    @type = 'hole'
    if not @quantifier? then @quantifier = 'one'

  display: () -> "<#{@identifier}:#{@group}>"

class Input extends Piece
  constructor: (@identifier, @pattern, @quantifier, @data = null) ->
    @type = 'input'
    if not @quantifier? then @quantifier = 'one'

  display: () ->
    if @data?
    then @data
    else "<#{@identifier}:#{@pattern}>"

  ###
  Creates a new `Input` piece with the supplied data.
  ###
  withData: (data) -> new Input @identifier, @pattern, @quantifier, data

class Subexpression extends Piece
  ###
  @param [Template] template This subexpression's template.
  @param [String] quantifier
  @param [String] identifier
  ###
  constructor: (@template, @quantifier, @identifier) ->
    @type = 'subexpression'
    if not @quantifier? then @quantifier = 'one'

  display: () -> do @expression.display


module.exports =
  Grammar: Grammar
  Expression: Expression
  Piece: Piece
  Literal: Literal
  Hole: Hole
  Input: Input
  Subexpression: Subexpression