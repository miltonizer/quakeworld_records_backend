const fs = require('fs');
var multer  = require('multer')
const config = require('config');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const superadmin = require('../middleware/superadmin');
const DemoService = require( "../services/demo_service" );
const logger = require('../util/logger');
const Constants = require('../util/constants');
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const demoService = new DemoService();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Create directory if it doesn't exist
        const directory = config.get('demo_base_folder') + req.user.id;
        if(!fs.existsSync(directory)) {
            fs.mkdirSync(directory, {recursive: true});
        }

        cb(null, directory);
     },
    filename: function (req, file, cb) {
        cb(null , file.originalname);
    }
});
   
function fileFilter (req, file, cb) {
    if(file.originalname.includes('.mvd')) {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
} 

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: Constants.MAX_DEMO_FILE_SIZE
    },
    fileFilter: fileFilter
});

/**
 * Uploads demos
 * @param 
 * @returns 
 * 
 */
router.post('/', [auth, upload.array('demos')], async (req, res) => {
    await demoService.uploadDemos(req.files);
    res.send();
});

module.exports = router;