. "$(dirname -- "$0")/functions.sh"
setup
install

npx --no-install archgpt install

# Test core.hooksPath
expect_hooksPath_to_be ".archy"

# Test pre-commit with 127 exit code
git add package.json
npx --no-install archgpt add .archy/pre-commit "exit 127"
expect 1 "git commit -m foo"
