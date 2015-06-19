start
  = (lit / var)*

lit
  = text:[^`]+ {
    return {
      type: "literal",
      text: text.join("")
    }
  }

var
  = text:("`" [^`]+ "`") {
    return {
      type: "variable",
      identifier: text.join("")
    }
  }