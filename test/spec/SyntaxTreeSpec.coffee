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
  constructor: (@identifier, @quantifier, @pattern) ->
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
      .toBe 0

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