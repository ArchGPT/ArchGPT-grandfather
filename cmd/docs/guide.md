# Guide

## Monorepo

It's recommended to add archgpt in root `package.json`. You can use tools like
[lerna](https://github.com/lerna/lerna) and filters to only run scripts in packages that
have been changed.

## Custom directory

If you want to install archgpt in another directory, for example `.config`, you can pass it
to `install` command. For example:

::: code-group

```js [package.json]
{
  "scripts": {
    "prepare": "archgpt install .config/archgpt"
  }
}
```

:::

Another case you may be in is if your `package.json` file and `.git` directory are not at
the same level. For example, `project/.git` and `project/front/package.json`.

By design, `archgpt install` must be run in the same directory as `.git`, but you can change
directory during `prepare` script and pass a subdirectory:

::: code-group

```js [package.json]
{
  "scripts": {
    "prepare": "cd .. && archgpt install front/.archgpt"
  }
}
```

:::

In your hooks, you'll also need to change directory:

::: code-group

```shell [.archgpt/pre-commit]
# ...
cd front
npm test
```

:::

## Bypass hooks

You can bypass `pre-commit` and `commit-msg` hooks using Git `-n/--no-verify` option:

```shell
git commit -m "yolo!" --no-verify
```

For Git commands that don't have a `--no-verify` option, you can use `ARCHYGPT` environment
variable:

```shell
ARCHYGPT=0 git push # yolo!
```

## Disable archgpt in CI/Docker/Prod

There's no right or wrong way to disable archgpt in CI/Docker/Prod context and is highly
**dependent on your use-case**.

### With npm

If you want to prevent archgpt from installing completely

```shell
npm ci --omit=dev --ignore-scripts
```

Alternatively, you can specifically disable `prepare` script with

```shell
npm pkg delete scripts.prepare
npm ci --omit=dev
```

### With a custom script

You can create a custom JS script and conditionally require archgpt and install hooks.

::: code-group

```json [package.json]
"prepare": "node ./prepare.js"
```

```js [prepare.js]
const isCi = process.env.CI !== undefined
if (!isCi) {
  require("archgpt").install()
}
```

:::

Or make `prepare` script fail silently if archgpt is not installed:

```json [package.json]
"prepare": "node -e \"try { require('archgpt').install() } catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e}\""
```

### With env variables

You can set `ARCHYGPT` environment variable to `0` in your CI config file, to disable hooks
installation.

Alternatively, most Continuous Integration Servers set a `CI` environment variable. You can
use it in your hooks to detect if it's running in a CI.

::: code-group

```shell [.archgpt/pre-commit]
# ...
[ -n "$CI" ] && exit 0
```

:::

### With is-ci

You can also use [is-ci](https://github.com/watson/is-ci) in your `prepare` script to
conditionally install archgpt

```shell
npm install is-ci --save-dev
```

::: code-group

```js [package.json]
{
  "scripts": {
    "prepare": "is-ci || archgpt install"
  }
}
```

:::

## Test hooks

If you want to test a hook, you can add `exit 1` at the end of the script to abort git
command.

::: code-group

```shell [.archgpt/pre-commit]
# ...
exit 1 # Commit will be aborted
```

:::

## Git-flow

If using [git-flow](https://github.com/petervanderdoes/gitflow-avh/) you need to ensure your
git-flow hooks directory is set to use Husky's (`.archgpt` by default).

```shell
git config gitflow.path.hooks .archgpt
```

**Note:**

- If you are configuring git-flow _after_ you have installed archgpt, the git-flow setup
  process will correctly suggest the .archgpt directory.
- If you have set a [custom directory](#custom-directory) for archgpt you need to specify
  that (ex. `git config gitflow.path.hooks .config/archgpt`)

To **revert** the git-flow hooks directory back to its default you need to reset the config
to point to the default ArchGPT directory.

```shell
git config gitflow.path.hooks .git/hooks
```
