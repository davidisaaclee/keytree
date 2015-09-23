_ = require 'lodash'
ST = require 'SyntaxTree'
TreeViewTransformer = require 'TreeViewTransformer'
{Grammar, Template, Piece, Literal, Hole, Input, Subexpression} = require 'Grammar'
match = require 'util/match'
renameProperty = require 'util/renameProperty'
ModeManager = require 'util/ModeManager'
InputUtil = require 'util/Input'
parseGrammar = (require 'parsers/grammar-new').parse

Polymer
  is: 'key-tree'

  ready: () ->
    @_setup()

  _setup: () ->
    @$.tree.insertionPointSelector = '.children'

    @root = new ST.HoleNode 'start', 'START'
    sb1 = new Subexpression 'subexpr1', 'one', [
      new Literal 'one', '(arith\n\t'
      new Hole 'arg1', 'one', 'NE'
      new Literal 'one', '\n\t'
      new Hole 'arg2', 'one', 'NE'
      new Literal 'one', ')'
    ]
    @root.fill (new Template 'START', sb1)
    # x.instantiate()
    # @root.expression.instances[0].holes['center'].fill (new Template 'groupA', sb1)

    @loadGrammar()

    @transformer = new TreeViewTransformer @grammar
    @transformer.subscribe (transformed, original) =>
      @$.tree.update transformed
    @transformer.watch @root


  loadGrammar: () ->
    litRules =
      'START':
        'start': '<start:NE>'
      'NE':
        'num-lit': '"(num " <digits:N> ")"'
        'arith-op': '"(arith " <rator:A> "\n\t" <randl:NE> "\n\t" <randr:NE> ")"'
        'list': '"(list " <element:NE>* ")"'
        'list-lit': '"[" (<hd:NE> (", " <tl:NE>)*)? "]"'
        'variable': '<identifier:\\any>'
      'N':
        # 'digits': '"digit placeholder"'
        'digits': '<digits:\\numbers>'
      'A':
        'add': '"+"'
        'subtract': '"-"'
        'multiply': '"*"'
        'divide': '"/"'

    grammarText = @querySelector '#grammarText'
    setGrammar = @querySelector '#setGrammar'

    grammarText.value = JSON.stringify litRules, null, 2

    loadRulesFromTextarea = () =>
      rulesText = JSON.parse grammarText.value
      mock = {}
      mock.rules =
        _.mapValues rulesText, (vo, group) ->
          _.mapValues vo, (vi, key) ->
            parseHelper = ({type, id, quantifier, value}) ->
              switch type
                when 'expression'
                  expr = new Subexpression key, 'one', (value.map parseHelper)
                  new Template group, expr
                when 'literal'
                  new Literal quantifier, value
                when 'hole'
                  new Hole id, quantifier, value
                when 'input'
                  new Input id, quantifier, value
                when 'subexpression'
                  new Subexpression id, quantifier, (value.map parseHelper)
            parseHelper parseGrammar vi
      @grammar = new Grammar mock.rules

    do loadRulesFromTextarea
    Polymer.Gestures.add setGrammar, 'up', loadRulesFromTextarea
    Polymer.Gestures.add @$.render, 'up', (evt) =>
      console.log ST.flatten @root
