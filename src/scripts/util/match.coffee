# Class-based pattern-matching for CoffeeScript.

module.exports = match = (obj, fns) ->
  constructor = obj.constructor
  fn = fns[constructor.name]
  while !fn and constructor.__super__
    constructor = constructor.__super__.constructor
    fn = fns[constructor.name]
  if fn
    fn.apply null, arguments
  else if fns.else?
    fns.else.apply null, arguments
  else
    throw Error "no match for type #{constructor.name}."