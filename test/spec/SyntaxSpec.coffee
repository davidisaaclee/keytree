_ = require 'lodash'
{SyntaxTree, Node} = require 'Syntax'
{Expression, Grammar, Piece, Literal, Hole, Subexpression} = require 'Grammar'
parseGrammar = (require 'parsers/grammar-new').parse

describe 'syntax trees', () ->
  beforeEach () ->
    litRules =
      'START':
        'start': '<start:NE>'
      'NE':
        'num-lit': '"(num " <digits:N> ")"'
        'arith-op': '"(arith " <rator:A> "\n\t" <randl:NE> "\n\t" <randr:NE> ")"'
        'list': '"(list " <element:NE>* ")"'
        'list-lit': '"[" (<hd:NE> (", " <tl:NE>)*)? "]"'
        'subexpr-fun': '(<outerHole:NE>* (<innerHole:NE>*)*)*'
      'N':
        'digits': '"digit placeholder"'
      'A':
        '+': '"+"'
        '-': '"-"'
        '*': '"*"'
        '/': '"/"'
    @rules =
      _.mapValues litRules, (vo) ->
        _.mapValues vo, (vi) ->
          parseHelper = ({type, value, id, quantifier}) ->
            switch type
              when 'expression'
                new Expression value.map parseHelper
              when 'literal'
                new Literal value, quantifier
              when 'hole'
                new Hole id, value, quantifier
              when 'subexpression'
                # new Subexpression (parseHelper value), quantifier, id
                new Subexpression (new Expression value.map parseHelper), quantifier, id
          parseHelper parseGrammar vi
    @grammar = new Grammar @rules
    @tree = new SyntaxTree @grammar, 'NE'

    @pathElm = (type, id, index) ->
      r = type: type, identifier: id
      if index?
      then _.extend r, index: index
      else r
    @instIdPathForNode = (node) ->
      if node.parent?.instanceId?
      then [(@instIdPathForNode node.parent)..., node.instanceId]
      else [node.instanceId]

  it 'can create lit nodes', () ->
    addNode =
      new Node null, 'faux-+', @grammar.makeExpression 'A', '+'

    expect _.size addNode.childrenMap
      .toBe 0

  it 'can create holed nodes', () ->
    numNode = Node.makeRoot @grammar.makeExpression 'NE', 'num-lit'
    expect _.size numNode.childrenMap
      .toBe 1

  it 'can create subexprd nodes', () ->
    listLitNode =
      new Node null, 'faux-ll', @grammar.makeExpression 'NE', 'list-lit'
    expect _.size listLitNode.childrenMap
      .toBe 0

  it 'can create holed nodes', () ->
    subexprNode =
      new Node null, 'faux-sbf', @grammar.makeExpression 'NE', 'subexpr-fun'
    expect _.size subexprNode.childrenMap
      .toBe 0

  it 'expects root fill', () ->
    expect @tree.root
      .not.toBeNull()
    expect @tree.root.isFilled
      .toBe false
    expect @tree.root.template
      .toBeNull()

  it 'can fill root', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.root.isFilled
      .toBe true
    expect @tree.root.template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')

  it 'can navigateExpression', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'num-lit')

    pathToStart = [
      @pathElm 'hole', 'start', 0
    ]
    expect @tree.navigateExpression pathToStart
      .toBe @tree.root

    pathToDigits = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'digits', 0
    ]
    expect (@tree.navigateExpression pathToDigits)
      .toBeDefined()
    expect (@tree.navigateExpression pathToDigits).parent
      .toBe @tree.root

    pathToUndefined = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'not a real id', 0
    ]
    expect (@tree.navigateExpression pathToUndefined)
      .toBeUndefined()

  it 'can navigate to information', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'num-lit')

    pathToStartInfo = [
      @pathElm 'hole', 'start'
    ]
    startInfo = @tree.navigateExpression pathToStartInfo
    expect startInfo
      .toBeDefined()
    expect startInfo.instances.length
      .toBe 1
    expect startInfo.instances[0]
      .toBe @tree.root

    pathToDigitsInfo = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'digits'
    ]
    digitsInfo = @tree.navigateExpression pathToDigitsInfo
    expect digitsInfo
      .toBeDefined()
    expect digitsInfo.instances.length
      .toBe 1
    expect digitsInfo.node()
      .toBe digitsInfo.instances[0]
    expect digitsInfo.node().parent
      .toBe @tree.root
    expect digitsInfo.node().isFilled
      .toBe false

  it 'can navigate from intermediate', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'num-lit')

    pathToDigits1 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'digits', 0
    ]
    pathToDigits2 = [
      @pathElm 'hole', 'digits', 0
    ]

    digits1 = @tree.navigateExpression pathToDigits1
    digits2 = @tree.root.navigateExpression pathToDigits2

    expect digits1
      .toBe digits2

  it 'can deep fill (simple)', () ->
    @tree.root
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    path1 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randr', 0
    ]
    expect @tree.navigateExpression(path1)
      .toBeDefined()
    @tree.navigateExpression path1
      .fill (@grammar.makeExpression 'NE', 'arith-op')

    path2 = [
      @pathElm 'hole', 'randr', 0
    ]
    path3 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'undefined', 0
    ]
    expect @tree.navigateExpression path2
      .toBeUndefined()
    expect @tree.navigateExpression path1
      .not.toBeUndefined()
    expect @tree.navigateExpression(path1).template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')
    expect @tree.navigateExpression path3
      .toBeUndefined()

    expect @tree.root.children().length
      .toBe 3
    expect @tree.navigateExpression(path1).children().length
      .toBe 3
    path4 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randl', 0
    ]
    expect @tree.navigateExpression(path4).children().length
      .toBe 0

  it 'can deep fill', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'arith-op')

    path1 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randr', 0
    ]
    @tree.navigateExpression path1
      .fill (@grammar.makeExpression 'NE', 'arith-op')

    expect @tree.navigateExpression(path1).template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')

    path2 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randr', 0
      @pathElm 'hole', 'randr', 0
    ]
    @tree.navigateExpression path2
      .fill (@grammar.makeExpression 'NE', 'arith-op')

    path3 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randr', 0
      @pathElm 'hole', 'randr', 0
      @pathElm 'hole', 'randl', 0
    ]
    @tree.navigateExpression path3
      .fill (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.navigateExpression(path3).template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')

    path4 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randr', 0
      @pathElm 'hole', 'randl', 0
    ]
    expect @tree.navigateExpression(path4).template
      .toBeNull()

    path5 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'randl', 0
    ]
    expect @tree.navigateExpression(path5).template
      .toBeNull()


  it 'can fill quantified holes', () ->
    # 'list': '"(list " <element:NE>* ")"'
    @tree.root.fill (@grammar.makeExpression 'NE', 'list')
    path1 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'element'
    ]
    @tree.navigateExpression(path1).pushEmpty()

    elementPath = (n) => [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'element', n
    ]
    @tree.navigateExpression elementPath 0
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    @tree.navigateExpression(path1).pushEmpty()
    @tree.navigateExpression elementPath 1
      .fill (@grammar.makeExpression 'NE', 'num-lit')

    expect @tree.navigateExpression(path1).instances.length
      .toBe 2
    expect @tree.root.children().length
      .toBe 2
    expect @tree.root.children()[0].template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')
    expect @tree.root.children()[1].template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')

    @tree.navigateExpression(path1).pushEmpty()
    expect @tree.navigateExpression(path1).instances.length
      .toBe 3


  it 'can fill quantified holes via instance id', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'list')
    elementInfoPath = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'element'
    ]
    elementInfo = @tree.navigateExpression elementInfoPath
    newNode1 = do elementInfo.pushEmpty
    idPath1 = @instIdPathForNode newNode1
    expect @tree.navigate idPath1
      .toBe newNode1

    newNode2 = do elementInfo.pushEmpty
    idPath2 = @instIdPathForNode newNode2
    expect @tree.navigate idPath2
      .toBe newNode2

    @tree.navigate idPath1
      .fill (@grammar.makeExpression 'NE', 'num-lit')
    @tree.navigate idPath2
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    expect @tree.root.children()[0].template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.root.children()[1].template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')

  it 'can fill quantified subexpressions', () ->
    # list-lit: "[" (<hd:NE> (", " <tl:NE>)*)? "]"
    @tree.root.fill (@grammar.makeExpression 'NE', 'list-lit')

    pathToHdSubexpr = [
      @pathElm 'hole', 'start', 0
      @pathElm 'subexpression', 0
    ]
    pathToHd = [
      @pathElm 'hole', 'start', 0
      @pathElm 'subexpression', 0, 0
      @pathElm 'hole', 'hd', 0
    ]
    expect @tree.navigateExpression pathToHd
      .toBeUndefined()
    do @tree.navigateExpression(pathToHdSubexpr).pushEmpty
    expect @tree.navigateExpression pathToHd
      .toBeDefined()

    @tree.navigateExpression pathToHd
      .fill (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.navigateExpression(pathToHd).template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')

    pathToTlSubexpr = [
      @pathElm 'hole', 'start', 0
      @pathElm 'subexpression', 0, 0
      @pathElm 'subexpression', 0
    ]
    pathToTl = (n) => [
      @pathElm 'hole', 'start', 0
      @pathElm 'subexpression', 0, 0
      @pathElm 'subexpression', 0, n
      @pathElm 'hole', 'tl', 0
    ]
    do @tree.navigateExpression(pathToTlSubexpr).pushEmpty
    tlNode1 = @tree.navigateExpression pathToTl 0
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    expect @tree.navigate(@instIdPathForNode tlNode1).template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')

    pathToRandl = [(pathToTl 0)..., (@pathElm 'hole', 'randl', 0)]
    randlNode = @tree.navigateExpression pathToRandl
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    expect @tree.navigate(@instIdPathForNode randlNode).template
      .toEqual (@grammar.makeExpression 'NE', 'arith-op')

    do @tree.navigateExpression(pathToTlSubexpr).pushEmpty
    @tree.navigateExpression (pathToTl 1)
      .fill (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.navigateExpression(pathToTl 1).template
      .toEqual (@grammar.makeExpression 'NE', 'num-lit')
    expect @tree.navigateExpression(pathToTl 2)
      .toBeUndefined()
    do @tree.navigateExpression(pathToTlSubexpr).pushEmpty
    expect @tree.navigateExpression(pathToTl 2)
      .toBeDefined()
    expect @tree.navigateExpression(pathToTl 2).isFilled
      .toBe false


  it 'can flatten nodes', () ->
    @tree.root.fill (@grammar.makeExpression 'NE', 'list')
    path1 = [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'element'
    ]
    @tree.navigateExpression(path1).pushEmpty()

    elementPath = (n) => [
      @pathElm 'hole', 'start', 0
      @pathElm 'hole', 'element', n
    ]
    @tree.navigateExpression elementPath 0
      .fill (@grammar.makeExpression 'NE', 'arith-op')
    @tree.navigateExpression(path1).pushEmpty()
    @tree.navigateExpression elementPath 1
      .fill (@grammar.makeExpression 'NE', 'num-lit')

    flattened = do @tree.root.flatten
    expect flattened[0].type
      .toBe 'literal'
    expect flattened[1].type
      .toBe 'hole'
    expect flattened[1].isFilled
      .toBe true
    expect flattened[1].value[0].type
      .toBe 'literal'
    expect flattened[1].value[0].value
      .toBe '(arith '
    expect flattened[1].value.length
      .toBe 7