{Template} = require 'Grammar'
TreeTransformer = require 'TreeTransformer'
TreeModel = require 'TreeModel'
HoleView = require 'views/HoleView'
ExpressionView = require 'views/ExpressionView'
LiteralView = require 'views/LiteralView'
InstanceView = require 'views/InstanceView'
InputView = require 'views/InputView'


class NodeView
  constructor: (text) ->

class TreeViewTransformer
  constructor: (@grammar) ->
    @_subscriptions = {}

    _subscriptionCount = 0
    @_nextSubscriptionId = () ->
      return _subscriptionCount++

    @transformer = new TreeTransformer (value) -> new TreeModel value
    (Object.keys @viewConstructors).forEach (type) =>
      @transformer.addNodeCase \
        (val, node) => node.constructor.name is type,
        (val, node) => () => @viewConstructors[type].call this, val, node


  ###
  Starts watching the specified model for changes, invoking callbacks when a
    change (and resulting transform) occurs.

  @param [TreeModel] model The model to watch.
  ###
  watch: (model) ->
    @transformer.watch model, (transformed, original) =>
      for key, subscription of @_subscriptions
        subscription transformed, original

  ## TODO
  unwatch: () ->
    @transformer.watch null #?

  ###
  Register a callback to be invoked when the model is changed.

  @param [Function<TreeModel, TreeModel>] callback The callback, with parameters
    representing the most recent transformed tree and the most recent
    untransformed tree.
  @return [Function] An unsubscribe function for the registered callback.
  ###
  subscribe: (callback) ->
    id = @_nextSubscriptionId()
    @_subscriptions[id] = callback
    return () => delete @_subscriptions[id]

  viewConstructors:
    'ExpressionNode': (val, node) ->
      shouldShowAddButton =
        (val.quantifier is 'kleene') or
        (val.quantifier is 'optional') and (node.instances.length is 0)

      elt =
        new ExpressionView \
          val.identifier,
          shouldShowAddButton,
          () ->
            console.log 'instantiating'
            r = node.instantiate()
            console.log r
      elt.classList.add 'node'
      elt.classList.add 'expression'
      return elt


    'InstanceNode': (val, node) ->
      elt = new InstanceView()
      elt.classList.add 'node'
      elt.classList.add 'instance'

      return elt

    'HoleNode': (val, node) ->
      elt = new HoleView val.identifier, node.isFilled
      elt.classList.add 'node'
      elt.classList.add 'hole'
      if node.isFilled
        elt.classList.add 'filled'
      else
        elt.classList.add 'unfilled'

      Polymer.Gestures.add elt, 'up', (evt) =>
        evt.stopPropagation()
        p = @grammar.productions[node.group]
        getRandomInt = (min, max) ->
          Math.floor(Math.random() * (max - min)) + min
        fillWith = p[Object.keys(p)[getRandomInt(0, Object.keys(p).length)]]
        node.fill fillWith

      return elt

    'LiteralNode': (val, node) ->
      lines = val.text.split '\n'
      elt = document.createElement 'span'
      lines.forEach (ln, index) ->
        tabBlocks = ln.split '\t'
        tabBlocks.forEach (block, index_) ->
          if block.length > 0
            e = new LiteralView block
            elt.appendChild e

          if index_ isnt (tabBlocks.length - 1)
            tabElt = document.createElement 'span'
            tabElt.classList.add 'tab'
            elt.appendChild tabElt

        if index isnt (lines.length - 1)
          newlineElt = document.createElement 'div'
          newlineElt.classList.add 'newline'
          elt.appendChild newlineElt

      # elt = new LiteralView val.text
      # elt.classList.add 'node'
      # elt.classList.add 'literal'

      return elt

    'InputNode': (val, node) ->
      elt = new InputView val.display, val.data
      elt.classList.add 'node'
      elt.classList.add 'input'

      return elt


module.exports = TreeViewTransformer