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

    $ npm install
    $ bower install

3. Build via `gulp`.

    $ gulp build

4. Serve from base directory, and launch from `<server>/build/index.html`.