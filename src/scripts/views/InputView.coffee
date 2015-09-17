InputView = Polymer
  is: 'kt-input-view'

  properties:
    display:
      type: String
      value: ''
      observe: '_displayChanged'
    data:
      type: String
      value: null

  factoryImpl: (@display, @data) ->

  _isFilled: (data) -> return data?

  _displayChanged: () ->
    console.log 'adsfsd', this

module.exports = InputView
