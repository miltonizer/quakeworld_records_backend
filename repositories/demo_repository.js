const { StatusCodes } = require('http-status-codes');
const db = require('../database');
const logger = require('../util/logger');
const DatabaseError = require('../util/errors/database_error');
const UserError = require('../util/errors/user_error');

class DemoRepository {
    constructor() {}

    /**
     * Save new demos to the database
     * @param 
     * @returns 
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async uploadDemos(demos) {
        logger.silly(`repositories.DemoRepository.uploadDemos called with ${JSON.stringify(demos)}`);
    }
}

module.exports = DemoRepository;