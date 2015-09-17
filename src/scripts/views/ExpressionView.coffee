ExpressionView = Polymer
  is: 'kt-expression-view'

  properties:
    identifier:
      type: String
      value: '<identifier>'
    showAddInstanceButton:
      type: String

  factoryImpl: (@identifier, @showAddInstanceButton, addInstance = ->) ->
    @_addInstance = (evt) ->
      console.log 'here'
      evt.stopPropagation()
      do addInstance

module.exports = ExpressionView