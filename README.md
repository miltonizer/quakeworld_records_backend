# Quakeworld Book of Records Backend
## Installation
### Development environment
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program. For some reason the powershell script runs slowly. The bash script in Linux has to be run like this:
`. ./set_environment_variables.sh`
- Install Docker
- Run create_docker_images.ps1 powershell script to create a docker image for the postgres database.
- Run the postgres docker image in the docker folder. This will create a database and a user that can connect to the given database based on the environment variables set earlier. Notice that the init_db.sh script won't be executed if the data volume is not empty.
`docker-compose -f docker-compose.yml up -d`

## Running
- Set environment variables by running either the powershell script or the bash script in docker folder. This sets all the required environment variables for running the program. The bash script in Linux has to be run like this:
`. ./set_environment_variables.sh`
- Start the postgres docker container by running:
`docker-compose -f docker-compose.yml up -d`
- Run the node backend in the root folder of the project:
`node index.js`

## Notes about development
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
- Errors happening in the Express request processing pipeline are handled by the middlware/error.js middleware. Before updating to Express major version 5 or higher an additional node package express-async-errors is needed to automatically "catch" errors in asynchronous route handlers. Without express-async-errors the middleware function next() would have to be called explicitly each time an error occured.
- Errors are handled by util/error_handler.js module and this module should always be called for error handling purposes.
- Validation is done with JOI package. There's a middleware function in middleware/validation.js that takes a validation function as a parameter and returns a JOI validation error if such an error exists. The validation function that is given as a parameter has to be customized for each request separately.

### Logging
- Logging is done by winston and morgan. Morgan handles http/express logging and winston the rest. Even morgan logging is streamed to winston.
- Winston setup is done in util/logger.js module and currently uses three transporters: one for console, one for error logging to file and one that logs everything to a separate file.
- If and when manual logging is needed it should be done by requiring the util/logger.js module and using the appropriate winston function (error, info, debug etc.).

### Debugging
- Use node package called debug controlled by an environment variable called "DEBUG".