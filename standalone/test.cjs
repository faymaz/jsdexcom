const JSDexcom = require('./jsdexcom.js');

async function test(username, password, requestedRegion = 'ous') {
    const region = requestedRegion.toLowerCase();
    
    console.log('\n=== JSdexcom Test ===');
    console.log('Region:', region.toUpperCase());
    console.log('Server:', JSDexcom.BaseUrls[region]);
    
    try {
        const dexcom = new JSDexcom(username, password, region);
        const reading = await dexcom.getLatestGlucose();
        
        console.log('\nGlucose Reading:');
        console.log(`Value: ${reading._value} mg/dL`);
        console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
        console.log(`Time: ${reading._datetime.toLocaleString()}`);
        console.log(`Status: ${reading._value < 70 ? 'LOW' : reading._value > 180 ? 'HIGH' : 'IN RANGE'}`);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Get credentials from command line or environment variables
const username = process.env.DEXCOM_USERNAME || process.argv[2];
const password = process.env.DEXCOM_PASSWORD || process.argv[3];
const region = process.env.DEXCOM_REGION || process.argv[4] || 'ous';

if (!username || !password) {
    console.log('Usage: node test.cjs USERNAME PASSWORD [REGION]');
    console.log('Regions: us, ous, jp');
    process.exit(1);
}

test(username, password, region);