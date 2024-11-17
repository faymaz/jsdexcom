(async () => {
  const JSDexcom = (await import('../../src/jsdexcom.js')).default;

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
})();
