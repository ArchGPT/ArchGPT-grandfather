### Summary

ArchGPT is a source-code-management framework to enable a new meta-programming paradigm
specially designed for Language-Model-Driven-Development (LMDD) i.e. the utilization of
Large Language Models for automated software development.

We call this meta-programming paradigm **The Yoneda paradigm**, drawing inspiration from the
Yoneda lemma in Category Theory, which states that:

> "Everything in a category is completely determined by its relationships to everything
> else."

#### The Yoneda Paradigm vs Existing Programming Paradigms

We say that a programmer is writing code under a programming paradigm of X when X can be
conceptually viewed as the "first-class citizens" in the code they write. For example, in
Object-Oriented Programming (OOP), the first-class citizens are **Objects** (i.e. the
realization of **Classes** or **Prototypes**). In Functional Programming (FP), the
first-class citizens are functions (with the possiblity of Side Effects unless
[Purity](https://en.wikipedia.org/wiki/Purely_functional_programming) is emphasized, e.g. in
Haskell, in which case the first-class citizens are **Pure Functions** and we will end up
with things like [Monads](<https://en.wikipedia.org/wiki/Monad_(functional_programming)>)).

The Yoneda Paradigm, on the other hand, is a meta-programming paradigm in which the
"abstract relationships" between "abstractions" in code are the first-class citizens.

These "abstract relationships" are the equivalent of **Arrows** in Category Theory, and the
"abstractions" can be anything, including but not limited to:

- Files
- Features
- Groups of Function calls
- Type Defintions
- the notion of "User"
- User stories
- etc.

They can basically be everything within the domain of human language.

**For the Yoneda Paradigm to work, we need to first define a list of "abstractions" most
interesting to us, and then generate/customize a list of "abstract relationships" between
them. And then ArchGPT will figure out the realization (i.e. within the context of an
existing codebase) of these "abstractions" and "abstract relationships", and automatically
handle the prompt orchestration to feed into LLMs for code generation/editing.**

## Right now ArchGPT is still work in progress && under active development .. (i.e. the implementation is not completed yet)

### Miletone 1 (Feb 2024)

After configuration, ArchGPT should be able to allow users to give natural-language commands to generate/edit
code based on the existing codebase.

e.g. using an image to edit the ReactJS code for the UI of a to-do list
app.

```
archgpt "use this image for the UI" --image "./img1.png"
```

<!-- [Video]

Here is the "./img1.png" used in the example:

[Image]

Here is the final resulted UI:

[Image]

To get a sense of how ArchGPT works, you can check out
[the to-do list demo](https://archgpt.github.io/ArchGPT/to-do-list). -->

