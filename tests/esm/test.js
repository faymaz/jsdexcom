import JSDexcom from '../../src/jsdexcom.js';

async function test() {
  try {
    console.log('Creating Dexcom client...');
    const dexcom = new JSDexcom(process.env.DEXCOM_USERNAME, process.env.DEXCOM_PASSWORD, 'ous');

    console.log('Fetching glucose reading...');
    const reading = await dexcom.getLatestGlucose();

    console.log('\nLatest Reading:');
    console.log('--------------');
    console.log(`Value: ${reading._value} mg/dL`);
    console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
    console.log(`Time: ${reading._datetime.toLocaleString()}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (process.argv.includes('--skip-auth')) {
  console.log('Skipping authentication test');
  process.exit(0);
}

// Check for environment variables
if (!process.env.DEXCOM_USERNAME || !process.env.DEXCOM_PASSWORD) {
  console.log('Please set DEXCOM_USERNAME and DEXCOM_PASSWORD environment variables');
  console.log('Example: DEXCOM_USERNAME=username DEXCOM_PASSWORD=password npm test');
  process.exit(1);
}

test();
