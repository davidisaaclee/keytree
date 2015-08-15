log = (x, name) ->
  if name?
  then console.log "#{name}:", x
  else console.log x
  return x

module.exports =
  log: log