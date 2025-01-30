![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=faymaz.jsdexcom)

# Language EN

**Author:** [faymaz](https://www.npmjs.com/~faymaz)

# @faymaz/jsdexcom

Node.js library for accessing Dexcom Share API with international support. This library allows you to fetch real-time CGM (Continuous Glucose Monitor) data from Dexcom Share servers.

This extension is not affiliated, funded, or in any way associated with Dexcom.

## Requirements

- Node.js 18 or higher
- Active Dexcom Share account
- Share feature enabled in Dexcom mobile app

## Installation

```bash
npm install @faymaz/jsdexcom
```

## Usage

### Basic Usage - Latest Version
```javascript
import JSDexcom from '@faymaz/jsdexcom';

async function monitorGlucose() {
    // Create instance
    const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');

    try {
        // Get reading with trend analysis
        const result = await dexcom.getLatestGlucoseWithDelta();

        console.log(`Current: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
        console.log(`Change: ${result.current._delta} mg/dL`);
        console.log(`Trend: ${result.current._trend_description}`);
        console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
        console.log(`Status: ${result.current._status}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}
```

### Package.json Configuration
```json
{
  "type": "module",
  "dependencies": {
    "@faymaz/jsdexcom": "*"
  }
}
```

### Detailed Example with Delta Analysis
```javascript
import JSDexcom from '@faymaz/jsdexcom';

async function getDexcomData() {
    try {
        // Create client (default region is 'ous')
        const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');
        
        // Get reading with delta analysis
        const result = await dexcom.getLatestGlucoseWithDelta();
        
        // Current reading
        console.log('\nCurrent Reading:');
        console.log(`Value: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
        console.log(`Time: ${result.current._datetime.toLocaleString()}`);
        console.log(`Status: ${result.current._status}`);
        
        // Delta information
        if (result.current._delta !== null) {
            console.log('\nTrend Analysis:');
            console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
            console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
            console.log(`Trend: ${result.current._trend_description}`);
            
            console.log('\nPrevious Reading:');
            console.log(`Value: ${result.previous._value} mg/dL ${result.previous._trend_arrow}`);
            console.log(`Time: ${result.previous._datetime.toLocaleString()}`);
        }

    } catch (error) {
        handleError(error);
    }
}

function handleError(error) {
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
```

### Continuous Monitoring Example
```javascript
async function monitorGlucose(intervalMinutes = 5) {
    try {
        const dexcom = new JSDexcom('USERNAME', 'PASSWORD', 'ous');
        
        setInterval(async () => {
            try {
                const result = await dexcom.getLatestGlucoseWithDelta();
                
                // Display current reading
                console.log('\nNew Reading:');
                console.log(`Time: ${result.current._datetime.toLocaleString()}`);
                console.log(`Value: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
                console.log(`Status: ${result.current._status}`);
                
                if (result.current._delta !== null) {
                    console.log(`Change: ${result.current._delta > 0 ? '+' : ''}${result.current._delta} mg/dL`);
                    console.log(`Rate: ${result.current._rate_of_change.toFixed(2)} mg/dL/min`);
                    console.log(`Trend: ${result.current._trend_description}`);
                }
                
                // Alerts
                if (result.current._status === 'LOW') {
                    console.error('⚠️ LOW GLUCOSE ALERT!');
                } else if (result.current._status === 'HIGH') {
                    console.error('⚠️ HIGH GLUCOSE ALERT!');
                }
                
                if (Math.abs(result.current._rate_of_change) > 3) {
                    console.warn('⚠️ Rapid glucose change detected!');
                }
                
            } catch (error) {
                console.error('Monitoring error:', error.message);
            }
        }, intervalMinutes * 60 * 1000);
        
    } catch (error) {
        console.error('Failed to start monitoring:', error.message);
    }
}

// Start monitoring every 5 minutes
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
    current: {
        _json: {
            WT: "Date timestamp",
            ST: "Date timestamp",
            DT: "Date timestamp",
            Value: 120,
            Trend: "Flat"
        },
        _value: 120,                // Glucose value in mg/dL
        _trend_direction: "Flat",   // Text description of trend
        _trend_arrow: "→",         // Visual representation of trend
        _datetime: Date,           // JavaScript Date object
        _status: "IN RANGE",       // LOW, HIGH, or IN RANGE
        _delta: 5,                 // Change from previous reading in mg/dL
        _delta_time: 5,            // Time since previous reading in minutes
        _rate_of_change: 1.0,      // Rate of change in mg/dL/min
        _trend_description: "Rising slowly" // Human-readable trend description
    },
    previous: {
        // Previous reading with same format as above (without delta fields)
    }
}
```

### Trend Arrows

| Trend          | Arrow | Description            |
| -------------- | ----- | ---------------------- |
| None           | →     | No trend               |
| DoubleUp       | ↑↑    | Rising quickly         |
| SingleUp       | ↑     | Rising                 |
| FortyFiveUp    | ↗     | Rising slowly          |
| Flat           | →     | Stable                 |
| FortyFiveDown  | ↘     | Falling slowly         |
| SingleDown     | ↓     | Falling                |
| DoubleDown     | ↓↓    | Falling quickly        |
| NotComputable  | ?     | Cannot determine trend |
| RateOutOfRange | ⚠️    | Rate of change unknown |

### Trend Descriptions

| Delta Range (mg/dL) | Description      |
| ------------------ | ---------------- |
| > +15              | Rising quickly   |
| +7 to +15          | Rising          |
| +3 to +7           | Rising slowly    |
| -3 to +3           | Stable          |
| -7 to -3           | Dropping slowly  |
| -15 to -7          | Dropping        |
| < -15              | Dropping quickly |

## Environment Variables

You can use environment variables for configuration:

```bash
DEXCOM_USERNAME=your-username
DEXCOM_PASSWORD=your-password
DEXCOM_REGION=ous  # or 'us' or 'jp'
```

## Command Line Testing

```bash
# Create test file (test.js)
import JSDexcom from '@faymaz/jsdexcom';

async function test() {
    const dexcom = new JSDexcom(
        process.env.DEXCOM_USERNAME,
        process.env.DEXCOM_PASSWORD,
        process.env.DEXCOM_REGION || 'ous'
    );
    
    const result = await dexcom.getLatestGlucoseWithDelta();
    console.log(JSON.stringify(result, null, 2));
}

test();

# Run test
DEXCOM_USERNAME=xxx DEXCOM_PASSWORD=yyy node test.js
```

## License

MIT

## Author

faymaz - [GitHub](https://github.com/faymaz)

## Disclaimer

This project is not affiliated with Dexcom, Inc. Use at your own risk. Always verify glucose values using your official Dexcom receiver or app.