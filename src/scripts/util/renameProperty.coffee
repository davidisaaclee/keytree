_ = require 'lodash'

# recursive:
#   enabled: Boolean
#   descendOn: [String]
renameProperty = (replacements, recursive) ->
  return r = (obj) ->
    if _.isArray obj
      if recursive?.descendOnArrays?
      then return _.map obj, r
      else return obj
    obj = _.mapKeys obj, (value, key) ->
      if replacements[key]?
      then replacements[key]
      else key
    if recursive?.enabled
      obj = _.mapValues obj, (value, key) ->
        if (_.contains recursive.descendOn, key) and (_.isObject value)
        then r value
        else value
    return obj

module.exports = renameProperty