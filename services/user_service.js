const jwt = require('jsonwebtoken');
const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const UserRepository = require("../repositories/user_repository");
const userRepository = new UserRepository();
const logger = require('../util/logger');
const UserError = require('../util/errors/user_error');
const {hashPassword, verifyPassword} = require('../util/password_encryption');
const User = require( "../models/User");

class UserService {
    constructor() {}

    /**
     * Create a new user
     * @param  {requestBody} requestBody The validated body of the 
     * create user request
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
            throw new UserError("User exists already.", 
                StatusCodes.BAD_REQUEST, 
                "error_user_exists");
        }
        else {
            // Hashing the password given by the user
            logger.silly("services.UserService.createUser existing user not found");
            user.password = await hashPassword(user.password);
            logger.silly("services.UserService.createUser user password hashed");

            // Save user
            user = await userRepository.saveUser(user);
            logger.silly(`services.UserService.createUser user saved to db: ${JSON.stringify(user)}`);

            // Generating token
            const token = user.generateAuthToken();
            logger.silly(`services.UserService.createUser token generated: ${JSON.stringify(token)}`);

            logger.silly("services.UserService.createUser user created");
            return { 
                user: user,
                token: token
            }
        } 
    }

    /**
     * Update a user
     * @param  {requestBody} requestBody The validated body of the 
     * update user request
     * @returns {Promise<{user: User}>}
     */
    async updateUser(userId, requestBody) {
        // hash the password if it's been provided
        if(requestBody.password) {
            requestBody.password = await hashPassword(requestBody.password);
        }
        const user = await userRepository.updateUser(userId, requestBody);
        return user;
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
            throw new UserError("User does not exist.", StatusCodes.BAD_REQUEST, "error_user_does_not_exist");
        }

        // Verifying password
        if(!await verifyPassword(user.password, passwordFromUser)) {
            throw new UserError("Invalid username or password", StatusCodes.BAD_REQUEST, "error_invalid_username_or_password");
        }   

        // Generating token to be returned
        return user.generateAuthToken();
    }

    /**
     * Fetch user's info by id
     * @param id The id of the user that has logged in
     * @returns {Promise<{User>}
     * In successful returns the body will contain a valid user object
     */
    async fetchById(userId) {
        logger.silly(`services.UserService.fetchById called with ${userId}`);
        const user = await userRepository.fetchById(userId);
        if(!user) {
            throw new UserError("User does not exist.", StatusCodes.BAD_REQUEST, "error_user_does_not_exist");
        }
        
        user.password = '';
        logger.silly(`services.UserService.fetchById done`);
        return user;
    }
}
module.exports = UserService;