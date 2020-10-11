const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, json } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

const logger = new createLogger({
    level: 'silly',
    transports: [
        new transports.File({ filename: './logs/error.log', level: 'error' }),
        new transports.File({ filename: './logs/all.log', level: 'silly' }),
        new transports.Console({level: 'silly'})
    ],
    exitOnError: false,
    format: combine(timestamp(), myFormat, json())
});

logger.stream = {
    write: function(message, encoding) {
        // use the 'info' log level so the output will be picked up by both transports
        logger.info(message);
    }
};

module.exports = logger;