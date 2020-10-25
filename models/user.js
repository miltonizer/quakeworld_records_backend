const jwt = require('jsonwebtoken');
const config = require('config');
const logger = require('../util/logger');

class User {
    constructor (
            username, 
            email, 
            password, 
            admin = false, 
            superadmin = false, 
            id) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.admin = admin;
        this.superadmin = superadmin;
        this.id = id;
    }

    // Generating token to be returned to the client
    // This method will be a method available to all objects of type(?) User. 
    // The object might not technically have a type because this is not TypeScript.

    /**
     * A method for generating authentication token with jwt
     * @returns {jsonwebtoken}
     */
    generateAuthToken() {
        // The client should save this token and use it like a driver's
        // licence to avoid authentication again. Privatekey should be secret
        // and the payload can be any information we want to have about the
        // user inside the token. E.g. admin status. Use jwt.io website to
        // check what any given token contains.
        logger.info("models.User.generateAuthToken generating token");
        const token = jwt.sign({
            id: this.id,
            admin: this.admin,
            superadmin: this.superadmin,
        }, config.get('jwtPrivateKey'));
        logger.info("models.User.generateAuthToken token generated");
        return token;
    }
}
module.exports = User;