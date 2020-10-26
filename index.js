const logger = require('./util/logger');
const express = require('express');
const config = require('config');
const app = express();
const { initializeErrorHandling } = require('./util/error_handler');
initializeErrorHandling();
require('./startup/internationalization')(app);
require('./startup/routes')(app);
require('./startup/configuration')();
// require('./startup/prod')(app);

const port = config.get('node_port');
const server = app.listen(port, () => logger.info(`Listening to port ${port}`));

module.exports = server;