const db = require('../database/');
const logger = require('../util/logger');
const DatabaseError = require('../util/errors/database_error');
const User = require( "../models/User");

class UserRepository {
    constructor() {}

    /**
     * Fetches a user from the database
     * @param {User} user A validated user object with at least properties
     * username and email set.
     * @returns {Promise<{User}|null>}
     * Body contains the inserted user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchUser(user) {
        logger.silly("repositories.UserRepository.fetchUser called");
        const { username, email } = user;
        const sql = `SELECT id, username, email, password, admin, superadmin 
                     FROM public.user 
                     WHERE email = $1 OR username = $2`;
        const values = [email, username];
        const result = await db.query(sql, values);
        logger.silly("repositories.UserRepository.fetchUser query done");
        if (result.rows.length == 1) {
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                result.rows[0].password,
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id
            );
            return user;
        }
        else if (result.rows.length > 0) {
            throw new DatabaseError(
                "Multiple users found.", 
                400, 
                "error_multiple_users_found",
                sql,
                values
            );
        }
        return null;
    }

    /**
     * Fetches a user from the database
     * @param id The id of the user
     * @returns {Promise<{User}|null>}
     * Body contains the fetched user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchById(userId) {
        logger.silly("repositories.UserRepository.fetchById called");
        const sql = `SELECT id, username, password, email, admin, superadmin 
                     FROM public.user 
                     WHERE id = $1`;
        const values = [userId];
        const result = await db.query(sql, values);
        logger.silly("repositories.UserRepository.fetchById query done");
        if (result.rows.length == 1) {
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                result.rows[0].password,
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id
            );
            return user;
        }
        else if (result.rows.length > 1) {
            throw new DatabaseError(
                "Multiple users found.", 
                400, 
                "error_multiple_users_found",
                sql,
                values
            );
        }
        return null;
    }

    /**
     * Save a new user in the database
     * @param {User} user A validated user object
     * @returns {Promise<{User}>}
     * Body contains the inserted user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async saveUser(user) {
        logger.silly(`repositories.UserRepository.saveUser called with ${JSON.stringify(user)}`);
        const sql = `INSERT INTO public.user (username,
                                            email, 
                                            password, 
                                            admin, 
                                            superadmin) 
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING *`;
        const values = [
            user.username,
            user.email,
            user.password,
            false,
            false
        ];

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');
            
            const result = await client.query(sql, values);

            // The function should save exactly one row
            if (result.rowCount !== 1) {
                throw new DatabaseError(
                    "Too many rows inserted.", 
                    500, 
                    "error_too_many_rows_inserted",
                    sql,
                    values
                );
            }
            await client.query('COMMIT');

            logger.silly("repositories.UserRepository.saveUser query done");
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                result.rows[0].password,
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id
            );
            return user;
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
module.exports = UserRepository;