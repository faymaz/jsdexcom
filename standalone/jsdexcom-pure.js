import https from 'https';

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

  async httpRequest(url, options = {}, data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const requestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Dexcom Share/3.0.2.11',
          ...(options.headers || {}),
        },
      };

      const req = https.request(requestOptions, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              ok: true,
              status: res.statusCode,
              text: () => Promise.resolve(responseData),
              json: () => Promise.resolve(JSON.parse(responseData)),
            });
          } else {
            resolve({
              ok: false,
              status: res.statusCode,
              text: () => Promise.resolve(responseData),
              json: () => Promise.resolve(JSON.parse(responseData)),
            });
          }
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

  async authenticate() {
    const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;

    const payload = {
      accountName: this.username,
      password: this.password,
      applicationId: this.applicationId,
    };

    try {
      const response = await this.httpRequest(authUrl, { method: 'POST' }, payload);

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

      const loginResponse = await this.httpRequest(loginUrl, { method: 'POST' }, loginPayload);

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
      const url = `${this.baseUrl}/ShareWebServices/Services/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${this.sessionId}&minutes=10&maxCount=1`;

      const response = await this.httpRequest(url, { method: 'POST' });

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
    };
  }
}

export default JSDexcom;
