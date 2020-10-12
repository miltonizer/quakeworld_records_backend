// This is a middleware function designed to reduce the amount
// of copy-paste code.  Middlware functions are functions
// that take three parameters (req, res, next) and this is 
// no different expect that this one is wrapper in another 
// function that takes a validator function as a parameter.
// This custom validator function is used to validate
// the requests body and to either continue in the pipeline
// with next() or returning an error.

// TODO: i18next the error message?
// https://medium.com/@Yuschick/building-custom-localised-error-messages-with-joi-4a348d8cc2ba
module.exports = (validator) => {
    return (req, res, next) => {
        const {error} = validator(req);
        if(error) return res.status(400).send(error.details[0].message);
        next();
    }
}