const jwt = require('jsonwebtoken');
const _ = require('lodash');
const UserRepository = require("../repositories/user_repository");
const userRepository = new UserRepository();
const logger = require('../util/logger');
const ApplicationError = require('../util/errors/application_error');
const {hashPassword, verifyPassword} = require('../util/password_encryption');
const User = require( "../models/User");

class UserService {
    constructor() {}

    /**
     * Create a new user
     * @param  {requestBody} requestBody The validated body of the create user request
     * @returns {Promise<{user: User, token: jsonwebtoken}>}
     */
    async createUser(requestBody) {
        // Most errors won't be handled here either because there isn't much
        // the service class can do about them.
        logger.silly(`services.UserService.createUser called with ${JSON.stringify(requestBody)}`);
        let user = new User(requestBody.username, 
            requestBody.email, 
            requestBody.password
        );
        if(await userRepository.fetchUser(user)) {
            throw new ApplicationError("User exists already.", 400, "error_user_exists");
        }
        else {
            // Hashing the password given by the user
            logger.silly("services.UserService.createUser existing user not found");
            user.password = await hashPassword(user.password);
            logger.silly("services.UserService.createUser user password hashed");

            // Save user
            user = await userRepository.saveUser(user);

            const token = await user.generateAuthToken();
            logger.silly("services.UserService.createUser user created");
            return { 
                user: user,
                token: token
            }
        } 
    }

    /**
     * Authenticate a user
     * @param  {requestBody} requestBody The validated body of the 
     * authentication request containing properties emailOrUsername 
     * and password
     * @returns {Promise<jsonwebtoken>}
     */
    async authenticateUser(requestBody) {
        logger.silly("services.UserService.authenticateUser called");
        const passwordFromUser = requestBody.password;

        // Make sure that user exists
        let user = await userRepository.fetchUser(
            new User(requestBody.emailOrUsername, 
                requestBody.emailOrUsername
            )
        );
        if(!user) {
            throw new ApplicationError("User does not exist.", 400, "error_user_does_not_exist");
        }

        // Verifying password
        if(!await verifyPassword(user.password, passwordFromUser)) {
            throw new ApplicationError("Invalid username or password", 400, "error_invalid_username_or_password");
        }   

        // Generating token to be returned
        return await user.generateAuthToken();
    }

    /**
     * Fetch user's info by id
     * @param id The id of the user that has logged in
     * @returns {Promise<{User>}
     * In successful returns the body will contain a valid user object
     */
    async fetchById(userId) {
        const user = await userRepository.fetchById(userId);
        if(!user) return { success: false, error: "error_user_does_not_exist" };
        user.password = '';
        return user;
    }
}
module.exports = UserService;