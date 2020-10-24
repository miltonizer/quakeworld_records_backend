const ApplicationError = require('./application_error');
class DatabaseError extends ApplicationError {
    constructor(message, statusCode, messageKey, sql, sqlParameters) {
        super(message, statusCode, messageKey);

        Error.captureStackTrace(this, this.constructor);

        this.name = "DatabaseError";
        this.sql = sql;
        this.sqlParameters = sqlParameters;
    }
}

module.exports = DatabaseError;