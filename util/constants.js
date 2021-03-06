// Notice that nested constants (if needed) need to be frozen
// separately:
// https://stackoverflow.com/questions/39206115/nodejs-define-global-constants
module.exports = Object.freeze({
    PASSWORD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 1
});

