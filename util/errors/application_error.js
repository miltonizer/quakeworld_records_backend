class ApplicationError extends Error {
    constructor(message, statusCode, messageKey) {
        super(message);

        Error.captureStackTrace(this, this.constructor);

        this.name = "ApplicationError";
        this.statusCode = statusCode;

        this.messageKey = messageKey;
    }
}

module.exports = ApplicationError;