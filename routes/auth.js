const _ = require('lodash');
const bcrypt = require('bcrypt');
const express = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const router = express.Router();
const UserService = require( "../services/user_service" );
const userService = new UserService();

// Authenticating user:
// User sends his username(email) and password (TODO: how to make sure sent
// passwords are safe?). User is fetched from the database with the email
// and passwords are being compared with bcrypt.
router.post('/', validate(validateAuthenticationRequest), async (req, res) => {
    try {
        let user = userService.authenticateUser(req.body);
        let user = await User.findOne({email: req.body.email});
        if(!user) return res.status(400).send('Invalid email or password.');

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword) return res.status(400).send('Invalid email or password.');

        const token = user.generateAuthToken();
        res.send(token);
    }
    catch (err) {
        // TODO i18n
        res.status(400).send(`Error while authenticating ${err.message}`);
    }
});

// TODO
// Move password requirements somewhere as constants?
function validateAuthenticationRequest(req) {
    const schema = Joi.object({ 
        email: Joi.string().email().required,
        password: Joi.string().min(8).required(),
    });
    return schema.validate(req);
}

module.exports = router;