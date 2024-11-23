/**
 * JSdexcom CommonJS Test
 * Tests the module in CommonJS format with dynamic import
 */
(async () => {
  const JSDexcom = (await import('../../src/jsdexcom.js')).default;

  async function test() {
      try {
          console.log('Creating Dexcom client...');
          const dexcom = new JSDexcom(
              process.env.DEXCOM_USERNAME,
              process.env.DEXCOM_PASSWORD,
              'ous'
          );
          
          console.log('Fetching glucose reading...');
          const result = await dexcom.getLatestGlucoseWithDelta();
          
          // Display current reading
          console.log('\nCurrent Reading:');
          console.log('--------------');
          console.log(`Value: ${result.current._value} mg/dL`);
          console.log(`Trend: ${result.current._trend_arrow} (${result.current._trend_direction})`);
          console.log(`Time: ${result.current._datetime.toLocaleString()}`);
          console.log(`Status: ${result.current._status}`);

          // Display delta information if available
          if (result.current._delta !== null) {
              console.log('\nTrend Analysis:');
              console.log('--------------');
              console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
              console.log(`Time Span: ${result.current._delta_time.toFixed(1)} minutes`);
              console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
              console.log(`Trend: ${result.current._trend_description}`);

              console.log('\nPrevious Reading:');
              console.log(`Value: ${result.previous._value} mg/dL`);
              console.log(`Time: ${result.previous._datetime.toLocaleString()}`);
          } else {
              console.log('\nNo previous reading available for trend analysis');
          }

          // Check for alerts
          if (result.current._value < 70) {
              console.error('\n⚠️ LOW GLUCOSE ALERT!');
          } else if (result.current._value > 180) {
              console.error('\n⚠️ HIGH GLUCOSE ALERT!');
          }
          
      } catch (error) {
          if (error.message.includes('No readings available')) {
              console.error('Error: No recent glucose readings found');
          } else if (error.message.includes('Invalid credentials')) {
              console.error('Error: Check your Dexcom Share username and password');
          } else if (error.message.includes('Authentication failed')) {
              console.error('Error: Could not connect to Dexcom. Check your internet connection');
          } else {
              console.error('Error:', error.message);
          }
          process.exit(1);
      }
  }

  // Run the test
  test();
})();