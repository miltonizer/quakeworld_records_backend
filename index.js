const winston = require('winston');
const express = require('express');
const app = express();
require('./startup/logging')();
require('./startup/internationalization')(app);
require('./startup/routes')(app);
// require('./startup/database')();
require('./startup/configuration')();
// require('./startup/prod')(app);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => winston.info(`Listening to port ${port}`));

module.exports = server;