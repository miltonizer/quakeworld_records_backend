const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const superadmin = require('../middleware/superadmin');
const validate = require('../middleware/validate');
const UserService = require( "../services/user_service" );
const logger = require('../util/logger');
const Constants = require('../util/constants');
const _ = require('lodash');
const Joi = require('joi');
const express = require('express');
const router = express.Router();
const userService = new UserService();

// A route for getting information about the user that has logged in
router.get('/me', auth, async (req, res) => {
    const user = await userService.fetchById(req.user.id);
    res.send(user);
});

router.delete('/me', auth, async (req, res) => {
    await userService.deleteById(req.user.id);
    res.send();
});

/**
 * Fetches a user from the database
 * @param id The id of the user
 * @returns {Promise<{User}|null>}
 * User with the given id must exist in the database.
 */
router.get('/:id', [auth, admin, validate(validateUserId)], async (req, res) => {
    const user = await userService.fetchById(req.params.id);
    res.send(user);
});

/**
 * Deletes a user from the database
 * @param id The id of the user
 * @returns true
 * User with the given id must exist in the database.
 */
router.delete('/:id', [auth, superadmin, validate(validateUserId)], async (req, res) => {
    await userService.deleteById(req.params.id);
    res.send();
});

// Add a new user
// Don't store tokens in database in general and if for some reason you do,
// don't store them in plain text but hash them first!
// Logging out should be handled by clients.
router.post('/', validate(validateUser), async (req, res) => {
    logger.silly("routes.users.root called");
    const { token, user } = await userService.createUser(req.body);
    logger.silly("routes.users.root about the send response");
    res.header('x-auth-token', token).send(_.pick(user, [
        'username',
        'email',
        'admin',
        'superadmin',
        'id'
    ]));
});

/**
 * Updates a user in the database
 * @param id The id of the user
 * @returns {Promise<{User}|null>}
 * Request body must contain at least one valid property
 * of the User model. User with the given id must be exist
 * in the database.
 */
router.patch('/:id', [auth, superadmin, validate(validateUserPatch)], async (req, res) => {
    const { user } = await userService.updateUser(req.params.id, req.body);
    res.send();
});

// TODO: can these validate-funtions be combined?
function validateUser(req) {
    const schema = Joi.object({
        body: Joi.object({
            username: Joi.string().min(Constants.USERNAME_MIN_LENGTH).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(Constants.PASSWORD_MIN_LENGTH).required(),
        }),
    }).unknown(true);
    return schema.validate(req);
}

function validateUserPatch(req) {
    const schema = Joi.object({
        body: Joi.object({
            username: Joi.string().min(Constants.USERNAME_MIN_LENGTH),
            email: Joi.string().email(),
            password: Joi.string().min(Constants.PASSWORD_MIN_LENGTH),
            admin: Joi.boolean(),
            superadmin: Joi.boolean()
        }),
        params: Joi.object({
            id: Joi.number().required()
        })
    }).unknown(true);
    return schema.validate(req);
}

function validateUserId(req) {
    const schema = Joi.object({
        params: Joi.object({
            id: Joi.number().required()
        })
    }).unknown(true);
    return schema.validate(req);
}

module.exports = router;