![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=faymaz.jsdexcom)

# Language EN

**Author:** [faymaz](https://www.npmjs.com/~faymaz)

# @faymaz/jsdexcom

Node.js library for accessing Dexcom Share API with international support. This library allows you to fetch real-time CGM (Continuous Glucose Monitor) data from Dexcom Share servers.

## Installation

```bash
npm install @faymaz/jsdexcom
```

## Usage

### Basic Usage

```javascript
import JSDexcom from '@faymaz/jsdexcom';

// Create client (default region is 'ous')
const dexcom = new JSDexcom('YOUR_USERNAME', 'YOUR_PASSWORD');

try {
  const reading = await dexcom.getLatestGlucose();
  console.log(`Current glucose: ${reading._value} mg/dL`);
  console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
  console.log(`Time: ${reading._datetime.toLocaleString()}`);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Region-Specific Usage

```javascript
// For US users
const dexcomUS = new JSDexcom('USERNAME', 'PASSWORD', 'us');

// For International users (default)
const dexcomOUS = new JSDexcom('USERNAME', 'PASSWORD', 'ous');

// For Japan users
const dexcomJP = new JSDexcom('USERNAME', 'PASSWORD', 'jp');
```

### Response Format

```javascript
{
    _json: {
        WT: "Date timestamp",
        ST: "Date timestamp",
        DT: "Date timestamp",
        Value: 120,
        Trend: "Flat"
    },
    _value: 120,              // Glucose value in mg/dL
    _trend_direction: "Flat", // Text description of trend
    _trend_arrow: "→",       // Visual representation of trend
    _datetime: Date          // JavaScript Date object
}
```

### Trend Arrows

| Trend          | Arrow | Description            |
| -------------- | ----- | ---------------------- |
| None           | →     | No trend               |
| DoubleUp       | ↑↑    | Rising quickly         |
| SingleUp       | ↑     | Rising                 |
| FortyFiveUp    | ↗    | Rising slowly          |
| Flat           | →     | Stable                 |
| FortyFiveDown  | ↘    | Falling slowly         |
| SingleDown     | ↓     | Falling                |
| DoubleDown     | ↓↓    | Falling quickly        |
| NotComputable  | ?     | Cannot determine trend |
| RateOutOfRange | ⚠️    | Rate of change unknown |

## Environment Variables

You can use environment variables for configuration:

```bash
DEXCOM_USERNAME=your-username
DEXCOM_PASSWORD=your-password
DEXCOM_REGION=ous  # or 'us' or 'jp'
```

## Error Handling

```javascript
try {
  const dexcom = new JSDexcom('USERNAME', 'PASSWORD');
  const reading = await dexcom.getLatestGlucose();
  // ... handle reading
} catch (error) {
  if (error.message.includes('Invalid credentials')) {
    console.error('Check your username and password');
  } else if (error.message.includes('No readings available')) {
    console.error('No recent glucose readings found');
  } else {
    console.error('Error:', error.message);
  }
}
```

## Examples

### Monitor Glucose Levels

```javascript
import JSDexcom from '@faymaz/jsdexcom';

async function monitorGlucose() {
  const dexcom = new JSDexcom('USERNAME', 'PASSWORD');

  setInterval(
    async () => {
      try {
        const reading = await dexcom.getLatestGlucose();
        console.log(
          `${reading._datetime.toLocaleTimeString()}: ${reading._value} mg/dL ${reading._trend_arrow}`
        );

        if (reading._value < 70) {
          console.log('⚠️ LOW glucose alert!');
        } else if (reading._value > 180) {
          console.log('⚠️ HIGH glucose alert!');
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    },
    5 * 60 * 1000
  ); // Check every 5 minutes
}

monitorGlucose();
```

## Standalone Version

You can also use the standalone version without npm. Check the [GitHub repository](https://github.com/faymaz/jsdexcom) for more information.

## License

MIT

## Author

faymaz - [GitHub](https://github.com/faymaz)

## Disclaimer

This project is not affiliated with Dexcom, Inc. Use at your own risk. Always verify glucose values using your official Dexcom receiver or app.
