const { StatusCodes } = require('http-status-codes');
const { errorHandler } = require('../util/error_handler');
const ApplicationError = require('../util/errors/application_error');

// This catches only errors in the request processing pipeline (Express).
// Error handler middlewares in Express are always introduced last and take
// four parameters instead of three.
module.exports = async function(err, req, res, next) {
    await errorHandler(err);
    if(!res.headersSent) {
        if(err instanceof ApplicationError) {
            res.status(err.statusCode).send(req.t(err.messageKey));
        }
        else {
            if(err.messageKey) {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(req.t(err.messageKey));
            }
            else {
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(req.t('error_internal_server_error'));
            }
        }
    }
    next();
}