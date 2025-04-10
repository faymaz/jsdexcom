/**
 * JSdexcom - CommonJS Test
 * Tests the library with delta calculation and trend analysis
 * @author faymaz
 * @version 2.1.0
 */

// Dynamic import helper
const importDynamic = new Function('specifier', 'return import(specifier)');

async function test(username, password, requestedRegion = 'ous') {
    try {
        const region = requestedRegion.toLowerCase();
        console.log('\n=== JSdexcom Test ===');
        console.log('Region:', region.toUpperCase());
        console.log('Server:', region === 'us' ? 'https://share2.dexcom.com' : 'https://shareous1.dexcom.com');

       
        const { default: JSDexcom } = await importDynamic('./jsdexcom.js');
        
        console.log('\nCreating Dexcom client...');
        const dexcom = new JSDexcom(username, password, region);
        
       
        const result = await dexcom.getLatestGlucoseWithDelta();
        
       
        console.log('\nCurrent Reading:');
        console.log('--------------');
        console.log(`Value: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
        console.log(`Trend: ${result.current._trend_direction}`);
        console.log(`Time: ${result.current._datetime.toLocaleString()}`);
        console.log(`Status: ${result.current._status}`);

       
        if (result.current._delta !== null) {
            console.log('\nTrend Analysis:');
            console.log('--------------');
            console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
            console.log(`Time Span: ${result.current._delta_time.toFixed(1)} minutes`);
            console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
            console.log(`Trend: ${result.current._trend_description}`);

           
            console.log('\nPrevious Reading:');
            console.log('--------------');
            console.log(`Value: ${result.previous._value} mg/dL ${result.previous._trend_arrow}`);
            console.log(`Time: ${result.previous._datetime.toLocaleString()}`);

           
            if (Math.abs(result.current._rate_of_change) > 3) {
                console.warn('\n⚠️ Rapid glucose change detected!');
                console.warn(`Rate of change: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
            }
        } else {
            console.log('\nNo previous reading available for trend analysis');
        }

       
        if (result.current._status === 'LOW') {
            console.error('\n⚠️ LOW GLUCOSE ALERT!');
            console.error(`Current value: ${result.current._value} mg/dL`);
        } else if (result.current._status === 'HIGH') {
            console.error('\n⚠️ HIGH GLUCOSE ALERT!');
            console.error(`Current value: ${result.current._value} mg/dL`);
        }

       
        console.log('\nRaw Data:');
        console.log('--------------');
        console.log(JSON.stringify(result.current._json, null, 2));

    } catch (error) {
        handleError(error);
        process.exit(1);
    }
}

function handleError(error) {
    if (error.message.includes('No readings available')) {
        console.error('\nError: No recent glucose readings found');
        console.error('Please check if your Dexcom sensor is working properly');
    } else if (error.message.includes('Invalid credentials')) {
        console.error('\nError: Check your Dexcom Share username and password');
        console.error('Make sure Share is enabled in your Dexcom app');
    } else if (error.message.includes('Authentication failed')) {
        console.error('\nError: Could not connect to Dexcom');
        console.error('Please check:');
        console.error('1. Your internet connection');
        console.error('2. Dexcom Share status in your app');
        console.error('3. Your credentials');
    } else {
        console.error('\nUnexpected error:', error.message);
        console.error('Please try again or check Dexcom Share status');
    }
}

// Get credentials from command line or environment variables
const username = process.env.DEXCOM_USERNAME || process.argv[2];
const password = process.env.DEXCOM_PASSWORD || process.argv[3];
const region = process.env.DEXCOM_REGION || process.argv[4] || 'ous';

if (!username || !password) {
    console.log('Usage: node test.cjs USERNAME PASSWORD [REGION]');
    console.log('Regions: us, ous, jp');
    console.log('\nOr use environment variables:');
    console.log('DEXCOM_USERNAME=username DEXCOM_PASSWORD=password DEXCOM_REGION=region node test.cjs');
    process.exit(1);
}

test(username, password, region);