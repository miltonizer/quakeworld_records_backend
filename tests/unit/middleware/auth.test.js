const User = require('../../../models/user');
const auth = require('../../../middleware/auth');
const UserError = require('../../../util/errors/user_error');
const UserService = require('../../../services/user_service');

describe('auth middleware', () => {
    // Creating mock versions of the functions that are called
    // in auth middleware.
    const res = {};
    const next = jest.fn();

    it('should throw a UserError if no token is set', async () => {
        // Mocking the request to return a null token
        const req = {
            header: jest.fn().mockReturnValue(null)
        };

        // Calling the auth middleware with the mocked functions.
        await expect(auth(req, res, next)).rejects.toThrow(UserError);
    });

    it('should throw a UserError if the token is not valid', async () => {
        // Mocking the request to return an invalid token
        const req = {
            header: jest.fn().mockReturnValue("invalid_token")
        };

        await expect(auth(req, res, next)).rejects.toThrow(UserError);
    });
});