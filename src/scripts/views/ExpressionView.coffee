ExpressionView = Polymer
  is: 'kt-expression-view'

  properties:
    identifier:
      type: String
      value: '<identifier>'
    showAddInstanceButton:
      type: String

  factoryImpl: (@identifier, @showAddInstanceButton, @addInstance = ->) ->

module.exports = ExpressionView