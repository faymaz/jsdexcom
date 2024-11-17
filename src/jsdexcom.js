import fetch from 'node-fetch';

class JSDexcom {
    static Regions = {
        US: 'us',
        OUS: 'ous',
        JP: 'jp'
    };

    static BaseUrls = {
        us: 'https://share2.dexcom.com',
        ous: 'https://shareous1.dexcom.com',
        jp: 'https://shareous1.dexcom.com'
    };

    constructor(username, password, region = 'ous') {
        this.username = username;
        this.password = password;
        this.region = region.toLowerCase();

        if (!JSDexcom.BaseUrls[this.region]) {
            throw new Error(`Invalid region: ${region}. Must be one of: us, ous, jp`);
        }

        this.baseUrl = JSDexcom.BaseUrls[this.region];
        this.applicationId = 'd89443d2-327c-4a6f-89e5-496bbb0317db';
        this.sessionId = null;
        this.accountId = null;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async authenticate() {
        // Step 1: Get account ID
        console.log('Getting account ID...');
        const authUrl = `${this.baseUrl}/ShareWebServices/Services/General/AuthenticatePublisherAccount`;

        const authPayload = {
            accountName: this.username,
            password: this.password,
            applicationId: this.applicationId
        };

        try {
            const authResponse = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Dexcom Share/3.0.2.11'
                },
                body: JSON.stringify(authPayload)
            });

            if (!authResponse.ok) {
                throw new Error(`Authentication failed with status ${authResponse.status}`);
            }

            this.accountId = (await authResponse.text()).replace(/"/g, '');
            console.log('Got account ID:', this.accountId);

            // Step 2: Login with account ID
            console.log('Logging in with account ID...');
            const loginUrl = `${this.baseUrl}/ShareWebServices/Services/General/LoginPublisherAccountById`;

            const loginPayload = {
                accountId: this.accountId,
                password: this.password,
                applicationId: this.applicationId
            };

            const loginResponse = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Dexcom Share/3.0.2.11'
                },
                body: JSON.stringify(loginPayload)
            });

            if (!loginResponse.ok) {
                throw new Error(`Login failed with status ${loginResponse.status}`);
            }

            this.sessionId = (await loginResponse.text()).replace(/"/g, '');
            console.log('Got session ID:', this.sessionId);

            if (this.sessionId === '00000000-0000-0000-0000-000000000000') {
                throw new Error('Invalid credentials');
            }

            await this.delay(1000);
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
                maxCount: '1'
            });

            console.log('Requesting glucose reading...');

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
                    console.log('Session expired, retrying...');
                    this.sessionId = null;
                    return this.getLatestGlucose();
                }
                throw new Error(`Server error: ${error.Message}`);
            }

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const responseText = await response.text();
            if (!responseText) {
                throw new Error('Empty response from server');
            }

            const readings = JSON.parse(responseText);
            if (!Array.isArray(readings) || readings.length === 0) {
                throw new Error('No readings available');
            }

            return this.formatReading(readings[0]);

        } catch (error) {
            throw error;
        }
    }

    formatReading(reading) {
        // Map numeric trends to their string representations
        const TREND_MAP = {
            0: 'None',
            1: 'DoubleUp',
            2: 'SingleUp',
            3: 'FortyFiveUp',
            4: 'Flat',
            5: 'FortyFiveDown',
            6: 'SingleDown',
            7: 'DoubleDown',
            8: 'NotComputable',
            9: 'RateOutOfRange'
        };

        // Map trend strings to display arrows
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

        // Map string trends to numeric values
        const TREND_TO_NUMBER = {
            'None': 0,
            'DoubleUp': 1,
            'SingleUp': 2,
            'FortyFiveUp': 3,
            'Flat': 4,
            'FortyFiveDown': 5,
            'SingleDown': 6,
            'DoubleDown': 7,
            'NotComputable': 8,
            'RateOutOfRange': 9
        };

        let trendDirection;
        let trendNumber;

        if (typeof reading.Trend === 'number') {
            trendNumber = reading.Trend;
            trendDirection = TREND_MAP[reading.Trend] || 'None';
        } else {
            trendDirection = reading.Trend;
            trendNumber = TREND_TO_NUMBER[reading.Trend] || 0;
        }

        return {
            _json: {
                WT: reading.WT,
                ST: reading.ST,
                DT: reading.DT,
                Value: reading.Value,
                Trend: trendDirection
            },
            _value: reading.Value,
            _trend_direction: trendDirection,
            _trend: trendNumber,
            _datetime: new Date(parseInt(reading.WT.match(/\d+/)[0])),
            _trend_arrow: TREND_ARROWS[trendDirection] || '?'
        };
    }
}

export default JSDexcom;
