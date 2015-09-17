HoleView = Polymer
  is: 'kt-hole-view'

  properties:
    isFilled:
      type: Boolean
      value: false
    identifier:
      type: String
      value: '<identifier>'

  factoryImpl: (@identifier, @isFilled) ->


module.exports = HoleView