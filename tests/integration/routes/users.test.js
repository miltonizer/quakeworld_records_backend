const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const UserRepository = require("../../../repositories/user_repository");
const userRepository = new UserRepository();
const User = require( "../../../models/User");
const {verifyPassword} = require('../../../util/password_encryption');
const {insertUserToDatabase} = require('../../../util/test/user_utils');
const maxListenersExceededWarning = require('max-listeners-exceeded-warning');

let server;
let adminId;
let adminToken;
let superAdminId;
let superAdminToken;
let normalUserToken;
let normalUserId;

maxListenersExceededWarning();

async function testUserRequestBody(requestBody, exec, meAPIRequest) {
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

    if(!meAPIRequest) {
        requestBody.superadmin = true;
        requestBody.banned = null;
        res = await exec();
        expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    }
}

describe('/api/users', () => {
    
    beforeAll(async () => {
        server = require('../../../index');

        const sql = `DELETE FROM public.user`;
        await db.query(sql);
    });

    afterAll(async () => {
        await server.close();
    });

    beforeEach(async () => {
        // Creating a superadmin to get a valid id and token for him
        const superAdminUser = await insertUserToDatabase("superadmin", 
                                                    "superadmin@test.com", 
                                                    "user.password", 
                                                    true,
                                                    true);
        superAdminId = superAdminUser.id;
        superAdminToken = superAdminUser.generateAuthToken();

        // Creating an admin to get a valid id and token for him
        const adminUser = await insertUserToDatabase("admin",
                                                "admin@test.com",
                                                "user.password",
                                                true,
                                                false);
        adminId = adminUser.id;
        adminToken = adminUser.generateAuthToken();

        // Creating a normal user that is used in some tests
        const normalUser = await insertUserToDatabase("normalUser",
                                                "normalUser@test.com",
                                                "user.password",
                                                false,
                                                false);
        normalUserId = normalUser.id;
        normalUserToken = normalUser.generateAuthToken();
    });

    afterEach(async () => {
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

    let requestBody;
    describe('PATCH /me', () => {
        const exec = async () => {
            return await request(server)
                .patch(`/api/users/me`)
                .set('x-auth-token', superAdminToken)
                .send(requestBody);
        }

        beforeEach(() => {
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

        it('should return 400 bad request if there is no valid patch body', async () => {
            expect.assertions(5);

            await testUserRequestBody(requestBody, exec, true);
        });

        it('should not be able to ban or unban yourself', async () => {
            expect.assertions(2);

            requestBody.banned = true;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const { banned } = JSON.parse(res.text);
            expect(banned).toBe(false);
        });

        it('should return 400 bad request if username/email is already taken', async () => {
            expect.assertions(2);

            requestBody.email = "normalUser@test.com";
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.email = "newEmail@test.com";
            requestBody.username = "normalUser";
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);     
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
                .get(`/api/users/${superAdminId}`)
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
            const sqlParameters = [superAdminId];
            const result = await db.query(sql, sqlParameters);
            const password = result.rows[0].password;
            expect(verifyPassword(password, requestBody.password)).toBeTruthy();
        });
    });

    //-------------------------------------------------------------------------
    //-------------------------------------------------------------------------

    describe('GET /', () => {
        let pageNumber;
        let pageSize;
        let username;
        const exec = async () => {
            return await request(server)
                .get(`/api/users`)
                .query({
                    page: pageNumber,
                    page_size: pageSize,
                    username: username
                })
                .set('x-auth-token', superAdminToken)
                .send();
        }

        beforeEach(() => {
            pageNumber = 1,
            pageSize = 10,
            username = undefined
        });

        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);

            superAdminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not an admin', async () => {
            expect.assertions(1);
            superAdminToken = normalUserToken;
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if query params are not valid', async () => {
            expect.assertions(2);

            pageNumber = 'notANumber';
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            pageNumber = 1;
            pageSize = 'notANumber';
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 OK and all users in JSON with no query parameters', async () => {
            expect.assertions(2);

            pageSize = undefined;
            pageNumber = undefined;
            username = undefined;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const users = JSON.parse(res.text);
            expect(users.length).toBe(3);
        });

        it('should return 200 OK and the right amount of users matching the query parameters', async () => {
            //expect.assertions(2);

            pageSize = 10;
            pageNumber = 1;
            username = undefined;
            let res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
            let users = JSON.parse(res.text);
            expect(users.length).toBe(3);

            pageSize = 10;
            pageNumber = 1;
            username = "User";
            res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
            users = JSON.parse(res.text);
            expect(users.length).toBe(1);

            pageSize = 2;
            pageNumber = 2;
            username = undefined;
            res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
            users = JSON.parse(res.text);
            expect(users.length).toBe(1);
        });
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

        beforeEach(() => {
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

        it('should return 403 forbidden if the user is not a superadmin or an admin', async () => {
            expect.assertions(1);
            superAdminToken = normalUserToken;
          
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
        });

        it('should return 400 bad request if there is no valid patch body', async () => {
            expect.assertions(6);

            await testUserRequestBody(requestBody, exec, false);
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

        it('should return 400 bad request if username/email already exists and its not the username/email of the user being modified', async () => {
            expect.assertions(2);

            requestBody.username = "normalUser";
            let res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);

            requestBody.username = "newUsername";
            requestBody.email = "normalUser@test.com";
            res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 200 OK if username/email already exists but the username belongs to the user being modified', async () => {
            expect.assertions(2);

            // Let's change the adminId to superAdminId so that the user is
            // trying to modify his own information
            adminId = superAdminId;

            requestBody.username = "superadmin@test.com";
            let res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            requestBody.username = "newUsername";
            requestBody.email = "superadmin@test.com";
            res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
        });

        it('should return 200 if the user exists and the patch body is valid', async () => {
            expect.assertions(1);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
        });

        it('should update the user in the database after a successful patch request', async () => {
            expect.assertions(7);

            requestBody.username = `newUsername`;
            requestBody.email = `new@email.com`;
            requestBody.admin = true;
            requestBody.superadmin = true;
            requestBody.banned = true;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            const userResponse = await request(server)
                .get(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send();
            expect(userResponse.status).toBe(StatusCodes.OK);

            const { username, email, admin, superadmin, banned } = JSON.parse(userResponse.text);
            expect(username).toBe('newUsername');
            expect(email).toBe('new@email.com');
            expect(admin).toBe(true);
            expect(superadmin).toBe(true);
            expect(banned).toBe(true);
        });

        it('should not update admin or superadmin statuses if the user is not superadmin', async () => {
            expect.assertions(3);

            // Setting the requester to be only admin and the target id to be superAdminId
            superAdminToken = adminToken;
            adminId = normalUserId;

            // Trying to set admin and superadmin properties to false
            requestBody.admin = true;
            requestBody.superadmin = true;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            // Expecting admin and superadmin properties to still be true
            const { admin, superadmin } = JSON.parse(res.text);
            expect(admin).toBe(false);
            expect(superadmin).toBe(false);
        });

        it('should not update superadmins data unless the user is the superadmin himself', async () => {
            expect.assertions(1);

            // Setting the requester to be only admin and the target id to be superAdminId
            superAdminToken = adminToken;
            adminId = superAdminId,

            requestBody.password = 'newPassword';
            requestBody.username = 'newUsername';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.FORBIDDEN);
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
        const exec = async () => {
            return await request(server)
                .get(`/api/users/${adminId}`)
                .set('x-auth-token', superAdminToken)
                .send();
        }

        it('should return 401 unauthorized if the user is not authenticated', async () => {
            expect.assertions(1);
            superAdminToken = '';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        it('should return 403 forbidden if the user is not an admin', async () => {
            expect.assertions(1);
            superAdminToken = normalUserToken;
          
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