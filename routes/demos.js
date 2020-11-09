const { StatusCodes } = require('http-status-codes');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const superadmin = require('../middleware/superadmin');
const fileUploader = require('../middleware/file_uploader');
const DemoService = require( "../services/demo_service" );
const express = require('express');
const router = express.Router();
const demoService = new DemoService();



/**
 * Uploads demos
 * @param 
 * @returns 
 * 
 */
router.post('/', [auth, fileUploader], async (req, res) => {
    const addedFiles = await demoService.uploadDemos(req.files, req.user.id);
    res.send(addedFiles);
});

module.exports = router;