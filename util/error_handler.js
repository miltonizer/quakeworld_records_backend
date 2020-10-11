const logger = require('../util/logger');

module.exports = async function(err) {
    logger.error(`${err.message}`);
}