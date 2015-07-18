// Grammar for writing terse grammar production rules.

{
  function concat (str) {
    return str.join('')
  }

  function wrap (tag, value, id) {
    if (id == null) {
      return { type: tag, value: value }
    } else {
      return { type: tag, value: value, id: id }
    }
  }
}

start =
  (cons / lit)*

lit =
  text:([^`]+) { return wrap('literal', concat(text)) }

cons = varargs
     / hole
     / regex

varargs =
  "`" id:([a-z]i / "-")+ ":" group:([a-z]i / "-")+ "*`"
  { return wrap('varargs', concat(group), concat(id)) }

hole =
  "`" id:([a-z]i / "-")+ ":" group:([a-z]i / "-")+ "`"
  { return wrap('hole', concat(group), concat(id)) }

regex =
  "`" id:([a-z]i / "-")+ ":\\" pattern:[^`]+ "`"
  { return wrap('regex', concat(pattern), concat(id)) }

// litRules =
//   'START':
//     'start': '`NE`'
//   'NE':
//     'num-lit': '(num `N`)'
//     'arith-op': '(arith `A` `NE` `NE`)'
//   'N':
//     'digits': '`\\[0-9]+`'
//   'A':
//     '+': '+'
//     '-': '-'
//     '*': '*'
//     '/': '/'
//
// expandedRules =
//   'START':
//     'start': Sequence [(Hole 'NE', 'expr')]
//   'NE':
//     'num-lit': Sequence [(Literal '(num '), (Hole 'N', 'number'), (Literal ')')]
//     'arith-op': Sequence [(Literal '(arith '),
//                           (Hole 'A', 'rator'),
//                           (Literal ' '),
//                           (Hole 'NE', 'randl'),
//                           (Literal ' '),
//                           (Hole 'NE', 'randr'),
//                           (Literal ')')]
//   'N':
//     'digits': Sequence [Regex '[0-9]+']
//   'A':
//     '+': Sequence [Literal '+']
//     '-': Sequence [Literal '-']
//     '*': Sequence [Literal '*']
//     '/': Sequence [Literal '/']
