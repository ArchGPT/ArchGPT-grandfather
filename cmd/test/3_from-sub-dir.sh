. "$(dirname -- "$0")/functions.sh"
setup

# Skip test for npm 6
npm --version | grep "^6\." && exit 0

# Example:
# .git
# sub/package.json

# Edit package.json in sub directory
mkdir sub
cd sub
npm install ../../archgpt.tgz
cat > package.json << EOL
{
	"scripts": {
		"prepare": "cd .. && archgpt install sub/.archy"
	}
}
EOL

# Install
npm run prepare

# Add hook
npx --no-install archgpt add .archy/pre-commit "echo \"pre-commit hook\" && exit 1"

# Test core.hooksPath
expect_hooksPath_to_be "sub/.archy"

# Test pre-commit
git add package.json
expect 1 "git commit -m foo"
