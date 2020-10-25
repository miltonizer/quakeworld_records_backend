const User = require('../../../models/user');
const auth = require('../../../middleware/auth');
const UserError = require('../../../util/errors/user_error');

describe('auth middleware', () => {
    // Creating mock versions of the functions that are called
    // in auth middleware.
    const res = {};
    const next = jest.fn();

    it('should populate req.user with the payload of a valid JWT', () => {
        expect.assertions(3);

        // Creating a user and a corresponding jwt token that are checked
        // used in the assertions later.
        const user = new User(
            "username",
            "email",
            "password",
            false,
            false,
            666
        );
        const token = user.generateAuthToken();

        // Mocking the request to return the token that was just created
        const req = {
            header: jest.fn().mockReturnValue(token)
        };

        // Calling the auth middleware with the mocked functions.
        // Notice how req.header function returns the token that was
        // created manually.
        auth(req, res, next);

        expect(req.user.id).toEqual(user.id);
        expect(req.user.admin).toEqual(user.admin);
        expect(req.user.superadmin).toEqual(user.superadmin);
    });

    it('should throw a UserError if no token is set', () => {
        // Mocking the request to return a null token
        const req = {
            header: jest.fn().mockReturnValue(null)
        };

        // Calling the auth middleware with the mocked functions.
        // From the jest documentation:
        // "Note: You must wrap the code in a function, otherwise
        // the error will not be caught and the assertion will fail.""
        expect(() => {
            auth(req, res, next);
        }).toThrow(UserError);
    });

    it('should throw a UserError if the token is not valid', () => {
        // Mocking the request to return an invalid token
        const req = {
            header: jest.fn().mockReturnValue("invalid_token")
        };

        expect(() => {
            auth(req, res, next);
        }).toThrow(UserError);
    });
});