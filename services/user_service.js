const jwt = require('jsonwebtoken');
const _ = require('lodash');
const UserRepository = require("../repositories/user_repository");
const userRepository = new UserRepository();
const logger = require('../util/logger');
const {hashPassword, verifyPassword} = require('../util/password_encryption');
const User = require( "../models/User");

class UserService {
    constructor() {}

    /**
     * Create a new user
     * @param  {requestBody} requestBody The validated body of the create user request
     * @returns {Promise<{success: boolean, error: *}|{success: boolean, body: *}>}
     * In successful returns the body will contain a user object and a jwt 
     * token named respectively.
     */
    async createUser(requestBody) {
        // Most errors won't be handled here either because there isn't much
        // the service class can do about them.
        logger.silly("services.UserService.createUser called");
        let user = new User(requestBody.username, 
            requestBody.email, 
            requestBody.password
        );
        if(await userRepository.fetchUser(user)) {
            return { success: false, error: "error_user_exists" };
        }
        else {
            // Hashing the password given by the user
            logger.silly("services.UserService.createUser existing user not found");
            user.password = await hashPassword(user.password);
            logger.silly("services.UserService.createUser user password hashed");

            // Save user
            const userFromRepository = await userRepository.saveUser(user);
            user.id = userFromRepository.id;
            user.username = userFromRepository.username;
            user.email = userFromRepository.email;
            user.admin = userFromRepository.admin;
            user.superadmin = userFromRepository.superadmin;
            const token = await user.generateAuthToken();
            logger.silly("services.UserService.createUser user created");
            return { 
                success: true, 
                body: { 
                    user: user,
                    token: token
                }
            }
        } 
    }

    /**
     * Authenticate a user
     * @param  {requestBody} requestBody The validated body of the 
     * authentication request containing properties emailOrUsername 
     * and password
     * @returns {Promise<{success: boolean, error: *}|{success: boolean, body: *}>}
     * In successful returns the body will contain jwt token with name "token"
     */
    async authenticateUser(requestBody) {
        logger.silly("services.UserService.authenticateUser called");

        // Make sure that user exists
        let user = new User(requestBody.emailOrUsername, 
            requestBody.emailOrUsername, 
            requestBody.password
        );

        const userFromRepository = await userRepository.fetchUser(user);
        if(!userFromRepository) return { success: false, error: "error_user_does_not_exist" };

        // Verifying password
        if(!await verifyPassword(userFromRepository.password, user.password)) {
            return { success: false, error: "error_invalid_username_or_password" };
        }   

        // Generating token to be returned
        user.id = userFromRepository.id;
        user.username = userFromRepository.username;
        user.email = userFromRepository.email;
        user.admin = userFromRepository.admin;
        user.superadmin = userFromRepository.superadmin;
        const token = await user.generateAuthToken();
        return { 
            success: true, 
            body: {
                token: token
            }
        }
    }

    /**
     * Fetch user's info by id
     * @param id The id of the user that has logged in
     * @returns {Promise<{success: boolean, error: *}|{success: boolean, body: *}>}
     * In successful returns the body will contain a valid user object
     */
    async fetchById(userId) {
        const userFromRepository = await userRepository.fetchById(userId);
        if(!userFromRepository) return { success: false, error: "error_user_does_not_exist" };
        const user = new User(
            userFromRepository.username,
            userFromRepository.email,
            '',
            userFromRepository.admin,
            userFromRepository.superadmin,
            userFromRepository.id);
        return {
            success: true,
            body: {
                user: user
            }
        }
    }
}
module.exports = UserService;