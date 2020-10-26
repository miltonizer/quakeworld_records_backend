const { StatusCodes } = require('http-status-codes');
const errorMiddleware = require('../../../middleware/error');
const ApplicationError = require('../../../util/errors/application_error');
const DatabaseError = require('../../../util/errors/database_error');
const UserError = require('../../../util/errors/user_error');
const mockResponse = require('../../../util/test/mock_response');

describe('error middleware', () => {
    // Creating a mock response to be able to make chained function
    // calls like res.status().send();
    // Notice how the mock functions can still handle the parameters
    // they receive.
    const res = mockResponse();
    const next = jest.fn();
    const req = {
        t: jest.fn( (messageKey) => {
            return messageKey;
        })
    };

    it('should set the http statuscode and messageKey of res correctly when ApplicationError is received', async () => {
        expect.assertions(2);
        const applicationError = new ApplicationError(
            "Test message",
            StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
            "MessageKey"
        );

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        await errorMiddleware(applicationError, req, res, next);

        expect(res.statusCode).toEqual(StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS);
        expect(res.messageKey).toEqual("MessageKey");
    });

    it('should set the http statuscode and messageKey of res correctly when DatabaseError is received', async () => {
        expect.assertions(2);
        const databaseError = new DatabaseError(
            "Test message",
            StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
            "MessageKey",
            "sql",
            "sqlParameters"
        );

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        await errorMiddleware(databaseError, req, res, next);

        expect(res.statusCode).toEqual(StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS);
        expect(res.messageKey).toEqual("MessageKey");
    });

    it('should set the http statuscode and messageKey of res correctly when UserError is received', async () => {
        expect.assertions(2);
        const userError = new UserError(
            "Test message",
            StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
            "MessageKey"
        );

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        await errorMiddleware(userError, req, res, next);

        expect(res.statusCode).toEqual(StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS);
        expect(res.messageKey).toEqual("MessageKey");
    });

    it('should set the http statuscode and messageKey of res correctly when normal Error is received', async () => {
        expect.assertions(2);
        let normalError = new Error("Test message for normal Error");
        normalError.messageKey = "NormalErrorMessageKey";

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        await errorMiddleware(normalError, req, res, next);

        expect(res.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(res.messageKey).toEqual("NormalErrorMessageKey");
    });

    it('should return INTERNAL_SERVER_ERROR and error_internal_server_error messageKey when messageKey is not set ', async () => {
        expect.assertions(2);

        let normalError = new Error("Test message for normal Error");

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        await errorMiddleware(normalError, req, res, next);

        expect(res.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
        expect(res.messageKey).toEqual("error_internal_server_error");
    });
});