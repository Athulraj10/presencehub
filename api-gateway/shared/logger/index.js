const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'application.log');

const timestamp = () => new Date().toISOString();

const writeLog = (level, service, message) => {
    const logEntry = {
        timestamp: timestamp(),
        level,
        service,
        message
    };

    fs.appendFileSync(
        logFile,
        JSON.stringify(logEntry) + '\n'
    );
};

const info = (service, message) => {
    console.log(`[${timestamp()}] [INFO] [${service}] ${message}`);
    writeLog('INFO', service, message);
};

const warn = (service, message) => {
    console.warn(`[${timestamp()}] [WARN] [${service}] ${message}`);
    writeLog('WARN', service, message);
};

const error = (service, message) => {
    console.error(`[${timestamp()}] [ERROR] [${service}] ${message}`);
    writeLog('ERROR', service, message);
};

const debug = (service, message) => {
    console.log(`[${timestamp()}] [DEBUG] [${service}] ${message}`);
    writeLog('DEBUG', service, message);
};

module.exports = {
    info,
    warn,
    error,
    debug
};