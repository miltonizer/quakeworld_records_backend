const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const config = require('config');
const db = require('../../../database/');
const UserRepository = require("../../../repositories/user_repository");
const userRepository = new UserRepository();

let server;

describe('/api/auth', () => {
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

    describe('POST /', () => {
        // Define the happy path, and then in each test one parameter 
        // that clearly aligns with the name of the test is changed.
        // The happy path should always be restored in beforeEach
        // so that every test can start with the same initial setup.
        let requestBody;
        const exec = async () => {
            return await request(server)
                .post('/api/auth')
                .send(requestBody);
        }

        beforeEach(async () => {
            // Adding a user to the database
            await request(server)
                .post('/api/users')
                .send({
                    username: "Miltonizer",
                    email: "test@test.com",
                    password: "password"
                });

            requestBody = {
                emailOrUsername: "Miltonizer",
                password: "password"
            }
        });

        it('should return 200 OK and a valid jwt token if username and password are correct', async () => {
            expect.assertions(2);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);

            // Checking that the received token is a valid jsonwebtoken
            // Notice that the token is sent in res.text
            const decoded = jwt.verify(res.text, config.get('jwtPrivateKey'));      
            expect(decoded).not.toBeNull();
        });

        it('should return 400 BAD_REQUEST if user is not found', async () => {
            expect.assertions(1);
            requestBody.emailOrUsername = "notInTheDatabase";

            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 BAD_REQUEST if password is incorrect', async () => {
            expect.assertions(1);
            requestBody.password = "wrongPassword";

            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 BAD_REQUEST if password is not given', async () => {
            expect.assertions(1);
            requestBody.password = null;

            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should return 400 BAD_REQUEST if username/email is not given', async () => {
            expect.assertions(1);
            requestBody.emailOrUsername = null;

            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });
});