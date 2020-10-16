const UserRepository = require("../repositories/user_repository");
const userRepository = new UserRepository();
const logger = require('../util/logger');

class UserService {
    constructor () {}

    // Most errors won't be handled here either because there isn't much
    // the service class can do about them.
    async userExists(user) {
        logger.info("services.UserService.userExists called");
        return await userRepository.userExists(user);
    }

    async createUser (user) {

    }
}
module.exports = UserService;