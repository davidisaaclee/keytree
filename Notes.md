Class List
==========

* `Syntax.coffee`
  * Model
    * `Grammar` - The grammar of a single language.
      - `productions :: { <group id>: { <symbol id>: <symbol> } }`
      - `makeSequence :: String -> String -> Sequence` (<group id> -> <sequence id> -> <sequence>)
    # `Production` - A set of production rules for a particular nonterminal.
    # - `identifier :: String` - The identifier corresponding to this rule set's nonterminal.
    # - `symbols :: {<identifier>: <Symbol>}` - Set of symbols which can be produced by this rule set.
    * `Sequence` - Describes and matches a RHS of a production as a sequence of `Symbol`s.
      - `symbols :: [Symbol]`
    * `Symbol` - A single element of a `Sequence`.
      * `Literal` - An unchanging string literal; a terminal.
        - `text :: String`
      * `Hole` - A hole to be filled; annotated with a valid group identifier for filling; a nonterminal.
        - `group :: String` - the identifier of the group this hole wants
        - `identifier :: String` - the identifier of this hole
      * `Regex` - A regular expression, for easy parsing of number literals, etc.
        - `pattern :: String`
  * Instance
    * `SyntaxTree` - Represents a syntax tree, containing all information necessary to render the text.
      - `root :: Node`
      - `grammar :: Grammar`
    * `Node` - Represents a node in a `SyntaxTree`, containing the ability to render itself and its children.
      - `sequence :: Sequence`
      - `holes :: { <identifier>: { group :: String, index :: Integer, value :: Node } }`
      - `fillHole :: String -> Node -> Node` (hole identifier -> fill with -> this)
      - `render :: Unit -> String` - Renders this node into text, recurring on its children.
      - `navigate :: Path -> Node`
  * Utility
    * `Path` - A way of expressing a `Node`'s address in a `SyntaxTree`.