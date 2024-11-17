import fs from 'fs';
import path from 'path';

const LOG_DIR = './tests/logs';
const today = new Date().toISOString().split('T')[0];
const reportFile = path.join(LOG_DIR, `report-${today}.html`);

function generateReport() {
  console.log('Generating test report...');

  // Ensure logs directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const testResults = {
    esm: process.env.ESM_TEST_RESULT === '0' ? 'Passed' : 'Failed',
    cjs: process.env.CJS_TEST_RESULT === '0' ? 'Passed' : 'Failed',
    timestamp: new Date().toLocaleString(),
    version: process.env.npm_package_version || '1.0.0',
  };

  const html = `
<!DOCTYPE html>
<html>
    <head>
        <title>JSdexcom Test Report</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                line-height: 1.6;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 20px;
            }
            .pass { 
                color: #28a745;
                font-weight: bold;
            }
            .fail { 
                color: #dc3545;
                font-weight: bold;
            }
            .summary { 
                margin: 20px 0; 
                padding: 20px;
                border: 1px solid #dee2e6;
                border-radius: 5px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                color: #6c757d;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>JSdexcom Test Report</h1>
                <p>Version: ${testResults.version}</p>
                <p>Date: ${today}</p>
            </div>
            
            <div class="summary">
                <h2>Test Summary</h2>
                <p class="${testResults.esm === 'Passed' ? 'pass' : 'fail'}">
                    ES Module Test: ${testResults.esm}
                </p>
                <p class="${testResults.cjs === 'Passed' ? 'pass' : 'fail'}">
                    CommonJS Test: ${testResults.cjs}
                </p>
            </div>

            <div class="footer">
                <p>Generated on: ${testResults.timestamp}</p>
                <p>JSdexcom - Node.js library for Dexcom Share API</p>
            </div>
        </div>
    </body>
</html>
`;

  fs.writeFileSync(reportFile, html);
  console.log(`Report generated: ${reportFile}`);
}

generateReport();
