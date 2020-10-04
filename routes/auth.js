const {User} = require('../models/user');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Authenticating user:
// User sends his username(email) and password (TODO: how to make sure sent
// passwords are safe?). User is fetched from the database with the email
// and passwords are being compared with bcrypt.
router.post('/', async (req, res) => {
    try {
        const {error} = validate(req.body);
        if(error) return res.status(400).send(error.details[0].message);
        
        let user = await User.findOne({email: req.body.email});
        if(!user) return res.status(400).send('Invalid email or password.');

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if(!validPassword) return res.status(400).send('Invalid email or password.');

        const token = user.generateAuthToken();
        res.send(token);
    }
    catch (err) {
        res.status(400).send(`Error while authenticating ${err.message}`);
    }
});

function validate(req) {
    const schema = Joi.object({ 
        email: Joi.string().min(1).required().email(),
        password: Joi.string().min(8).required(),
    });
    return schema.validate(req);
}

module.exports = router;