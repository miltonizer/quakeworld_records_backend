const jwt = require('jsonwebtoken');
const _ = require('lodash');
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
     * @returns
     */
    async uploadDemos(demos) {
        //logger.silly(`services.DemoService.uploadDemos called with ${JSON.stringify(files)}`);
        //_.forEach(_.keysIn(files.demos), (key) => {
         //   let demo = files.demos[key];
          //  demo.mv(config.get('demo_base_folder'));
        //});
        for(let i = 0; i < demos.length; i++) {
            console.log(demos[i]);
        }

        /* Object.keys(files.demos).forEach(key => {
            console.log(key);
        }); */
        await demoRepository.uploadDemos(demos);
    }
}
module.exports = DemoService;