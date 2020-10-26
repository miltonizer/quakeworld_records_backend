const { StatusCodes } = require('http-status-codes');
const adminMiddleware = require('../../../middleware/superadmin');
const mockResponse = require('../../../util/test/mock_response');

describe('admin middleware tests', () => {
    let res;
    let next;
    let req;

    beforeEach(() => {
        res = mockResponse();
        next = jest.fn();
        req = {
            t: jest.fn( (messageKey) => {
                return messageKey;
            }),
            user: {
                admin: false,
                superadmin: false
            }
        };
    });

    it('should throw an error if req is not provided', () => {
        req = null;
        expect(() => {
            adminMiddleware(req, res, next);
        }).toThrow();
    });

    it('should throw an error if res is not provided', () => {
        res = null;
        expect(() => {
            adminMiddleware(req, res, next);
        }).toThrow();
    });

    it('should throw an error if next is not provided', () => {
        next = null;
        req.user.superadmin = true;
        expect(() => {
            adminMiddleware(req, res, next);
        }).toThrow();
    });

    it('should set statusCode to 403 forbidden and messageKey to "access_denied" if the user is not superadmin', async () => {
        req.user.admin = true;
        await adminMiddleware(req, res, next);
        expect(res.statusCode).toEqual(StatusCodes.FORBIDDEN);
        expect(res.messageKey).toEqual("access_denied");
    });

    it('should not call next() if user is admin', async () => {
        req.user.admin = true;
        await adminMiddleware(req, res, next);
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if user is superadmin', async () => {
        req.user.superadmin = true;
        await adminMiddleware(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});