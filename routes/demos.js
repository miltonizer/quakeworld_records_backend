const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const superadmin = require('../middleware/superadmin');
const validate = require('../middleware/validate');
const DemoService = require( "../services/demo_service" );
const logger = require('../util/logger');
const Constants = require('../util/constants');
const _ = require('lodash');
const Joi = require('joi');
const express = require('express');
const router = express.Router();
const demoService = new DemoService();

/**
 * Uploads demos
 * @param 
 * @returns 
 * 
 */
router.post('/', auth, async (req, res) => {
    await demoService.uploadDemos(req.user.id);
    res.send();
});

module.exports = router;