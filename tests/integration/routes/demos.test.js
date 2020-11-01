const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const DemoRepository = require("../../../repositories/demo_repository");
const demoRepository = new DemoRepository();
const maxListenersExceededWarning = require('max-listeners-exceeded-warning');
const {insertUserToDatabase} = require('../../../util/test/user_utils');

let server;
let normalUserToken;
let normalUserId;

maxListenersExceededWarning();

describe('/api/demos', () => {
    
    beforeAll(async () => {
        server = require('../../../index');

        //let sql = `DELETE FROM public.demo`;
        //await db.query(sql);

        sql = `DELETE FROM public.user`;
        await db.query(sql);

        // Creating a normal user that is used in some tests
        const normalUser = await insertUserToDatabase("normalUser",
                                                "normalUser@test.com",
                                                "user.password",
                                                false,
                                                false);
        normalUserId = normalUser.id;
        normalUserToken = normalUser.generateAuthToken();
    });

    afterAll(async () => {
        const sql = `DELETE FROM public.user`;
        await db.query(sql);

        await server.close();
    });

    beforeEach(async () => {
        
    });

    afterEach(async () => {
        //const sql = `DELETE FROM public.demo`;
        //await db.query(sql);
    });

    describe('POST /', () => {
        const exec = async () => {
            return await request(server)
                .post('/api/demos')
                .set('x-auth-token', normalUserToken)
                .send();                    
        }
        
        it('should respond 400 BAD_REQUEST if token is invalid', async () => {
            normalUserToken = 'invalid_token';
            expect.assertions(1);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should respond 400 BAD_REQUEST if demo file size is not valid', async () => {
            expect.assertions(1);
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });
    });
});