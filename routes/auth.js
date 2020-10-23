const _ = require('lodash');
const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const logger = require('../util/logger');
const { errorHandler } = require('../util/error_handler');
const router = express.Router();
const UserService = require( "../services/user_service" );
const userService = new UserService();

/**
 * Authenticate a user
 * The caller must provide properties emailOrUsername and password.
 * @returns HTTP 400 if authentication fails because of an invalid
 * @returns HTTP 200 and a jwt token if authentication is successful
 * @returns HTTP 500 if an unexpected error occurs
 */
router.post('/', validate(validateAuthenticationRequest), async (req, res) => {
    try {
        logger.silly("routes.auth.root called");
        const { success, body, error } = await userService.authenticateUser(req.body);
        if(error) return res.status(400).send(req.t(error));
        logger.silly("routes.auth.root authentication done");

        res.send(body.token);
    }
    catch (err) {
        await errorHandler(err);
        res.status(500).send(req.t('user_authentication_error'));
    }
});

// TODO
// Move password requirements somewhere as constants?
// Password shouldn't probably be validated too strictly 
// here because this is for authentication. 
function validateAuthenticationRequest(req) {
    const schema = Joi.object({
        body: Joi.object({
            emailOrUsername: Joi.string().required(),
            password: Joi.string().required(),
        }),
    }).unknown(true);
    return schema.validate(req);
}

module.exports = router;