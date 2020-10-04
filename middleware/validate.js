// This is a middleware function designed to reduce the amount
// of copy-paste code. 
// TODO: try to understand how this really works and document it
// above.
module.exports = (validator) => {
    return (req, res, next) => {
        const {error} = validator(req.body);
        if(error) return res.status(400).send(error.details[0].message);
        next();
    }
}