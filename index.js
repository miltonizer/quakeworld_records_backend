const winston = require('winston');
const express = require('express');
const app = express();
require('./startup/logging')();
require('./startup/routes')(app);
// require('./startup/database')();
require('./startup/configuration')();
// require('./startup/prod')(app);

const port = process.env.PORT || 3000;
// TODO: i18n
const server = app.listen(port, () => winston.info(`Listening to port ${port}`));

module.exports = server;