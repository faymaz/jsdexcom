import fetch from 'node-fetch';

class JSDexcom {
  static Regions = {
    US: 'us',
    OUS: 'ous',
    JP: 'jp',
  };

  static BaseUrls = {
    us: 'https://share2.dexcom.com',
    ous: 'https://shareous1.dexcom.com',
    jp: 'https://shareous1.dexcom.com',
  };

  constructor(username, password, region = 'ous') {
    this.username = username;
    this.password = password;
    this.region = region.toLowerCase();
    this.baseUrl = JSDexcom.BaseUrls[this.region] || JSDexcom.BaseUrls.ous;
    this.applicationId = 'd89443d2-327c-4a6f-89e5-496bbb0317db';
    this.sessionId = null;
    this.accountId = null;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async authenticate() {
    const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;

    const payload = {
      accountName: this.username,
      password: this.password,
      applicationId: this.applicationId,
    };

    try {
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Dexcom Share/3.0.2.11',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed with status ${response.status}`);
      }

      this.accountId = (await response.text()).replace(/"/g, '');

      // Step 2: Login with account ID
      const loginUrl = `${this.baseUrl}/ShareWebServices/Services/General/LoginPublisherAccountById`;

      const loginPayload = {
        accountId: this.accountId,
        password: this.password,
        applicationId: this.applicationId,
      };

      const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Dexcom Share/3.0.2.11',
        },
        body: JSON.stringify(loginPayload),
      });

      if (!loginResponse.ok) {
        throw new Error(`Login failed with status ${loginResponse.status}`);
      }

      this.sessionId = (await loginResponse.text()).replace(/"/g, '');

      if (this.sessionId === '00000000-0000-0000-0000-000000000000') {
        throw new Error('Invalid credentials');
      }

      return this.sessionId;
    } catch (error) {
      throw new Error(`Authentication error: ${error.message}`);
    }
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
        maxCount: '1',
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Dexcom Share/3.0.2.11',
        },
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
    } catch (error) {
      throw error;
    }
  }

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

    const trendDirection = reading.Trend;

    return {
      _json: {
        WT: reading.WT,
        ST: reading.ST,
        DT: reading.DT,
        Value: reading.Value,
        Trend: trendDirection,
      },
      _value: reading.Value,
      _trend_direction: trendDirection,
      _trend_arrow: TREND_ARROWS[trendDirection] || '?',
      _datetime: new Date(parseInt(reading.WT.match(/\d+/)[0])),
    };
  }
}

// // Export for CommonJS
// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = JSDexcom;
// }

// // Make available globally for browsers
// if (typeof window !== 'undefined') {
//     window.JSDexcom = JSDexcom;
// }
// Export for ES modules
export default JSDexcom;
