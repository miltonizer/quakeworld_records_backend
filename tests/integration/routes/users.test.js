const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const UserRepository = require("../../../repositories/user_repository");
const userRepository = new UserRepository();
const User = require( "../../../models/User");
const {verifyPassword} = require('../../../util/password_encryption');

let server;

describe('/api/users', () => {
    beforeAll(async () => {
        const sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    beforeEach(async () => {
        server = require('../../../index');
    });

    afterEach(async () => {
        await server.close();

        const sql = `DELETE FROM public.user`;
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

    describe('PATCH /:id', () => {
        let requestBody;
        let id;
        let token;
        const exec = async () => {
            return await request(server)
                .patch(`/api/users/${id}`)
                .set('x-auth-token', token)
                .send(requestBody);
        }

        beforeEach(async () => {
            requestBody = {
                username: "Miltonizer",
                email: "asdf@asdf.com",
                password: "password"
            }

            // Creating a new user to get a valid id
            const res = await request(server)
                .post('/api/users')
                .send(requestBody);
            id = JSON.parse(res.text).id;

            const user = new User("client", "client@test.com", "password", true, true);
            token = user.generateAuthToken();
        });
        
        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            token = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not a superadmin', async () => {
            expect.assertions(1);
            const onlyAdminUser = new User("client", "client@test.com", "password", true, false);
            token = onlyAdminUser.generateAuthToken();
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if there is no valid patch body', async () => {
            expect.assertions(5);

            requestBody.username = '';
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.username = 'username';
            requestBody.email = 'notAValidEmail';
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.email = 'asdf@asdf.com';
            requestBody.password = 'toShort';
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.password = 'longEnough';
            requestBody.admin = null;
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.admin = true;
            requestBody.superadmin = null;
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if user id is not numeric', async () => {
            expect.assertions(1);

            id = 'Miltonizer'    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if there is no user with the given id', async () => {
            expect.assertions(1);

            id = 666    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 if the user exists and the patch body is valid', async () => {
            expect.assertions(1);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
        });

        it('should update the user in the database after a successful patch request', async () => {
            expect.assertions(6);

            requestBody.username = `newUsername`;
            requestBody.email = `new@email.com`;
            requestBody.admin = true;
            requestBody.superadmin = true;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const userResponse = await request(server)
                .get(`/api/users/${id}`)
                .set('x-auth-token', token)
                .send();
            expect(userResponse.status).toBe(StatusCodes.OK);

            const { username, email, admin, superadmin } = JSON.parse(userResponse.text);
            expect(username).toBe('newUsername');
            expect(email).toBe('new@email.com');
            expect(admin).toBe(true);
            expect(superadmin).toBe(true);
        });

        it('should update and hash users password after a successful patch request with a password', async() => {
            expect.assertions(2);

            // Updating user's password
            requestBody.password = `newPassword`;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            // Fetching the updated password from the database
            const sql = `SELECT password
                        FROM public.user 
                        WHERE id = $1`;
            const sqlParameters = [id];
            const result = await db.query(sql, sqlParameters);
            const password = result.rows[0].password;
            expect(verifyPassword(password, requestBody.password)).toBeTruthy();
        });
    });

    describe('get /:id', () => {
        let id;
        let token;
        const exec = async () => {
            return await request(server)
                .get(`/api/users/${id}`)
                .set('x-auth-token', token)
                .send();
        }

        beforeEach(async () => {
            const user = new User("client", "client@test.com", "password", true, true);
            token = user.generateAuthToken();
        });

        // Should return 
        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            token = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not an admin', async () => {
            expect.assertions(1);
            const standardUser = new User("client", "client@test.com", "password", false, false);
            token = standardUser.generateAuthToken();
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if user id is not numeric', async () => {
            expect.assertions(1);

            id = 'Miltonizer'    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if there is no user with the given id', async () => {
            expect.assertions(1);

            id = 666    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 OK and a proper user object if a valid request is made', async () => {
            expect.assertions(6);
            requestBody = {
                username: "Miltonizer",
                email: "asdf@asdf.com",
                password: "password"
            }

            // Creating a new user to get a valid id
            const userCreationResponse = await request(server)
                .post('/api/users')
                .send(requestBody);
            id = JSON.parse(userCreationResponse.text).id;

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const { username, email, admin, superadmin } = JSON.parse(res.text);
            const resultId = JSON.parse(res.text).id;
            expect(username).toBe('Miltonizer');
            expect(email).toBe('asdf@asdf.com');
            expect(admin).toBe(false);
            expect(superadmin).toBe(false);
            expect(resultId).toBe(id);
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