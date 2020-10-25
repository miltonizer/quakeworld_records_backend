const User = require('../../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');

let user = {};

describe('Test set for models.User', () => {
    beforeEach(() => {
        user = new User(
            "username",
            "email",
            "password",
            false,
            false,
            666
        );
    });

    it('should set all its properties properly with the constructor', () => {
        expect.assertions(6);
        
        expect(user.username).toEqual('username');
        expect(user.email).toEqual('email');
        expect(user.password).toEqual('password');
        expect(user.admin).toEqual(false);
        expect(user.superadmin).toEqual(false);
        expect(user.id).toEqual(666);
    })

    it('should generate a valid jsonwebtoken with generateAuthToken function', () => {
        expect.assertions(1);
        const payload = {
            id: 666, 
            admin: false,
            superadmin: false
        };
        const token = user.generateAuthToken();
        // Config requires a test.json in its configuration folder(config)
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject(payload); 
    });
});