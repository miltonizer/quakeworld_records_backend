const logger = require('./logger');
const DatabaseError = require('../util/errors/database_error');
require('express-async-errors');

const errorHandler = async (err) => {
    let errorMessage;
    if(err instanceof DatabaseError) {
        errorMessage = `Message: ${err.message} ` + 
                        `StackTrace: ${err.stack} ` +
                        `SQL: ${err.sql} ` +
                        `SqlParameters: ${err.sqlParameters}`;
    }
    else {
        errorMessage = `Message: ${err.message} ` +
                        `StackTrace: ${err.stack}`;
    }
    logger.error(`${errorMessage}`);
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