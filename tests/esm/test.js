/**
 * JSdexcom ESM Test
 */
import JSDexcom from '../../src/jsdexcom.js';

async function test() {
    try {
        console.log('Starting test...');
        console.log('Initializing client...');
        
        const dexcom = new JSDexcom(
            process.env.DEXCOM_USERNAME,
            process.env.DEXCOM_PASSWORD,
            'ous'
        );
        
        console.log('Fetching glucose reading...');
        const result = await dexcom.getLatestGlucoseWithDelta();
        
        console.log('\nCurrent Reading:');
        console.log('--------------');
        console.log(`Value: ${result.current._value} mg/dL`);
        console.log(`Trend: ${result.current._trend_arrow} (${result.current._trend_direction})`);
        console.log(`Time: ${result.current._datetime.toLocaleString()}`);

        if (result.current._delta !== null) {
            console.log('\nTrend Analysis:');
            console.log('--------------');
            console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
            console.log(`Time Span: ${result.current._delta_time.toFixed(1)} minutes`);
            console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
            console.log(`Description: ${result.current._trend_description}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Add timeout
const timeout = setTimeout(() => {
    console.error('\nTimeout: Request took too long');
    process.exit(1);
}, 30000);

// Run test and clear timeout
test()
    .then(() => {
        clearTimeout(timeout);
        process.exit(0);
    })
    .catch(error => {
        clearTimeout(timeout);
        console.error('Failed:', error);
        process.exit(1);
    });