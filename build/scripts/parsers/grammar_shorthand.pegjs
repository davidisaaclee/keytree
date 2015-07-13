// Grammar for writing terse grammar production rules.

{
  function concat (str) {
    return str.join('')
  }

  function wrap (tag, value) {
    return { type: tag, value: value }
  }
}

start =
  (cons / lit)*

lit =
  text:([^`]+) { return wrap('literal', concat(text)) }

cons = hole
     / regex

hole =
  "`" group:[^`\\]+ "`" { return wrap('hole', concat(group)) }

regex =
  "`\\" pattern:[^`]+ "`" { return wrap('regex', concat(pattern)) }


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
