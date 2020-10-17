const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const UserRepository = require("../repositories/user_repository");
const userRepository = new UserRepository();
const logger = require('../util/logger');
const User = require( "../models/User");

class UserService {
    constructor() {}

    /**
     * Create a new user
     * @param  {requestBody} requestBody The body of the create user request
     * @returns {Promise<{success: boolean, error: *}|{success: boolean, body: *}>}
     * In successful returns the body will contain a user object and a jwt 
     * token named respectively.
     */
    async createUser(requestBody) {
        // Most errors won't be handled here either because there isn't much
        // the service class can do about them.
        logger.info("services.UserService.createUser called");
        let user = new User(requestBody.username, 
            requestBody.email, 
            requestBody.password
        );
        if(await userRepository.userExists(user)) {
            return { success: false, error: "error_user_exists" };
        }
        else {
            logger.info("services.UserService.createUser existing user not found");
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);

            // Save user
            const {body} = await userRepository.saveUser(user);
            user.id = body.id;
            user.username = body.username;
            user.email = body.email;
            user.admin = body.admin;
            user.superadmin = body.superadmin;
            const token = await user.generateAuthToken();
            logger.info("services.UserService.createUser user created");
            return { 
                success: true, 
                body: { 
                    user: user,
                    token: token
                }
            }
        } 
    }

    async authenticateUser(requestBody) {
        // TODO: continue here
    }
}
module.exports = UserService;