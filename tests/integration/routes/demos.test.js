const request = require('supertest');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const config = require('config');
const { StatusCodes } = require('http-status-codes');
const db = require('../../../database/');
const DemoRepository = require("../../../repositories/demo_repository");
const demoRepository = new DemoRepository();
const maxListenersExceededWarning = require('max-listeners-exceeded-warning');
const {insertUserToDatabase} = require('../../../util/test/user_utils');
const { createHttpTerminator} = require('http-terminator');

let server;
let httpTerminator;
let normalUserToken;
let normalUserId;

maxListenersExceededWarning();

describe('/api/demos', () => {
    beforeAll(async () => {
        server = require('../../../index');

        httpTerminator = createHttpTerminator({server});

        const sql = `DELETE FROM public.user`;
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

    beforeEach(async () => {
        const sql = `DELETE FROM public.demo`;
        await db.query(sql);
        await fsPromises.rmdir(config.get('demo_base_folder'), {recursive: true});
    });

    afterAll(async () => {
        await fsPromises.rmdir(config.get('demo_base_folder'), {recursive: true});

        let sql = `DELETE FROM public.demo`;
        await db.query(sql);

        sql = `DELETE FROM public.user`;

        await db.query(sql);
        await db.pool.end();       
        await httpTerminator.terminate();
    });  

    describe('POST /', () => {
        let demo1;
        let demo2;
        let userToken;
        const demo1Filename = '2on2_red_vs_blue[dm4]310720-1950_129_frags.mvd';
        const demo2Filename = '4on4_blue_vs_muta_e1m2_200121-2334_157_frags.mvd';

        // Notice the keep-alive header. Without it the tests
        // crash with either ECONNRESET or ECONNABORTED
        const exec = async () => {
            return await request(server)
                .post('/api/demos')
                .set('x-auth-token', userToken)
                .set('Connection', 'keep-alive')
                .attach('demos', demo1)
                .attach('demos', demo2);                  
        }

        beforeEach(async () => {
            demo1 = `.${path.sep}tests${path.sep}files${path.sep}${demo1Filename}`;
            demo2 = `.${path.sep}tests${path.sep}files${path.sep}${demo2Filename}`;
            userToken = normalUserToken;
        });
        
        it('should respond 400 BAD_REQUEST if token is invalid', async () => {
            expect.assertions(1);

            userToken = 'invalid_token';
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should respond 400 BAD_REQUEST if demo file doesnt have .mvd file extension', async () => {
            expect.assertions(1);

            demo1 = `.${path.sep}tests${path.sep}files${path.sep}4on4_blue_vs_red[cmt1b]090417-1539.not_mvd`;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should respond 400 BAD_REQUEST if demo file is too big', async () => {
            expect.assertions(1);

            demo1 = `.${path.sep}tests${path.sep}files${path.sep}too_big_demo_archive.zip.mvd`;
            const res = await exec();
            expect(res.status).toBe(StatusCodes.BAD_REQUEST);
        });

        it('should respond 200 OK and save the uploaded valid files to disk', async () => {
            expect.assertions(3);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
            expect(fs.existsSync(config.get('demo_base_folder') + `${normalUserId}${path.sep}` + demo1Filename)).toBeTruthy();
            expect(fs.existsSync(config.get('demo_base_folder') + `${normalUserId}${path.sep}` + demo1Filename)).toBeTruthy();

            // Notice that the uploaded files need to be removed manually
            // because jest does something strange with permissions and
            // the whole directory structure demos/test cannot be removed
            // resursively.
            await fsPromises.rmdir(config.get('demo_base_folder') + `${normalUserId}${path.sep}`, {recursive: true});
        });

        /* it('should respond 200 OK and save demo meta data to database', async () => {
            expect.assertions(3);

            const res = await exec();
            expect(res.status).toBe(StatusCodes.OK);
            expect(fs.existsSync(demo1)).toBeTruthy();
            expect(fs.existsSync(demo2)).toBeTruthy();
            
        }); */
    });
});