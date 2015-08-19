module.exports = enumerate = (keys...) ->
  keys.reduce (do ->
    i = 0
    (acc, elm) ->
      acc[elm] = i++
      return acc), {}