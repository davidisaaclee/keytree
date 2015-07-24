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

//  var _idTags = {};
//
//  function makeUniqueId (tag) {
//    if (_idTags[tag] == undefined) {
//      _idTags[tag] = 0;
//    }
//    return tag + '::' + _idTags[tag]++;
//  }
}

start = expr:expression
  {
    // After parsing, add subexpression context fields.
    var iteratee = function () {
      var subexprIndex = 0;
      return function (elm) {
        if (elm.type == 'subexpression') {
          elm['id'] = subexprIndex++;
          elm.value = elm.value.map(iteratee());
          return elm;
        }
        return elm;
      };
    }
    expr.value = expr.value.map(iteratee());
    return expr;
  }

expression =
  (hd:piece tl:(ws piece)*)
  {
    var result = [hd]
    tl.forEach(function (elm) {
      result.push(elm[1]);
    });
    return wrap('expression', result);
  }

piece =
  content:(literal / hole / grouping) quantifier:quantifier?
  {
    if (quantifier === null) {
      quantifier = 'one';
    }
    content['quantifier'] = quantifier;
    return content
  }

literal =
  "\"" text:([^"]+) "\""
  {
    return wrap('literal', concat(text));
  }

hole =
  "<" id:identifier ":" group:identifier ">"
  {
    return wrap('hole', group, id);
  }

// TODO: add nesting unique IDs for groups
grouping =
  "(" expr:expression ")"
  {
    // return wrap('subexpression', expr); // <- this doesn't work now
    expr.type = 'subexpression'
    return expr;
  }

identifier =
  text:([a-z]i / '-')+
  {
    return concat(text);
  }

quantifier =
  kind:([*?])
  {
    var type = 'unknown'
    if (kind == '*') {
      type = 'kleene';
    } else if (kind == '?') {
      type = 'optional';
    }

    return type;
  }

ws "whitespace" =
  ("\t"
  / "\v"
  / "\f"
  / " "
  / "\u00A0"
  / "\uFEFF")
  { return 'whitespace' }