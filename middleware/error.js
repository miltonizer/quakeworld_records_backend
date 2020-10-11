const errorHandler = require('../util/error_handler');

// This catches only errors in the request processing pipeline (Express).
// Error handler middlewares in Express are always introduced last and take
// four parameters instead of three.
module.exports = async function(err, req, res, next) {
    await errorHandler(err);
    res.status(500).send('internal_server_error');
}