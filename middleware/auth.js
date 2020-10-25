const jwt = require('jsonwebtoken');
const config = require('config');
const { StatusCodes } = require('http-status-codes');
const UserError = require('../util/errors/user_error');

// This middleware function checks if client's token is valid. The token
// should be sent in a header called x-auth-token (could be named something
// else but this is commonly used)
module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    if(!token) {
        throw new UserError(
            'Access denied - no token set', 
            StatusCodes.UNAUTHORIZED, 
            'access_denied_no_token'
        );
    }
    // jwt.verify doesn't return any error codes but throws an exception
    // instead if the token is invalid so the exception must be caught
    // here to give a meaningful error message to the user.
    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next();
    }
    catch (err) {
        throw new UserError(
            'Invalid token',
            StatusCodes.BAD_REQUEST,
            'invalid_token'
        );
    }
}