TreeModel = require 'TreeModel'


###
TREE STRUCTURE

HoleNode -> ExpressionNode

ExpressionNode -> Array<InstanceNode>

InstanceNode -> Array<ExpressionNode>
InstanceNode -> Array<HoleNode>
InstanceNode -> Array<InputNode>
InstanceNode -> Array<LiteralNode>

InputNode -> LiteralNode ? (to hold the user string)
###

###
Template ::=
  group: [String]
  expression: [Subexpression]

Piece ::= [Subexpression]
        | [Hole]
        | [Literal]
        | [Input]

Subexpression ::=
  type: 'subexpression'
  quantifier: [String]
  identifier: [String]
  pieces: [Array<Piece>]

Hole ::=
  type: 'hole'
  quantifier: [String]
  identifier: [String]
  acceptCondition: [Function<Template, Boolean>]

Literal ::=
  type: 'literal'
  quantifier: [String]
  text: [String]

Input ::=
  type: 'input'
  quantifier: [String]
  identifier: [String]
  pattern: [String]
###


###
An `ExpressionNode` represents a template of grammatical pieces. This template
  is instantiated one or more times into `InstanceNode`s.
  For an `ExpressionNode` to be represented in the output source, it must have at
  least one `InstanceNode`.

The `value` field of this node holds this expression's template.
###
class ExpressionNode extends TreeModel

  ###
  Constructs an `ExpressionNode`, given the expression template.

  @param [Subexpression] expression The expression model.
  ###
  constructor: (expression) ->
    super
      identifier: expression.identifier
      template: expression.pieces

    ###
    @property [Array<InstanceNode>] instances An ordered list of this
      `ExpressionNode`'s `InstanceNode`s.
    ###
    Object.defineProperty this, 'instances',
      get: () -> @childList

    ###
    @property [Array<Piece>] template The template which all instances of this
      node should follow.
    ###
    Object.defineProperty this, 'template',
      get: () -> @value.template

    instanceCounter = 0
    @_instanceIndex = () -> instanceCounter++

  ###
  Creates and adds an empty instance to the end of this node's list of
    instances.
  @return [InstanceNode] The newly created node.
  ###
  instantiate: () ->
    key = '#' + @_instanceIndex()
    @addChild key, new InstanceNode @template


###
An `InstanceNode` is an instantiation of an `ExpressionNode`, which offers a
  buffer in which to fill the `ExpressionNode`'s template.
The `value` field of this node holds a reference to the parent
  `ExpressionNode`'s template.
###
class InstanceNode extends TreeModel
  ###
  @param [Array<Piece>] template
  ###
  constructor: (template) ->
    super template: template

    ###
    @property [Map<String, HoleNode>] holes A mapping of hole IDs to their nodes.
    ###
    Object.defineProperty this, 'holes',
      get: () ->
        @childList
          .filter (elm) ->
            elm.constructor.name is 'HoleNode'
          .reduce ((acc, elm) ->
            acc[elm.value.identifier] = elm
            return acc), {}

    ###
    @property [Map<String, ExpressionNode>] expressions A mapping of expression
      IDs to their nodes.
    ###
    Object.defineProperty this, 'expressions',
      get: () ->
        @childList
          .filter (elm) ->
            elm.constructor.name is 'ExpressionNode'
          .reduce ((acc, elm) ->
            acc[elm.key] = elm
            return acc), {}

    ###
    @property [Map<String, InputNode>] inputs A mapping of input IDs to their
      nodes.
    ###
    Object.defineProperty this, 'inputs',
      get: () ->
        @childList
          .filter (elm) ->
            elm.constructor.name is 'InputNode'
          .reduce ((acc, elm) ->
            acc[elm.value.identifier] = elm
            return acc), {}

    ###
    @property [Array<LiteralNode>] literals An ordered list of this node's
      template's literals.
    ###
    Object.defineProperty this, 'literals',
      get: () ->
        @childList.filter (elm) ->
          elm.constructor.name is 'LiteralNode'

    ###
    @property [Subexpression] template A reference to the parent's template.
    ###
    Object.defineProperty this, 'template',
      get: () -> @value.template

    # Populate this node's children with the template's information.
    holeCounter = 0
    expressionCounter = 0
    literalCounter = 0

    @template
      .forEach (piece) => switch piece.type
      # TODO: wrap these in ExpressionNodes according to quantifiers
        when 'hole'
          # console.log 'adding hole'
          @addChild \
            ".#{piece.identifier}",
            new HoleNode piece.identifier, piece.acceptCondition
        when 'subexpression'
          # console.log 'adding subexpr'
          @addChild \
            "@#{piece.identifier}",
            new ExpressionNode piece
        when 'literal'
          console.log 'adding literal; todo'
          @addChild "$#{literalCounter++}", new LiteralNode piece.text
        when 'input' # ?
          console.log 'adding input; todo'
          @addChild \
            "|#{piece.identifier}",
            new InputNode input.identifier, input.pattern




###
A `HoleNode` represents a figurative "hole" in the source code which awaits
  being "filled" by an expression.
The `value` field of this node holds a predicate to determine which expressions
  are eligible to fill this hole.
###
class HoleNode extends TreeModel
  ###
  @param [Function<Template, Boolean>] acceptCondition Returns `true`
    if this hole can accept the specified template.
  ###
  constructor: (identifier, acceptCondition = (-> false)) ->
    super
      identifier: identifier
      acceptCondition: acceptCondition

    ###
    @property [ExpressionNode] expression The `ExpressionNode` which is filling
      this hole; if not filled, this is `null`.
    ###
    Object.defineProperty this, 'expression',
      get: () -> @getChild 'expression'

    ###
    @property [Boolean] isFilled `true` if this hole is filled with an
      expression, else `false.
    ###
    Object.defineProperty this, 'isFilled',
      get: () -> (@getChild 'expression')?

    ###
    @property [Function<Template, Boolean>] acceptCondition Returns
      `true` if this hole can accept the specified template.
    ###
    Object.defineProperty this, 'acceptCondition',
      get: () -> @value.acceptCondition

  ###
  @param [Template] template The subexpression with which to fill this hole.
  @return [ExpressionNode] The expression node created and used to fill this
    hole, or `null` if unsuccessful fill.
  ###
  fill: (template) ->
    if @acceptCondition template
      @setChild \
        'expression',
        new ExpressionNode template.expression
    else null


###
TODO
###
class LiteralNode extends TreeModel

###
TODO
###
class InputNode extends TreeModel



module.exports =
  ExpressionNode: ExpressionNode
  InstanceNode: InstanceNode
  HoleNode: HoleNode
  LiteralNode: LiteralNode
  InputNode: InputNode