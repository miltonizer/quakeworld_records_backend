const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto')
const db = require('../database/');
const logger = require('../util/logger');
const DatabaseError = require('../util/errors/database_error');
const UserError = require('../util/errors/user_error');

class DemoRepository {
    constructor() {}

    /**
     * Fetches a list of MD5 check sums of demos that already exist in the
     * database
     * @param uploadedMD5s An array of MD5 checksums for the uploaded demos
     * @returns matchingMD5s An array of MD5 checksums that already exist
     * in the database.  
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchMatchingMD5s(uploadedMD5s) {
        let matchingMD5s = new Array();
        let somethingAlreadySet = false;
        let sql = `SELECT md5sum
                     FROM public.demo 
                     WHERE md5sum IN (`;
        for(let i=0; i < uploadedMD5s.length; i++) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sql += `$${i+1}`;
        }
        sql += `)`;

        const result = await db.query(sql, uploadedMD5s);

        if (result.rows.length > 0) {
            for(let i = 0; i < result.rows.length; i++) {
                matchingMD5s.push(result.rows[i].md5sum);
            }
        }
        return matchingMD5s;
    }

    /**
     * Save metadata of new demos to the database
     * @param demos, userId demos is an array of files
     * and userId is the id of the user who uploaded the files 
     * @returns paths of files added to the database
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async uploadDemos(demos, userId) {
        logger.silly(`repositories.DemoRepository.uploadDemos called with ${JSON.stringify(demos)}`);
        let somethingAlreadySet = false;
        let sqlParameters = [];
        let sql = `INSERT INTO public.demo (path,
                                            create_user, 
                                            md5sum) 
                                VALUES `;
        for(let i = 0; i < demos.length; i++) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(demos[i].path);
            sqlParameters.push(userId);
            sqlParameters.push(demos[i].md5sum);
            sql += `($${i*3+1}, $${i*3+2}, $${i*3+3}) `; 
        }
        sql += `RETURNING path `;
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');          
            const result = await client.query(sql, sqlParameters);
            await client.query('COMMIT');

            logger.silly("repositories.UserRepository.uploadDemos query done");
            return result.rows;
        } 
        catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } 
        finally {
            client.release();
        }
    }
}

module.exports = DemoRepository;