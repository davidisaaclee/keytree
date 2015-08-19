_ = require 'lodash'
ModeManager = require 'util/ModeManager'

describe 'basic mode manager', () ->
  beforeEach () ->
    @context = context =
      foo: 3
      bar: false

    @manager = new ModeManager @context
    @manager.add 'base',
      canTransitionTo: []
      checkAccept: (acceptFn) ->
        start: () ->
        stop: () ->
      active: () ->
        start: () ->
          @foo = 5
        stop: () ->
          @foo = 10

  afterEach () ->
    @manager.stop()


  it 'can have a mode', () ->
    @manager.start 'base'
    expect @manager.mode
      .toBe 'base'


  it 'can mutate context', () ->
    @manager.start 'base'

    expect @manager.mode
      .toBe 'base'
    expect @context.foo
      .toBe 5

    # stopping the manager does not
    #   change mode; only stopping
    #   transitions to new modes.
    @manager.stop()
    expect @manager.mode
      .toBe 'base'
    expect @context.foo
      .toBe 5

  it 'passes context correctly', () ->
    context = @context
    track = jasmine.createSpy 'track'

    @manager.add 'base2',
      canTransitionTo: ['base3']
      checkAccept: (acceptFn) ->
        start: () ->
        stop: () ->
      active: () ->
        expect(this).toBe(context)
        do track
        start: () ->
          expect(this).toBe(context)
          do track
        stop: () ->
          expect(this).toBe(context)
          do track
    @manager.add 'base3',
      canTransitionTo: []
      checkAccept: (acceptFn) ->
        expect(this).toBe(context)
        @transition = acceptFn
        do track
        start: () ->
          expect(this).toBe(context)
          do track
        stop: () ->
          expect(this).toBe(context)
          do track
      active: () ->
        start: () ->
        stop: () ->

    @manager.start 'base2'
    do @context.transition
    expect @manager.mode
      .toBe 'base3'
    expect track.calls.count()
      .toBe 6

describe 'intermediate mode manager', () ->
  beforeEach () ->
    @context =
      currentMode: 'none'

    @manager = new ModeManager @context
    @transitions = transitions = {}

    @manager
      .add 'left',
        canTransitionTo: ['center']
        checkAccept: (acceptFn) ->
          start: () ->
            transitions.left = acceptFn
          stop: () ->
            transitions.left = null
        active: () ->
          start: () ->
            @currentMode = 'left'
          stop: () ->
            @currentMode = 'none'
      .add 'center',
        canTransitionTo: ['left', 'right']
        checkAccept: (acceptFn) ->
          start: () ->
            transitions.center = acceptFn
          stop: () ->
            transitions.center = null
        active: () ->
          start: () ->
            @currentMode = 'center'
          stop: () ->
            @currentMode = 'none'
      .add 'right',
        canTransitionTo: ['center']
        checkAccept: (acceptFn) ->
          start: () ->
            transitions.right = acceptFn
          stop: () ->
            transitions.right = null
        active: () ->
          start: () ->
            @currentMode = 'right'
          stop: () ->
            @currentMode = 'none'

  afterEach () ->
    @manager.stop()


  it 'can switch modes', () ->
    @manager.start 'left'

    expect @context.currentMode
      .toBe 'left'

    do @transitions.center
    expect @context.currentMode
      .toBe 'center'

    do @transitions.right
    expect @context.currentMode
      .toBe 'right'
    expect @transitions.left
      .toBeNull()

    do @transitions.center
    expect @context.currentMode
      .toBe 'center'

    do @manager.stop
    expect @transitions.left
      .toBeNull()
    expect @transitions.right
      .toBeNull()

describe 'layered mode manager', () ->
  beforeEach () ->
    @context =
      topMode: 'none'
      transitions: {}

    @manager = new ModeManager @context

    @manager
      .add 'left',
        canTransitionTo: ['right', 'leftright']
        checkAccept: (acceptFn) ->
          start: () ->
            @transitions.left = acceptFn
          stop: () ->
            @transitions.left = null
        active: () ->
          start: () ->
            @topMode = 'left'
          stop: () ->
            @topMode = 'none'
          background: (reclaimFn, releaseFn) ->
            @transitions.reclaimLeft = reclaimFn
      .add 'right',
        canTransitionTo: ['left']
        checkAccept: (acceptFn) ->
          start: () ->
            @transitions.right = acceptFn
          stop: () ->
            @transitions.right = null
        active: () ->
          start: () ->
            @topMode = 'right'
          stop: () ->
            @topMode = 'none'
      .add 'leftright',
        parent: 'left'
        canTransitionTo: ['leftleft', 'right', 'leftrightstack']
        checkAccept: (acceptFn) ->
          start: () ->
            @transitions.leftright = acceptFn
          stop: () ->
            @transitions.leftright = null
        active: () ->
          start: (releaseFn) ->
            @topMode = 'leftright'
            @transitions.releaseLR = releaseFn
            @leftrightPaused = false
          stop: () ->
            @topMode = 'none'
          background: (reclaimFn, releaseFn) ->
            @leftrightPaused = true
            @transitions.reclaimLR = reclaimFn
            @transitions.popToLeft = releaseFn
      .add 'leftleft',
        parent: 'left'
        canTransitionTo: ['leftright']
        checkAccept: (acceptFn) ->
          start: () ->
            @transitions.leftleft = acceptFn
          stop: () ->
            @transitions.leftleft = null
        active: () ->
          start: (releaseFn) ->
            @topMode = 'leftleft'
            @transitions.release = releaseFn
            @transitions.reclaim = null
            @transitions.popToRoot = null
          stop: () ->
            @topMode = 'none'
      .add 'leftrightstack',
        parent: 'leftright'
        canTransitionTo: []
        checkAccept: (acceptFn) ->
          start: () ->
            @transitions.acceptLRS = acceptFn
          stop: () ->
        active: () ->
          start: (releaseFn) ->
            @transitions.releaseLRS = releaseFn
          stop: () ->
            @transitions.releaseLRS = null


  afterEach () ->
    @manager.stop()


  it 'can navigate layered modes', () ->
    @manager.start 'right'

    expect @manager.mode
      .toBe 'right'
    expect @context.transitions.leftleft
      .toBeFalsy()
    expect @context.transitions.leftright
      .toBeFalsy()

    do @context.transitions.left
    expect @manager.mode
      .toBe 'left'
    expect @context.transitions.leftleft
      .toBeFalsy()
    expect @context.transitions.leftright
      .toBeTruthy()

    do @context.transitions.leftright
    expect @manager.mode
      .toBe 'leftright'

    do @context.transitions.leftleft
    expect @manager.mode
      .toBe 'leftleft'

    do @context.transitions.release
    expect @manager.mode
      .toBe 'left'


  it 'can jump layers', () ->
    @manager.start 'left'

    do @context.transitions.leftright
    expect @manager.mode
      .toBe 'leftright'

    do @context.transitions.right
    expect @manager.mode
      .toBe 'right'

    expect @context.transitions.release
      .toBeFalsy()


  it 'can release multiple frames', () ->
    @manager.start 'left'

    do @context.transitions.leftright
    expect @manager.mode
      .toBe 'leftright'

    do @context.transitions.acceptLRS
    expect @manager.mode
      .toBe 'leftrightstack'

    do @context.transitions.releaseLRS
    expect @manager.mode
      .toBe 'leftright'

    do @context.transitions.acceptLRS
    expect @manager.mode
      .toBe 'leftrightstack'
    expect @context.leftrightPaused
      .toBe true

    do @context.transitions.reclaimLR
    expect @manager.mode
      .toBe 'leftright'
    expect @context.leftrightPaused
      .toBe false

    do @context.transitions.acceptLRS
    expect @manager.mode
      .toBe 'leftrightstack'
    expect @context.leftrightPaused
      .toBe true

    do @context.transitions.popToLeft
    expect @manager.mode
      .toBe 'left'
    expect @context.transitions.releaseLRS
      .toBeNull()