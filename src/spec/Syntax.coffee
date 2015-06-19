{Grammar, \
 Sequence, \
 S: {Literal, Hole, Regex}, \
 SyntaxTree, \
 Node} = require 'Syntax'




describe 'constructing phrases', () ->
  beforeEach () ->
    # @rules =
    #   'START': [ '`NE`' ]
    #   'NE': [
    #     '(num `N`)'
    #     '(arg `N`)'
    #     '(arith `A` `NE` `NE`)'
    #   ]
    #   'N': [
    #     '`REGEX [0-9]+`'
    #   ]
    #   'A': [
    #     '+'
    #     '-'
    #     '*'
    #     '/'
    #   ]

    @rules =
      'START':
        'start': Sequence [(Hole 'NE', 'expr')]
      'NE':
        'num-lit': Sequence [(Literal '(num '), (Hole 'N', 'number'), (Literal ')')]
        'arith-op': Sequence [(Literal '(arith '),
                              (Hole 'A', 'rator'),
                              (Literal ' '),
                              (Hole 'NE', 'randl'),
                              (Literal ' '),
                              (Hole 'NE', 'randr'),
                              (Literal ')')]
      'N':
        'digits': Sequence [Regex '[0-9]+']
      'A':
        '+': Sequence [Literal '+']
        '-': Sequence [Literal '-']
        '*': Sequence [Literal '*']
        '/': Sequence [Literal '/']

    @grammar = new Grammar @rules
    @syntaxTree = new SyntaxTree @grammar, 'NE'

  it 'starts with the default hole', () ->
    expect @syntaxTree.root.holes['start']?
      .toBe true
    expect @syntaxTree.root.holes['start'].group
      .toBe 'NE'

  it 'can access sequences', () ->
    expect (@grammar.makeSequence 'NE', 'num-lit')
      .toEqual (Sequence [(Literal '(num '), (Hole 'N', 'number'), (Literal ')')])

  it 'accepts simple fills', () ->
    numNode = new Node (@grammar.makeSequence 'NE', 'num-lit')
    @syntaxTree.root.fillHole 'start', numNode

    expect @syntaxTree.root.holes['start'].value?
      .toBe true
    expect @syntaxTree.root.holes['start'].value
      .toEqual numNode

  it 'accepts deep fills', () ->
    numNode = new Node (@grammar.makeSequence 'NE', 'num-lit')
    arithNode = new Node (@grammar.makeSequence 'NE', 'arith-op')

    @syntaxTree.root.fillHole 'start', arithNode
    expect @syntaxTree.root.holes['start'].value.holes['randl'].value
      .toBe null

    @syntaxTree.root.holes['start'].value.fillHole 'randl', numNode
    expect @syntaxTree.root.holes['start'].value.holes['randl'].value?
      .toBe true
    expect @syntaxTree.root.holes['start'].value.holes['randl'].value
      .toEqual numNode