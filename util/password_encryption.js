const argon2 = require('argon2');
const logger = require('./logger');

// Using default values for most of the argon2 settings
// Generating salt is not necessary or recommended:
// https://github.com/ranisalt/node-argon2/issues/76#issuecomment-291553840
async function hashPassword(plainTextPassword) {
    logger.silly("util.password_encryption.hashPassword called");
    return await argon2.hash(plainTextPassword, {
        type: argon2.argon2id,
    });
}

async function verifyPassword(hash, password) {
    logger.silly("util.password_encryption.verifyPassword called");
    return await argon2.verify(hash, password);
}

module.exports.hashPassword = hashPassword;
module.exports.verifyPassword = verifyPassword;