const winston = require('winston');

// This catches only errors in the request processing pipeline (Express).
module.exports = function(err, req, res, next) {
    winston.error(err.message, err);

    // error
    // warn
    // info
    // verbose
    // debug
    // silly
    // TODO: i18n
    // TODO: configure error levels and learn how logging really works
    res.status(500).send('Something failed. This message comes from error.js.');
}