const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const DemoRepository = require("../repositories/demo_repository");
const demoRepository = new DemoRepository();
const logger = require('../util/logger');
const UserError = require('../util/errors/user_error');

class DemoService {
    constructor() {}

    /**
     * Upload demos
     * @param  
     * @returns
     */
    async uploadDemos(demos) {
        logger.silly(`services.DemoService.uploadDemos called with ${JSON.stringify(demos)}`);
        await demoRepository.uploadDemos(demos);
    }
}
module.exports = DemoService;