Polymer
  is: 'text-root'

  listeners:
    'request-fill': '_fillRequested'
    # 'down': '_handleDown'

  selected: null

  rootNode: () -> this.$['root'].querySelector '.node'

  select: (path, useNumericPath) ->
    if @selected?
      @unselect.apply @, @selected

    selectedElm = this.$.root.walk path,
      endFn: (elm) ->
        Polymer.dom(elm).classList.add 'selected'
        return elm
      useNumericPath: useNumericPath

    if selectedElm? then @selected = arguments

    return selectedElm

  unselect: (path, useNumericPath) ->
    this.$.root.walk path,
      endFn: (elm) ->
        Polymer.dom(elm).classList.remove 'selected'
      fold:
        proc: (acc, elm) -> Polymer.dom(elm).classList.remove 'selected'
      useNumericPath: useNumericPath

  navigate: (path, useNumericPath) -> this.$.root.navigate path, useNumericPath

  _fillRequested: (event, detail) ->
    event.stopPropagation()

    @fire 'requested-fill',
      idPath: detail.idPath
      numericPath: detail.numericPath
      nodeModel: detail.nodeModel
      tree: this