const db = require('../database');
const { StatusCodes } = require('http-status-codes');
const UserError = require('../util/errors/user_error');
const UserService = require('../services/user_service');
const userService = new UserService();

module.exports = async function (user) {
    const userInDatabase = await userService.fetchById(user.id);
    if(userInDatabase.id == user.id &&
        userInDatabase.admin == user.admin &&
        userInDatabase.superadmin == user.superadmin) {
            return true;
    }
    else {
        throw new UserError(
            "Authentication attempt with a token of a modified user", 
            StatusCodes.INSUFFICIENT_SPACE_ON_RESOURCE, 
            "error_modified_user"
        );
    }
}