. "$(dirname -- "$0")/functions.sh"
setup
install

npx --no-install archgpt install

# Test core.hooksPath
expect_hooksPath_to_be ".archgpt"

# Test pre-commit with 127 exit code
git add package.json
npx --no-install archgpt add .archgpt/pre-commit "exit 127"
expect 1 "git commit -m foo"
