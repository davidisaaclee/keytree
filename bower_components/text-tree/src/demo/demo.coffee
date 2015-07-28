window.addEventListener 'WebComponentsReady', () ->
  sampleTree = [
    type: 'hole'
    id: 'start'
    isFilled: true
    value: [
      type: 'literal'
      value: '(+ '
     ,
      type: 'hole'
      id: 'randl::0'
      placeholder: 'randl'
      isFilled: true
      classes: 'special-node'
      value: [
        type: 'literal'
        value: '42'
      ]
     ,
      type: 'hole'
      id: 'randr::0'
      placeholder: 'randr'
      isFilled: false
      value: null
     ,
      type: 'action'
      display: 'action'
      onAction: () -> alert 'did action'
     ,
      type: 'literal'
      value: ')'
    ]
  ]

  document
    .querySelector '#tree'
    .treeModel = sampleTree

  document
    .querySelector '#tree'
    .addEventListener 'requested-fill', (evt) ->
      console.log 'requested-fill', arguments
      console.log evt.detail.tree.select evt.detail.idPath