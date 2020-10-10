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
    // TODO: configure error levels and learn how logging really works
    res.status(500).send('internal_server_error');
}