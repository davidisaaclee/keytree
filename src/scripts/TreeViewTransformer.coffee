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
        (val, node) => @viewConstructors[type].call this, val, node


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

      elt = new ExpressionView val.identifier, shouldShowAddButton, () -> node.instantiate()
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

      Polymer.Gestures.add elt, 'up', () =>
        p = @grammar.productions[node.group]
        node.fill p[Object.keys(p)[0]]

      return elt

    'LiteralNode': (val, node) ->
      elt = new LiteralView val.text
      elt.classList.add 'node'
      elt.classList.add 'literal'

      return elt

    'InputNode': (val, node) ->
      elt = new InputView val.display, val.data
      elt.classList.add 'node'
      elt.classList.add 'input'

      return elt


module.exports = TreeViewTransformer