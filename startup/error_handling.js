const errorHandler = require('../util/error_handler');
require('express-async-errors');

module.exports = function() {
    // Handling unhandled exceptions happening outside request handling 
    // pipeline
    process.on('uncaughtException', async (ex) => {
        await errorHandler(ex);
        process.exit(1);
    });

    // Handling unhandled promise rejections happening outside request 
    // handling pipeline
    process.on('unhandledRejection', async (ex) => {
        await errorHandler(ex);
        process.exit(1);
    });
}