const { StatusCodes } = require('http-status-codes');
const db = require('../database/');
const logger = require('../util/logger');
const DatabaseError = require('../util/errors/database_error');
const UserError = require('../util/errors/user_error');
const User = require( "../models/user");

class UserRepository {
    constructor() {}

    /**
     * Fetches a user from the database
     * @param {User} user A validated user object with at least properties
     * username and email set.
     * @returns {Promise<{User}|null>}
     * Body contains the inserted user object with id, username, email, 
     * password, admin and superadmin fields set.
     * 
     * WARNING: unset the password field before returning 
     * the object to clients
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchUser(user) {
        logger.silly("repositories.UserRepository.fetchUser called");
        const { username, email } = user;
        const sql = `SELECT id, username, email, password, 
                            admin, superadmin, banned
                     FROM public.user 
                     WHERE email = $1 OR username = $2`;
        const sqlParameters = [email, username];
        const result = await db.query(sql, sqlParameters);
        logger.silly("repositories.UserRepository.fetchUser query done");
        if (result.rows.length == 1) {
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                result.rows[0].password,
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id,
                result.rows[0].banned
            );
            return user;
        }
        else if (result.rows.length > 0) {
            throw new DatabaseError(
                "Multiple users found.", 
                StatusCodes.BAD_REQUEST, 
                "error_multiple_users_found",
                sql,
                sqlParameters
            );
        }
        return null;
    }

    /**
     * Fetches users from the database
     * @param username 
     * @param limit 
     * @param offset
     * @returns {Promise<[{User}]>}
     * In successful returns the body will contain a list of valid 
     * user objects (can be empty).
     *
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchUsers(username, limit, offset) {
        let sqlParameters = [];
        let sql = `SELECT id, username, email, password, 
                            admin, superadmin, banned
                     FROM public.user `;
        if(username) {
            const usernameParameter = `%${username}%`;
            sqlParameters.push(usernameParameter);      
            sql += `WHERE username LIKE $${sqlParameters.length} `;        
        }

        if(limit) {
            sqlParameters.push(limit);   
            sql += `LIMIT $${sqlParameters.length} `
        }

        if(offset) {
            sqlParameters.push(offset);   
            sql += `OFFSET $${sqlParameters.length} `
        }
        
        const result = await db.query(sql, sqlParameters);
        return result.rows;
    }

    /**
     * Fetches a user from the database
     * @param id The id of the user
     * @returns {Promise<{User}|null>}
     * Body contains the fetched user object with id, username, email, 
     * password, admin and superadmin fields set.
     * 
     * WARNING: unset the password field before returning 
     * the object to clients
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async fetchById(userId) {
        logger.silly("repositories.UserRepository.fetchById called");
        const sql = `SELECT id, username, email, password, 
                            admin, superadmin, banned
                     FROM public.user 
                     WHERE id = $1`;
        const sqlParameters = [userId];
        const result = await db.query(sql, sqlParameters);
        logger.silly("repositories.UserRepository.fetchById query done");
        if (result.rows.length == 1) {
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                result.rows[0].password,
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id,
                result.rows[0].banned
            );
            return user;
        }
        else if (result.rows.length > 1) {
            throw new DatabaseError(
                "Multiple users found.", 
                StatusCodes.BAD_REQUEST, 
                "error_multiple_users_found",
                sql,
                sqlParameters
            );
        }
        return null;
    }

    /**
     * Checks if a user is a superadmin or not
     * @param id The id of the user
     * @returns <true|false>
     * This function won't try to handle errors but throws them
     * instead.
     */
    async isSuperAdmin(userId) {
        const sql = `SELECT superadmin
                     FROM public.user 
                     WHERE id = $1`;
        const sqlParameters = [userId];
        const result = await db.query(sql, sqlParameters);

        if (result.rows.length == 1) {
            return result.rows[0].superadmin;
        }
        else {
            throw new UserError("User does not exist.", 
                                StatusCodes.BAD_REQUEST, 
                                "error_user_does_not_exist");
        }
    }

    /**
     * Deletes a user from the database
     * @param id The id of the user
     * @returns {Promise<number of rows affected>}
     * 
     * This function won't try to handle errors but throws them
     * instead.
     */
    async deleteById(userId) {
        logger.silly("repositories.UserRepository.deleteById called");
        const sql = `DELETE 
                     FROM public.user 
                     WHERE id = $1`;
        const sqlParameters = [userId];
        const { rowCount } = await db.query(sql, sqlParameters);
        logger.silly("repositories.UserRepository.deleteById query done");
        if (rowCount == 1) {
            return rowCount;
        }
        else if(rowCount === 0) {
            throw new UserError("User does not exist.", 
                                StatusCodes.BAD_REQUEST, 
                                "error_user_does_not_exist");
        }
        else {
            throw new DatabaseError(
                "Too many rows deleted.", 
                StatusCodes.INTERNAL_SERVER_ERROR, 
                "error_too_many_rows_deleted",
                sql,
                sqlParameters
            );
        }
    }

    /**
     * Update an existing user in the database
     * @param {userId} userId an id of the user to be updated
     * @param {requestBody} a validated requestBody containing at
     * least one of the following properties: 
     * username, email, password, admin, superadmin
     * @returns {Promise<{User}>}
     * Body contains the inserted user object with id, username, email, 
     * admin and superadmin fields set.
     * 
     * This function won't try to handle errors but throws them
     * instead. Throws a UserError if no user with the given id
     * exists.
     */
    async updateUser(userId, requestBody) {
        logger.silly(`repositories.UserRepository.updateUser called with id: ${userId} requestbody: ${JSON.stringify(requestBody)}`);
        let somethingAlreadySet = false;
        let sqlParameters = [];
        let sql = `UPDATE public.user SET `;

        if(requestBody.username) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.username);         
            sql += `username = $${sqlParameters.length} `;        
        }
        if(requestBody.email) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.email);         
            sql += `email = $${sqlParameters.length} `;        
        } 
        if(requestBody.password) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.password);       
            sql += `password = $${sqlParameters.length} `;    
        } 
        if(requestBody.admin) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.admin);       
            sql += `admin = $${sqlParameters.length} `;   
        } 
        if(requestBody.superadmin) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.superadmin);       
            sql += `superadmin = $${sqlParameters.length} `;  
        }
        if(requestBody.banned) {
            if(somethingAlreadySet) sql += `,`;
            somethingAlreadySet = true;
            sqlParameters.push(requestBody.banned);       
            sql += `banned = $${sqlParameters.length} `; 
        }

        sqlParameters.push(userId);
        sql += `WHERE id = $${sqlParameters.length}
                RETURNING id, username, email, admin, superadmin, banned`;
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');
            
            const result = await client.query(sql, sqlParameters);

            // The function should update exactly one row
            if (result.rowCount > 1) {
                throw new DatabaseError(
                    "Too many rows updated.", 
                    StatusCodes.INTERNAL_SERVER_ERROR, 
                    "error_too_many_rows_updated",
                    sql,
                    sqlParameters
                );
            }
            else if(result.rowCount === 0) {
                throw new UserError("User does not exist.", 
                                    StatusCodes.BAD_REQUEST, 
                                    "error_user_does_not_exist");
            }
            await client.query('COMMIT');

            logger.silly("repositories.UserRepository.updateUser query done");
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                '',
                result.rows[0].admin,
                result.rows[0].superadmin,
                result.rows[0].id,
                result.rows[0].banned
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

    /**
     * Save a new user in the database
     * @param {User} user A validated user object
     * @returns {Promise<{User}>}
     * Body contains the inserted user object with id, username, email, 
     * password, admin and superadmin fields set.
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
                                RETURNING id, username, email, admin, superadmin`;
        const sqlParameters = [
            user.username,
            user.email,
            user.password,
            false,
            false
        ];

        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');
            
            const result = await client.query(sql, sqlParameters);

            // The function should save exactly one row
            if (result.rowCount !== 1) {
                throw new DatabaseError(
                    "Too many rows inserted.", 
                    StatusCodes.INTERNAL_SERVER_ERROR, 
                    "error_too_many_rows_inserted",
                    sql,
                    sqlParameters
                );
            }
            await client.query('COMMIT');

            logger.silly("repositories.UserRepository.saveUser query done");
            const user = new User(
                result.rows[0].username,
                result.rows[0].email,
                '',
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