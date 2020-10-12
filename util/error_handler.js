const logger = require('../util/logger');
require('express-async-errors');

const errorHandler = async (err) => {
    logger.error(`${err.message}`);
}

module.exports = {
    errorHandler: errorHandler,
    initializeErrorHandling: function() {
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
}