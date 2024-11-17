import JSDexcom from '../index.js';

async function test(username, password, requestedRegion = 'ous') {
    const region = requestedRegion.toLowerCase();
    
    console.log('\n=== JSdexcom Test ===');
    console.log('Region:', region.toUpperCase());
    
    try {
        const dexcom = new JSDexcom(username, password, region);
        const reading = await dexcom.getLatestGlucose();
        
        console.log('\nGlucose Reading:');
        console.log(`Value: ${reading._value} mg/dL`);
        console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
        console.log(`Time: ${reading._datetime.toLocaleString()}`);

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Check for --skip-auth flag
if (process.argv.includes('--skip-auth')) {
    console.log('Skipping authentication test for npm publish');
    process.exit(0);
}

// Get credentials from command line or environment variables
const username = process.env.DEXCOM_USERNAME || process.argv[2];
const password = process.env.DEXCOM_PASSWORD || process.argv[3];
const region = process.env.DEXCOM_REGION || process.argv[4] || 'ous';

if (!username || !password) {
    console.log('Dexcom Share API Test Tool');
    console.log('=========================\n');
    console.log('Usage:');
    console.log('  node test.js USERNAME PASSWORD [REGION]\n');
    console.log('Regions:');
    console.log('  us  - United States (share2.dexcom.com)');
    console.log('  ous - Outside United States (shareous1.dexcom.com) [default]');
    console.log('  jp  - Japan (shareous1.dexcom.com)\n');
    console.log('Environment variables:');
    console.log('  DEXCOM_USERNAME - Your Dexcom Share username');
    console.log('  DEXCOM_PASSWORD - Your Dexcom Share password');
    console.log('  DEXCOM_REGION - Set default region (us, ous, jp)\n');
    console.log('Examples:');
    console.log('  node test.js johndoe password123');
    console.log('  node test.js johndoe password123 us');
    console.log('  DEXCOM_REGION=ous node test.js johndoe password123\n');
    process.exit(0);
}

test(username, password, region);