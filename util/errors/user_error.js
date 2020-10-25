const ApplicationError = require('./application_error');
class UserError extends ApplicationError {
    constructor(message, statusCode, messageKey) {
        super(message, statusCode, messageKey);

        Error.captureStackTrace(this, this.constructor);

        this.name = "UserError";
    }
}

module.exports = UserError;