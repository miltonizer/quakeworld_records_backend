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
     * @param  {userId} userId id of the user to be updated
     * @param  {requestBody} requestBody The validated body of the 
     * update user request
     * @param  {requestUser} requestUser The user that made the 
     * request. Contains id, admin and superadmin properties.
     * @returns {Promise<{user: User}>}
     */
    async updateUser(userId, requestBody, requestUser) {
        // User's username or email cannot be set to values that
        // have been already taken (by other users).
        if(requestBody.email) {
            let userRequest = {
                username: requestBody.email,
                email: requestBody.email,
            }
            const user = await userRepository.fetchUser(userRequest);
            if(user && user.id !== requestUser.id) {
                throw new UserError("User exists already.", 
                                    StatusCodes.BAD_REQUEST, 
                                    "error_user_exists");
            }
        }

        if(requestBody.username) {
            let userRequest = {
                username: requestBody.username,
                email: requestBody.username,
            }
            const user = await userRepository.fetchUser(userRequest);
            if(user && user.id !== requestUser.id) {
                throw new UserError("User exists already.", 
                                    StatusCodes.BAD_REQUEST, 
                                    "error_user_exists");
            }
        }

        // User can't ban or unban himself
        if(userId === requestUser.id) {
            requestBody.banned = undefined; 
        }
        
        // Only superadmin can change admin / superadmin status
        if(!requestUser.superadmin) {
            requestBody.superadmin = undefined;
            requestBody.admin = undefined;
        }

        // Only superadmin can change his own data
        if(await userRepository.isSuperAdmin(userId) &&
                requestUser.id !== userId) {
            throw new UserError("Can't modify superadmin's data.", 
                                StatusCodes.FORBIDDEN, 
                                "error_cant_modify_superadmins");
        }

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
     * Fetch users 
     * @param queryParams an object containing query parameters
     * Allowed parameters are: page, page_size and username
     * @returns {Promise<[{User}]>}
     * In successful returns the body will contain a list of valid 
     * user objects (can be empty).
     */
    async fetchUsers(queryParams) {
        const username = queryParams.username;
        const limit = queryParams.page_size;
        let offset;
        if(limit) {
            offset = (queryParams.page - 1) * limit;
        }
        const users = await userRepository.fetchUsers(username, limit, offset);
        return users;
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

    /**
     * Delete user by id
     * @param id The id of the user that has logged in
     * @returns undefined
     */
    async deleteById(userId) {
        logger.silly(`services.UserService.deleteById called with ${userId}`);
        const deletedRowCount = await userRepository.deleteById(userId);
        if(!deletedRowCount) {
            throw new UserError("User does not exist.", StatusCodes.BAD_REQUEST, "error_user_does_not_exist");
        }

        logger.silly(`services.UserService.deleteById done`);
        return;
    }
}
module.exports = UserService;