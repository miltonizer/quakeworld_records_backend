const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = new createLogger({
    level: 'silly',
    transports: [
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/all.log', level: 'silly' }),
        new transports.Console({level: 'info'})
    ],
    exitOnError: false,
    format: combine(timestamp(), myFormat, json())
});

// This stream is here to help morgan utilize winston when it logs
// HTTP/express calls
logger.stream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

module.exports = logger;