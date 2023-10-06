. "$(dirname -- "$0")/functions.sh"
setup
install

cat > index.js << EOL
process.env.PATH = ''
require('archgpt').install()
EOL
expect 0 "node index.js" 

