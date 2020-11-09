const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const multer  = require('multer')
const config = require('config');
const { StatusCodes } = require('http-status-codes');
const ApplicationError = require('../util/errors/application_error');
const Constants = require('../util/constants');
const UserError = require('../util/errors/user_error');
const logger = require('../util/logger');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Create directory if it doesn't exist
        const directory = config.get('demo_base_folder') + `temp${path.sep}${req.user.id}`;
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
    if(path.extname(file.originalname) === '.mvd') {
        cb(null, true);
    }
    else {
        req.file_error = true;
        cb(null, false);
    }
} 

const uploader = multer({ 
    storage: storage,
    limits: {
        fileSize: Constants.MAX_DEMO_FILE_SIZE
    },
    fileFilter: fileFilter
});

const upload = uploader.array('demos');

// For some reason express-async-errors is not catching these
// errors and they have to be handled by calling next with the
// error in question.
module.exports = async function (req, res, next) {
    upload(req, res, async function (err) {
        const directory = config.get('demo_base_folder') + `temp${path.sep}${req.user.id}`;
        if (err instanceof multer.MulterError && 
            err.message === Constants.MULTER_FILE_TOO_LARGE_ERROR_MESSAGE) {
            // A Multer error occurred when uploading.
            await fsPromises.rmdir(directory, {recursive: true});
            next(new UserError("File too large.", 
                        StatusCodes.BAD_REQUEST, 
                        "error_file_too_large"));
        }
        else if(req.hasOwnProperty('file_error')) {
            await fsPromises.rmdir(directory, {recursive: true});
            next(new UserError("File format not accepted.", 
                                StatusCodes.BAD_REQUEST, 
                                "error_file_format_not_accepted"));
        }
        else if (err) {
            await fsPromises.rmdir(directory, {recursive: true});
            next(new ApplicationError("File uploading failed for an unknown reason.", 
                                        StatusCodes.BAD_REQUEST, 
                                        "error_file_uploading_failed"));
        }
        else {
            // Everything went fine.
            next();
        }  
    });
}