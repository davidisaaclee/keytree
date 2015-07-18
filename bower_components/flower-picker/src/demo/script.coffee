_ = require 'lodash'

fp = document.querySelector 'flower-picker';
bg = document.querySelector '#background';

handleSelect = (evt) ->
  console.log 'selected', evt.detail.value
  document.querySelector('#pickedElement').innerHTML =
    'selected: ' + evt.detail.value;

handleDown = (evt) ->
  console.log 'down'
  fp.start x: evt.detail.x, y: evt.detail.y

handleUp = (evt) ->
  console.log 'up'
  fp.finish x: evt.detail.x, y: evt.detail.y

Polymer.Gestures.add bg, 'down', handleDown
Polymer.Gestures.add bg, 'up', handleUp
fp.addEventListener 'selected', handleSelect

petals = [
  model:
    foo: 3
    bar: 'bar'
  display: _.property 'bar'
  value: _.property 'bar'
  isLeaf: true
 ,
  model: 'group'
  isLeaf: false
  children: [
    model:
      foo: 3
      bar: 'bar'
    display: _.property 'bar'
    value: _.property 'bar'
    isLeaf: true
   ,
    model: 'inner group'
    isLeaf: false
    children: [
      model:
        foo: 3
        bar: 'bar'
      display: _.property 'bar'
      value: _.property 'bar'
      isLeaf: true
    ]
  ]
 ,
  type: 'input'
  model: '(input `string`)'
  display: (model, data) ->
    if data? and data.length > 0
    then "(input #{data})"
    else model
  value: (model, data) -> "(input #{data})"
  isLeaf: true
]
fp.petals = petals;