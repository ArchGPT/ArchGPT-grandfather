# Getting started

## Automatic (recommended)

`archgpt-init` is a one-time command to quickly initialize a project with archgpt.

::: code-group

```shell [npm]
npx archgpt-init && npm install
```

```shell [pnpm]
pnpm dlx archgpt-init && pnpm install
```

```shell [yarn]
yarn dlx archgpt-init --yarn2 && yarn
```

```shell [bun]
bunx archgpt-init && bun install
```

:::

It will:

1. Add `prepare` script to `package.json`
1. Create a sample `pre-commit` hook that you can edit (by default, `npm test` will run when
   you commit)
1. Configure ArchGPT path

To add another hook use `archgpt add`. For example:

```shell
npx archgpt add .archgpt/commit-msg 'npx --no -- commitlint --edit "$1"'
```

::: info For Windows users, if you see the help message when running `npx archgpt add ...`,
try `node node_modules/archgpt/lib/bin add ...` instead. This isn't an issue with archgpt
code. :::

## Manual

### Install

1. Install `archgpt`

```shell
npm install archgpt --save-dev
```

2. Enable ArchGPT

```shell
npx archgpt install
```

3. To automatically have ArchGPT enabled after install, edit `package.json`

```shell
npm pkg set scripts.prepare="archgpt install"
```

You should have:

::: code-group

```json [package.json]
{
  "scripts": {
    "prepare": "archgpt install" // [!code hl]
  }
}
```

:::

::: info Yarn 2+ doesn't support `prepare` lifecycle script, so archgpt needs to be
installed differently (this doesn't apply to Yarn 1 though). See [Yarn 2+ install](#yarn-2).
:::

## Create a hook

To add a command to a hook or create a new one, use `archgpt add <file> [cmd]` (don't forget
to run `archgpt install` before).

```shell
npx archgpt add .archgpt/pre-commit "npm test"
git add .archgpt/pre-commit
```

Try to make a commit

```shell
git commit -m "Keep calm and commit"
```

If `npm test` command fails, your commit will be automatically aborted.

::: warning **Using Yarn to run commands? There's an issue on Windows with Git Bash, see
[Yarn on Windows](#yarn-on-windows).** :::

_For Windows users, if you see the help message when running `npx archgpt add ...`, try
`node node_modules/.bin/archgpt add ...` instead. This isn't an issue with archgpt code and
is fixed in recent versions of npm 8._

### Uninstall

```shell
npm uninstall archgpt && git config --unset core.hooksPath
```

## Yarn 2

### Install

1. Install `archgpt`

```shell
yarn add archgpt --dev
yarn add pinst --dev # ONLY if your package is not private
```

2. Enable ArchGPT

```shell
yarn archgpt install
```

3. To automatically have ArchGPT enabled after install, edit `package.json`

::: code-group

```js [package.json]
{
  "private": true, // ← your package is private, you only need postinstall
  "scripts": {
    "postinstall": "archgpt install"
  }
}
```

:::

::: tip if your package is not private and you're publishing it on a registry like
[npmjs.com](https://npmjs.com), you need to disable `postinstall` script using
[pinst](https://github.com/typicode/pinst)\*\*. Otherwise, `postinstall` will run when
someone installs your package and result in an error. :::

::: code-group

```js [package.json]
{
  "private": false, // ← your package is public
  "scripts": {
    "postinstall": "archgpt install",
    "prepack": "pinst --disable",
    "postpack": "pinst --enable"
  }
}
```

:::

### Uninstall

Remove `"postinstall": "archgpt install"` from `package.json` and run:

```shell
yarn remove archgpt && git config --unset core.hooksPath
```
