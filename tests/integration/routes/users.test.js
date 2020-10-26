const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const UserRepository = require("../../../repositories/user_repository");
const userRepository = new UserRepository();
const User = require( "../../../models/User");

let server;

describe('/api/users', () => {
    beforeAll(async () => {
        let sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    beforeEach(async () => {
        server = require('../../../index');
    });

    afterEach(async () => {
        await server.close();

        let sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    describe('get /me', () => {
        let token;
        beforeEach(async () => {
            // Creating a new user to get a valid token
            const res = await request(server)
                .post('/api/users')
                .send({
                    username: "Miltonizer",
                    email: "asdf@asdf.com",
                    password: "password"
                });
            token = res.headers['x-auth-token'];
        });

        const exec = async () => {
            return await request(server)
                .get('/api/users/me')
                .set('x-auth-token', token)
                .send();                    
        }

        it('should respond 200 OK if user is authenticated and found in the database', async () => {
            // Notice that the auth middleware sets the user id in request
            // which is then used to fetch the rest of the information
            // from the database
            expect.assertions(7);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const { username, 
                email, 
                password, 
                admin, 
                superadmin, 
                id } = JSON.parse(res.text);
            expect(username).toBe('Miltonizer');
            expect(email).toBe('asdf@asdf.com');
            expect(password).toHaveLength(0);
            expect(admin).toBe(false);
            expect(superadmin).toBe(false);
            expect(id).toBeDefined();
        });
        
        it('should respond 400 BAD_REQUEST if token is invalid', async () => {
            token = 'invalid_token';
            expect.assertions(1);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should respond 400 BAD_REQUEST if token is valid but the user isnt in the database', async () => {
            user = new User(
                "username",
                "email",
                "password",
                false,
                false,
                666
            );
            token = await user.generateAuthToken();

            expect.assertions(1);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

    });

    describe('POST /', () => {
        // Define the happy path, and then in each test one parameter 
        // that clearly aligns with the name of the test is changed.
        // The happy path should always be restored in beforeEach
        // so that every test can start with the same initial setup.
        let requestBody;
        const exec = async () => {
            return await request(server)
                .post('/api/users')
                .send(requestBody);
        }

        beforeEach(() => {
            requestBody = {
                username: "Miltonizer",
                email: "asdf@asdf.com",
                password: "password"
            }
        });

        it('should save a new user to the database if the user doesnt exist yet', async () => {
            expect.assertions(2);

            // Saving the user to the database
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            // Making sure the user was actually inserted into the database
            const newUser = await userRepository.fetchUser(requestBody);
            expect(newUser).not.toBeNull();
        });

        it('should return 400 if user exists already', async () => {
            expect.assertions(3);

            // Inserting the user for the first time
            await exec();

            // Trying to insert the same user again
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            // Trying to insert another user with the same
            // email
            requestBody.username = "AnotherUsername";
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            // Making sure everything works if both username
            // and email are changed
            requestBody.email = "newEmail@test.com";
            res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
        })

        it('should return 400 if bad parameters are given', async () => {
            expect.assertions(3);

            // Bad username
            requestBody.username = '';
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            // Bad email
            requestBody.email = 'whatever@';
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            // Too short password
            requestBody.password = '';
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        })
    });
});