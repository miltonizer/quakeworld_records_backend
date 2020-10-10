//const auth = require('../middleware/auth');
//const admin = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
    // const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id])
    const result = await db.query('SELECT NOW() as time', []);
    console.log(result);
    res.send(`Hello world! ${result.rows[0].time}`);
});

module.exports = router;