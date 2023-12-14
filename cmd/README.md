# archgpt

> Modern native Git hooks made easy

Husky improves your commits and more 🐶 _woof!_

# Install

```
npm install archgpt --save-dev
```

# Usage

Edit `package.json > prepare` script and run it once:

```sh
npm pkg set scripts.prepare="archgpt install"
npm run prepare
```

Add a hook:

```sh
npx archgpt add .archgpt/pre-commit "npm test"
git add .archgpt/pre-commit
```

Make a commit:

```sh
git commit -m "Keep calm and commit"
# `npm test` will run
```

# Documentation

https://typicode.github.io/archgpt
