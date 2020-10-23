const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const UserService = require( "../services/user_service" );
const logger = require('../util/logger');
const { errorHandler } = require('../util/error_handler');
const _ = require('lodash');
const Joi = require('joi');
const express = require('express');
const router = express.Router();
const userService = new UserService();

router.get('/me', auth, async (req, res) => {
    const { body, error } = await userService.fetchById(req.user.id);
    if(error) return res.status(400).send(req.t(error));
    res.status(200).send(body.user);
});

// Add a new user
// Don't store tokens in database in general and if for some reason you do,
// don't store them in plain text but hash them first!
// Logging out should be handled by clients.
router.post('/', validate(validateUser), async (req, res) => {
    try {
        logger.silly("routes.users.root called");
        const { success, body, error } = await userService.createUser(req.body);
        if(error) return res.status(400).send(req.t(error)); 
        logger.silly("routes.users.root about the send response");
        res.header('x-auth-token', body.token).send(_.pick(body.user, [
            'username',
            'email',
            'admin',
            'superadmin',
            'id'
        ]));
    }
    catch (err) {
        await errorHandler(err);
        res.status(500).send(req.t('user_creation_error'));
    }
});

function validateUser(req) {
    const schema = Joi.object({
        body: Joi.object({
            username: Joi.string().min(1).required(),
            email: Joi.string().email().required(),
            password: Joi.string().min(8).required(),
        }),
    }).unknown(true);
    return schema.validate(req);
}

module.exports = router;