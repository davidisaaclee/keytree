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


# holds an immutable syntactic template, with extra grammatical metadata
class Template
  ###
  @param [String] group Identifier of this template's grammatical group.
  @param [Subexpression] expression The actual syntactic template.
  ###
  constructor: (@group, @expression) ->

  display: () -> @expression.display()
    # @expression.pieces
    #   .map (sym) -> do sym.display
    #   .join ''

  templateString: () ->
    do @display

class Piece
  # type: literal | hole | subexpression
  # data: {text: <string>}
  #     | {identifier: <string>, group: <string>}
  #     | {template: <Template>}
  # quantifier: kleene | optional | one

  ## ?? is this used anywhere?
  @make: (type, data, quantifier) ->
    if not quantifier? then quantifier = 'one'
    switch type
      when 'literal' then new Literal data.text, quantifier
      when 'hole' then new Hole data.identifier, data.group, quantifier
      when 'subexpression' then new Subexpression data.template, quantifier

  display: () ->
    console.warn 'display() not overriden for this Piece:', this


class Subexpression extends Piece
  ###
  @param [String] identifier
  @param [String] quantifier
  @param [Array<Piece>] pieces
  ###
  constructor: (@identifier, @quantifier, @pieces) ->
    @type = 'subexpression'
    if not @quantifier? then @quantifier = 'one'

  display: () -> do @expression.display


class Hole extends Piece
  ###
  @param [String] identifier
  @param [String] quantifier
  @param [String] group
  ###
  constructor: (@identifier, @quantifier, @group) ->
    @type = 'hole'
    if not @quantifier? then @quantifier = 'one'

  ###
  @param [Template] template
  @return `true` if the specified Template can fill this hole.
  ###
  acceptCondition: (template) -> template.group is @group


  display: () -> "<#{@identifier}:#{@group}>"


class Literal extends Piece
  ###
  @param [String] quantifier
  @param [String] text This piece's immutable syntax text.
  ###
  constructor: (@quantifier, @text) ->
    @type = 'literal'
    if not @quantifier? then @quantifier = 'one'

  display: () -> @text


###
@param [String] identifier
@param [String] quantifier
@param [String | RegExp] pattern The regex pattern which data must match to be
  accepted by this `Input`.
###
class Input extends Piece
  constructor: (@identifier, @quantifier, @pattern) ->
    @type = 'input'
    if not @quantifier? then @quantifier = 'one'

  display: () ->
    if @data?
    then @data
    else "<#{@identifier}:#{@pattern}>"

  ###
  Returns `true` iff this input can accept the specified string as data.
  ###
  acceptCondition: (text) -> (text.match @pattern)?


module.exports =
  Grammar: Grammar
  Template: Template
  Piece: Piece
  Literal: Literal
  Hole: Hole
  Input: Input
  Subexpression: Subexpression