import fs from 'fs';
import path from 'path';

const LOG_DIR = './tests/logs';
const LOG_FILE = path.join(LOG_DIR, `test-${new Date().toISOString().split('T')[0]}.log`);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function logTest(testName, message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${testName}] ${message}\n`;

  // Log to console with colors
  const colors = {
    info: '\x1b[32m', // Green
    error: '\x1b[31m', // Red
    warn: '\x1b[33m', // Yellow
    reset: '\x1b[0m', // Reset
  };

  console.log(`${colors[level] || colors.info}${message}${colors.reset}`);

  // Log to file
  fs.appendFileSync(LOG_FILE, logMessage);
}
