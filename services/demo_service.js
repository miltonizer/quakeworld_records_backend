const md5File = require('md5-file')
const fs = require('fs');
const fsPromises = require('fs').promises;
const moveFile = require('move-file');
const path = require('path');
const config = require('config');
const { StatusCodes } = require('http-status-codes');
const DemoRepository = require("../repositories/demo_repository");
const demoRepository = new DemoRepository();
const logger = require('../util/logger');
const UserError = require('../util/errors/user_error');
const Constants = require('../util/constants');

class DemoService {
    constructor() {}

    /**
     * Upload demos
     * @param demos Uploaded non-validated files
     * @returns a list of added files
     */
    async uploadDemos(demos, userId) {
        logger.silly(`services.DemoService.uploadDemos called with ${JSON.stringify(demos)}`);
        let addedFiles = new Array();
        let uploadedMD5s = new Array();
        if(demos && userId) {
            // Check if demos have been uploaded already and remove the already
            // existing demos from both the array and disk. Notice that the
            // temporary demo folder should never be removed because there might
            // be multiple uploads coming from multiple (and even the same) user
            // at the "same time".
            for(let i = 0; i < demos.length; i++) {
                demos[i].md5sum
                demos[i].md5sum = await md5File(demos[i].path);
                uploadedMD5s.push(demos[i].md5sum);
            }
            const alreadyExistingDemos = await demoRepository.fetchMatchingMD5s(uploadedMD5s);

            for(let i = 0; i < demos.length; i++) {
                // Demo is removed from the array and the disk if it has
                // already been saved to database
                if(alreadyExistingDemos.length > 0 &&
                    alreadyExistingDemos.find(element => element === demos[i].md5sum) !== undefined) {
                    
                    // The file must be deleted before splicing to be able
                    // to access the path of the demo
                    fs.unlinkSync((demos[i].path));
                    demos.splice(i, 1);
                    
                    // Splice throws off the indexing so it has 
                    // to be readjusted
                    i--;
                }
                // The demo is moved to its final destination if it has not
                // been saved before.
                else {
                    const newPath = `${config.get('demo_base_folder')}${userId}${path.sep}${demos[i].originalname}`;
                    await moveFile(demos[i].path, newPath);
                    demos[i].path = newPath;
                }
            }

            // Save only new demos to database
            if(demos.length > 0) {
                const addedFilesDatabaseResult = await demoRepository.uploadDemos(demos, userId);
                if(addedFilesDatabaseResult) {
                    for(let i = 0; i < addedFilesDatabaseResult.length; i++) {
                        addedFiles.push(addedFilesDatabaseResult[i].path);
                    }
                }
            }
        }
        return addedFiles;
    }
    // TODO: Remove demos that do not contain any records
}
module.exports = DemoService;