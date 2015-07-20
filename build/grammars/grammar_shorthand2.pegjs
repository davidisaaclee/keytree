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

start = expression

expression =
  (hd:piece tl:(ws piece)*)
  {
    var result = [hd]
    tl.forEach(function (elm) {
      result.push(elm[1]);
    });
    return result;
  }

piece =
  content:(literal / hole / grouping) quantifier:quantifier?
  {
    if (quantifier === null) {
      quantifier = 'none';
    }
    return {
      content: content,
      quantifier: quantifier
    };
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

grouping =
  "(" expr:expression ")"
  {
    return wrap('group', expr);
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