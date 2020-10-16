const auth = require('../middleware/auth');
//const {User, validate} = require('../models/user');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const UserService = require( "../services/user_service" );
const userService = new UserService();

router.get('/me', auth, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).send(user);
});

// Add a new user
// Don't store tokens in database in general and if for some reason you do,
// don't store them in plain text but hash them first!
// Logging out should be handled by clients.
// TODO: How do I know that I can put auth (middleware) function here?
router.post('/', auth, async (req, res) => {
    try {
        // Validate user coming from the client
        const {error} = validate(req.body);
        if(error) return res.status(400).send(error.details[0].message);
        
        let user = await User.findOne({email: req.body.email});
        if(user) return res.status(400).send('User already registered.');

        // TODO: How does bcrypt + salt work?
        const salt = await bcrypt.genSalt(10);

        user = new User(_.pick(req.body, ['name', 'email', 'password']));
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();

        const token = user.generateAuthToken();
        res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
    }
    catch (err) {
        res.status(400).send(`Error in creating a new user ${err.message}`);
    }
});

module.exports = router;