const User = require('../../models/user');
const jwt = require('jsonwebtoken');
const config = require('config');

let user = {};

beforeAll(() => {
    user = new User(
        "username",
        "email",
        "password",
        false,
        false,
        666
    );
});

afterAll(() => {
    
});

describe('Test set for models.User', () => {
    it('should set all its properties properly with the constructor', async () => {
        expect.assertions(6);
        
        expect(user.username).toEqual('username');
        expect(user.email).toEqual('email');
        expect(user.password).toEqual('password');
        expect(user.admin).toEqual(false);
        expect(user.superadmin).toEqual(false);
        expect(user.id).toEqual(666);
    })

    it('should generate a valid jsonwebtoken with generateAuthToken function', async () => {
        expect.assertions(1);
        const payload = {
            id: 666, 
            admin: false,
            superadmin: false
        };
        const token = await user.generateAuthToken();
        // Config requires a test.json in its configuration folder(config)
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        expect(decoded).toMatchObject(payload); 
    });
});