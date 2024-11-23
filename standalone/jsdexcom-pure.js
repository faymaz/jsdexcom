/**
 * JSdexcom - A standalone JavaScript library for Dexcom Share API
 * Browser-compatible version using Fetch API
 * @class JSDexcom
 * @author faymaz
 * @version 2.1.0
 */
class JSDexcom {
  /**
   * Available region codes for Dexcom Share servers
   * @static
   * @readonly
   * @enum {string}
   */
  static Regions = {
    US: 'us',
    OUS: 'ous',
    JP: 'jp',
  };

  /**
   * Base URLs for different Dexcom Share regions
   * @static
   * @readonly
   * @enum {string}
   */
  static BaseUrls = {
    us: 'https://share2.dexcom.com',
    ous: 'https://shareous1.dexcom.com',
    jp: 'https://shareous1.dexcom.com',
  };

  /**
   * Create a new JSdexcom instance
   * @param {string} username - Dexcom Share username
   * @param {string} password - Dexcom Share password
   * @param {string} [region='ous'] - Region code (us, ous, jp)
   */
  constructor(username, password, region = 'ous') {
    this.username = username;
    this.password = password;
    this.region = region.toLowerCase();
    this.baseUrl = JSDexcom.BaseUrls[this.region] || JSDexcom.BaseUrls.ous;
    this.applicationId = 'd89443d2-327c-4a6f-89e5-496bbb0317db';
    this.sessionId = null;
    this.accountId = null;
  }

  /**
   * Make an HTTP request using Fetch API
   * @param {string} url - The URL to request
   * @param {Object} [options={}] - Request options
   * @param {Object} [data=null] - Request body data
   * @returns {Promise<Response>} Fetch Response object
   * @private
   */
  async httpRequest(url, options = {}, data = null) {
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dexcom Share/3.0.2.11',
        ...(options.headers || {})
      },
      ...(data && { body: JSON.stringify(data) })
    };

    return fetch(url, requestOptions);
  }

  /**
   * Authenticate with Dexcom Share server
   * @returns {Promise<string>} Session ID for subsequent requests
   * @throws {Error} If authentication fails
   */
  async authenticate() {
    try {
      // Step 1: Get account ID
      const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;
      const authResponse = await this.httpRequest(
        authUrl,
        { method: 'POST' },
        {
          accountName: this.username,
          password: this.password,
          applicationId: this.applicationId
        }
      );

      if (!authResponse.ok) {
        throw new Error(`Authentication failed: ${authResponse.status}`);
      }

      this.accountId = (await authResponse.text()).replace(/"/g, '');

      if (this.accountId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Invalid credentials');
      }

      // Step 2: Login with account ID
      const loginUrl = `${this.baseUrl}/ShareWebServices/Services/General/LoginPublisherAccountById`;
      const loginResponse = await this.httpRequest(
        loginUrl,
        { method: 'POST' },
        {
          accountId: this.accountId,
          password: this.password,
          applicationId: this.applicationId
        }
      );

      if (!loginResponse.ok) {
        throw new Error(`Login failed: ${loginResponse.status}`);
      }

      this.sessionId = (await loginResponse.text()).replace(/"/g, '');

      if (this.sessionId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Login failed: Invalid session');
      }

      return this.sessionId;
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  /**
   * Get latest glucose reading
   * @returns {Promise<Object>} Latest glucose reading with trend information
   * @throws {Error} If fetching reading fails
   */


  async getLatestGlucoseWithDelta() {
    if (!this.sessionId) {
        await this.authenticate();
    }

    try {
        const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues`;
        const params = new URLSearchParams({
            sessionId: this.sessionId,
            minutes: '10',
            maxCount: '2'  // Request 2 readings to calculate delta
        });

        const response = await this.httpRequest(`${url}?${params}`, { method: 'POST' });

        // Handle session expiration
        if (response.status === 500) {
            const error = await response.json();
            if (error.Code === 'SessionIdNotFound') {
                this.sessionId = null;
                return this.getLatestGlucoseWithDelta();
            }
            throw new Error(`Server error: ${error.Message}`);
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const readings = await response.json();
        if (!Array.isArray(readings) || readings.length === 0) {
            throw new Error('No readings available');
        }

        const current = this.formatReading(readings[0]);
        const previous = readings.length > 1 ? this.formatReading(readings[1]) : null;

        // Calculate delta and rate of change
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
            return this.getLatestGlucoseWithDelta();
        }
        throw error;
    }
}

    /**
     * Get human readable trend description based on delta
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



  async getLatestGlucose() {
    if (!this.sessionId) {
      await this.authenticate();
    }

    try {
      const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues`;
      const params = new URLSearchParams({
        sessionId: this.sessionId,
        minutes: '10',
        maxCount: '1'
      });

      const response = await this.httpRequest(`${url}?${params}`, { method: 'POST' });

      // Handle session expiration
      if (response.status === 500) {
        const error = await response.json();
        if (error.Code === 'SessionIdNotFound') {
          this.sessionId = null;
          return this.getLatestGlucose();
        }
        throw new Error(`Server error: ${error.Message}`);
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const readings = await response.json();
      if (!Array.isArray(readings) || readings.length === 0) {
        throw new Error('No readings available');
      }

      return this.formatReading(readings[0]);
    } catch (error) {
      if (error.message.includes('SessionIdNotFound')) {
        this.sessionId = null;
        return this.getLatestGlucose();
      }
      throw error;
    }
  }

  /**
   * Format raw glucose reading data
   * @param {Object} reading - Raw reading from Dexcom
   * @returns {Object} Formatted reading with trend arrows and datetime
   * @private
   */
  formatReading(reading) {
    const TREND_ARROWS = {
      None: '→',
      DoubleUp: '↑↑',
      SingleUp: '↑',
      FortyFiveUp: '↗',
      Flat: '→',
      FortyFiveDown: '↘',
      SingleDown: '↓',
      DoubleDown: '↓↓',
      NotComputable: '?',
      RateOutOfRange: '⚠️',
    };

    return {
      _json: {
        WT: reading.WT,
        ST: reading.ST,
        DT: reading.DT,
        Value: reading.Value,
        Trend: reading.Trend,
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
}

// Standalone usage example
if (typeof process !== 'undefined' && process.env.DEXCOM_USERNAME && process.env.DEXCOM_PASSWORD) {
  const dexcom = new JSDexcom(process.env.DEXCOM_USERNAME, process.env.DEXCOM_PASSWORD);
  dexcom.getLatestGlucoseWithDelta()
      .then(result => {
          console.log('\nCurrent Reading:');
          console.log(`Glucose: ${result.current._value} mg/dL ${result.current._trend_arrow}`);
          console.log(`Status: ${result.current._status}`);
          console.log(`Time: ${result.current._datetime.toLocaleString()}`);
          console.log(`Change: ${result.current._delta !== null ? (result.current._delta > 0 ? '+' : '') + result.current._delta + ' mg/dL' : 'N/A'}`);
          console.log(`Rate: ${result.current._rate_of_change !== null ? result.current._rate_of_change.toFixed(2) + ' mg/dL/min' : 'N/A'}`);
          console.log(`Trend: ${result.current._trend_description}`);

          if (result.previous) {
              console.log('\nPrevious Reading:');
              console.log(`Glucose: ${result.previous._value} mg/dL ${result.previous._trend_arrow}`);
              console.log(`Time: ${result.previous._datetime.toLocaleString()}`);
          }
      })
      .catch(error => console.error('Error:', error.message));
}