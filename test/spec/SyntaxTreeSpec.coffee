ST = require 'SyntaxTree'


class MockTemplate
  constructor: (@expression, @group) ->

class MockPiece
  constructor: (@type) ->

class MockHole extends MockPiece
  constructor: (@identifier, @quantifier, @acceptCondition) ->
    super 'hole'

class MockSubexpr extends MockPiece
  constructor: (@identifier, @quantifier, @pieces) ->
    super 'subexpression'

class MockLiteral extends MockPiece
  constructor: (@quantifier, @text) ->
    super 'literal'

class MockInput extends MockPiece
  constructor: (@identifier, @quantifier, @acceptCondition) ->
    super 'input'


describe 'Filling a syntax tree', () ->
  beforeEach () ->
    @root = new ST.HoleNode 'start', (expr) ->
      expr.group == 'START'

    @sb1 = new MockSubexpr 'subexpr1', 'one', [
      new MockLiteral 'one', '[ '
      new MockHole 'center', 'one', (exp) ->
        exp.group is 'groupA'
      new MockLiteral 'one', ' ]'
    ]

    @sb2 = new MockSubexpr 'subexpr2', 'one', [
      new MockLiteral 'one', 'fi11er'
    ]

    @sb3 = new MockSubexpr 'subexpr3', 'one', [
      new MockLiteral 'one', 'fi22er'
    ]

    @sb4 = new MockSubexpr 'subexpr4', 'one', [
      new MockLiteral 'one', 'fiBBer'
    ]

  it 'works on a basic level', () ->
    @root.fill (new MockTemplate @sb1, 'START')

    expect @root.isFilled
      .toBe true
    expect @root.expression.template
      .toBe @sb1.pieces


    expect @root.expression.instances
      .toBeDefined()
    expect @root.expression.instances.length
      .toBe 1

    # does nothing on quantifier 'one'
    @root.expression.instantiate()

    expect @root.expression.instances.length
      .toBe 1
    expect @root.expression.instances[0].template
      .toBe @root.expression.template
    expect @root.expression.instances[0].childList.length
      .toBe 3
    expect @root.expression.instances[0].literals.length
      .toBe 2
    expect Object.keys(@root.expression.instances[0].holes).length
      .toBe 1
    expect Object.keys(@root.expression.instances[0].inputs).length
      .toBe 0
    expect Object.keys(@root.expression.instances[0].expressions).length
      .toBe 0

    sb2_ = @root.expression.instances[0].holes['center'].fill (new MockTemplate @sb2, 'groupA')
    expect sb2_
      .not.toBeNull()
    expect sb2_.template
      .toBe @sb2.pieces


  it 'can reject bad fills', () ->
    result = @root.fill (new MockTemplate @sb1, 'STOAT')

    expect result
      .toBeNull()
    expect @root.isFilled
      .toBe false

    result = @root.fill (new MockTemplate @sb1, 'START')
    expect result
      .not.toBeNull()
    expect @root.isFilled
      .toBe true

    @root.expression.instantiate()
    centerHole =
      @root
        .expression
        .instances[0]
        .holes['center']
    result2 = centerHole.fill (new MockTemplate 'invalidGroup', @sb2)

    expect result2
      .toBeNull()
    expect centerHole.isFilled
      .toBe false


describe 'Quantifiers', () ->
  beforeEach () ->
    @root = new ST.HoleNode 'start', (expr) ->
      expr.group == 'START'

    @one = new MockSubexpr 'subexpr_one', 'one', [
      new MockLiteral 'one', 'david'
      new MockHole 'abyss_option', 'optional', (exp) -> true
    ]
    @option = new MockSubexpr 'subexpr_option', 'optional', [
      new MockLiteral 'optional', 'david'
      new MockHole 'abyss_kleene', 'kleene', (exp) -> true
    ]
    @kleene = new MockSubexpr 'subexpr_kleene', 'kleene', [
      new MockLiteral 'kleene', 'david'
      new MockHole 'abyss_one', 'one', (exp) -> true
    ]

    @flag = new MockSubexpr 'subexpr_flag', 'one', [
      new MockLiteral 'flag'
    ]

  it 'generally work', () ->
    # sort of tough to break this one out into multiple test cases, since
    #  all the node types sort of work together...

    @root.fill (new MockTemplate @one, 'START')

    expect @root.expression
      .toBeDefined()
    expect @root.expression
      .not.toBeNull()
    expect @root.expression.instances
      .toBeDefined()


    # inst1 = @root.expression.instantiate()
    # inst1_ = @root.expression.instances[0]
    # expect inst1
    #   .toBe inst1_
    # expect inst1
    #   .not.toBeNull()

    inst1 = @root.expression.instances[0]


    # Since this is an optional hole, it created a subexpression for itself.
    expect inst1.holes['abyss_option']
      .not.toBeDefined()

    expect inst1.expressions['abyss_option']
      .toBeDefined()

    expect inst1.expressions['abyss_option'].instances.length
      .toBe 0


    # let's check out this deeper optional hole before going back up the tree
    optionHole = inst1.expressions['abyss_option'].instantiate()
    expect inst1.expressions['abyss_option'].instances.length
      .toBe 1
    expect inst1.expressions['abyss_option'].instances[0]
      .toBe optionHole

    expect optionHole.holes['abyss_option']
      .toBeDefined()
    expect optionHole.holes['abyss_option'].isFilled
      .toBe false

    optionHole
      .holes['abyss_option']
      .fill (new MockTemplate @one, 'will-be-replaced')
    expect optionHole.holes['abyss_option'].isFilled
      .toBe true
    expect optionHole.holes['abyss_option'].expression.template
      .toBe @one.pieces

    previousFill = optionHole.holes['abyss_option'].expression

    optionHole
      .holes['abyss_option']
      .fill (new MockTemplate @flag, 'replacement')
    expect optionHole.holes['abyss_option'].isFilled
      .toBe true
    expect optionHole.holes['abyss_option'].expression.template
      .toBe @flag.pieces

    expect optionHole.childList.length
      .toBe 1
    expect optionHole.holes['abyss_option'].expression
      .not.toBe previousFill


    # now, let's try changing things up the tree
    inst2 = @root.expression.instantiate()

    expect @root.expression.childList.length
      .toBe 1
    expect inst2
      .toBeNull()
    expect inst2
      .not.toBe @root.expression.instances[0]
    expect @root.expression.instances.length
      .toBe 1

  it 'work across instances', () ->
    kleeneExpr = new MockSubexpr 'kleeneExpr', 'kleene', [
      new MockLiteral 'one', 'david'
      new MockLiteral 'kleene', 'kleene_literal'
      new MockHole 'abyss_option', 'optional', (exp) -> true
    ]

    @root.fill (new MockTemplate kleeneExpr, 'START')

    expect @root.expression.instances.length
      .toBe 0

    @root.expression.instantiate()
    @root.expression.instantiate()
    expect @root.expression.instances[0].literals.length
      .toBe 1
    expect @root.expression.instances[1].literals.length
      .toBe 1

    expect Object.keys(@root.expression.instances[0].expressions).length
      .toBe 2
    expect Object.keys(@root.expression.instances[1].expressions).length
      .toBe 2

    instances = @root.expression.instances
    kleeneLit_0 = instances[0].expressions[instances[0].orderedChildrenKeys[1]]
    abyssOpt_0 = instances[0].expressions['abyss_option']
    kleeneLit_1 = instances[1].expressions[instances[1].orderedChildrenKeys[1]]
    abyssOpt_1 = instances[1].expressions['abyss_option']

    expect kleeneLit_0
      .toBeDefined()
    expect abyssOpt_0
      .toBeDefined()
    expect kleeneLit_0.instances.length
      .toBe 0
    expect abyssOpt_0.instances.length
      .toBe 0

    expect kleeneLit_1
      .toBeDefined()
    expect abyssOpt_1
      .toBeDefined()
    expect kleeneLit_1.instances.length
      .toBe 0
    expect abyssOpt_1.instances.length
      .toBe 0

    kleeneLit_0.instantiate()
    kleeneLit_0.instantiate()
    abyssOpt_0.instantiate()

    expect kleeneLit_0.instances.length
      .toBe 2
    expect abyssOpt_0.instances.length
      .toBe 1

    expect kleeneLit_1.instances.length
      .toBe 0
    expect abyssOpt_1.instances.length
      .toBe 0

    @root.expression.instantiate()
    kleeneLit_2 =
      @root
        .expression
        .instances[2]
        .expressions[@root.expression.instances[2].orderedChildrenKeys[1]]
    abyssOpt_2 = @root.expression.instances[2].expressions['abyss_option']
    expect kleeneLit_2
      .toBeDefined()
    expect abyssOpt_2
      .toBeDefined()
    expect kleeneLit_2.instances.length
      .toBe 0
    expect abyssOpt_2.instances.length
      .toBe 0