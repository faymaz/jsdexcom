import JSDexcom from '../index.js';

// Example comparing glucose readings across different regions
async function compareRegions() {
  // Get credentials from environment variables
  const username = process.env.DEXCOM_USERNAME;
  const password = process.env.DEXCOM_PASSWORD;

  if (!username || !password) {
    console.log('\nPlease set environment variables:');
    console.log(
      'DEXCOM_USERNAME=your-username DEXCOM_PASSWORD=your-password node examples/region-specific.js'
    );
    process.exit(1);
  }

  // Test each region
  console.log('\nTesting Dexcom Share across regions...');
  console.log('====================================\n');

  const regions = {
    'United States': 'us',
    'Outside US': 'ous',
    Japan: 'jp',
  };

  for (const [regionName, regionCode] of Object.entries(regions)) {
    try {
      console.log(`Testing ${regionName} (${regionCode.toUpperCase()}):`);
      console.log('-'.repeat(40));

      const dexcom = new JSDexcom(username, password, regionCode);
      const reading = await dexcom.getLatestGlucose();

      console.log(`Server: ${dexcom.baseUrl}`);
      console.log(`Glucose: ${reading._value} mg/dL ${reading._trend_arrow}`);
      console.log(`Trend: ${reading._trend_direction}`);
      console.log(`Time: ${reading._datetime.toLocaleString()}`);

      const status =
        reading._value < 70 ? '⚠️ LOW' : reading._value > 180 ? '⚠️ HIGH' : '✓ IN RANGE';
      console.log(`Status: ${status}`);
      console.log();
    } catch (error) {
      console.log(`❌ Error with ${regionName}: ${error.message}\n`);
    }
  }
}

// Run the comparison
compareRegions().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
