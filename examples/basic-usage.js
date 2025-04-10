import JSDexcom from '../index.js';

async function main() {
 
  const username = process.env.DEXCOM_USERNAME;
  const password = process.env.DEXCOM_PASSWORD;
  const region = process.env.DEXCOM_REGION || 'ous';

  if (!username || !password) {
    console.log('Please set DEXCOM_USERNAME and DEXCOM_PASSWORD environment variables');
    console.log('Example:');
    console.log(
      '  DEXCOM_USERNAME=your-username DEXCOM_PASSWORD=your-password node examples/basic-usage.js'
    );
    process.exit(1);
  }

  try {
   
    const dexcom = new JSDexcom(username, password, region);

   
    const reading = await dexcom.getLatestGlucose();

   
    console.log('\nCurrent Glucose Reading:');
    console.log('------------------------');
    console.log(`Value: ${reading._value} mg/dL`);
    console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
    console.log(`Time: ${reading._datetime.toLocaleString()}`);

    const status = reading._value < 70 ? '⚠️ LOW' : reading._value > 180 ? '⚠️ HIGH' : '✓ IN RANGE';
    console.log(`Status: ${status}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
