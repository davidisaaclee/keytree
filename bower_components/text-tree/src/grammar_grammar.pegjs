{
  var indices = {};
  function nextIndex (kind) {
    if (indices[kind] == null) {
      indices[kind] = 0
    }
    return indices[kind]++
  }
}

start
  = (lit / hole / var)*

lit
  = text:[^`]+ {
    return {
      type: "literal",
      text: text.join(""),
      index: nextIndex('piece'),
      literalIndex: nextIndex('literal')
    };
  };

hole
  = "`" text:(([a-z]i / '-')+) "`" {
    return {
      type: "hole",
      identifier: text.join(""),
      index: nextIndex('piece'),
      holeIndex: nextIndex('hole')
    };
  };

var
  = "`" text:(([a-z]i / '-')+) "*`" {
    return {
      type: 'variadic',
      identifier: text.join(""),
      index: nextIndex('piece'),
      holeIndex: nextIndex('hole')
    };
  };