start = expression

expression = piece*

piece = literal
      / hole
      / existential

literal =
  "\"" text:.+ "\""

hole =
  "<" id:identifier ":" group:identifier ">"

existential =
  "(" expression:expression ")" kind:[*?]
