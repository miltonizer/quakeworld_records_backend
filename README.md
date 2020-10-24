# Quakeworld Book of Records Backend

## Installation

### Development environment
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program. For some reason the powershell script runs slowly. The bash script in Linux has to be run like this:
`. ./set_environment_variables.sh`
- Install Docker
- Run create_docker_images.ps1 powershell script to create a docker image for the postgres database.
- Run the postgres docker image in the docker folder. This will create a database and a user that can connect to the given database based on the environment variables set earlier. Notice that the init_db.sh script won't be executed if the data volume is not empty.
`docker-compose -f docker-compose.yml up -d`
- Check Schema migration -topic for instructions on how to set up the database further.
- TODO: Enable SSL for the database?

## Running
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program. The bash script in Linux has to be run like this:
`. ./set_environment_variables.sh`
In production environment quakeworld_records_backend_jwtPrivateKey -environment variable must be set before running the program. It is not set by default because it would override values set in config npm package's JSON configuration files, which would for example break tests.
- Start the postgres docker container by running:
`docker-compose -f docker-compose.yml up -d`
- Run the node backend in the root folder of the project:
`node index.js`

## Notes about development

### Schema migration
- The project uses db-migrate tool for database version control. Db-migrate can be installed globally with this command:
`npm install -g db-migrate`
Db-migrate installation might have to be added in the backend Dockerfile as well.
- Use the following command in the project root folder to update the database to the latest version:
`npm run-script db-migrate-up-<environment>`
This will set NODE_ENV environment variable temporarily and load the corresponding database configuration (development, test, production). If connection settings for any of these environments change, the change must be done in the configuration files of config as well as in the db-migrate configuration file (database.json in the root folder of the project).
- Create a migration that uses sql files:
`db-migrate create <name_of_the_migration>`
After creating a migration a corresponding javascript-file is created in migrations-folder. The SQL commands for this migration need to be added in the corresponding SQL files under migrations/sqls/ -folder. 
- The migration can be done with commands
`npm run-script db-migrate-<environment>-up`
and
`npm run-script db-migrate-<environment>-down`
- Running a migration writes a line to the database in migrations-table with its id, timestamp and name.

### Internationalization
- The project uses i18next package for internationalization. There is unfortunately no way to translate texts outside the express pipeline, but within the pipeline translatations are accessed through i18next's t-function:
`req.t('key')`, 
where key is a key for the translation found in one of the translation JSON files. 
- Translation files files are located under locales/{lng}/.
- i18next configuration is done in startup/internationalization.js file.
- Language in the software can be changed by query string (lng), header information or with cookies.

### Error handling and validation
- index.js calls a function exported by util/error_handler.js module that sets up global event handlers for uncaught exceptions and unhandled promise rejections.
- Fatal errors should be always thrown as Errors instead of e.g. strings so that the event handler will catch them.
- Errors happening in the Express request processing pipeline are handled by the middleware/error.js middleware. Before updating to Express major version 5 or higher an additional node package express-async-errors is needed to automatically "catch" errors in asynchronous route handlers. Without express-async-errors the middleware function next() would have to be called explicitly each time an error occured.
- Errors are handled by util/error_handler.js module and this module should always be called for error handling purposes.
- Programmer errors aren't caught separately from operational errors because nodeJS doesn't offer a good way to do so (https://github.com/nodejs/promises/issues/10).
- Error handling in general is done by throwing Errors and catching them in the middleware/error.js middleware. Custom errors in util/errors/ can be used when needed and the general ApplicationError can be handy because a statusCode and messageKey for i18next can be provided.
- Transactions with node-postgres are an exception as they need separate error handling.
- Validation is done with JOI package. There's a middleware function in middleware/validation.js that takes a validation function as a parameter and returns a JOI validation error if such an error exists. The validation function that is given as a parameter has to be customized for each request separately.

### Logging
- Logging is done by winston and morgan. Morgan handles http/express logging and winston the rest. Even morgan logging is streamed to winston.
- Winston setup is done in util/logger.js module and currently uses three transporters: one for console, one for error logging to file and one that logs everything to a separate file.
- If and when manual logging is needed it should be done by requiring the util/logger.js module and using the appropriate winston function (error, info, debug etc.).

### Authentication and authorization
- The system uses jsonwebtoken npm package to handle authentication.
- The routes that require authentication need to use the auth middlware in middlware/auth.js.
- To be able to access endpoints that require authentication the client is required to send a valid jsonwebtoken with the request. The token should be send in an http header called x-auth-token. 
- The token is verified by jsonwebtoken npm package by giving it the token received in the header and a secret jwtPrivateKey that is stored in an environment variable.
- If no token is sent the system responses with 401. If the token is invalid the system responses with 400.

### Debugging
- Use node package called debug controlled by an environment variable called "DEBUG".