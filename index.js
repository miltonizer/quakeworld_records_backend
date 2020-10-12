const logger = require('./util/logger');
const express = require('express');
const app = express();
const { initializeErrorHandling } = require('./util/error_handler');
initializeErrorHandling();
require('./startup/internationalization')(app);
require('./startup/routes')(app);
require('./startup/configuration')();
// require('./startup/prod')(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => logger.info(`Listening to port ${port}`));

module.exports = server;