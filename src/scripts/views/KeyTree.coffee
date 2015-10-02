_ = require 'lodash'
ST = require 'SyntaxTree'
# TreeViewTransformer = require 'TreeViewTransformer'
{Grammar, Template, Piece, Literal, Hole, Input, Subexpression} = require 'Grammar'
match = require 'util/match'
renameProperty = require 'util/renameProperty'
ModeManager = require 'util/ModeManager'
InputUtil = require 'util/Input'
parseGrammar = (require 'parsers/grammar-new').parse
# DocumentViewController = require 'DocumentViewController'
require 'views/TextBlockView'

Polymer
  is: 'key-tree'

  ready: () ->
    ###
    @property state [Object] Holds all state for the application.
    ###
    @state =
      document:
        treeModel: null
        grammar: null

    @_setupNewDocument @state


  _setupNewDocument: (state) ->
    state.document.grammar = @loadGrammar state
    startExpr = new Subexpression 'start', 'one', [
      new Hole 'start', 'one', 'START'
    ]
    state.document.treeModel =
      startNode = new ST.ExpressionNode startExpr, 'START'

    @$.root.setModel state.document


  loadGrammar: (state) ->
    litRules =
      'START':
        'start': '<start:NE>'
      'NE':
        'num-lit': '"(num " <digits:N> ")"'
        'arith-op': '"(arith " <rator:A> "\n\t" <randl:NE> "\n\t" <randr:NE> ")"'
        'list': '"(list " <element:NE>* ")"'
        'list-lit': '"[" (<hd:NE> (", " <tl:NE>)*)? "]"'
        # 'variable': '<identifier:\\any>'
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
      state.document.grammar = new Grammar mock.rules

    do loadRulesFromTextarea
    console.log state.document.grammar
    Polymer.Gestures.add setGrammar, 'up', loadRulesFromTextarea
    Polymer.Gestures.add @$.render, 'up', (evt) =>
      console.log ST.render state.document.treeModel

    return state.document.grammar