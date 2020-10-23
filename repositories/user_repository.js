const db = require('../database/');
const logger = require('../util/logger');

class UserRepository {
    constructor() {}

    /**
     * Fetches a user from the database
     * @param {User} user A validated user object with at least properties
     * username and email set.
     * @returns {Promise<{id, username, email, password, admin, superadmin}|null>}
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
        if (result.rows.length > 0) return result.rows[0];
        return null;
    }

    /**
     * Fetches a user from the database
     * @param id The id of the user
     * @returns {Promise<{id, username, email, admin, superadmin}|null>}
     * Body contains the fetched user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchById(userId) {
        logger.silly("repositories.UserRepository.fetchById called");
        const sql = `SELECT id, username, email, admin, superadmin 
                     FROM public.user 
                     WHERE id = $1`;
        const values = [userId];
        const result = await db.query(sql, values);
        logger.silly("repositories.UserRepository.fetchById query done");
        if (result.rows.length > 0) return result.rows[0];
        return null;
    }

    /**
     * Save a new user in the database
     * @param {User} user A validated user object
     * @returns {Promise<{id, username, email, admin, superadmin}>}
     * Body contains the inserted user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async saveUser(user) {
        logger.silly("repositories.UserRepository.saveUser called");
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');
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
            const result = await client.query(sql, values);
            if (result.rowCount !== 1) throw new Error("too_many_rows_inserted");
            await client.query('COMMIT')

            logger.silly("repositories.UserRepository.saveUser query done");
            return {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email,
                admin: result.rows[0].admin,
                superadmin: result.rows[0].superadmin
            };
        } 
        catch (e) {
            await client.query('ROLLBACK')
            throw e;
        } 
        finally {
            client.release()
        }
    }
}
module.exports = UserRepository;