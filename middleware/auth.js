const jwt = require('jsonwebtoken');
const config = require('config');

// This middleware function checks if client's token is valid. The token
// should be sent in a header called x-auth-token (could be named something
// else but this is commonly used)
module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    // TODO: i18n
    if(!token) return res.status(401).send('Access denied. No token provided');

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next();
    }
    catch (err) {
        console.log(err.message);
        // TODO: i18n
        res.status(400).send('Invalid token');
    }
}