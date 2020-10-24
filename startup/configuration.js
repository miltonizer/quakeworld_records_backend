// A package for accessing environment variables
// check config folder for related jsons
const config = require('config');

module.exports = function() {

    if(!config.get('jwtPrivateKey')) {
        // Throw error (will be handled elsewhere by winston).
        // Don't throw string (possible in javascript) because
        // you will lose stacktrace by doing so.
         throw new Error('FATAL ERROR: jwtPrivateKey not set.');
    }

    // TODO: Make checks for other mandatory environment variables as well
    // At least database stuff
}