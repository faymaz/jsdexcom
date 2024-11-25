![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=faymaz.jsdexcom)

# Language EN

**Author:** [faymaz](https://www.npmjs.com/~faymaz)

# @faymaz/jsdexcom

Node.js library for accessing Dexcom Share API with international support. This library allows you to fetch real-time CGM (Continuous Glucose Monitor) data from Dexcom Share servers.

This extension is not affiliated, funded, or in any way associated with Dexcom.

## Requirements

- Node.js 18 or higher (for built-in fetch support)
- Active Dexcom Share account
- Share feature enabled in Dexcom mobile app

## Installation

```bash
npm install @faymaz/jsdexcom
```

## Usage

### Basic Usage - Latest Version
test.js
```javascript
import JSDexcom from '@faymaz/jsdexcom';

async function monitorGlucose() {
    // Create instance
    const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');

    try {
        // Get reading with trend analysis
        const result = await dexcom.getLatestGlucoseWithDelta();

        console.log(`Current: ${result.current._value} mg/dL`);
        console.log(`Change: ${result.current._delta} mg/dL`);
        console.log(`Trend: ${result.current._trend_description}`);
        console.log(`Rate: ${result.current._rate_of_change} mg/dL/min`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}
monitorGlucose();
```

```bash
node --experimental-fetch test.js
```

or

```bash
npm install node-fetch
```

### Detailed error handling - Latest Version
```javascript
import JSDexcom from '@faymaz/jsdexcom';

// Basic glucose reading with full error handling
async function getDexcomData() {
    try {
        // Create client (default region is 'ous')
        const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');
        
        // Get reading with delta
        const result = await dexcom.getLatestGlucoseWithDelta();
        
        // Display current reading
        console.log(`Current glucose: ${result.current._value} mg/dL`);
        console.log(`Trend: ${result.current._trend_arrow} (${result.current._trend_direction})`);
        console.log(`Time: ${result.current._datetime.toLocaleString()}`);
        
        // Display delta information if available
        if (result.current._delta !== null) {
            console.log(`Change: ${result.current._delta} mg/dL`);
            console.log(`Rate: ${result.current._rate_of_change} mg/dL/min`);
            console.log(`Trend: ${result.current._trend_description}`);
        }

    } catch (error) {
        // Handle specific error types
        if (error.message.includes('No readings available')) {
            console.error('No recent glucose readings found');
        } else if (error.message.includes('Invalid credentials')) {
            console.error('Check your Dexcom Share username and password');
        } else if (error.message.includes('Authentication failed')) {
            console.error('Could not connect to Dexcom. Check your internet connection');
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Extended example with monitoring
async function monitorGlucose(intervalMinutes = 5) {
    try {
        const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');
        
        // Continuous monitoring
        setInterval(async () => {
            try {
                const result = await dexcom.getLatestGlucoseWithDelta();
                
                // Log current reading
                console.log('\nNew Reading:');
                console.log(`Time: ${result.current._datetime.toLocaleString()}`);
                console.log(`Value: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
                
                // Check if we have trend data
                if (result.current._delta !== null) {
                    console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
                }
                
                // Alert conditions
                if (result.current._value < 70) {
                    console.error('⚠️ LOW GLUCOSE ALERT!');
                } else if (result.current._value > 180) {
                    console.error('⚠️ HIGH GLUCOSE ALERT!');
                }
                
                if (result.current._rate_of_change < -3) {
                    console.warn('⚠️ Dropping quickly!');
                } else if (result.current._rate_of_change > 3) {
                    console.warn('⚠️ Rising quickly!');
                }
                
            } catch (error) {
                console.error('Monitoring error:', error.message);
                // Continue monitoring despite errors
            }
        }, intervalMinutes * 60 * 1000);
        
    } catch (error) {
        console.error('Failed to start monitoring:', error.message);
    }
}

// Usage examples:
// Get single reading
getDexcomData();

// Start continuous monitoring (every 5 minutes)
monitorGlucose(5);
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

## CommonJS Usage (Node.js < 18)

For older Node.js versions, you'll need to install and use node-fetch:

```bash
npm install node-fetch
```

```javascript
const fetch = require('node-fetch');
const JSDexcom = require('@faymaz/jsdexcom');
```


## Standalone Version

You can also use the standalone version without npm. Check the [GitHub repository](https://github.com/faymaz/jsdexcom) for more information.

## License

MIT

## Author

faymaz - [GitHub](https://github.com/faymaz)

## Disclaimer

This project is not affiliated with Dexcom, Inc. Use at your own risk. Always verify glucose values using your official Dexcom receiver or app.
