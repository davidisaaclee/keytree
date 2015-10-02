_ = require 'lodash'
TreeModel = require 'TreeModel'

###
TREE STRUCTURE

ExpressionNode: Hold a template and a way of making a set number of instances.
InstanceNode: An instance of an ExpressionNode. Can have HoleNodes,
  LiteralNodes, InputNodes, and ExpressionNodes as children, as dictated by
  its parent's template.
HoleNode: These await being filled by expressions.
LiteralNode: Holds an immutable string of text.
InputNode: Holds a accept condition for user text input, and the most recent
  input string from user.

ExpressionNode -> Array<InstanceNode>

InstanceNode -> Array<ExpressionNode>
InstanceNode -> Array<HoleNode>
InstanceNode -> Array<InputNode>
InstanceNode -> Array<LiteralNode>

HoleNode -> ExpressionNode

InputNode -> LiteralNode ? (to hold the user string)

(LiteralNode is a leaf)
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
  group: [String]

Literal ::=
  type: 'literal'
  quantifier: [String]
  text: [String]

Input ::=
  type: 'input'
  quantifier: [String]
  identifier: [String]
  acceptCondition: [Function<String, Boolean>]
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
  constructor: (expression, group) ->
    super
      identifier: expression.identifier
      pieces: expression.pieces
      quantifier: expression.quantifier
      group: group

    ###
    @property [Array<InstanceNode>] instances An ordered list of this
      `ExpressionNode`'s `InstanceNode`s.
    ###
    Object.defineProperty this, 'instances',
      get: () -> @childList

    ###
    @property [Array<Piece>] pieces The pieces of the template which all
      instances of this node should follow.
    ###
    Object.defineProperty this, 'pieces',
      get: () -> @value.pieces

    ###
    @property [String] group The group of the template, if one exists.
    ###
    Object.defineProperty this, 'group',
      get: () -> @value.group

    instanceCounter = 0
    @_instanceIndex = () -> instanceCounter++

    if @value.quantifier is 'one'
      do @instantiate

  ###
  Creates and adds an empty instance to the end of this node's list of
    instances.
  If this expression's quantifier is `'one'` or `'option'` and there already
    exists an instance, does nothing.
  @return [InstanceNode] The newly created node.
  ###
  instantiate: () ->
    key = '#' + @_instanceIndex()
    if (@value.quantifier is 'one') or (@value.quantifier is 'optional')
      if @instances.length > 0
        return null

    @addChild key, new InstanceNode @pieces, key

  ###
  Removes the instance at the given numerical index, and returns the removed
    `InstanceNode`.

  @param [Integer] index The index of the instance to destroy.
  @return [InstanceNode] The destroyed instance, or `null` if no instance at
    that index.
  ###
  destroyInstance: (index) ->
    @removeChild @orderedChildrenKeys[index]


###
An `InstanceNode` is an instantiation of an `ExpressionNode`, which offers a
  buffer in which to fill the `ExpressionNode`'s pieces.
An `ExpressionNode` can have multiple instances of itself as children. The
  allowed number of instances correlates with the `ExpressionNode`'s quantifier.
The `value` field of this node holds a reference to the parent
  `ExpressionNode`'s pieces.
###
class InstanceNode extends TreeModel
  ###
  @param [Array<Piece>] pieces
  ###
  constructor: (pieces, instanceIdentifier) ->
    super {pieces: pieces, identifier: instanceIdentifier}

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
    @property [Subexpression] pieces A reference to the parent's template pieces.
    ###
    Object.defineProperty this, 'pieces',
      get: () -> @value.pieces

    # Populate this node's children with the template's information.
    holeCounter = 0
    expressionCounter = 0
    literalCounter = 0

    @pieces
      .forEach (piece) =>
        wrapInExpression = (pc) ->
          r = new ExpressionNode
            type: 'subexpression'
            identifier: pc.identifier
            quantifier: pc.quantifier
            pieces: [_.extend (_.clone pc), quantifier: 'one']
        switch piece.quantifier
          when 'one'
            switch piece.type
              when 'subexpression'
                @addChild \
                  "#{piece.identifier}",
                  new ExpressionNode piece
              when 'hole'
                @addChild \
                  "#{piece.identifier}",
                  new HoleNode piece.identifier, piece.group, piece.acceptCondition
              when 'literal'
                @addChild \
                  "@#{literalCounter++}",
                  new LiteralNode piece.text
              when 'input'
                @addChild \
                  "#{piece.identifier}",
                  new InputNode piece.identifier, piece.acceptCondition, piece.pattern
          when 'optional', 'kleene'
            switch piece.type
              when 'subexpression'
                @addChild \
                  "#{piece.identifier}",
                  new ExpressionNode piece
              when 'hole'
                @addChild \
                  "#{piece.identifier}",
                  wrapInExpression piece, piece.quantifier
              when 'input'
                @addChild \
                  "#{piece.identifier}",
                  wrapInExpression piece, piece.quantifier
              when 'literal'
                @addChild \
                  "@#{literalCounter++}",
                  wrapInExpression piece, piece.quantifier


###
A `HoleNode` represents a figurative "hole" in the source code which awaits
  being "filled" by an expression.
The `value` field of this node holds a predicate to determine which expressions
  are eligible to fill this hole.
###
class HoleNode extends TreeModel
  ###
  @param [String] identifier
  @param [String] group The identifier of the grammatical group which
    this hole can accept.
  @param [Function<Template, Boolean>] acceptCondition Returns `true`
    if this hole can accept the specified template.
  ###
  constructor: (identifier, group, acceptCondition) ->
    if not acceptCondition?
      acceptCondition = (template) -> template.group is group

    super
      identifier: identifier
      group: group
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
    @property [String] group The identifier of the grammatical group which this
    hole can accept.
    ###
    Object.defineProperty this, 'group',
      get: () -> @value.group

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
  @param [ExpressionNode] node The node with which to fill this hole.
  @return [ExpressionNode] The same expression node supplied and used to fill
    this hole, or `null` if unsuccessful fill.
  ###
  fillWithNode: (node) ->
    # TODO: how to deal with acceptCondition without including Grammar.Template here?
    outerTemplate =
      group: node.group
    if @acceptCondition outerTemplate
      @setChild \
        'expression',
        node
    else
      null


###
Represents a block of immutable text.

PENDING: The user should have control over all syntax. What is the best way to
  allow editing of literals?
###
class LiteralNode extends TreeModel
  constructor: (text) ->
    super text: text

    ###
    @property text [String] The syntactical text which this node represents.
    ###
    Object.defineProperty this, 'text',
      get: () -> @value.text


###
Represents a point where the user must input a string: identifiers, numbers,
  string literals, etc.
###
class InputNode extends TreeModel
  ###
  Constructs an `InputNode` with the piece's grammatical identifier, an accept
    condition for its data (user text), and, optionally, an initial data value.

  @param [String] identifier The piece's identifier within its template.
  @param [Function<String, Boolean>] acceptCondition Returns `true` if this
    input can accept the specified data.
  @param [String] display A string to display when not filled.
  @param [String] data The initial data value.
  ###
  constructor: (identifier, acceptCondition, display, data = null) ->
    super
      identifier: identifier
      display: display
      acceptCondition: acceptCondition
      data: data

    ###
    @property acceptCondition [Function<String, Boolean>] Returns `true` if this
      input can accept the specified data.
    ###
    Object.defineProperty this, 'acceptCondition',
      get: () -> @value.acceptCondition

    ###
    @property data [String] The user-input data value.
    ###
    Object.defineProperty this, 'data',
      get: () -> @value.data
      set: (text) -> @value.data = text

    ###
    @property display [String] A string to display when not filled.
    ###
    Object.defineProperty this, 'display',
      get: () -> @value.display

###
Renders a node into the corresponding source code.
###
render = (node) ->
  switch node.constructor.name
    when 'ExpressionNode'
      node.instances.reduce ((acc, elm) -> acc += render elm), ''
    when 'InstanceNode'
      node.childList.reduce ((acc, elm) -> acc += render elm), ''
    when 'HoleNode'
      if node.isFilled
      then render node.expression
      else "<#{node.value.identifier}>"
    when 'LiteralNode'
      node.text
    when 'InputNode'
      if node.data?
      then node.data
      else "<#{node.display}>"

###
Flattens a node into a set of tagged pieces, organized into lines.

Line ::=
  tabstops: [Integer]
  pieces: [Piece]

Piece ::= TextPiece
        | HolePiece
        | (...)

TextPiece ::=
  type: 'text'
  tags: [Array<String>]
  node: [LiteralNode]
  holeContext: [HoleNode]
  display: [String]

HolePiece ::=
  type: 'hole'
  tags: [Array<String>]
  node: [HoleNode]
  group: [String]
  display: [String]

InputPiece ::=
  type: 'input'
  tags: [Array<String>]
  node: [InputNode]
  pattern: [String]
  display: [String]

ActionPiece ::=
  type: 'action'
  action: [Function]

@return [Array<Line>]
###
flatten = (node) ->
  initialContext = node
  while initialContext? and initialContext.constructor.name isnt 'HoleNode'
    initialContext = initialContext.parent

  do helper = (node, \
               holeContext = initialContext, \
               contextIndents = 0, \
               path = [node.value.identifier], \
               lines = [{tabstops: 0, pieces: []}]) ->
    lastLine = lines[lines.length - 1]

    switch node.constructor.name
      when 'ExpressionNode'
        lines = node.instances.reduce ((linesAcc, elm) ->
          helper \
            elm,
            holeContext,
            contextIndents,
            [path..., node.value.identifier],
            linesAcc),
          lines

        needsInstantiateButton = node.value.quantifier is 'kleene'
        needsInstantiateButton ||= (node.value.quantifier is 'optional') and
                                   (node.instances.length is 0)
        if needsInstantiateButton
          lines[lines.length - 1].pieces.push
            type: 'action'
            action: () ->
              node.instantiate()
            tags: path

        return lines

      when 'InstanceNode'
        return node.childList.reduce ((linesAcc, elm) ->
          helper \
            elm,
            holeContext,
            contextIndents,
            [path..., node.value.identifier],
            linesAcc),
          lines

      when 'HoleNode'
        if node.isFilled
          helper \
            node.expression,
            node,
            lines[lines.length - 1].tabstops,
            [path..., node.value.identifier],
            lines
        else
          lastLine.pieces.push
            type: 'hole'
            tags: [path..., node.value.identifier]
            node: node
            group: node.value.group
            display: node.value.identifier
          return lines

      when 'LiteralNode'
        node.text.split '\n'
          .map (ln) ->
            [original, leadingTabs, tail] = /^(\t*)(.*)/.exec ln

            tabstops: leadingTabs.length
            text: tail
          .forEach (ln, lnIdx) ->
            if lnIdx isnt 0
              lines.push
                tabstops: contextIndents
                pieces: []

            lines[lines.length - 1].tabstops += ln.tabstops
            if ln.text.length > 0
              lines[lines.length - 1].pieces.push
                type: 'text'
                tags: path
                holeContext: holeContext
                node: node
                display: ln.text
        return lines

      when 'InputNode'
        lines[lines.length - 1].pieces.push
          type: 'input'
          tags: [path..., node.value.identifier]
          node: node
          pattern: node.value.pattern
          data: node.value.data
        return lines

module.exports =
  ExpressionNode: ExpressionNode
  InstanceNode: InstanceNode
  HoleNode: HoleNode
  LiteralNode: LiteralNode
  InputNode: InputNode
  render: render
  flatten: flatten