const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, json } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

let transportsList = [
    new transports.File({ filename: `./logs/${process.env.NODE_ENV}_error.log`, level: 'error' }),
    new transports.File({ filename: `./logs/${process.env.NODE_ENV}_all.log`, level: 'silly' })
];

// Console logging is disabled for tests so that it's easier to follow
// jest output.
if(process.env.NODE_ENV !== 'test') {
    transportsList.push(new transports.Console({level: 'info'}));
}

const logger = new createLogger({
    level: 'silly',
    transports: transportsList,
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