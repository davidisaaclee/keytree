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
  = (lit / var)*

lit
  = text:[^`]+ {
    return {
      type: "literal",
      text: text.join(""),
      index: nextIndex('piece'),
      literalIndex: nextIndex('literal')
    };
  };

var
  = "`" text:([^`]+) "`" {
    return {
      type: "hole",
      identifier: text.join(""),
      index: nextIndex('piece'),
      holeIndex: nextIndex('hole')
    };
  };