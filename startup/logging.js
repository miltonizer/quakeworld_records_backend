// A good package for logging
const winston = require('winston');
require('express-async-errors');

module.exports = function() {
    // Handling unhandled exceptions happening outside request handling pipeline
    process.on('uncaughtException', (ex) => {
        winston.error(ex.message, ex);
        process.exit(1);
    });

    // Handling unhandled promise rejections happening outside request 
    // handling pipeline
    process.on('unhandledRejection', (ex) => {
        winston.error(ex.message, ex);
        process.exit(1);
    });

    // Setting where winston should log things
    // Here you can also set logging levels. For example only errors to database
    // and everything to files.
    winston.add(new winston.transports.Console());
    winston.add(new winston.transports.File({ filename: 'logfile.log' }));
}