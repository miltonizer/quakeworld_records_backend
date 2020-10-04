// 401 unauthorized - use when jwt is not valid
// 403 forbidden - use when jwt is valid but the user has no right to see the 
// requested resource
module.exports = function (req, res, next) {
    // TODO: i18n
    if(!req.user.isAdmin) return res.status(403).send('Access denied.')
    next();
}