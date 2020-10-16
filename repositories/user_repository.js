const db = require('../database');
const { errorHandler } = require('../util/error_handler');
const logger = require('../util/logger');

class UserRepository {
    constructor () {}

    // Errors won't be caught here because there's nothing 
    // the repository could do about the error anyway.
    async userExists (user) {
        logger.info("repositories.UserRepository.userExists called");
        const { username, email } = user;
        const text = 'SELECT * FROM public.user WHERE email = $1 OR username =$2';
        const values = [email, username];
        const result = await db.query(text, values);
        logger.info("repositories.UserRepository.userExists query done");
        if (result.rows.length > 0) return true;
        return false;
    }
}
module.exports = UserRepository;