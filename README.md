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

You can also use standalone

# # JSdexcom

A Node.js library for accessing Dexcom Share API, allowing you to fetch real-time CGM (Continuous Glucose Monitor) data. This library supports international Dexcom users with region-specific server endpoints.

## Features

- 🌐 Support for multiple regions (US, OUS, Japan)
- 📊 Real-time glucose readings with trend information
- 🔐 Secure authentication flow
- ⚡ Automatic session management
- 🔄 Automatic retry on session expiration
- 📈 Trend arrow visualization
- 💉 Blood glucose status indicators

## Installation

1. Clone the repository:
```bash
git clone https://github.com/faymaz/jsdexcom.js.git
cd jsdexcom.js
```

2. Install dependencies:
```bash
npm install node-fetch
```

## Usage

### Basic Usage

```javascript
import DexcomShare from './jsdexcom.js';

// Create a client (default region is 'ous')
const dexcom = new DexcomShare('YOUR_USERNAME', 'YOUR_PASSWORD');

// Get latest reading
try {
    const reading = await dexcom.getLatestGlucose();
    console.log(`Current glucose: ${reading._value} mg/dL`);
    console.log(`Trend: ${reading._trend_arrow} (${reading._trend_direction})`);
} catch (error) {
    console.error('Error:', error.message);
}
```

### Specify Region

```javascript
// For US users
const dexcom = new DexcomShare('USERNAME', 'PASSWORD', 'us');

// For International users
const dexcom = new DexcomShare('USERNAME', 'PASSWORD', 'ous');

// For Japan users
const dexcom = new DexcomShare('USERNAME', 'PASSWORD', 'jp');
```

### Using the Test Script

The repository includes a test script to verify your connection:

```bash
# Basic usage (defaults to OUS region)
node test.js YOUR_USERNAME YOUR_PASSWORD

# Specify region
node test.js YOUR_USERNAME YOUR_PASSWORD us
node test.js YOUR_USERNAME YOUR_PASSWORD ous
node test.js YOUR_USERNAME YOUR_PASSWORD jp

# Using environment variable for region
DEXCOM_REGION=ous node test.js YOUR_USERNAME YOUR_PASSWORD
```

### Sample Output

```
=== Dexcom Share Test ===
Region: OUS
Server: https://shareous1.dexcom.com

✓ Connection successful!

=== Glucose Reading ===
Value: 111 mg/dL
Trend: ↘ (FortyFiveDown)
Time: 11/17/2024, 1:29:04 AM
Status: ✓ IN RANGE

=== Connection Info ===
Server: https://shareous1.dexcom.com
Last update: 11/17/2024, 1:34:01 AM
Session ID: fe70c955...
```

## API Reference

### DexcomShare Class

#### Constructor
```javascript
const dexcom = new DexcomShare(username, password, region = 'ous')
```

#### Methods

- `authenticate()`: Authenticates with Dexcom servers
- `getLatestGlucose()`: Gets the latest glucose reading

#### Response Format

The `getLatestGlucose()` method returns an object with:

```javascript
{
    _json: {
        WT: "Date timestamp",
        ST: "Date timestamp",
        DT: "Date timestamp",
        Value: 111,
        Trend: "TrendString"
    },
    _value: 111,              // Glucose value in mg/dL
    _trend_direction: "Trend", // Text description of trend
    _trend: 5,                // Numeric trend value
    _datetime: Date,          // JavaScript Date object
    _trend_arrow: "↘"         // Visual representation of trend
}
```

#### Trend Values

| Trend | Arrow | Description |
|-------|-------|-------------|
| 0 | → | None |
| 1 | ↑↑ | Double Up |
| 2 | ↑ | Single Up |
| 3 | ↗ | Forty Five Up |
| 4 | → | Flat |
| 5 | ↘ | Forty Five Down |
| 6 | ↓ | Single Down |
| 7 | ↓↓ | Double Down |
| 8 | ? | Not Computable |
| 9 | ⚠️ | Rate Out Of Range |

## Region Support

| Region | Code | Server |
|--------|------|---------|
| United States | `us` | share2.dexcom.com |
| Outside US | `ous` | shareous1.dexcom.com |
| Japan | `jp` | shareous1.dexcom.com |

## Error Handling

The library includes comprehensive error handling:
- Authentication failures
- Session expiration
- Network errors
- Invalid regions
- Missing or invalid readings

## Requirements

- Node.js 14 or higher
- Active Dexcom Share account
- Share feature enabled in Dexcom mobile app

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Inspired by:
- [pydexcom](https://github.com/gagebenne/pydexcom)

## License

MIT License

## Disclaimer

This project is not affiliated with Dexcom, Inc. Use at your own risk. Do not use this library for making medical decisions. Always verify glucose values using your official Dexcom receiver or app.