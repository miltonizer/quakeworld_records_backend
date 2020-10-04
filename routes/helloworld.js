//const auth = require('../middleware/auth');
//const admin = require('../middleware/admin');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.send('Hello world!');
});

module.exports = router;