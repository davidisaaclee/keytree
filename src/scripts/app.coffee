_ = require 'underscore'
RecursionHelper = require 'RecursionHelperService'
match = require 'util/match'
{Grammar, \
 Sequence, \
 S: {Literal, Hole, Regex}, \
 SyntaxTree, \
 Node} = require 'Syntax'

linkFlower = require '../elements/kt-flower'

window['mock'] =
  rules:
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
mock['grammar'] = new Grammar mock.rules
mock['syntaxTree'] = new SyntaxTree mock.grammar, 'NE'

numNode = new Node (mock.grammar.makeSequence 'NE', 'num-lit')
arithNode = new Node (mock.grammar.makeSequence 'NE', 'arith-op')
mock.syntaxTree.root.fillHole 'start', arithNode
mock.syntaxTree.root.holes['start'].value.fillHole 'randl', numNode

module = angular.module 'keyTree', []
  .controller 'KeyTreeController', () ->
    f = (node) ->
      node.sequence.symbols.map (symbol) ->
        match symbol,
          Literal: (literal) -> literal
          Hole: (hole) ->
            if node.holes[hole.identifier]?.value?
              (f node.holes[hole.identifier].value)
            else
              hole
    @data = f mock.syntaxTree.root

    transformData = (elm) ->
      if elm.constructor.name is 'Array'
        model: elm.map transformData
        type: 'Fill'
      else
        model: elm
        type: elm.constructor.name
        onClick: () ->
          if @type is 'Hole'
            node = new Node (@grammar.makeSequence 'NE', 'num-lit')
            # <thisNode>.fillHole @model.identifier, node
    @filteredData = @data.map transformData

    @flowerData = ['head', 'a', 'b', 'c', 'last']


    return this

# register the recursion helper
RecursionHelper module

module.directive 'ktSymbol', ['RecursionHelper', (RecursionHelper) ->
  restrict: 'E'
  templateUrl: 'elements/kt-symbol.html'
  scope:
    model: '='
  link: (scope) ->
    console.log scope.model
  compile: RecursionHelper.compile
]

module.directive 'ktFlower', ['RecursionHelper', (RecursionHelper) ->
  restrict: 'E'
  templateUrl: 'elements/kt-flower.html'
  scope:
    model: '='
  link: linkFlower
  # compile: RecursionHelper.compile
]