LiteralView = Polymer
  is: 'kt-literal-view'

  properties:
    text:
      type: String
      value: ''

  factoryImpl: (@text) ->


module.exports = LiteralView