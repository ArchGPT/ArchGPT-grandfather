. "$(dirname -- "$0")/functions.sh"
setup
install

# Test custom dir support
mkdir sub
npx --no-install archgpt install sub/archgpt
npx --no-install archgpt add sub/archgpt/pre-commit "echo \"pre-commit\" && exit 1"

# Test core.hooksPath
# expect_hooksPath_to_be "sub/archgpt"

# # Test pre-commit
# git add package.json
# expect 1 "git commit -m foo"
