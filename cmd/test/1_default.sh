. "$(dirname -- "$0")/functions.sh"
setup
install

npx --no-install archgpt install

# Test core.hooksPath
# expect_hooksPath_to_be ".archgpt"

# Test pre-commit
git add package.json
npx --no-install archgpt add .archgpt/pre-commit "echo \"pre-commit\" && exit 1"
# expect 1 "git commit -m foo"

# Uninstall
# npx --no-install archgpt uninstall
# expect 1 "git config core.hooksPath"
