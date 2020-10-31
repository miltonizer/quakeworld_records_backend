const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const UserRepository = require("../../../repositories/user_repository");
const userRepository = new UserRepository();
const User = require( "../../../models/User");
const {verifyPassword} = require('../../../util/password_encryption');

let server;
let adminId;
let adminToken;
let superAdminId;
let superAdminToken;

describe('/api/users', () => {
    
    beforeAll(async () => {
        const sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    beforeEach(async () => {
        server = require('../../../index');

        // Creating a superadmin to get a valid id and token for him
        let sql = `INSERT INTO public.user (username,
                                email, 
                                password, 
                                admin, 
                                superadmin) 
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id, username, email, admin, superadmin`;
        let sqlParameters = [
            "superadmin",
            "superadmin@test.com",
            "user.password",
            true,
            true
        ];

        const superAdminResult = await db.query(sql, sqlParameters);
        const superAdminUser = new User(
            superAdminResult.rows[0].username, 
            superAdminResult.rows[0].email,
            superAdminResult.rows[0].password,
            superAdminResult.rows[0].admin,
            superAdminResult.rows[0].superadmin,
            superAdminResult.rows[0].id);
        superAdminId = superAdminUser.id;
        superAdminToken = superAdminUser.generateAuthToken();

        // Creating a superadmin to get a valid id and token for him
        sql = `INSERT INTO public.user (username,
                                email, 
                                password, 
                                admin, 
                                superadmin) 
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, username, email, admin, superadmin`;
        sqlParameters = [
            "admin",
            "admin@test.com",
            "user.password",
            true,
            false
        ];

        const adminResult = await db.query(sql, sqlParameters);
        const adminUser = new User(
            adminResult.rows[0].username, 
            adminResult.rows[0].email,
            adminResult.rows[0].password,
            adminResult.rows[0].admin,
            adminResult.rows[0].superadmin,
            adminResult.rows[0].id);
        adminId = adminUser.id;
        adminToken = adminUser.generateAuthToken();
    });

    afterEach(async () => {
        await server.close();

        const sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    describe('GET /me', () => {
        const exec = async () => {
            return await request(server)
                .get('/api/users/me')
                .set('x-auth-token', adminToken)
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
            expect(username).toBe('admin');
            expect(email).toBe('admin@test.com');
            expect(password).toHaveLength(0);
            expect(admin).toBe(true);
            expect(superadmin).toBe(false);
            expect(id).toBe(adminId);
        });
        
        it('should respond 400 BAD_REQUEST if token is invalid', async () => {
            adminToken = 'invalid_token';
            expect.assertions(1);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('PATCH /me', () => {
        const exec = async () => {
            return await request(server)
                .patch(`/api/users/me`)
                .set('x-auth-token', superAdminToken)
                .send();
        }

        // Should return
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('GET /', () => {
        const exec = async () => {
            return await request(server)
                .get(`/api/users`)
                .set('x-auth-token', superAdminToken)
                .send();
        }
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('DELETE /:id', () => {
        const exec = async () => {
            return await request(server)
                .delete(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send();
        }
        
        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            superAdminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not a superadmin', async () => {
            expect.assertions(1);
            superAdminToken = adminToken;
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if user id is not numeric', async () => {
            expect.assertions(1);

            adminId = 'Miltonizer'    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if there is no user with the given id', async () => {
            expect.assertions(1);

            adminId = 666    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 if the user exists', async () => {
            expect.assertions(1);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
        });

        it('the user should be removed from the database after a successful request', async () => {
            expect.assertions(2);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const userResponse = await request(server)
                .get(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send();
            expect(userResponse.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('DELETE /me', () => {
        const exec = async () => {
            return await request(server)
                .delete(`/api/users/me`)
                .set('x-auth-token', adminToken)
                .send();
        }
        
        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            adminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('the user should be removed from the database after a successful request', async () => {
            expect.assertions(2);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const userResponse = await request(server)
                .get(`/api/users/me`)
                .set('x-auth-token', adminToken)
                .send();
            expect(userResponse.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('PATCH /:id', () => {
        let requestBody;
        const exec = async () => {
            return await request(server)
                .patch(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send(requestBody);
        }

        beforeEach(async () => {
            requestBody = {
                username: "Miltonizer",
                email: "asdf@asdf.com",
                password: "password"
            }
        });
        
        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            superAdminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not a superadmin', async () => {
            expect.assertions(1);
            superAdminToken = adminToken;
          
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

            adminId = 'Miltonizer'    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if there is no user with the given id', async () => {
            expect.assertions(1);

            adminId = 666    
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
                .get(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
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
            const sqlParameters = [adminId];
            const result = await db.query(sql, sqlParameters);
            const password = result.rows[0].password;
            expect(verifyPassword(password, requestBody.password)).toBeTruthy();
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('GET /:id', () => {
        let normalUserId;
        let normalUserToken;
        const exec = async () => {
            return await request(server)
                .get(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send();
        }

        beforeEach(async () => {
            requestBody = {
                username: "normalUser",
                email: "normaluser@test.com",
                password: "password"
            }
            const userCreationResponse = await request(server)
                                            .post('/api/users')
                                            .send(requestBody);
            const { username, email, admin, superadmin, id } = JSON.parse(userCreationResponse.text);
            normalUserId = id;
            const normalUser = new User(
                username, 
                email,
                '',
                admin,
                superadmin,
                id);
            normalUserToken = normalUser.generateAuthToken();
        });

        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            superAdminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not an admin', async () => {
            expect.assertions(1);
            superAdminToken = normalUserToken
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if user id is not numeric', async () => {
            expect.assertions(1);

            adminId = 'Miltonizer'    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 bad request if there is no user with the given id', async () => {
            expect.assertions(1);

            adminId = 666    
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 OK and a proper user object if a valid request is made', async () => {
            expect.assertions(6);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const { username, email, admin, superadmin } = JSON.parse(res.text);
            const resultId = JSON.parse(res.text).id;
            expect(username).toBe('admin');
            expect(email).toBe('admin@test.com');
            expect(admin).toBe(true);
            expect(superadmin).toBe(false);
            expect(resultId).toBe(adminId);
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

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