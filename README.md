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