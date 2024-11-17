![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=faymaz.jsdexcom)
# Language EN
**Author:** [faymaz](https://github.com/faymaz)
            [faymaz](https://www.npmjs.com/~faymaz)

# JSdexcom

A Node.js library for accessing Dexcom Share API, allowing you to fetch real-time CGM (Continuous Glucose Monitor) data. This library supports international Dexcom users with region-specific server endpoints.

## Installation

```bash
npm install jsdexcom
```

## Usage

```javascript
import JSDexcom from 'jsdexcom';

// Create a client (default region is 'ous')
const dexcom = new JSDexcom('YOUR_USERNAME', 'YOUR_PASSWORD');

// Get latest reading
try {
    const reading = await dexcom.getLatestGlucose();
    console.log(`Current glucose: ${reading._value} mg/dL`);
    console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
} catch (error) {
    console.error('Error:', error.message);
}
```
## 2.Import in your code:
```javascript
import JSDexcom from 'jsdexcom';

const dexcom = new JSDexcom('username', 'password', 'ous');
const reading = await dexcom.getLatestGlucose();

```
## 3.Run examples:
```bash
# Set environment variables
export DEXCOM_USERNAME=your-username
export DEXCOM_PASSWORD=your-password
export DEXCOM_REGION=ous

# Run example
npm run example
```
## License
MIT License
