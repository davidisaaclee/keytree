# KeyTree

Writing code on a small touchscreen is frustrating. All text must be precisely
input, which becomes cumbersome with a thumb keyboard; yet, at the same time,
bits of text, in the form of keywords and identifiers, are often repeated
throughout a source code document.

KeyTree attempts to solve this problem by offering a text input method which
more closely mirrors a syntax tree of the source code. Such a syntax tree knows
what kinds of text are valid at any point in a document. Relying on this knowledge
allows rapid creation of source code on touchscreen devices, free of syntax errors.

## Try

A build attempting to maximize features and lack of bugs can be demo'd at
[https://davidisaaclee.github.io/keytree](https://davidisaaclee.github.io/keytree).

## Build

1. Clone the repository.
2. Install all dependencies.

    ```
    $ npm install
    $ bower install
    ```
3. Build via `gulp`.

    ```
    $ gulp build
    ```
4. Serve from base directory, and launch from `<server>/build/index.html`.

<section id="grammar-doc"/>
## Grammars

You can input your own grammar as JSON data.
The first level of keys (`START`, `NE`, `N`, and `A` in the
default grammar) are identifiers for groups of possible
produced texts, or "productions". All possible productions of
a group are listed as that group's children. Each produced
text has a unique identifier.

For example, `A` is a group for arithmetic operators. It can
produce the texts `+`, `-`, `*`, and `/` - each of which is
given a unique identifier (respectively, `add`, `subtract`,
`multiply`, and `divide`).

Each production is made up of "pieces." All the productions in
`A` have a single "literal" piece, which is why each operator
is enclosed by escaped double quotes.

Pieces:
<table>
    <tr>
        <td>"<em>text</em>"</td>
        <td>literal</td>
        <td>inserts the literal string "text"</td>
    </tr>
    <tr>
        <td>&lt;<em>id</em>:<em>group</em>&gt;</td>
        <td>hole</td>
        <td>creates a hole to be filled with a production from group `group`, with the identifier `id`</td>
    </tr>
    <tr>
        <td>&lt;<em>id</em>:\<em>type</em>&gt;</td>
        <td>input</td>
        <td>creates a hole to be filled with user input of type `type`, with the identifier `id`</td>
    </tr>
    <tr>
        <td>(<em>pieces</em>)</td>
        <td>subexpression</td>
        <td>groups together the pieces between parentheses as a single piece</td>
    </tr>
</table>

Any piece can be quantified by appending `*` or `?`, representing,
respectively, "zero or more" or "zero or one" of the piece.

## Example grammar

    {
      "START": {
        "start": "<start:NE>"
      },
      "NE": {
        "num-lit": "\"(num \" <digits:N> \")\"",
        "arith-op": "\"(arith \" <rator:A> \"\n\t\" <randl:NE> \"\n\t\" <randr:NE> \")\"",
        "list": "\"(list \" <element:NE>* \")\"",
        "list-lit": "\"[\" (<hd:NE> (\", \" <tl:NE>)*)? \"]\"",
        "variable": "<identifier:\\any>"
      },
      "N": {
        "digits": "<digits:\\numbers>"
      },
      "A": {
        "add": "\"+\"",
        "subtract": "\"-\"",
        "multiply": "\"*\"",
        "divid": "\"/\""
      }
    }
