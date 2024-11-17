import JSDexcom from '../index.js';

async function test(username, password, requestedRegion = 'ous') {
    const region = requestedRegion.toLowerCase();
    
    console.log('\n=== JSdexcom Test ===');
    console.log('Region:', region.toUpperCase());
    console.log('Server:', JSDexcom.BaseUrls[region]);
    
    try {
        const dexcom = new JSDexcom(username, password, region);
        const reading = await dexcom.getLatestGlucose();

        const cleanOutput = {
            _json: reading._json,
            _value: reading._value,
            _trend_direction: reading._trend_direction,
            _trend: reading._trend,
            _datetime: reading._datetime
        };

        // Success banner
        console.log('\n✓ Connection successful!');

        // Raw data section
        console.log('\n=== Raw Data ===');
        console.log(JSON.stringify(cleanOutput, null, 2));

        // Formatted reading section
        console.log('\n=== Glucose Reading ===');
        console.log(`Value: ${reading._value} mg/dL`);
        console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
        console.log(`Time: ${reading._datetime.toLocaleString()}`);

        // Status with symbols
        const status = reading._value < 70 ? '⚠️ LOW' :
                      reading._value > 180 ? '⚠️ HIGH' :
                      '✓ IN RANGE';
        console.log(`Status: ${status}`);

        // Connection info section
        console.log('\n=== Connection Info ===');
        console.log(`Server: ${dexcom.baseUrl}`);
        console.log(`Last update: ${new Date().toLocaleString()}`);
        console.log(`Session ID: ${dexcom.sessionId.substring(0, 8)}...`);

        // Provide region advice if needed
        if (region === 'us' && dexcom.baseUrl.includes('shareous1')) {
            console.log('\nNote: You\'re using an EU/OUS account with US region selected.');
            console.log('Tip: Use "ous" region for better compatibility.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('Authentication failed') && region === 'us') {
            console.log('\nTroubleshooting tips:');
            console.log('1. Check if you have a US or International Dexcom account:');
            console.log('   - US accounts use share2.dexcom.com');
            console.log('   - International accounts use shareous1.dexcom.com');
            console.log('\n2. Try changing the region:');
            console.log('   - For US accounts: node test.js USERNAME PASSWORD us');
            console.log('   - For International accounts: node test.js USERNAME PASSWORD ous');
            console.log('\n3. Verify your Share credentials:');
            console.log('   - These might be different from your Dexcom Clarity login');
            console.log('   - Check the Share settings in your Dexcom mobile app');
        }

        if (error.message.includes('Invalid region')) {
            console.log('\nSupported regions:');
            console.log('  us  - United States (share2.dexcom.com)');
            console.log('  ous - Outside United States (shareous1.dexcom.com)');
            console.log('  jp  - Japan (shareous1.dexcom.com)');
        }

        process.exit(1);
    }
}

// Help text
const usage = `
Dexcom Share API Test Tool
=========================

Usage:
  node test.js USERNAME PASSWORD [REGION]

Regions:
  us  - United States (share2.dexcom.com)
  ous - Outside United States (shareous1.dexcom.com) [default]
  jp  - Japan (shareous1.dexcom.com)

Environment variables:
  DEXCOM_REGION - Set default region (us, ous, jp)

Examples:
  node test.js johndoe password123
  node test.js johndoe password123 us
  DEXCOM_REGION=ous node test.js johndoe password123
`;

// Parse arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log(usage);
    process.exit(1);
}

const username = args[0];
const password = args[1];
const region = args[2] || process.env.DEXCOM_REGION || 'ous';

// Run test
test(username, password, region).catch(error => {
    console.error('\nUnhandled error:', error);
    process.exit(1);
});
