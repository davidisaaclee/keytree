InputView = Polymer
  is: 'kt-input-view'

  properties:
    pattern:
      type: String
      value: ''
    data:
      type: String
      value: null

  factoryImpl: (@pattern, @data) ->

  _isFilled: (data) -> return data?

module.exports = InputView
