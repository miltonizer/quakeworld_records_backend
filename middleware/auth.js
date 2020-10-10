const jwt = require('jsonwebtoken');
const config = require('config');

// This middleware function checks if client's token is valid. The token
// should be sent in a header called x-auth-token (could be named something
// else but this is commonly used)
module.exports = function (req, res, next) {
    const token = req.header('x-auth-token');
    if(!token) return res.status(401).send(req.t('access_denied_no_token'));

    try {
        const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
        req.user = decoded;
        next();
    }
    catch (err) {
        console.log(err.message);
        res.status(400).send(req.t('invalid_token'));
    }
}