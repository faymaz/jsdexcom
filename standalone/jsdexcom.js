/**
 * JSdexcom - A Node.js library for Dexcom Share API
 * Provides access to real-time CGM data with international support
 * @class JSDexcom
 * @author faymaz
 * @version 2.1.0
 * Available regions for Dexcom servers
 * @static
 * @readonly
 * Create a new JSdexcom instance
 * @param {string} username - Dexcom Share username
 * @param {string} password - Dexcom Share password
 * @param {string} [region='ous'] - Region code (us, ous, jp)
 * static BaseUrls = {
   'us': 'https://share2.dexcom.com',
   'ous': 'https://shareous1.dexcom.com',
   'jp': 'https://shareous1.dexcom.com'
    };
 */

class JSDexcom {
  constructor(username, password, region = 'ous') {
    this.username = username;
    this.password = password;
    this.region = region.toLowerCase();
    this.baseUrl = region.toLowerCase() === 'us' 
        ? 'https://share2.dexcom.com'
        : 'https://shareous1.dexcom.com';
    this.applicationId = 'd89443d2-327c-4a6f-89e5-496bbb0317db';
    this.sessionId = null;
    this.accountId = null; 
}
  /**
   * Authenticate with Dexcom Share server
   * @returns {Promise<string>} Session ID for subsequent requests
   * @throws {Error} If authentication fails
   * @private
   */
  async authenticate() {
   
    if (!this.accountId) {
        console.log('Getting account ID...');
        const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;
        
        const response = await fetch(authUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Dexcom Share/3.0.2.11'
            },
            body: JSON.stringify({
                accountName: this.username,
                password: this.password,
                applicationId: this.applicationId
            })
        });

        if (!response.ok) {
            throw new Error(`Account authentication failed: ${response.status}`);
        }

        this.accountId = (await response.text()).replace(/"/g, '');
        
        if (this.accountId === '00000000-0000-0000-0000-000000000000') {
            throw new Error('Invalid credentials');
        }
    }

   
    console.log('Getting session ID...');
    const loginUrl = `${this.baseUrl}/ShareWebServices/Services/General/LoginPublisherAccountById`;
    
    const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Dexcom Share/3.0.2.11'
        },
        body: JSON.stringify({
            accountId: this.accountId,
            password: this.password,
            applicationId: this.applicationId
        })
    });

    if (!loginResponse.ok) {
        throw new Error(`Session login failed: ${loginResponse.status}`);
    }

    this.sessionId = (await loginResponse.text()).replace(/"/g, '');
    
    if (this.sessionId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Login failed');
    }

    return this.sessionId;
}
  /**
   * Get latest glucose reading with delta calculation
   * @returns {Promise<Object>} Object containing current and previous readings with trend analysis
   * @throws {Error} If fetching readings fails
   */
  async getLatestGlucoseWithDelta() {
    if (!this.sessionId) {
        await this.authenticate();
    }

    const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues`;
    const params = new URLSearchParams({
        sessionId: this.sessionId,
        minutes: '10',
        maxCount: '2'
    });

    try {
        console.log('Fetching glucose readings...');
        const response = await fetch(`${url}?${params}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Dexcom Share/3.0.2.11'
            }
        });

       
        if (response.status === 500) {
            const error = await response.json();
            if (error.Code === 'SessionIdNotFound') {
                this.sessionId = null; 
                await this.authenticate(); 
                return this.getLatestGlucoseWithDelta();
            }
            throw new Error(`Server error: ${error.Message}`);
        }

        if (!response.ok) {
            throw new Error(`Failed to get readings: ${response.status}`);
        }

        const readings = await response.json();
        if (!Array.isArray(readings) || readings.length === 0) {
            throw new Error('No readings available');
        }

        const current = this.formatReading(readings[0]);
        const previous = readings.length > 1 ? this.formatReading(readings[1]) : null;

        const delta = previous ? current._value - previous._value : null;
        const deltaTime = previous ? 
            (current._datetime.getTime() - previous._datetime.getTime()) / (1000 * 60) :
            null;

        return {
            current: {
                ...current,
                _delta: delta,
                _delta_time: deltaTime,
                _previous_value: previous?._value,
                _rate_of_change: deltaTime ? (delta / deltaTime) : null,
                _trend_description: this.getTrendDescription(delta)
            },
            previous: previous
        };

    } catch (error) {
       
        if (error.message.includes('SessionIdNotFound')) {
            this.sessionId = null;
            this.accountId = null; 
            await this.authenticate();
            return this.getLatestGlucoseWithDelta();
        }
        throw error;
    }
}

  /**
   * Get a single glucose reading
   * @returns {Promise<Object>} Latest glucose reading
   * @throws {Error} If fetching reading fails
   */
  async getLatestGlucose() {
      if (!this.sessionId) {
          await this.authenticate();
      }

      const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues`;
      const params = new URLSearchParams({
          sessionId: this.sessionId,
          minutes: '10',
          maxCount: '1'
      });

      const response = await fetch(`${url}?${params}`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'Dexcom Share/3.0.2.11'
          }
      });

      if (response.status === 500) {
          const error = await response.json();
          if (error.Code === 'SessionIdNotFound') {
              this.sessionId = null;
              return this.getLatestGlucose();
          }
          throw new Error(`Server error: ${error.Message}`);
      }

      if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
      }

      const readings = await response.json();
      if (!Array.isArray(readings) || readings.length === 0) {
          throw new Error('No readings available');
      }

      return this.formatReading(readings[0]);
  }

  /**
   * Format raw glucose reading data
   * @param {Object} reading - Raw reading from Dexcom
   * @returns {Object} Formatted reading with additional information
   * @private
   */
  formatReading(reading) {
      const TREND_ARROWS = {
          'None': '→',
          'DoubleUp': '↑↑',
          'SingleUp': '↑',
          'FortyFiveUp': '↗',
          'Flat': '→',
          'FortyFiveDown': '↘',
          'SingleDown': '↓',
          'DoubleDown': '↓↓',
          'NotComputable': '?',
          'RateOutOfRange': '⚠️'
      };

      return {
          _json: {
              WT: reading.WT,
              ST: reading.ST,
              DT: reading.DT,
              Value: reading.Value,
              Trend: reading.Trend
          },
          _value: reading.Value,
          _trend_direction: reading.Trend,
          _trend_arrow: TREND_ARROWS[reading.Trend] || '?',
          _datetime: new Date(parseInt(reading.WT.match(/\d+/)[0])),
          _status: this.getGlucoseStatus(reading.Value)
      };
  }

  /**
   * Get glucose status based on value
   * @param {number} value - Glucose value in mg/dL
   * @returns {string} Status description (LOW, HIGH, or IN RANGE)
   * @private
   */
  getGlucoseStatus(value) {
      if (value < 70) return 'LOW';
      if (value > 180) return 'HIGH';
      return 'IN RANGE';
  }

  /**
   * Get human readable trend description
   * @param {number} delta - Change in glucose value
   * @returns {string} Trend description
   * @private
   */
  getTrendDescription(delta) {
      if (delta === null) return 'Unknown';
      if (delta > 15) return 'Rising quickly';
      if (delta > 7) return 'Rising';
      if (delta > 3) return 'Rising slowly';
      if (delta >= -3) return 'Stable';
      if (delta >= -7) return 'Dropping slowly';
      if (delta >= -15) return 'Dropping';
      return 'Dropping quickly';
  }
}

export default JSDexcom;