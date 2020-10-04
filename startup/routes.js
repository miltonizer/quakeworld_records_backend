const express = require('express');
//const auth = require('../routes/auth');
const helloworld = require('../routes/helloworld');
const error = require('../middleware/error');

module.exports = function(app) {
    app.use(express.json());
    //app.use('/api/auth', auth);
    app.use('/api/helloworld', helloworld);

    // This error middleware function catches all errors everywhere
    // thanks to express-async-errors. Without express-async-errors
    // every route handler should call next(err) implicitly.
    app.use(error);
}