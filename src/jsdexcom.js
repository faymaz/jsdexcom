import https from 'https';

/**
 * JSdexcom - A Pure Node.js library for Dexcom Share API
 * Provides access to real-time CGM data with international support
 * Uses native HTTPS module without external dependencies
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
    JP: 'jp'   
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
    jp: 'https://shareous1.dexcom.com'
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
   * Make an HTTPS request using native Node.js https module
   * @param {Object} options - HTTPS request options
   * @param {Object} [data=null] - Request body data
   * @returns {Promise<Object>} Response object with status, ok, json(), and text() methods
   * @private
   */
  makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const response = {
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: () => JSON.parse(responseData),
            text: () => responseData
          };
          resolve(response);
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Parse URL and create options object for https.request
   * @param {string} url - Full URL to parse
   * @param {string} [method='GET'] - HTTP method
   * @param {Object} [extraHeaders={}] - Additional headers
   * @returns {Object} Options object for https.request
   * @private
   */
  parseUrl(url, method = 'GET', extraHeaders = {}) {
    const parsedUrl = new URL(url);
    return {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      port: 443,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dexcom Share/3.0.2.11',
        ...extraHeaders
      }
    };
  }

  /**
   * Authenticate with Dexcom Share server
   * Performs a two-step authentication process:
   * 1. Gets account ID using credentials
   * 2. Gets session ID using account ID
   * @returns {Promise<string>} Session ID for subsequent requests
   * @throws {Error} If authentication fails
   * @private
   */
  async authenticate() {
    try {
     
      if (!this.accountId) {
        console.log('Getting account ID...');
        const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;
        const authOptions = this.parseUrl(authUrl, 'POST');
        
        const response = await this.makeRequest(authOptions, {
          accountName: this.username,
          password: this.password,
          applicationId: this.applicationId
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
      const loginOptions = this.parseUrl(loginUrl, 'POST');
      
      const loginResponse = await this.makeRequest(loginOptions, {
        accountId: this.accountId,
        password: this.password,
        applicationId: this.applicationId
      });

      if (!loginResponse.ok) {
        throw new Error(`Session login failed: ${loginResponse.status}`);
      }

      this.sessionId = (await loginResponse.text()).replace(/"/g, '');
      
      if (this.sessionId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Login failed');
      }

      return this.sessionId;
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
  }

  /**
   * Get latest glucose reading with trend and delta analysis
   * @returns {Promise<Object>} Object containing current and previous readings with trend analysis
   * @throws {Error} If fetching readings fails
   */
  async getLatestGlucoseWithDelta() {
    if (!this.sessionId) {
      await this.authenticate();
    }

    try {
      console.log('Fetching glucose readings...');
      const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${this.sessionId}&minutes=10&maxCount=2`;
      const options = this.parseUrl(url, 'POST');
      const response = await this.makeRequest(options);

     
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
   * Get a single glucose reading without trend analysis
   * @returns {Promise<Object>} Latest glucose reading
   * @throws {Error} If fetching reading fails
   */
  async getLatestGlucose() {
    if (!this.sessionId) {
      await this.authenticate();
    }

    try {
      const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${this.sessionId}&minutes=10&maxCount=1`;
      const options = this.parseUrl(url, 'POST');
      const response = await this.makeRequest(options);

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
    } catch (error) {
      if (error.message.includes('SessionIdNotFound')) {
        this.sessionId = null;
        return this.getLatestGlucose();
      }
      throw error;
    }
  }

  /**
   * Format raw glucose reading data into a standardized format
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
      RateOutOfRange: '⚠️'
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
   * Values are based on standard medical guidelines:
   * - Below 70 mg/dL is considered LOW
   * - Above 180 mg/dL is considered HIGH
   * - Between 70-180 mg/dL is IN RANGE
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
   * Get human readable trend description based on delta value
   * Provides easy-to-understand descriptions of glucose trends
   * @param {number} delta - Change in glucose value (mg/dL)
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