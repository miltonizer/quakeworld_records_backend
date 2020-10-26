const { StatusCodes } = require('http-status-codes');

// 401 unauthorized - use when jwt is not valid
// 403 forbidden - use when jwt is valid but the user has no right to see the 
// requested resource
module.exports = function (req, res, next) {
    if(!req.user.superadmin) {
        return res.status(StatusCodes.FORBIDDEN).send(req.t('access_denied'));
    } 
    next();
}