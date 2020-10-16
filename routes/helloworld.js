const auth = require('../middleware/auth');
//const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const express = require('express');
const router = express.Router();
const db = require('../database/');
const Joi = require('joi');
const UserService = require( "../services/user_service" );
const userService = new UserService();
const User = require( "../models/User");

router.get('/', async (req, res) => {
    res.send(`${req.t('key')}`);
});

router.get('/errorTest', async (req, res) => {
    throw new Error('asdf error');
});

router.get('/languageRequired', validate(validateHelloWorld), async (req, res) => {
    res.send(`${req.t('key')}`);
});

router.get('/databaseTest', async (req, res) => {
    const result = await db.query('SELECT NOW() as time', []);
    res.send(`${result.rows[0].time}`);
});

router.get('/authTest', auth, async (req, res) => {
    res.send(`${req.t('key')}`);
});

router.get('/serviceRepositoryTest', async (req, res) => {
    const user = new User(req.query.username, req.query.email);
    const result = await userService.userExists(user); 
    res.send(result);
});

function validateHelloWorld(req) {
    const schema = Joi.object({
        query: Joi.object({
            lng: Joi.string().min(2).required()
        }),
    }).unknown(true);
    return schema.validate(req);
}

module.exports = router;