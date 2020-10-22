const argon2 = require('argon2');
 

async function hash(plainTextPassword) {
    try {
        const hash = await argon2.hash("password");
    } 
    catch (err) {
    //...
    }
}

async function verify() {
    try {
        // TODO do something
    } 
    catch (err) {
    //...
    }
}


module.exports.hash = hash;
module.exports.verify = verify;