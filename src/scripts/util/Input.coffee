Input = {}

# creates a function which calls `cb` if event with
#  keycode `onKeycode` is received.
Input.ifKey = (onKeycode, cb) ->
  (evt) ->
    keycode =
      if evt.keycode?
      then evt.keycode
      else evt.which
    if keycode is onKeycode
      do cb


module.exports = Input