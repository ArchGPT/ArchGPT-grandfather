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

They are basically be everything within the domain of human language.

**For the Yoneda Paradigm to work, we need to first define a list of "abstractions" most
interesting to us, and then generate/customize a list of "abstract relationships" between
them. And then ArchGPT will figure out the realization (i.e. within the context of an
existing codebase) of these "abstractions" and "abstract relationships", and automatically
handle the prompt orchestration to feed into LLMs for code generation/editing.**

### Examples

After configuration, ArchGPT can be used to give natural-language commands to generate/edit
code based on the existing codebase.

Here is an example of using an image to edit the ReactJS code for the UI of a to-do list
app.

```
archgpt "use this image for the UI" --image "./img1.png"
```

[Video]

Here is the "./img1.png" used in the example:

[Image]

Here is the final resulted UI:

[Image]

To get a sense of how ArchGPT works, you can check out
[the to-do list demo](https://archgpt.github.io/ArchGPT/to-do-list).

### Quickstart with LL.Market

1. Install ArchGPT globally

```bash
npm install archgpt --global
```

or

```bash
yarn add archgpt --global
```

To verify the installation, run

```
archgpt --version
## 0.1.0a
```

2. Set up the env variable for ll.market (recommended)

In your `~/.env` file, or the `.env` in the repo:

```
LL_MARKET_API_CALL=...
```

To obtain an API key, create an account on https://ll.market

> Alternatively, you can use your own `OPEN_AI` API key or set up
> [Ollama](https://ollama.ai/) to use local LLM models (such as Mistral, CodeLlama, etc) and
> configure **Caregories** by yourself. For more details, see **Endpoints and Categories
> Configuration** below.

3. Initalize ArchGPT for your codebase

In the root folder of your codebase, run

```
archgpt init
```

This will create an `.archgpt/` folder, and index the existing codebase using an encoder,
and generate meta-information about the repo. This will take a while, depending on the size
of the codebase.

> By default, it uses
> [ll.market's `codebase-indexer`](https://ll.market/llm/codebase-indexer). In the case if
> you want to use a custom indexer (e.g. with `text-embedding-ada` + `gpt-4`, or locally
> with Mistral, etc), see **Codebase Indexer Configuration** below.

4. Now you can give command to ArchGPT:

```
archgpt "use this image for the UI" --image "~/archgpt/to-do-example/img-1.jpg"
```

<!-- ```
archgpt "refactor reducers to "
``` -->

### How does ArchGPT work

```
archgpt [command] [options]

## e.g. archgpt "use this image for the UI" --image "~/archgpt/to-do-example/img-1.jpg"
```

Upon receiving a command (such as "use this image for the UI"), ArchGPT will first go
through the meta-information about the repo (in `.archgpt`), and figure out which
specialized LLMs on LL.Market to use, and then ArchGPT will orchestrate the prompt
composition and run a sequence of LLMs to generate/edit the existing source code.

> Alternatively, you can create your own specialized LLMs (e.g. locally with Mistral, etc)
> and configure **Endpoints and Categories** by yourself. For more details, see **Endpoints
> and Categories Configuration** below.

<!--
### Prerequisite

For local-only LLMs:

Make sure you have [Ollama](https://ollama.ai/) installed.

For API-based LLMs:

We support LLMs from [OpenAI](https://platform.openai.com/) and
[LL.Market](https://ll.market). (More coming soon)

For it to work, you need to ensure you have the following environment variables in `.env` of
the root folder, or in `~/.env`

`OPENAI_API_KEY=` (for OpenAI API key)

`LLMARKET_API_KEY=` (for LLMarket API key) -->

<!--
```typescript
import {initArchGPT} from "archgpt"

const archGPT = await initArchGPT(folder)

const ArSTs = await archGPT.searchFiles("to do list")

const description = "allow users to assign a todo item to existing members in a team"

const result = await archGPT.runPrompt("CREATE_FILE", {
  basedOn: ArSTs,
  description,
  llm: "gpt-4",
})
```

### coming soon:

1. [Insomnium](https://github.com/ArchGPT/insomnium/) Integration:
   https://github.com/ArchGPT/insomnium/discussions/13 to have first-class support for LLMs

2. upload to npm & add API documentations

3. ArchGPT GUI:

![HN](https://github.com/ArchGPT/ArchGPT/blob/main/gui.png?raw=true) -->
