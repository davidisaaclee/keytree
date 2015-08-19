_ = require 'lodash'

# internal
class Mode
  constructor: (manager, @name, fields) ->
    {@open, @close, @canTransitionTo, @background} = fields
    @before = (data) =>
      manager._forEach @canTransitionTo, (mode) ->
        do mode.open
      return fields.before data
    @after = () =>
      manager._forEach @canTransitionTo, (mode) ->
        do mode.close
      return do fields.after


class ModeManager
  _activeMode: null

  # Creates a ModeManager with a context. The context will be the `this` value
  # bound to all mode state callbacks.
  constructor: (@context) ->
    @_modes = {}
    Object.defineProperty this, 'mode',
      get: () -> @_activeMode.name

  # Begin the manager's transitions on the specified mode.
  start: (initialMode) ->
    @setMode initialMode

  # Stops _transitions_, not the workings of the current mode.
  stop: () ->
    @_forEach @_activeMode?.canTransitionTo, (mode) =>
      do mode.close

  # Resumes _transitions_, not the workings of the current mode.
  resume: () ->
    @_forEach @_activeMode?.canTransitionTo, (mode) =>
      do mode.open

  ###
  Add a new mode to the manager.
  Returns the manager for chaining.

  The second argument is an object with fields:

    canTransitionTo: a list of mode names which this mode can transition to
    accept: a function which accepts an `accept` procedure (which, when called,
      sets the current mode to this one), and returns an "start-stop object",
      which is started when this mode can be transitioned to, and stopped when
      this mode can no longer be transitioned to.
    active: a function with no parameters, which returns an "start-stop object",
      which is started when this mode is entered, and stopped when this mode is
      exited.

  Both `accept` and `active` are bound to this ModeManager's `context`. If you
    want to use `context` as `this` in your start-stop object, use a fat arrow
    (or Function::bind). Otherwise, `this` in your start-stop object will refer
    to the `Mode` object which `ModeManager` creates.
  [TODO: Not certain if there's any benefit to this... Might change it so the
    context is alwasy bound.]

  start-stop objects:
    start: ->
    stop: ->
  ###
  add: (name, options) ->
    options = _.defaults options,
      parent: null
      canTransitionTo: []
      checkAccept: () ->
        start: () ->
        stop: () ->
      active: () ->
        start: () ->
        stop: () ->
        background: () ->

    accept = (data) =>
      if @mode is options.parent
        do @_activeMode.background
      @setMode name, data
    release = (data) => @setMode options.parent, data
    reclaim = (data) => @setMode name, data

    acceptResult = _.defaults ((@_bind options.checkAccept) accept),
      start: () ->
      stop: () ->
    activeResult = _.defaults (do (@_bind options.active)),
      start: () ->
      stop: () ->
      background: () ->

    context = this
    @_modes[name] = new Mode this, name,
      parent: options.parent
      canTransitionTo: options.canTransitionTo
      open: context._bind acceptResult.start
      close: context._bind acceptResult.stop
      before: context._bind activeResult.start, release
      background: context._bind activeResult.background, reclaim, release
      after: context._bind activeResult.stop

    return this

  # Retrieve a mode from the manager's list of registered modes.
  get: (modeName) -> @_modes[modeName]

  # Set the active mode, performing teardown and setup.
  setMode: (modeName, data = {}) ->
    if @_activeMode? and modeName is @_activeMode.name
      return

    if @_activeMode?
      do @_activeMode.after
    @_activeMode = @get modeName
    @_activeMode.before data

    return @_activeMode

  # Iterate over the modes named by `modeNames`, throwing an error
  # if no such mode exists.
  #
  # The iteratee takes in the single argument of the specified mode.
  _forEach: (modeNames, proc) ->
    modeNames.forEach (modeName) =>
      mode = @get modeName
      if mode?
      then proc mode
      else console.error 'No such mode ', modeName

  # Quickly bind a function to this `ModeManager`'s `context`.
  _bind: (fn, args...) -> _.bind fn, @context, args...

module.exports = ModeManager