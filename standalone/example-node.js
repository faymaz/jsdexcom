// example-node.js
const JSDexcom = require('./jsdexcom.js');

async function getGlucose(username, password, region = 'ous') {
    try {
        const dexcom = new JSDexcom(username, password, region);
        const reading = await dexcom.getLatestGlucose();
        
        console.log('\nCurrent Glucose Reading:');
        console.log(`Value: ${reading._value} mg/dL ${reading._trend_arrow}`);
        console.log(`Trend: ${reading._trend_direction}`);
        console.log(`Time: ${reading._datetime.toLocaleString()}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Get credentials from command line
const [username, password, region] = process.argv.slice(2);

if (!username || !password) {
    console.log('Usage: node example-node.js USERNAME PASSWORD [REGION]');
    process.exit(1);
}

getGlucose(username, password, region);