const db = require('../database/');
const { errorHandler } = require('../util/error_handler');
const logger = require('../util/logger');

class UserRepository {
    constructor() {}

    // Errors won't be caught here because there's nothing 
    // the repository could do about the error anyway.
    async userExists(user) {
        logger.info("repositories.UserRepository.userExists called");
        const { username, email } = user;
        const sql = 'SELECT * FROM public.user WHERE email = $1 OR username =$2';
        const values = [email, username];
        const result = await db.query(sql, values);
        logger.info("repositories.UserRepository.userExists query done");
        if (result.rows.length > 0) return true;
        return false;
    }

    /**
     * Save a new user in the database
     * @param {User} user A validated user object
     * @returns {Promise<{success: boolean, error: *}|{success: boolean, body: *}>}
     * Body contains the inserted user object with id, username, email, 
     * admin and superadmin fields set.
     */
    async saveUser(user) {
        logger.info("repositories.UserRepository.saveUser called");
        const sql = `INSERT INTO public.user (username, 
                                            email, 
                                            password, 
                                            admin, 
                                            superadmin) 
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *`;
        const values = [user.username,
                    user.email,
                    user.password,
                    false,
                    false
                ];
        const result = await db.query(sql, values);
        if (result.rowCount !== 1) throw new Error('repositories.UserRepository.saveUser rowCount !== 1');
        logger.info("repositories.UserRepository.saveUser query done");
        return {success: true,
            body: {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email,
                admin: result.rows[0].admin,
                superadmin: result.rows[0].superadmin
            }
        };
    }
}
module.exports = UserRepository;