#!/bin/bash

# Create directories
mkdir -p src tests examples docs

# Create main files
echo "export { default } from './src/jsdexcom.js';" > index.js
mv jsdexcom.js src/

# Create test file
cat > tests/test.js << EOL
import JSDexcom from '../index.js';

async function test(username, password, requestedRegion = 'ous') {
    const region = requestedRegion.toLowerCase();
    
    console.log('\n=== JSdexcom Test ===');
    console.log('Region:', region.toUpperCase());
    
    try {
        const dexcom = new JSDexcom(username, password, region);
        const reading = await dexcom.getLatestGlucose();
        
        console.log('\nGlucose Reading:');
        console.log(\`Value: \${reading._value} mg/dL\`);
        console.log(\`Trend: \${reading._trend_arrow} (\${reading._trend_direction})\`);
        console.log(\`Time: \${reading._datetime.toLocaleString()}\`);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Get credentials from command line
const [username, password, region] = process.argv.slice(2);

if (!username || !password) {
    console.log('Usage: node test.js USERNAME PASSWORD [REGION]');
    process.exit(1);
}

test(username, password, region);
EOL

# Install dependencies
npm install node-fetch
npm install --save-dev eslint prettier husky

# Initialize git
git init
git add .
git commit -m "Initial commit"

# Create npm ignore file
cat > .npmignore << EOL
.git
.gitignore
.eslintrc.json
.prettierrc
.husky
tests
examples
docs
*.log
.DS_Store
EOL

echo "Setup complete! Next steps:"
echo "1. Run: npm install"
echo "2. Test with: npm test USERNAME PASSWORD"
EOL

# Make the script executable
chmod +x setup.sh