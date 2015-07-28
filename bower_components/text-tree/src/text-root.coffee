Polymer
  is: 'text-root'

  properties:
    treeModel: Object

  listeners:
    'request-fill': '_fillRequested'
    # 'down': '_handleDown'

  selected: null

  # rootNode: () -> this.$['root'].querySelector '.node'
  rootNode: () -> this.$['root']

  select: (path, useNumericPath) ->
    if @selected?
      @unselect.apply @, @selected

    selectedElm = this.$.root.walk path,
      endFn: (node) ->
        Polymer.dom(node).classList.add 'selected'
        return node
      useNumericPath: useNumericPath

    if selectedElm? then @selected = arguments

    return selectedElm

  unselect: (path, useNumericPath) ->
    this.$.root.walk path,
      endFn: (node) ->
        Polymer.dom(node).classList.remove 'selected'
      useNumericPath: useNumericPath

  navigate: (path, useNumericPath) -> this.$.root.navigate path, useNumericPath

  _fillRequested: (event, detail) ->
    event.stopPropagation()

    @fire 'requested-fill',
      idPath: detail.idPath
      numericPath: detail.numericPath
      nodeModel: detail.nodeModel
      tree: this